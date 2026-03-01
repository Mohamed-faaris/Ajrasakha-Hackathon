import numpy as np
import pandas as pd
from statsmodels.tsa.arima.model import ARIMA
from typing import List, Tuple, Optional
import warnings
warnings.filterwarnings("ignore")

class PredictionResult:
    def __init__(self, price: float, confidence: float):
        self.price = price
        self.confidence = confidence

class PricePredictor:
    def __init__(self, prices: List[float], dates: List):
        self.prices = np.array(prices)
        self.dates = dates
        self.n = len(prices)
    
    def calculate_ema(self, period: int = 5) -> float:
        if self.n == 0:
            return 0.0
        alpha = 2 / (period + 1)
        ema = self.prices[0]
        for i in range(1, self.n):
            ema = alpha * self.prices[i] + (1 - alpha) * ema
        return ema
    
    def calculate_arima_forecast(self, days: int = 7) -> List[PredictionResult]:
        if self.n < 14:
            # Not enough data - use EMA extrapolation
            return self._ema_forecast(days)
        
        try:
            # Fit ARIMA model (p=5, d=1, q=0) - auto-regressive integrated
            model = ARIMA(self.prices, order=(5, 1, 0))
            fitted = model.fit()
            forecast = fitted.forecast(steps=days)
            
            # Calculate confidence based on residual std
            residuals = fitted.resid
            std_residuals = np.std(residuals) if len(residuals) > 0 else 1
            mean_price = np.mean(self.prices)
            volatility = (std_residuals / mean_price) * 100 if mean_price > 0 else 50
            
            results = []
            for i, price in enumerate(forecast):
                # Confidence decreases as we predict further
                base_confidence = max(30, 95 - volatility)
                distance_penalty = i * 3  # -3% per day
                confidence = max(20, base_confidence - distance_penalty)
                results.append(PredictionResult(float(price), float(confidence)))
            
            return results
        except Exception:
            # Fallback to EMA
            return self._ema_forecast(days)
    
    def _ema_forecast(self, days: int = 7) -> List[PredictionResult]:
        if self.n < 2:
            return [PredictionResult(self.prices[0] if self.n > 0 else 0, 30.0) for _ in range(days)]
        
        ema = self.calculate_ema()
        last_price = self.prices[-1]
        
        # Calculate trend from recent data
        if self.n >= 5:
            recent_avg = np.mean(self.prices[-5:])
            older_avg = np.mean(self.prices[:-5]) if self.n > 5 else recent_avg
            trend = (recent_avg - older_avg) / max(older_avg, 1) * 0.1  # Dampened trend
        else:
            trend = (ema - last_price) / max(last_price, 1) * 0.1
        
        # Calculate volatility for confidence
        if self.n >= 3:
            volatility = np.std(self.prices) / np.mean(self.prices) * 100 if np.mean(self.prices) > 0 else 50
        else:
            volatility = 50
        
        results = []
        for i in range(days):
            predicted = last_price * (1 + trend * (i + 1))
            base_confidence = max(30, 90 - volatility)
            distance_penalty = i * 4  # -4% per day for EMA
            confidence = max(20, base_confidence - distance_penalty)
            results.append(PredictionResult(float(predicted), float(confidence)))
        
        return results
    
    def determine_trend(self, predicted_prices: List[float]) -> str:
        if len(predicted_prices) < 2:
            return "Neutral"
        
        first_price = predicted_prices[0]
        last_price = predicted_prices[-1]
        change_pct = ((last_price - first_price) / max(first_price, 1)) * 100
        
        if change_pct > 2:
            return "Bullish"
        elif change_pct < -2:
            return "Bearish"
        return "Neutral"

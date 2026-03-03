import { useMemo } from "react";

export type PredictionTrend = "Bullish" | "Bearish" | "Neutral";

export interface PricePredictionResult {
  predictedPrice: number;
  trend: PredictionTrend;
  confidence: number;
}

export interface PricePredictionOptions {
  period?: number;
  neutralThresholdPct?: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const calculateEma = (prices: number[], period: number): number => {
  if (!prices.length) return 0;
  const alpha = 2 / (period + 1);
  let ema = prices[0];
  for (let i = 1; i < prices.length; i += 1) {
    ema = alpha * prices[i] + (1 - alpha) * ema;
  }
  return ema;
};

export const usePricePrediction = (
  prices: number[],
  options: PricePredictionOptions = {}
): PricePredictionResult => {
  const { period = 5, neutralThresholdPct = 1 } = options;

  return useMemo(() => {
    if (!prices.length) {
      return { predictedPrice: 0, trend: "Neutral", confidence: 0 };
    }

    const safePeriod = Math.max(2, Math.min(period, prices.length));
    const predictedPrice = calculateEma(prices, safePeriod);
    const lastPrice = prices[prices.length - 1];
    const changePct = lastPrice
      ? ((predictedPrice - lastPrice) / lastPrice) * 100
      : 0;

    let trend: PredictionTrend = "Neutral";
    if (changePct > neutralThresholdPct) trend = "Bullish";
    if (changePct < -neutralThresholdPct) trend = "Bearish";

    const mean = prices.reduce((sum, value) => sum + value, 0) / prices.length;
    const variance =
      prices.reduce((sum, value) => sum + (value - mean) ** 2, 0) / prices.length;
    const volatilityPct = mean ? (Math.sqrt(variance) / mean) * 100 : 0;

    const trendStrength = Math.min(Math.abs(changePct) * 8, 20);
    const volatilityPenalty = Math.min(volatilityPct * 1.2, 35);
    const confidence = clamp(75 + trendStrength - volatilityPenalty, 35, 95);

    return {
      predictedPrice: Number(predictedPrice.toFixed(2)),
      trend,
      confidence: Number(confidence.toFixed(1)),
    };
  }, [neutralThresholdPct, period, prices]);
};


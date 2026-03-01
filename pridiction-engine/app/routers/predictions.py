from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import List
from app.database import get_prices_collection, get_predictions_collection
from app.models import PricePredictor

router = APIRouter(prefix="/predictions", tags=["predictions"])

class PredictionDay(BaseModel):
    date: datetime
    predictedPrice: float
    confidence: float

class PredictionResponse(BaseModel):
    cropId: str
    mandiId: str
    predictions: List[PredictionDay]
    trend: str
    generatedAt: datetime
    expiresAt: datetime

@router.post("/{crop_id}/{mandi_id}", response_model=PredictionResponse)
async def generate_prediction(crop_id: str, mandi_id: str):
    # Fetch historical prices from MongoDB
    prices_collection = get_prices_collection()
    
    # Get last 90 days of data
    start_date = datetime.now() - timedelta(days=90)
    
    historical = list(prices_collection.find(
        {"cropId": crop_id, "mandiId": mandi_id, "date": {"$gte": start_date}},
        {"modalPrice": 1, "date": 1, "_id": 0}
    ).sort("date", 1))
    
    if len(historical) < 3:
        raise HTTPException(status_code=400, detail="Insufficient historical data (minimum 3 days)")
    
    # Extract prices and dates
    prices = [doc["modalPrice"] for doc in historical]
    dates = [doc["date"] for doc in historical]
    
    # Generate predictions
    predictor = PricePredictor(prices, dates)
    forecast_results = predictor.calculate_arima_forecast(days=7)
    
    # Build prediction days
    predictions = []
    base_date = datetime.now()
    for i, result in enumerate(forecast_results):
        predictions.append(PredictionDay(
            date=base_date + timedelta(days=i),
            predictedPrice=round(result.price, 2),
            confidence=round(result.confidence, 1)
        ))
    
    # Determine trend
    predicted_prices = [p.predictedPrice for p in predictions]
    trend = predictor.determine_trend(predicted_prices)
    
    # Store in MongoDB
    predictions_collection = get_predictions_collection()
    now = datetime.now()
    expires_at = now + timedelta(hours=24)
    
    prediction_doc = {
        "cropId": crop_id,
        "mandiId": mandi_id,
        "predictions": [{"date": p.date, "predictedPrice": p.predictedPrice, "confidence": p.confidence} for p in predictions],
        "trend": trend,
        "generatedAt": now,
        "expiresAt": expires_at,
        "updatedAt": now
    }
    
    # Upsert - replace existing if any
    predictions_collection.update_one(
        {"cropId": crop_id, "mandiId": mandi_id},
        {"$set": prediction_doc},
        upsert=True
    )
    
    return PredictionResponse(
        cropId=crop_id,
        mandiId=mandi_id,
        predictions=predictions,
        trend=trend,
        generatedAt=now,
        expiresAt=expires_at
    )

@router.get("/{crop_id}/{mandi_id}", response_model=PredictionResponse)
async def get_prediction(crop_id: str, mandi_id: str):
    predictions_collection = get_predictions_collection()
    
    # Check for valid (non-expired) prediction
    prediction = predictions_collection.find_one({
        "cropId": crop_id,
        "mandiId": mandi_id,
        "expiresAt": {"$gt": datetime.now()}
    })
    
    if not prediction:
        raise HTTPException(status_code=404, detail="No valid prediction found. Generate one first.")
    
    predictions = [PredictionDay(
        date=p["date"],
        predictedPrice=p["predictedPrice"],
        confidence=p["confidence"]
    ) for p in prediction["predictions"]]
    
    return PredictionResponse(
        cropId=crop_id,
        mandiId=mandi_id,
        predictions=predictions,
        trend=prediction["trend"],
        generatedAt=prediction["generatedAt"],
        expiresAt=prediction["expiresAt"]
    )

@router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now()}

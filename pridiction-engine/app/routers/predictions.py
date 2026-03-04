from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import List
from app.database import get_prices_collection, get_predictions_collection, get_topmovers_collection
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


class TopMoverResponse(BaseModel):
    cropId: str
    cropName: str
    latestPrice: float
    previousPrice: float
    changePct: float
    direction: str


@router.get("/top-movers", response_model=List[TopMoverResponse])
async def get_top_movers():
    prices_collection = get_prices_collection()
    topmovers_collection = get_topmovers_collection()

    cached = topmovers_collection.find_one({"computedAt": {"$gte": datetime.now() - timedelta(hours=24)}})
    if cached:
        return [TopMoverResponse(**m) for m in cached.get("movers", [])]

    latest_data = list(prices_collection.aggregate([
        {"$sort": {"date": -1}},
        {"$limit": 1}
    ]))

    if not latest_data:
        return []

    latest_date = latest_data[0]["date"]
    today_start = datetime.combine(latest_date.date(), datetime.min.time())

    latest_prices = list(prices_collection.aggregate([
        {"$match": {"date": {"$gte": today_start}}},
        {"$sort": {"date": -1}},
        {"$group": {
            "_id": {"cropId": "$cropId", "mandiId": "$mandiId"},
            "cropId": {"$first": "$cropId"},
            "cropName": {"$first": "$cropName"},
            "mandiId": {"$first": "$mandiId"},
            "modalPrice": {"$first": "$modalPrice"},
            "date": {"$first": "$date"}
        }}
    ]))

    yesterday_start = today_start - timedelta(days=1)
    previous_prices = list(prices_collection.aggregate([
        {"$match": {"date": {"$lt": today_start, "$gte": yesterday_start}}},
        {"$sort": {"date": -1}},
        {"$group": {
            "_id": {"cropId": "$cropId", "mandiId": "$mandiId"},
            "modalPrice": {"$first": "$modalPrice"}
        }}
    ]))

    previous_map = {f"{p['_id']['cropId']}:{p['_id']['mandiId']}": p["modalPrice"] for p in previous_prices}

    movers = []
    for latest in latest_prices:
        key = f"{latest['cropId']}:{latest['mandiId']}"
        prev_price = previous_map.get(key)
        
        if prev_price and prev_price > 0:
            change_pct = ((latest["modalPrice"] - prev_price) / prev_price) * 100
            movers.append({
                "cropId": latest["cropId"],
                "cropName": latest["cropName"],
                "latestPrice": latest["modalPrice"],
                "previousPrice": prev_price,
                "changePct": round(change_pct, 2),
                "direction": "up" if change_pct >= 0 else "down"
            })

    top_gainers = sorted([m for m in movers if m["direction"] == "up"], key=lambda x: x["changePct"], reverse=True)[:10]
    top_losers = sorted([m for m in movers if m["direction"] == "down"], key=lambda x: x["changePct"])[:10]

    result = top_gainers + top_losers

    topmovers_collection.update_one(
        {"_id": "current"},
        {"$set": {"movers": result, "computedAt": datetime.now()}},
        upsert=True
    )

    return [TopMoverResponse(**m) for m in result]

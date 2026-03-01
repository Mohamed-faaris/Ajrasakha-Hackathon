from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import predictions
from app.config import get_settings

settings = get_settings()

app = FastAPI(
    title="Mandi Insights Price Prediction Engine",
    description="ARIMA/EMA-based price forecasting for agricultural commodities",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predictions.router)

@app.get("/")
async def root():
    return {"message": "Price Prediction Engine", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=settings.port)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.routers import predictions, admin
from app.config import get_settings
from app.scheduler import start_scheduler, stop_scheduler, get_scheduler_status

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    start_scheduler()
    yield
    stop_scheduler()


app = FastAPI(
    lifespan=lifespan,
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
app.include_router(admin.router)

@app.get("/")
async def root():
    return {"message": "Price Prediction Engine", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=settings.port)

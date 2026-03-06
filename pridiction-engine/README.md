# Prediction Engine

ARIMA-based price forecasting service for agricultural commodities. Generates 7-day price predictions using historical market data from Indian mandis (agricultural markets).

## Overview

The Prediction Engine is a Python FastAPI service that:

- Fetches 90 days of historical price data from MongoDB
- Generates 7-day forecasts using ARIMA time-series models
- Falls back to EMA (Exponential Moving Average) for insufficient data
- Stores predictions with 24-hour TTL
- Provides REST API endpoints for on-demand predictions
- Includes scheduled jobs for automated data pipeline and predictions

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | FastAPI 0.135+ |
| Python | 3.11+ |
| Data Analysis | pandas 3.0+, numpy 2.4+ |
| Forecasting | statsmodels 0.14+ (ARIMA) |
| Database | MongoDB (PyMongo 4.16+) |
| Scheduling | APScheduler 3.11+ |
| Server | Uvicorn 0.41+ |
| Configuration | pydantic-settings 2.13+ |

## Prerequisites

- Python 3.11 or higher
- MongoDB instance (local or cloud)
- Bun (for scraper/loader pipelines - JavaScript/TypeScript)

## Installation

1. **Create virtual environment:**

```bash
cd pridiction-engine
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# or
.venv\Scripts\activate  # Windows
```

2. **Install dependencies:**

```bash
pip install -r requirements.txt
```

3. **Verify installation:**

```bash
python -c "from app.models import PricePredictor; print('OK')"
```

## Environment Configuration

Create a `.env` file in the project root:

```env
# Required
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name
PREDICTION_ENGINE_PORT=8000
```

**Environment Variables:**

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | Yes | MongoDB connection string |
| `PREDICTION_ENGINE_PORT` | Yes | Service port (default: 8000) |

The service connects to MongoDB collections:
- `prices` - Historical price data
- `predictions` - Generated forecasts
- `logs` - Job execution logs
- `topmovers` - Cached top price movers

## Running the Service

### Development

```bash
# With auto-reload
uvicorn app.main:app --reload --port 8000

# Or via Python
python app/main.py
```

### Production

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Docker

```bash
# Build image
docker build -t prediction-engine .

# Run container
docker run -p 8000:8000 --env-file .env prediction-engine
```

## API Endpoints

### Health & Status

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Service info |
| GET | `/health` | Health check |

### Predictions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/predictions/{crop_id}/{mandi_id}` | Generate new prediction |
| GET | `/predictions/{crop_id}/{mandi_id}` | Get cached prediction |
| GET | `/predictions/top-movers` | Get top price movers |
| GET | `/predictions/health` | Router health check |

### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/ui` | Web admin dashboard |
| GET | `/admin/logs` | View system logs |
| GET | `/admin/scheduler` | Scheduler status |
| POST | `/admin/jobs/scrape-load` | Trigger scraper |
| POST | `/admin/jobs/parse-load` | Trigger parser |
| POST | `/admin/jobs/predictions` | Trigger batch predictions |
| POST | `/admin/jobs/cleanup` | Cleanup old logs |

### Generate Prediction

```bash
curl -X POST http://localhost:8000/predictions/crop123/mandi456
```

**Response:**

```json
{
  "cropId": "crop123",
  "mandiId": "mandi456",
  "predictions": [
    {
      "date": "2024-01-15T00:00:00",
      "predictedPrice": 2450.50,
      "confidence": 85.0
    }
  ],
  "trend": "Bullish",
  "generatedAt": "2024-01-15T10:30:00",
  "expiresAt": "2024-01-16T10:30:00"
}
```

### Get Cached Prediction

```bash
curl http://localhost:8000/predictions/crop123/mandi456
```

Returns 404 if no valid (non-expired) prediction exists.

### Get Top Movers

```bash
curl http://localhost:8000/predictions/top-movers
```

Returns top 10 gainers and top 10 losers by price change percentage.

## Scheduled Jobs

The scheduler runs the following jobs (Asia/Kolkata timezone):

| Job | Schedule | Description |
|-----|----------|-------------|
| `scrape_and_load` | Daily at 00:00 | Scrape and load price data |
| `generate_predictions` | Daily at 00:30 | Generate batch predictions |
| `cleanup_old_logs` | Sundays at 02:00 | Remove logs older than 30 days |

## Project Structure

```
pridiction-engine/
├── app/
│   ├── __init__.py
│   ├── main.py           # FastAPI app entry point
│   ├── config.py         # Pydantic settings
│   ├── database.py       # MongoDB connection
│   ├── models.py         # ARIMA/EMA prediction models
│   ├── orchestrator.py   # Pipeline orchestration
│   ├── scheduler.py      # APScheduler setup
│   └── routers/
│       ├── __init__.py
│       ├── predictions.py  # Prediction endpoints
│       └── admin.py        # Admin endpoints
├── requirements.txt
├── Dockerfile
└── README.md
```

## ARIMA Model Configuration

The prediction engine uses ARIMA(5,1,0) configuration:

- **p=5**: 5 autoregressive terms
- **d=1**: 1 order of differencing (makes series stationary)
- **q=0**: No moving average terms

**Confidence Calculation:**

```python
base_confidence = max(30, 95 - volatility)
distance_penalty = day_index * 3  # -3% per day
confidence = max(20, base_confidence - distance_penalty)
```

**Trend Determination:**

| Change % | Trend |
|----------|-------|
| > +2% | Bullish |
| < -2% | Bearish |
| -2% to +2% | Neutral |

## Docker Usage

### Build

```bash
docker build -t prediction-engine:latest .
```

### Run

```bash
docker run -d \
  -p 8000:8000 \
  -e MONGO_URI=mongodb+srv://... \
  -e PREDICTION_ENGINE_PORT=8000 \
  --name prediction-engine \
  prediction-engine:latest
```

### Docker Compose

```yaml
version: '3.8'
services:
  prediction-engine:
    build: ./pridiction-engine
    ports:
      - "8000:8000"
    environment:
      - MONGO_URI=${MONGO_URI}
      - PREDICTION_ENGINE_PORT=8000
    restart: unless-stopped
```

## Troubleshooting

### "Insufficient historical data" Error

- Verify price data exists in MongoDB for the crop/mandi pair
- Check `prices` collection has entries for the last 90 days
- Minimum 3 data points required

### ARIMA Model Fails

- Falls back to EMA forecast automatically
- Check logs at `/admin/logs` for detailed error messages

### MongoDB Connection Issues

- Verify `MONGO_URI` is set correctly in `.env`
- Check network connectivity to MongoDB
- Ensure database user has read/write permissions

### Scheduler Not Running

- Check scheduler status: `GET /admin/scheduler`
- View logs: `GET /admin/logs?component=scheduler`
- Restart service to reinitialize scheduler

# Prediction Engine Workflow

Technical documentation for the prediction engine architecture, workflows, and development patterns.

## 1. Architecture Overview

### FastAPI App Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI Application                      │
├─────────────────────────────────────────────────────────────┤
│  Lifespan Context                                           │
│  ├── start_scheduler()     # Initialize APScheduler        │
│  └── stop_scheduler()      # Cleanup on shutdown           │
├─────────────────────────────────────────────────────────────┤
│  Middleware                                                 │
│  └── CORS                  # Allow all origins             │
├─────────────────────────────────────────────────────────────┤
│  Routers                                                    │
│  ├── /predictions          # Forecast endpoints            │
│  └── /admin                # Management endpoints          │
└─────────────────────────────────────────────────────────────┘
```

### Router Organization

**predictions.py**
- `POST /{crop_id}/{mandi_id}` - Generate new prediction
- `GET /{crop_id}/{mandi_id}` - Retrieve cached prediction
- `GET /top-movers` - Price movement leaders

**admin.py**
- `GET /ui` - Web dashboard (HTML interface)
- `GET /logs` - Query job logs with filters
- `POST /jobs/*` - Manual trigger endpoints
- `GET /scheduler` - Scheduler status

### Database Connection (MongoDB)

```python
# database.py - Singleton pattern with module-level client
_client = MongoClient(_settings.mongo_uri)
_db = _client.get_default_database()

def get_prices_collection() -> Collection:
    return _db["prices"]          # Historical price data

def get_predictions_collection() -> Collection:
    return _db["predictions"]     # Forecast results

def get_logs_collection() -> Collection:
    return _db["logs"]            # Job execution logs

def get_topmovers_collection() -> Collection:
    return _db["topmovers"]       # Cached analytics
```

**Collections:**

| Collection | Schema | Index |
|------------|--------|-------|
| `prices` | `{cropId, mandiId, date, modalPrice, ...}` | `{cropId:1, mandiId:1, date:-1}` |
| `predictions` | `{cropId, mandiId, predictions[], trend, expiresAt}` | `{cropId:1, mandiId:1}` |
| `logs` | `{level, component, message, timestamp}` | `{timestamp:-1}` |
| `topmovers` | `{movers[], computedAt}` | `{computedAt:-1}` |

---

## 2. Prediction Workflow

### How Predictions Are Generated

```
┌─────────────────┐
│  API Request    │  POST /predictions/{cropId}/{mandiId}
└────────┬────────┘
         ▼
┌─────────────────┐
│ Load 90 days    │  Query MongoDB prices collection
│ historical data │  Filter: cropId + mandiId + date >= now-90d
└────────┬────────┘
         ▼
┌─────────────────┐
│ Validate data   │  Minimum 3 data points required
│                 │  Raise HTTP 400 if insufficient
└────────┬────────┘
         ▼
┌─────────────────┐
│ Build predictor │  PricePredictor(prices[], dates[])
│                 │  Extract price series from documents
└────────┬────────┘
         ▼
┌─────────────────┐
│ ARIMA forecast  │  calculate_arima_forecast(days=7)
│ (or EMA fallback)│  Returns: List[PredictionResult]
└────────┬────────┘
         ▼
┌─────────────────┐
│ Determine trend │  Bullish/Bearish/Neutral
│                 │  Based on first vs last predicted price
└────────┬────────┘
         ▼
┌─────────────────┐
│ Store result    │  Upsert to predictions collection
│                 │  TTL: expiresAt = now + 24 hours
└────────┬────────┘
         ▼
┌─────────────────┐
│ Return response │  JSON with predictions[] + trend
└─────────────────┘
```

### ARIMA Model Configuration

```python
# models.py - ARIMA(5,1,0) configuration
model = ARIMA(prices, order=(5, 1, 0))
fitted = model.fit()
forecast = fitted.forecast(steps=7)
```

**Parameters:**
- `p=5`: 5 autoregressive lags
- `d=1`: First-order differencing (removes trend)
- `q=0`: No moving average component

**Why this configuration:**
- Agricultural prices show weekly patterns
- 5 lags capture ~1 week of autocorrelation
- Differencing handles non-stationary price series

### Data Loading (90 Days Historical)

```python
start_date = datetime.now() - timedelta(days=90)

historical = list(prices_collection.find(
    {
        "cropId": crop_id,
        "mandiId": mandi_id,
        "date": {"$gte": start_date}
    },
    {"modalPrice": 1, "date": 1, "_id": 0}
).sort("date", 1))
```

**Query optimization:**
- Projection limits fields to `modalPrice` and `date`
- Sorted ascending for time-series ordering
- Returns list of `{modalPrice: float, date: datetime}`

### Forecast Generation (7 Days)

```python
# Build prediction days with confidence decay
predictions = []
base_date = datetime.now()

for i, result in enumerate(forecast_results):
    predictions.append({
        "date": base_date + timedelta(days=i),
        "predictedPrice": round(result.price, 2),
        "confidence": round(result.confidence, 1)
    })
```

**Confidence intervals:**

```python
# Calculate from residual standard deviation
residuals = fitted.resid
std_residuals = np.std(residuals)
mean_price = np.mean(self.prices)
volatility = (std_residuals / mean_price) * 100

# Confidence decreases over forecast horizon
base_confidence = max(30, 95 - volatility)
distance_penalty = day_index * 3
confidence = max(20, base_confidence - distance_penalty)
```

### Result Storage with TTL

```python
prediction_doc = {
    "cropId": crop_id,
    "mandiId": mandi_id,
    "predictions": predictions,      # 7-day forecast array
    "trend": trend,                   # Bullish/Bearish/Neutral
    "generatedAt": now,
    "expiresAt": now + timedelta(hours=24),  # TTL marker
    "updatedAt": now
}

# Upsert pattern - replace existing if present
predictions_collection.update_one(
    {"cropId": crop_id, "mandiId": mandi_id},
    {"$set": prediction_doc},
    upsert=True
)
```

---

## 3. API Endpoints

### POST /predictions/{cropId}/{mandiId}

**Purpose:** Generate fresh prediction for crop/mandi pair

**Logic:**
1. Query 90 days of historical prices
2. Validate minimum 3 data points
3. Run ARIMA or EMA forecast
4. Determine trend direction
5. Store with 24-hour TTL
6. Return prediction document

**Error Cases:**
- `400` - Insufficient historical data (< 3 points)
- `500` - Model computation error

### GET /predictions/{cropId}/{mandiId}

**Purpose:** Retrieve cached prediction

**Logic:**
1. Find non-expired prediction: `expiresAt > now`
2. Return 404 if expired or missing
3. Deserialize predictions array

**Note:** This endpoint does NOT generate predictions - use POST for that.

### GET /predictions/top-movers

**Purpose:** Get crops with highest price changes

**Logic:**
1. Check cache (24-hour TTL in `topmovers` collection)
2. If cache miss:
   - Aggregate latest prices by crop/mandi
   - Compare to previous day prices
   - Calculate change percentage
   - Sort for top 10 gainers and losers
   - Store to cache
3. Return combined list

---

## 4. Scheduler & Cleanup

### APScheduler Configuration

```python
# scheduler.py
scheduler = BackgroundScheduler(timezone=pytz.timezone("Asia/Kolkata"))

# Jobs scheduled via CronTrigger
def setup_jobs():
    # Daily at midnight - scrape new data
    scheduler.add_job(
        run_scrape_load_pipeline,
        CronTrigger(hour=0, minute=0),
        id="scrape_and_load"
    )
    
    # Daily at 00:30 - generate predictions
    scheduler.add_job(
        run_predictions,
        CronTrigger(hour=0, minute=30),
        id="generate_predictions"
    )
    
    # Weekly cleanup - Sundays at 2 AM
    scheduler.add_job(
        run_cleanup,
        CronTrigger(day_of_week="sun", hour=2, minute=0),
        id="cleanup_old_logs"
    )
```

### Job Execution Logging

```python
def log_job_execution(job_name: str, func):
    """Decorator that logs job start/completion/failure"""
    def wrapper(*args, **kwargs):
        # Log start
        logs_collection.insert_one({
            "level": "INFO",
            "component": "scheduler",
            "message": f"Starting: {job_name}",
            "timestamp": datetime.now()
        })
        
        try:
            result = func(*args, **kwargs)
            # Log success
            logs_collection.insert_one({...})
            return result
        except Exception as e:
            # Log failure
            logs_collection.insert_one({...})
            raise
    return wrapper
```

### Background Tasks

The scheduler runs jobs in background threads:
- Does not block API requests
- Jobs are idempotent (safe to retry)
- Failed jobs log errors but don't crash scheduler

---

## 5. Orchestrator Pattern

### How the Orchestrator Coordinates Pipelines

The `Orchestrator` class manages the data pipeline from scraping to predictions:

```
┌─────────────────────────────────────────────────────────────┐
│                      Orchestrator                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  scrape_and_load()                                          │
│  ├── trigger_scraper()      # Run Python scraper           │
│  └── run_loader()           # Load to MongoDB              │
│                                                             │
│  parse_and_load()                                           │
│  ├── run_parsers()          # Parse raw files (Bun/TS)     │
│  └── run_loader()           # Load to MongoDB              │
│                                                             │
│  generate_all_predictions()                                 │
│  ├── get_unique_crop_mandi_pairs()  # Aggregate prices     │
│  └── generate_prediction()  # ARIMA for each pair          │
│                                                             │
│  cleanup_old_logs()                                         │
│  └── delete logs > 30 days                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Caching and Deduplication Logic

**Prediction Caching:**

```python
def generate_prediction(self, crop_id: str, mandi_id: str):
    # Check existing valid prediction first
    existing = self.predictions_collection.find_one({
        "cropId": crop_id,
        "mandiId": mandi_id,
        "expiresAt": {"$gt": datetime.now()}
    })
    
    if existing:
        return existing  # Return cached
    
    # Otherwise, generate new...
```

**Top Movers Caching:**

```python
cached = topmovers_collection.find_one({
    "computedAt": {"$gte": datetime.now() - timedelta(hours=24)}
})

if cached:
    return cached["movers"]  # Use cache

# Otherwise, compute and cache...
```

**Deduplication in Pipelines:**

The loader component (in `scraper-engine/loader`) handles deduplication using MongoDB upserts:

```javascript
// Loader uses compound unique index
prices_collection.createIndex(
    { cropId: 1, mandiId: 1, date: 1 },
    { unique: true }
)

// Upsert prevents duplicates
db.prices.updateOne(
    { cropId, mandiId, date },
    { $set: priceData },
    { upsert: true }
)
```

---

## 6. Development Workflow

### Adding New Prediction Models

1. **Create model class in `app/models.py`:**

```python
class NewPredictor:
    def __init__(self, prices: List[float], dates: List):
        self.prices = np.array(prices)
        self.dates = dates
    
    def forecast(self, days: int = 7) -> List[PredictionResult]:
        # Your algorithm here
        return [PredictionResult(price, confidence) for ...]
```

2. **Integrate into PricePredictor:**

```python
class PricePredictor:
    def calculate_new_forecast(self, days: int = 7):
        predictor = NewPredictor(self.prices, self.dates)
        return predictor.forecast(days)
```

3. **Add feature flag or parameter:**

```python
@app.post("/{crop_id}/{mandi_id}")
async def generate_prediction(
    crop_id: str,
    mandi_id: str,
    model: str = "arima"  # or "new_model"
):
    if model == "arima":
        forecast = predictor.calculate_arima_forecast()
    else:
        forecast = predictor.calculate_new_forecast()
```

### Testing Predictions

**Unit test pattern:**

```python
# tests/test_models.py
import numpy as np
from app.models import PricePredictor

def test_arima_forecast():
    prices = [100, 102, 101, 103, 105, 104, 106]
    dates = [...]  # corresponding datetimes
    
    predictor = PricePredictor(prices, dates)
    results = predictor.calculate_arima_forecast(days=3)
    
    assert len(results) == 3
    assert all(r.price > 0 for r in results)
    assert all(0 <= r.confidence <= 100 for r in results)

def test_trend_calculation():
    predictor = PricePredictor([], [])
    
    assert predictor.determine_trend([100, 105]) == "Bullish"
    assert predictor.determine_trend([100, 95]) == "Bearish"
    assert predictor.determine_trend([100, 101]) == "Neutral"
```

**Integration test pattern:**

```python
# tests/test_api.py
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_generate_prediction():
    # Ensure test data exists in MongoDB
    response = client.post("/predictions/test-crop/test-mandi")
    assert response.status_code == 200
    data = response.json()
    assert "predictions" in data
    assert len(data["predictions"]) == 7
```

### Debugging

**Enable verbose logging:**

```python
# In app/models.py, remove warning filter
# warnings.filterwarnings("ignore")  # Comment out

# Or set logging level
import logging
logging.basicConfig(level=logging.DEBUG)
```

**Check scheduler jobs:**

```bash
# Via API
curl http://localhost:8000/admin/scheduler

# Check logs
curl "http://localhost:8000/admin/logs?component=scheduler&limit=20"
```

**Manual job trigger for testing:**

```bash
# Trigger scraper
curl -X POST http://localhost:8000/admin/jobs/scrape-load

# Trigger predictions
curl -X POST http://localhost:8000/admin/jobs/predictions

# View results
curl http://localhost:8000/admin/logs?limit=10
```

**Database inspection:**

```bash
# Connect to MongoDB and check collections
mongosh "mongodb+srv://..."

# Check predictions
db.predictions.findOne({cropId: "...", mandiId: "..."})

# Check logs
db.logs.find({component: "prediction"}).sort({timestamp: -1}).limit(5)
```

**ARIMA debugging:**

```python
# Add to models.py for debug output
from statsmodels.tsa.arima.model import ARIMA

model = ARIMA(prices, order=(5, 1, 0))
fitted = model.fit()
print(fitted.summary())  # Print model diagnostics
print(f"AIC: {fitted.aic}, BIC: {fitted.bic}")
```

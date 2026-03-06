# Ajrasakha - Agricultural Market Price Analytics Platform

Problem statement: https://vicharanashala.github.io/ajrasakha-hackathon/docs/problem-statements/pb1/

Ajrasakha is a comprehensive agricultural market intelligence platform that empowers farmers, traders, and APMC operators with real-time price analytics, AI-driven forecasting, and automated alerts across Indian mandi markets.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Quick Start Guide](#quick-start-guide)
4. [Prerequisites](#prerequisites)
5. [Setup Instructions](#setup-instructions)
6. [Environment Configuration](#environment-configuration)
7. [Development Workflow](#development-workflow)
8. [API Documentation](#api-documentation)
9. [Testing](#testing)
10. [Deployment](#deployment)
11. [Troubleshooting](#troubleshooting)

---

## Project Overview

### Key Features

| Feature | Description | Module |
|---------|-------------|--------|
| **Real-time Price Tracking** | Live commodity prices from 3000+ mandis across India | Consumer Portal |
| **AI Price Forecasting** | 7-day price predictions using ARIMA models | Prediction Engine |
| **Price Alerts** | Push notifications for price thresholds and trends | Consumer Portal + Server |
| **Market Analytics** | Top movers, trend analysis, coverage maps | Consumer Portal |
| **APMC Management** | Portal for operators to manage listings and submissions | APMC Portal |
| **Data Ingestion** | AI-powered scraping from 150+ government sources | Scraper Engine |
| **Developer API** | RESTful APIs with key management for third-party access | Dev Portal |

### Target Users

- **Farmers**: Price discovery, trend analysis, alert subscriptions
- **Traders**: Market intelligence, arbitrage opportunities
- **APMC Operators**: Data submission, compliance, analytics
- **Developers**: API access for building integrations

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
├─────────────────┬──────────────────┬─────────────────┬──────────────────────┤
│                 │                  │                 │                      │
│  Consumer       │  APMC Portal     │  Dev Portal     │  Third-Party Apps    │
│  Portal         │  (Operators)     │  (API Keys)     │  (API Consumers)     │
│  (React/Vite)   │  (React/Vite)    │  (React/Vite)   │                      │
│  Port: 3000     │  Port: 8080      │  Port: 5173     │                      │
│                 │                  │                 │                      │
└────────┬────────┴────────┬─────────┴────────┬────────┴──────────────────────┘
         │                 │                  │
         └─────────────────┼──────────────────┘
                           │
                    ┌──────▼──────┐
                    │   Nginx/    │
                    │   CDN       │
                    └──────┬──────┘
                           │
┌──────────────────────────▼──────────────────────────────────────────────────┐
│                           API LAYER                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    API Server (Node.js/Express)                      │   │
│  │                         Port: 5000                                   │   │
│  │                                                                      │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │   │
│  │  │ Auth        │  │ Prices      │  │ Predictions │  │ Alerts     │  │   │
│  │  │ (Better     │  │ API         │  │ Proxy       │  │ (Cron)     │  │   │
│  │  │  Auth)      │  │             │  │             │  │            │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘  │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    │ HTTP/REST                              │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │              Prediction Engine (Python/FastAPI)                      │   │
│  │                         Port: 8000                                   │   │
│  │              ARIMA-based forecasting, pandas, statsmodels            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ MongoDB Driver
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DATA LAYER                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │              Scraper Engine (Python/Playwright/LangChain)            │   │
│  │                      Endpoint Discovery Pipeline                     │   │
│  │         AI-powered discovery, mapping, extraction, normalization    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│                        ┌───────────────────┐                                │
│                        │     MongoDB       │                                │
│                        │   (Data Store)    │                                │
│                        │                   │                                │
│                        │ • prices          │                                │
│                        │ • sources         │                                │
│                        │ • predictions     │                                │
│                        │ • alerts          │                                │
│                        │ • user_profiles   │                                │
│                        └───────────────────┘                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
External Sources          Ingestion                Processing              API
(150+ Mandi Sites)   →  Scraper Engine    →     Cron Jobs        →    Server
                             ↓                       ↓                   ↓
                        ┌─────────┐           ┌───────────┐        ┌──────────┐
                        │ MongoDB │    →      │ Analytics │   →    │ REST API │
                        └─────────┘           └───────────┘        └────┬─────┘
                                                                        │
                        ┌───────────────────────────────────────────────┼───────┐
                        ▼                                               ▼       │
              ┌──────────────────┐                          ┌────────────────┐ │
              │ Firebase FCM     │                          │ Prediction     │ │
              │ (Push Alerts)    │                          │ Engine (ML)    │ │
              └──────────────────┘                          └────────────────┘ │
                                                                               │
                        ┌──────────────────────────────────────────────────────┘
                        ▼
              ┌──────────────────┬──────────────────┬──────────────────┐
              │ Consumer Portal  │ APMC Portal      │ Dev Portal       │
              └──────────────────┴──────────────────┴──────────────────┘
```

---

## Quick Start Guide

Get the entire stack running locally in under 10 minutes:

```bash
# 1. Clone and navigate
git clone <repository-url>
cd Ajrasakha-Hackathon

# 2. Copy environment template
cp .env.example .env
# Edit .env with your configuration

# 3. Start MongoDB (if local)
# Using Docker:
docker run -d -p 27017:27017 --name ajrasakha-mongo mongo:7

# 4. Install dependencies and start services (in separate terminals)

# Terminal 1 - Server
(cd server && bun install && bun dev)

# Terminal 2 - Consumer Portal
(cd consumer-portal && bun install && bun dev)

# Terminal 3 - Prediction Engine
(cd pridiction-engine && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && uvicorn app.main:app --reload)

# Access the app at http://localhost:3000
```

---

## Prerequisites

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| Node.js | 18+ | JavaScript runtime for all Node services |
| Bun | 1.0+ | Package manager and runtime (faster than npm/pnpm) |
| Python | 3.11+ | Prediction and scraper engines |
| MongoDB | 6.0+ | Primary database (local or Atlas) |
| Git | 2.30+ | Version control |

### Optional Software

| Software | Purpose |
|----------|---------|
| Bun | Alternative runtime for loader/parser utilities |
| Docker | Containerized MongoDB and deployment |
| Playwright | For scraper engine browser automation |

### System Requirements

- **RAM**: 8GB minimum (16GB recommended for full stack)
- **Storage**: 10GB free space
- **OS**: Linux/macOS/Windows with WSL2

---

## Setup Instructions

### 1. Repository Setup

```bash
# Clone repository
git clone <repository-url>
cd Ajrasakha-Hackathon

# Verify directory structure
ls -la
```

### 2. Database Setup

#### Option A: MongoDB Atlas (Cloud)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Add your IP to Network Access
4. Create a database user
5. Copy the connection string

#### Option B: Local MongoDB
```bash
# Using Docker
docker run -d \
  --name ajrasakha-mongo \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  mongo:7

# Or install locally (Ubuntu/Debian)
sudo apt-get install mongodb
sudo systemctl start mongodb
```

### 3. Service-by-Service Setup

#### Server (Node.js/Express)

```bash
cd server

# Install dependencies
bun install

# Copy environment file
cp .env.example .env
# Edit .env with your MongoDB URI and auth secrets

# Start development server
bun dev
```

The server will be available at `http://localhost:5000`

#### Consumer Portal (React)

```bash
cd consumer-portal

# Install dependencies
bun install

# Copy environment file
cp .env.example .env
# Edit .env with API URLs

# Start development server
bun dev
```

The portal will be available at `http://localhost:3000`

#### APMC Portal (React)

```bash
cd apmc-portal

# Install dependencies
bun install

# Start development server
bun dev
```

The portal will be available at `http://localhost:8080`

#### Dev Portal (React)

```bash
cd dev-portal

# Install dependencies
bun install

# Start development server
bun dev
```

The portal will be available at `http://localhost:5173`

#### Prediction Engine (Python/FastAPI)

```bash
cd pridiction-engine

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Linux/macOS:
source .venv/bin/activate
# Windows:
# .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start development server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at `http://localhost:8000`

#### Scraper Engine (Python)

```bash
cd scraper-engine/endpoint-discovery

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows

# Install dependencies
pip install -r requirements.txt

# Install Playwright browser
playwright install chromium

# Copy environment file
cp .env.example .env
# Edit .env with LLM API keys and MongoDB URI

# Run scraper
python main.py
```

---

## Environment Configuration

### Configuration Strategy

Ajrasakha uses a **single root `.env` file** as the source of truth. All services read from this file using the `dotenv` pattern.

### Required Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

#### Core Server Configuration

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `PORT` | Yes | Server port | `5000` |
| `MONGO_URI` | Yes | MongoDB connection string | `mongodb+srv://...` |
| `BETTER_AUTH_SECRET` | Yes | Min 32 char secret for auth | Generate with `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | Yes | Auth service URL | `http://localhost:5000` |
| `BETTER_AUTH_TRUSTED_ORIGINS` | Yes | Allowed CORS origins | `http://localhost:5173,http://localhost:3000` |

#### Frontend Configuration

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_API_URL` | Yes | Consumer portal API base | `http://localhost:5000/api/consumer-portal` |
| `VITE_AUTH_BASE_URL` | Yes | Auth API endpoint | `http://localhost:5000/api/consumer-portal/auth` |
| `VITE_FIREBASE_API_KEY` | Yes* | Firebase client key | From Firebase Console |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes* | Firebase auth domain | `project.firebaseapp.com` |

*Required for push notifications

#### Prediction Engine Configuration

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `PREDICTION_ENGINE_PORT` | Yes | Prediction API port | `8000` |
| `PREDICTION_ENGINE_URL` | Yes | Full URL for server to call | `http://localhost:8000` |

#### Scraper Engine Configuration

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DB_NAME` | Yes | MongoDB database name | `mandi_insights` |
| `LLM_PROVIDER` | Yes | `google`, `openai`, or `openrouter` | `openrouter` |
| `GOOGLE_API_KEY` | Conditional | Required if using Google provider | `AIza...` |
| `OPENAI_API_KEY` | Conditional | Required if using OpenAI | `sk-...` |
| `OPENROUTER_API_KEY` | Conditional | Required if using OpenRouter | `sk-or-...` |
| `AGENT_MODE` | Yes | `discover`, `scrape`, or `discover_and_scrape` | `discover_and_scrape` |

### Generating Secrets

```bash
# Generate Better Auth secret
openssl rand -base64 32

# Generate Firebase service account
# Go to Firebase Console > Project Settings > Service Accounts
# Click "Generate new private key"
```

---

## Development Workflow

### Service Ports

| Service | Port | URL | Notes |
|---------|------|-----|-------|
| Server API | 5000 | http://localhost:5000 | Main backend |
| Consumer Portal | 3000 | http://localhost:3000 | End-user app |
| APMC Portal | 8080 | http://localhost:8080 | Operator portal |
| Dev Portal | 5173 | http://localhost:5173 | API key management |
| Prediction Engine | 8000 | http://localhost:8000 | ML service |
| MongoDB | 27017 | mongodb://localhost:27017 | Database |

### Running Services

Use separate terminal windows/tabs for each service:

```bash
# Terminal 1: Server
cd server && bun dev

# Terminal 2: Consumer Portal
cd consumer-portal && bun dev

# Terminal 3: APMC Portal (optional)
cd apmc-portal && bun dev

# Terminal 4: Prediction Engine
cd pridiction-engine && source .venv/bin/activate && uvicorn app.main:app --reload

# Terminal 5: Dev Portal (optional)
cd dev-portal && bun dev
```

### Development Scripts

#### Server

```bash
cd server
bun dev           # Start with hot reload
bun run build     # Build for production
bun start         # Start production build
bun run lint      # Run ESLint
bun run typecheck # Run TypeScript checks
```

#### Frontend Apps

```bash
# Consumer Portal, APMC Portal, Dev Portal
bun dev           # Start dev server
bun run build     # Build for production
bun run preview   # Preview production build
bun test          # Run tests
bun run lint      # Run linter
```

#### Prediction Engine

```bash
cd pridiction-engine
uvicorn app.main:app --reload                    # Dev with reload
uvicorn app.main:app --host 0.0.0.0 --port 8000  # Production
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker  # With workers
```

#### Scraper Engine

```bash
cd scraper-engine/endpoint-discovery
python main.py                    # Run with .env config
python main.py --mode discover    # Discovery only
python main.py --mode scrape      # Scraping only
```

---

## API Documentation

### Authentication

All API endpoints (except health check and auth routes) require authentication via Better Auth session cookies.

```bash
# Login
curl -X POST http://localhost:5000/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

### Core Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/health` | GET | Health check | No |
| `/api/auth/*` | Various | Authentication | Varies |
| `/api/crops` | GET | List all crops | Yes |
| `/api/crops/:id` | GET | Get crop details | Yes |
| `/api/mandis` | GET | List all mandis | Yes |
| `/api/mandis/:id` | GET | Get mandi details | Yes |
| `/api/prices` | GET | Query prices with filters | Yes |
| `/api/prices/latest` | GET | Latest prices | Yes |
| `/api/predictions/:cropId/:mandiId` | GET | Get prediction | Yes |
| `/api/predictions/:cropId/:mandiId` | POST | Generate prediction | Yes |
| `/api/alerts` | GET | List user alerts | Yes |
| `/api/alerts` | POST | Create alert | Yes |
| `/api/alerts/:id` | DELETE | Delete alert | Yes |
| `/api/topmovers` | GET | Top price movers | Yes |
| `/api/coverage` | GET | Data coverage stats | Yes |

### Query Parameters

#### Price Query (`/api/prices`)

| Parameter | Type | Description |
|-----------|------|-------------|
| `cropId` | string | Filter by crop ID |
| `mandiId` | string | Filter by mandi ID |
| `startDate` | ISO date | Start date range |
| `endDate` | ISO date | End date range |
| `limit` | number | Max results (default 100) |
| `page` | number | Pagination page |

### Response Format

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 100,
    "total": 1000
  }
}
```

### Prediction API

Direct access to prediction engine:

```bash
# Get prediction
curl http://localhost:8000/predictions/crop-123/mandi-456

# Generate new prediction
curl -X POST http://localhost:8000/predictions/crop-123/mandi-456

# Response format
{
  "crop_id": "crop-123",
  "mandi_id": "mandi-456",
  "predictions": [
    {"date": "2024-01-01", "price": 2500.50, "confidence": 0.85},
    ...
  ],
  "model_info": {
    "type": "ARIMA",
    "parameters": {...}
  }
}
```

---

## Testing

### Frontend Tests

```bash
# Consumer Portal
cd consumer-portal
bun test              # Run all tests
bun test:watch        # Run in watch mode
bun test:coverage     # Generate coverage report

# APMC Portal
cd apmc-portal
bun test
```

### Backend Tests

Currently, server and Python services do not have automated test suites configured. Testing is done via:

1. **Manual API Testing**: Use tools like Postman or curl
2. **Integration Testing**: Test full flows through frontend
3. **Health Checks**: `curl http://localhost:5000/api/health`

### Manual Test Checklist

```bash
# 1. Health checks
curl http://localhost:5000/api/health
curl http://localhost:8000/health

# 2. Authentication flow
# - Sign up via consumer portal
# - Log in
# - Verify session persists

# 3. Price queries
# - Search for crops
# - View price charts
# - Check map view

# 4. Alerts
# - Create price alert
# - Verify in database: db.alerts.find()

# 5. Predictions
# - Request prediction for crop/mandi
# - Verify response format
```

---

## Deployment

### Production Checklist

- [ ] All environment variables configured
- [ ] MongoDB indexes created
- [ ] Firebase Cloud Messaging configured
- [ ] SSL certificates installed
- [ ] Rate limiting enabled
- [ ] Logging and monitoring setup

### Docker Deployment

```dockerfile
# Example Dockerfile for server
FROM oven/bun:1-alpine
WORKDIR /app
COPY package*.json .
RUN bun install --production
COPY . .
RUN bun run build
EXPOSE 5000
CMD ["bun", "start"]
```

### Environment-Specific Configurations

| Environment | Server URL | Auth URL | Trusted Origins |
|-------------|------------|----------|-----------------|
| Development | localhost:5000 | localhost:5000 | localhost:3000,5173,8080 |
| Staging | staging-api.example.com | staging-api.example.com | staging.example.com |
| Production | api.example.com | api.example.com | app.example.com |

### Database Migrations

No formal migrations required (MongoDB is schemaless), but ensure indexes:

```javascript
// Create these indexes in MongoDB
db.prices.createIndex({ cropId: 1, mandiId: 1, date: -1 });
db.prices.createIndex({ date: -1 });
db.alerts.createIndex({ userId: 1, active: 1 });
db.predictions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
```

---

## Troubleshooting

### Common Issues

#### "VITE_API_URL environment variable is required"

**Cause**: Frontend cannot connect to backend

**Solution**:
```bash
# 1. Check .env file exists in project root
cat .env | grep VITE_API_URL

# 2. Verify server is running
curl http://localhost:5000/api/health

# 3. Restart frontend after .env changes
# (Vite requires restart to pick up env changes)
```

#### "BETTER_AUTH_SECRET is required"

**Cause**: Auth secret not configured

**Solution**:
```bash
# Generate new secret
openssl rand -base64 32

# Add to .env
BETTER_AUTH_SECRET=<generated_secret>
```

#### MongoDB Connection Failed

**Cause**: Invalid connection string or network issue

**Solution**:
```bash
# Test connection
mongosh "<your_connection_string>"

# For Atlas: whitelist your IP
# For local: ensure MongoDB service is running
sudo systemctl status mongodb  # Linux
```

#### Prediction Engine 500 Error

**Cause**: Insufficient historical data for ARIMA

**Solution**:
- Ensure prices collection has data for the requested crop/mandi
- Check prediction engine logs for detailed error

#### Scraper Engine Not Discovering Sources

**Cause**: LLM API key invalid or rate limited

**Solution**:
```bash
# Verify API key
curl -H "Authorization: Bearer $GOOGLE_API_KEY" \
  https://generativelanguage.googleapis.com/v1beta/models

# Check rate limits in provider dashboard
```

#### CORS Errors in Browser

**Cause**: Origin not in trusted origins list

**Solution**:
```bash
# Update .env with correct origins
BETTER_AUTH_TRUSTED_ORIGINS=http://localhost:3000,http://localhost:8080,http://localhost:5173

# Restart server
```

#### Push Notifications Not Working

**Cause**: Firebase not configured correctly

**Solution**:
1. Verify Firebase project settings
2. Check VAPID key is set in environment
3. Ensure service account JSON is valid
4. Check browser console for permission errors

### Debug Commands

```bash
# Check all services status
curl http://localhost:5000/api/health
curl http://localhost:8000/health

# View MongoDB collections
mongosh "<uri>" --eval "show collections"

# Check recent logs
cd server && tail -f server.log

# Verify environment variables
cat .env | grep -v "^#" | grep -v "^$"
```

### Getting Help

1. Check [PROJECT_WORKFLOW.md](./PROJECT_WORKFLOW.md) for detailed workflow documentation
2. Review environment configuration in [AGENTS.md](./AGENTS.md)
3. Check service-specific logs in each directory
4. File issues with reproduction steps

---

## Repository Structure

```
Ajrasakha-Hackathon/
├── server/                    # Node.js/Express API
│   ├── src/
│   │   ├── routes/           # API route handlers
│   │   ├── models/           # Mongoose schemas
│   │   ├── services/         # Business logic
│   │   ├── jobs/             # Cron jobs and processors
│   │   └── middleware/       # Auth and validation
│   └── package.json
│
├── consumer-portal/           # React frontend (end users)
│   ├── src/
│   │   ├── pages/            # Route components
│   │   ├── components/       # Reusable UI
│   │   ├── hooks/            # TanStack Query hooks
│   │   └── lib/              # Utilities and API client
│   └── package.json
│
├── apmc-portal/              # React frontend (operators)
│   └── src/
│
├── dev-portal/               # Developer API portal
│   └── src/
│
├── pridiction-engine/        # Python FastAPI ML service
│   ├── app/
│   │   ├── main.py           # FastAPI app
│   │   └── services/         # Prediction logic
│   └── requirements.txt
│
├── scraper-engine/           # Data ingestion pipeline
│   ├── endpoint-discovery/   # AI-powered source discovery
│   ├── loader/               # Data loading utilities
│   ├── parser/               # HTML/PDF parsers
│   └── mapper/               # Field mapping logic
│
├── seeder/                   # Database seeding scripts
├── shared/                   # Shared TypeScript types
├── docs/                     # Additional documentation
├── .env.example              # Environment template
├── PROJECT_WORKFLOW.md       # Detailed workflow docs
└── README.md                 # This file
```

---

## Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **State Management**: TanStack Query (React Query)
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Authentication**: Better Auth

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js with TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Better Auth (session-based)
- **Validation**: Zod
- **Cron Jobs**: node-cron

### Data/ML
- **API Framework**: Python FastAPI
- **ML Libraries**: pandas, statsmodels (ARIMA)
- **Data Processing**: numpy, scipy
- **Browser Automation**: Playwright
- **LLM Integration**: LangChain

### Infrastructure
- **Database**: MongoDB (Atlas or self-hosted)
- **Push Notifications**: Firebase Cloud Messaging
- **Package Manager**: Bun (Node.js), pip (Python)
- **Version Control**: Git

---

## License

MIT License - see [LICENSE](./LICENSE) for details.

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

<p align="center">
  <strong>Ajrasakha</strong> - Empowering Indian agriculture with data intelligence
</p>

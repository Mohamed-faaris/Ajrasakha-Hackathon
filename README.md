# Ajrasakha Hackathon

Problem statement: https://vicharanashala.github.io/ajrasakha-hackathon/docs/problem-statements/pb1/

Ajrasakha is a multi-service mandi/APMC platform with:

- data ingestion and normalization (scraper engine),
- analytics and API backend (Node.js + Express),
- price forecasting (FastAPI prediction engine),
- two frontend apps (consumer and APMC portals).

## Current Implementation Snapshot

- `server/`: main backend API, auth, cron-driven aggregations, prediction proxy.
- `consumer-portal/`: production-facing React UI for analytics, alerts, trends, map insights.
- `apmc-portal/`: React UI for APMC workflows; several data hooks are currently mock/placeholder.
- `pridiction-engine/`: Python FastAPI service for ARIMA-based price prediction.
- `scraper-engine/endpoint-discovery/`: AI-assisted source discovery + scraping pipeline.
- `shared/`: shared frontend schemas/types.

Detailed workflow is documented in `PROJECT_WORKFLOW.md`.

## Repository Structure

```text
Ajrasakha-Hackathon/
|- apmc-portal/
|- consumer-portal/
|- server/
|- scraper-engine/
|  |- endpoint-discovery/
|  |- loader/
|  |- parser/
|  |- mapper/
|  '- mapper-apmc/
|- pridiction-engine/
|- seeder/
|- shared/
|- docs/
|- PROJECT_WORKFLOW.md
'- README.md
```

## Tech Stack

- Frontend: React, TypeScript, Vite, TanStack Query, Tailwind, shadcn/ui
- Backend: Node.js, Express, TypeScript, Mongoose, Better Auth
- Data/ML: Python FastAPI, pandas, statsmodels (ARIMA), MongoDB
- Scraping: Playwright, httpx, BeautifulSoup, LangChain-based discovery/mapping

## Prerequisites

- Node.js 18+
- pnpm 10+
- Python 3.11+ (3.12 also works)
- MongoDB (local or Atlas)
- Chromium install for Playwright (scraper only)
- Bun (optional, for `scraper-engine/loader` and parser utilities)

## Environment Configuration

### Server (`server/.env`)

Start from `server/.env.example`.

Required keys:

```env
PORT=5000
MONGO_URI=<your_mongodb_uri>
BETTER_AUTH_SECRET=<min_32_chars_secret>
BETTER_AUTH_URL=http://localhost:5000
BETTER_AUTH_TRUSTED_ORIGINS=http://localhost:8080,http://localhost:3000
```

### Prediction Engine (`pridiction-engine/.env`)

Start from `pridiction-engine/.env.example`.

```env
MONGO_URI=<your_mongodb_uri>
PORT=8000
```

### Scraper Engine (`scraper-engine/endpoint-discovery/.env`)

Start from `.env.example` in that folder.

Minimum required for practical runs:

```env
MONGO_URI=<your_mongodb_uri>
DB_NAME=mandi_insights
LLM_PROVIDER=google
GOOGLE_API_KEY=<your_google_key>
AGENT_MODE=discover_and_scrape
```

## Local Development

Run each service in a separate terminal.

### 1) API Server (port `5000`)

```bash
cd server
pnpm install
pnpm dev
```

### 2) Consumer Portal (port `3000`)

```bash
cd consumer-portal
pnpm install
pnpm dev
```

### 3) APMC Portal (port `8080`)

```bash
cd apmc-portal
pnpm install
pnpm dev
```

### 4) Prediction Engine (port `8000`)

```bash
cd pridiction-engine
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
# source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 5) Scraper Engine (optional, ingestion pipeline)

```bash
cd scraper-engine/endpoint-discovery
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
# source .venv/bin/activate
pip install -r requirements.txt
playwright install chromium
python main.py
```

## Current Ports and Integration

- `server`: `http://localhost:5000`
- `consumer-portal`: `http://localhost:3000` (dev proxy to server for `/api`)
- `apmc-portal`: `http://localhost:8080`
- `pridiction-engine`: `http://localhost:8000`

Server prediction integration defaults to `http://localhost:8000` (`PREDICTION_ENGINE_URL` in server service code).

## Tests

```bash
cd consumer-portal && pnpm test
cd apmc-portal && pnpm test
```

Server and Python services currently do not have a full automated test suite configured in this repo.

## Important Notes

- Root-level `package.json` scripts are legacy and do not fully reflect the current folder names/services.
- Prefer running install/dev/build commands from each service directory.
- APMC portal includes UI flows that still use mock hooks in `apmc-portal/src/hooks/useAPMCHooks.ts`.

## License

MIT

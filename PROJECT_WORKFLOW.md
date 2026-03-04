# Ajrasakha Project Workflow

This document explains the end-to-end workflow of the Ajrasakha system across ingestion, analytics, prediction, and user-facing apps.

## 1) System Overview

Ajrasakha is organized into these major services:

- `scraper-engine/endpoint-discovery`: discovers and scrapes mandi/APMC price sources.
- `server`: main API + auth + aggregation layer.
- `pridiction-engine`: forecasting microservice for crop prices.
- `consumer-portal`: end-user dashboard and insights frontend.
- `apmc-portal`: APMC/operator-facing frontend (currently largely mock-data driven).

Primary datastore: MongoDB.

## 2) End-to-End Data Flow

```text
Public mandi/APMC websites
  -> scraper-engine/endpoint-discovery
  -> MongoDB.prices / sources / scrape_runs
  -> server cron jobs compute derived collections
  -> server REST APIs
  -> consumer-portal + apmc-portal

On-demand prediction request
  -> server /api/predictions/*
  -> pridiction-engine /predictions/*
  -> MongoDB.predictions
  -> server response to frontend
```

## 3) Ingestion Workflow (Scraper Engine)

Location: `scraper-engine/endpoint-discovery`

### Discovery Stage

- Crawls a source site using Playwright.
- Detects candidate extraction methods:
- API endpoints (from network activity)
- HTML tables
- file-based sources (PDF/XLS/XLSX)
- Uses LLM-assisted analysis to select extraction strategy.
- Saves extraction config into `sources` collection.

### Mapping Stage

- Runs a small sample scrape.
- Uses AI mapping to align source-specific field names to normalized schema.
- Saves `schemaMapping` + conversion rules for reuse.

### Scrape Stage

- Reuses saved config to extract data in bulk.
- Normalizes fields and dates.
- Writes records to `prices` (upsert-based dedupe pattern).
- Logs run details in `scrape_runs`.

### Supported Modes

- `discover`
- `scrape`
- `discover_and_scrape` (default)
- `single_url`

## 4) Backend API Workflow (Server)

Location: `server`

The Node/Express server is the central API gateway.

### Core Responsibilities

- Better Auth session/auth endpoints under `/api/auth/*`.
- Domain APIs for crops, mandis, prices, coverage, alerts, top movers, profile, admin.
- Prediction proxy/orchestration endpoints under `/api/predictions`.
- Health endpoint: `/api/health`.

### Request Lifecycle

- Frontend calls API route (cookie/session based auth where required).
- Route handlers call services.
- Services query/update MongoDB models.
- JSON response returned to frontend.

## 5) Scheduled Analytics Workflow (Cron)

Location: `server/src/jobs/cron.ts`

The backend computes derived datasets on schedule:

- `01:00 IST` daily: compute top movers and store in `TopMover`.
- `02:00 IST` daily: compute latest mandi map prices and store in `MandiPrice`.
- `Every hour`: compute coverage metrics and update `Coverage`.
- `03:00 IST` daily: remove expired prediction documents.

These precomputed collections power fast dashboard queries.

## 6) Prediction Workflow

Services involved: `server` + `pridiction-engine`

### Generation

- Client requests prediction for a `(cropId, mandiId)` pair.
- Server routes to prediction service.
- Prediction engine loads last 90 days of prices from MongoDB.
- ARIMA-based forecast generates next 7 days with confidence.
- Result is stored/upserted with 24-hour TTL semantics (`expiresAt`).

### Retrieval

- Read endpoint returns only non-expired prediction documents.
- If none exists, caller must trigger generation.

## 7) Frontend Workflow

### Consumer Portal (`consumer-portal`)

- Primary user-facing app for prices, trends, alerts, map insights, analytics, and profile.
- Uses `/api` endpoints from the server (default via proxy/base URL config).
- Uses auth client (`better-auth`) with credentials/cookies.

### APMC Portal (`apmc-portal`)

- Intended for mandi/APMC operators (submission, profile, integration settings).
- Current hooks in `src/hooks/useAPMCHooks.ts` are placeholders using mock data.
- UI workflow is implemented; production API integration is still pending for several flows.

## 8) Operational Workflow (Local Dev)

Recommended startup order:

1. MongoDB
2. `server` (port `5000`)
3. `pridiction-engine` (port `8000`)
4. `consumer-portal` (port `3000`)
5. `apmc-portal` (port `8080`)
6. `scraper-engine/endpoint-discovery` (as needed for data ingestion)

## 9) Collections and Ownership

- `sources`: discovered source configurations (scraper-owned).
- `prices`: normalized historical mandi prices (scraper-owned, server-read).
- `scrape_runs`: scraper execution logs.
- `topmovers`/`top_movers`: derived movers dataset (server cron).
- `coverage`: aggregate national/state coverage stats (server cron).
- `mandiprices`/`mandi_prices`: latest map-friendly prices (server cron).
- `predictions`: generated forecasts with expiry (prediction service + server cleanup).

## 10) Current Gaps and Practical Notes

- Root `package.json` scripts are not the source of truth for all services; run commands from each service folder.
- APMC portal is not fully wired to backend APIs yet (mock hook layer still present).
- Prediction engine folder name is `pridiction-engine` in this repository.


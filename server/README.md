# Ajrasakha Server

Node.js/Express backend for Ajrasakha - the central API gateway, authentication service, and data aggregation layer for the agricultural commodity price intelligence platform.

## Overview

The server acts as the primary backend orchestration layer, providing:

- RESTful API endpoints for consumer and APMC portals
- Authentication and session management via Better Auth
- Data aggregation and analytics computation
- Scheduled cron jobs for price analysis and alerts
- WebSocket/SSE support for real-time updates
- Integration with the prediction microservice
- Push notification delivery via Firebase Cloud Messaging

## Tech Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js 18+ |
| Framework | Express 5 |
| Language | TypeScript 5 |
| Database | MongoDB with Mongoose ODM |
| Authentication | Better Auth |
| Validation | Zod |
| Task Scheduling | node-cron |
| Email | Nodemailer |
| Push Notifications | Firebase Admin SDK |

## Features

- **REST API** - Comprehensive endpoints for crops, mandis, prices, coverage, and alerts
- **Authentication** - Session-based auth with Better Auth (email/password, OAuth ready)
- **Authorization** - Role-based access control for admin and user endpoints
- **Cron Jobs** - Scheduled analytics (top movers, coverage stats, price aggregations)
- **Alert System** - Price/trend alerts with push notification delivery
- **Prediction Proxy** - Routes to prediction engine for price forecasting
- **Health Monitoring** - Service health checks with dependency status
- **Validation** - Request validation using Zod schemas

## Quick Start

### Prerequisites

- Node.js 18+ or Bun
- MongoDB instance (local or Atlas)
- Bun package manager

### Installation

```bash
# From project root
cd server

# Install dependencies
bun install
```

### Environment Setup

Create a `.env` file in the project root (server reads from root `.env`):

```bash
# Required
PORT=5000
MONGO_URI=mongodb://localhost:27017/ajrasakha
BETTER_AUTH_SECRET=your-secret-key-min-32-chars
BETTER_AUTH_URL=http://localhost:5000
PREDICTION_ENGINE_URL=http://localhost:8000

# Optional (with defaults)
BETTER_AUTH_TRUSTED_ORIGINS=http://localhost:5173,http://localhost:3000
EMAIL_FROM=noreply@ajrasakha.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

Generate a secure auth secret:
```bash
openssl rand -base64 32
```

### Development

```bash
# Start with hot reload (uses Bun)
bun dev

# Server will start on http://localhost:5000
```

### Production

```bash
# Build TypeScript
bun run build

# Start compiled server
bun start
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `5000` | Server port |
| `MONGO_URI` | Yes | - | MongoDB connection string |
| `BETTER_AUTH_SECRET` | Yes | - | Auth encryption secret (min 32 chars) |
| `BETTER_AUTH_URL` | No | `http://localhost:5000` | Base URL for auth endpoints |
| `BETTER_AUTH_TRUSTED_ORIGINS` | No | `http://localhost:5173` | Comma-separated allowed CORS origins |
| `PREDICTION_ENGINE_URL` | Yes | - | URL of prediction microservice |
| `EMAIL_FROM` | No | - | Default sender email address |
| `SMTP_HOST` | No | `smtp.gmail.com` | SMTP server host |
| `SMTP_PORT` | No | `465` | SMTP server port |
| `SMTP_USER` | No | - | SMTP authentication username |
| `SMTP_PASS` | No | - | SMTP authentication password |

## Project Structure

```
server/
├── src/
│   ├── app.ts                 # Express app factory
│   ├── server.ts              # Entry point, DB connection
│   ├── lib/
│   │   └── auth.ts            # Better Auth configuration
│   ├── config/
│   │   ├── db.ts              # MongoDB connection
│   │   ├── env.ts             # Environment validation
│   │   └── firebase.ts        # Firebase Admin setup
│   ├── routes/
│   │   ├── index.ts           # Route exports
│   │   ├── crop.routes.ts     # Crop endpoints
│   │   ├── state.routes.ts    # State endpoints
│   │   ├── mandi.routes.ts    # Mandi endpoints
│   │   ├── price.routes.ts    # Price endpoints
│   │   ├── alert.routes.ts    # Alert management
│   │   ├── coverage.routes.ts # Coverage statistics
│   │   ├── topMover.routes.ts # Top movers data
│   │   ├── mandiPrice.routes.ts # Map price data
│   │   ├── userProfile.routes.ts # User profile
│   │   ├── prediction.routes.ts  # Prediction proxy
│   │   ├── analyticsPrediction.routes.ts # Analytics
│   │   ├── map.routes.ts      # Map insights
│   │   ├── admin.routes.ts    # Admin endpoints
│   │   └── dev.*.routes.ts    # Development utilities
│   ├── controllers/           # Route handlers
│   ├── services/              # Business logic
│   ├── models/                # Mongoose schemas
│   ├── middlewares/           # Express middlewares
│   └── jobs/
│       ├── cron.ts            # Scheduled jobs
│       └── alert.processor.ts # Alert evaluation
├── dist/                      # Compiled output
├── package.json
├── tsconfig.json
└── README.md
```

## API Overview

### Endpoint Groups

| Base Path | Description | Auth Required |
|-----------|-------------|---------------|
| `/api/auth/*` | Better Auth endpoints | Varies |
| `/api/consumer-portal/*` | Consumer app APIs | Yes |
| `/api/dev/*` | Development utilities | No |
| `/api/health` | Health check | No |

### Consumer Portal Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/consumer-portal/crops` | GET | List all crops |
| `/api/consumer-portal/states` | GET | List all states |
| `/api/consumer-portal/mandis` | GET | List mandis with filters |
| `/api/consumer-portal/prices` | GET | Get price data |
| `/api/consumer-portal/alerts` | GET/POST | Manage price alerts |
| `/api/consumer-portal/coverage` | GET | Coverage statistics |
| `/api/consumer-portal/top-movers` | GET | Daily top price movers |
| `/api/consumer-portal/mandi-prices` | GET | Latest prices for maps |
| `/api/consumer-portal/profile` | GET/PATCH | User profile |
| `/api/consumer-portal/predictions` | GET/POST | Price predictions |
| `/api/consumer-portal/analytics` | GET | Analytics data |
| `/api/consumer-portal/map-insights` | GET | Map-based insights |
| `/api/consumer-portal/admin/*` | Various | Admin operations |

### Auth Endpoints (Better Auth)

Better Auth provides standard endpoints under `/api/auth/`:

- `POST /api/auth/sign-up/email` - Email registration
- `POST /api/auth/sign-in/email` - Email login
- `POST /api/auth/sign-out` - Logout
- `GET /api/auth/session` - Get current session
- `POST /api/auth/update-user` - Update user profile

## Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `bun --watch src/server.ts` | Development with hot reload |
| `build` | `tsc` | Compile TypeScript to `dist/` |
| `start` | `bun dist/server.js` | Run compiled server |
| `test` | - | Tests not implemented |

## Testing

Currently, no automated tests are implemented. To test endpoints manually:

1. Start the server: `bun dev`
2. Use curl, Postman, or the frontend applications
3. Health check: `curl http://localhost:5000/api/health`

Example requests:

```bash
# Health check
curl http://localhost:5000/api/health

# Get crops
curl http://localhost:5000/api/consumer-portal/crops

# Get states
curl http://localhost:5000/api/consumer-portal/states
```

## Scheduled Jobs

The server runs several cron jobs (defined in `src/jobs/cron.ts`):

| Schedule | Job | Description |
|----------|-----|-------------|
| `0 1 * * *` (1 AM IST) | Top Movers | Computes daily top price movers |
| `0 2 * * *` (2 AM IST) | Mandi Prices | Updates map price aggregations |
| `0 * * * *` (Hourly) | Coverage | Updates coverage statistics |
| `0 3 * * *` (3 AM IST) | Cleanup | Removes expired predictions |
| `0 * * * *` (Hourly) | Alert Processor | Evaluates and sends alert notifications |

## Related Documentation

- [Project Workflow](../PROJECT_WORKFLOW.md) - End-to-end system workflow
- [Environment Guide](../AGENTS.md) - Environment variable patterns and common errors

## License

MIT

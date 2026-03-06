# Ajrasakha Consumer Portal

End-user dashboard for agricultural price insights, analytics, and personalized alerts.

## Overview

The Consumer Portal is the primary user-facing application of the Ajrasakha system. It provides farmers, traders, and agricultural professionals with real-time access to mandi (market) prices, price predictions, interactive maps, and analytics. The portal integrates with the main API server and prediction engine to deliver actionable insights for agricultural commodity trading decisions.

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React 18 |
| Language | TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui |
| State Management | TanStack Query (React Query) |
| Charts | Recharts |
| Maps | Leaflet (via react-leaflet) |
| Auth | Better Auth |
| Testing | Vitest + Testing Library |

## Features

### Dashboard
- Real-time commodity price cards with top gainers/losers
- Quick stats overview with daily market summaries
- Interactive price trend charts

### Analytics
- Historical price analysis with customizable date ranges
- Volume and price correlation visualizations
- Export data for offline analysis

### Price Alerts
- Create custom alerts for price thresholds
- Trend-based alerts (percentage change over time)
- Push notifications via Firebase Cloud Messaging
- Alert management dashboard

### Map Insights
- Interactive map showing mandi locations across India
- Heatmap visualization of price coverage
- State-wise market density indicators
- Click-through to detailed mandi information

### Predictions
- ARIMA-based 7-day price forecasts
- Confidence intervals for predictions
- Historical accuracy metrics

### User Profile
- Manage personal preferences
- FCM token registration for push notifications
- Saved locations and favorite commodities

## Quick Start

### Prerequisites

- Bun (recommended) or Node.js 18+
- Running backend server (see [../server/README.md](../server/README.md))
- MongoDB instance

### Installation

```bash
# Install dependencies
bun install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
bun dev
```

The development server runs on `http://localhost:3000` by default.

## Environment Variables

Create a `.env` file in the project root with the following variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Backend API base URL (e.g., `http://localhost:5000/api`) |
| `VITE_AUTH_BASE_URL` | Yes | Auth API base URL (e.g., `http://localhost:5000/api`) |
| `VITE_FIREBASE_API_KEY` | Yes | Firebase client API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Yes | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | No | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Yes | FCM sender ID |
| `VITE_FIREBASE_APP_ID` | Yes | Firebase app ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | No | Firebase analytics ID |

> **Security Note:** Never commit `.env` files to version control. The `.env.example` file shows required variables without real values.

## Project Structure

```
consumer-portal/
├── public/                 # Static assets
├── src/
│   ├── components/         # React components
│   │   ├── ui/            # shadcn/ui components (buttons, cards, dialogs, etc.)
│   │   ├── AppSidebar.tsx # Main navigation sidebar
│   │   ├── AppLayout.tsx  # App shell with sidebar
│   │   └── ...
│   ├── pages/             # Route pages
│   │   ├── Dashboard.tsx
│   │   ├── Analytics.tsx
│   │   ├── PriceAlerts.tsx
│   │   ├── MapInsights.tsx
│   │   ├── Login.tsx
│   │   ├── Signup.tsx
│   │   └── ...
│   ├── hooks/             # Custom React hooks
│   │   ├── use-alerts.ts      # Alert CRUD operations
│   │   ├── use-prices.ts      # Price data fetching
│   │   ├── use-prediction.ts  # Prediction fetching
│   │   ├── use-coverage.ts    # Coverage heatmap data
│   │   ├── use-fcm.ts         # Firebase Cloud Messaging
│   │   └── ...
│   ├── lib/               # Utilities and configurations
│   │   ├── api.ts         # API client configuration
│   │   ├── api-client.ts  # Typed API functions
│   │   ├── auth.ts        # Auth configuration
│   │   ├── auth-client.ts # Better Auth client
│   │   ├── types.ts       # TypeScript interfaces
│   │   └── utils.ts       # Helper functions
│   ├── test/              # Test utilities and examples
│   │   └── setup.ts       # Vitest configuration
│   ├── App.tsx            # Main app component with routes
│   ├── main.tsx           # Entry point
│   └── index.css          # Global styles
├── index.html
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

## Scripts

| Command | Description |
|---------|-------------|
| `bun dev` | Start development server (Vite + HMR) |
| `bun run build` | Build for production |
| `bun run build:dev` | Build for development mode |
| `bun run preview` | Preview production build locally |
| `bun test` | Run tests once (Vitest) |
| `bun test:watch` | Run tests in watch mode |
| `bun run lint` | Run ESLint |

## Testing

The project uses **Vitest** for unit testing with **Testing Library** for React component testing.

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test:watch

# Run with coverage
bun test --coverage
```

Tests are located alongside components or in `src/test/` for utilities. Example test:

```typescript
// src/test/example.test.ts
import { describe, it, expect } from 'vitest';

describe('Math', () => {
  it('adds numbers correctly', () => {
    expect(1 + 1).toBe(2);
  });
});
```

## Related Documentation

- [PROJECT_WORKFLOW.md](../PROJECT_WORKFLOW.md) - End-to-end system workflow
- [../server/README.md](../server/README.md) - Backend API documentation
- [../scraper-engine/README.md](../scraper-engine/README.md) - Data ingestion workflow

## Development Workflow

1. **Start the backend**: Ensure the server is running on port 5000
2. **Set up environment**: Configure `.env` with API URLs
3. **Run the app**: `bun dev` starts the Vite dev server
4. **Make changes**: Vite HMR provides instant feedback
5. **Test**: Write tests for new features, run `bun test`
6. **Build**: `bun run build` creates production assets in `dist/`

## API Integration

The portal consumes REST APIs from the backend server:

- `/api/prices/*` - Price data and historical trends
- `/api/crops/*` - Commodity/crop information
- `/api/mandis/*` - Market/mandi data
- `/api/alerts/*` - User alert management
- `/api/predictions/*` - Price forecasting
- `/api/coverage/*` - Map coverage data
- `/api/auth/*` - Better Auth endpoints

All API calls are typed using the `api-client.ts` module.

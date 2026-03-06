# APMC Portal

APMC (Agricultural Produce Market Committee) operator portal for mandi market management. This application enables APMC operators to submit daily commodity prices, manage market profiles, and integrate with the Ajrasakha price aggregation platform.

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 18** | UI library with functional components and hooks |
| **TypeScript** | Type-safe development |
| **Vite** | Fast build tool and dev server |
| **TanStack Query** | Server state management and data fetching |
| **Tailwind CSS** | Utility-first styling |
| **shadcn/ui** | Headless UI component library |
| **React Router** | Client-side routing |
| **Zod** | Schema validation |
| **Recharts** | Data visualization |

---

## Features

### Dashboard (`/dashboard`)
- Real-time integration status monitoring
- Submission statistics and trends
- Coverage contribution metrics
- Data health indicators
- Monthly submission history chart

### Submit Price (`/submit-price`)
- Manual price entry form with validation
- Support for min/max/modal prices
- Date selection with calendar picker
- Crop and variety selection
- Success/error feedback via toast notifications

### Bulk Upload (`/bulk-upload`)
- Excel/CSV file upload interface
- Progress tracking during processing
- Validation status indicators
- Download template option
- Row-level error reporting

### Submission History (`/history`)
- Paginated view of all submissions
- Filter by status (Approved, Pending, Rejected)
- Filter by source (Manual, Excel, API)
- Sort by date, crop, or price range
- Status badges for quick identification

### My Mandi Profile (`/profile`)
- Mandi information display and editing
- Location coordinates (latitude/longitude)
- Contact person details
- Email and phone management
- Last updated timestamp tracking

### Integration Settings (`/integration`)
- Data source type selection (Manual, Excel, API)
- API key generation and regeneration
- Webhook URL configuration
- Integration status monitoring
- Last verified timestamp

---

## Current Status

> ⚠️ **Important:** This portal is currently in **UI-complete, mock-data phase**. All hooks in `src/hooks/useAPMCHooks.ts` return static mock data and do not make actual API calls.
>
> The following operations are currently mocked:
> - `useAPMCStats()` - Returns static statistics
> - `useSubmitPrice()` - Logs to console only
> - `useBulkUpload()` - Simulates progress only
> - `useSubmissionHistory()` - Returns static history array
> - `useMandiProfile()` - Returns static profile data
> - `useIntegrationSettings()` - Returns static settings
>
> Backend API integration is pending for production deployment.

---

## Quick Start

### Prerequisites

- Node.js 18+
- bun package manager
- Backend server running (see root `server/`)

### Installation

```bash
# From the project root
cd apmc-portal

# Install dependencies
bun install

# Configure environment
cp .env.example .env
# Edit .env and set VITE_API_URL
```

### Development

```bash
# Start development server (port 8080)
bun dev
```

The application will be available at `http://localhost:8080`.

---

## Environment Variables

Create a `.env` file in the `apmc-portal` directory:

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_API_URL` | Yes | API base URL for APMC endpoints | `http://localhost:5000/api/apmc` |

> Note: All environment variables exposed to the client must be prefixed with `VITE_`.

---

## Project Structure

```
apmc-portal/
├── src/
│   ├── components/
│   │   ├── apmc/              # APMC-specific components
│   │   │   ├── APMCLayout.tsx
│   │   │   ├── APMCSidebar.tsx
│   │   │   ├── APMCTopbar.tsx
│   │   │   ├── StatCard.tsx
│   │   │   └── StatusBadge.tsx
│   │   ├── ui/                # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── form.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── table.tsx
│   │   │   └── toast.tsx
│   │   └── NavLink.tsx
│   ├── hooks/
│   │   ├── useAPMCHooks.ts    # Mock data hooks (see Current Status)
│   │   ├── use-toast.ts
│   │   └── use-mobile.tsx
│   ├── lib/
│   │   ├── routes.ts          # Route definitions
│   │   └── utils.ts           # Utility functions
│   ├── pages/
│   │   ├── Index.tsx          # Landing/redirect
│   │   ├── NotFound.tsx       # 404 page
│   │   └── apmc/
│   │       ├── APMCDashboard.tsx
│   │       ├── SubmitPrice.tsx
│   │       ├── BulkUpload.tsx
│   │       ├── SubmissionHistory.tsx
│   │       ├── MyMandiProfile.tsx
│   │       ├── MandiRegistration.tsx
│   │       └── IntegrationSettings.tsx
│   ├── App.tsx                # Root component
│   ├── main.tsx               # Entry point
│   └── index.css              # Global styles
├── public/                    # Static assets
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
└── README.md
```

---

## Scripts

| Script | Description |
|--------|-------------|
| `bun dev` | Start development server with HMR |
| `bun run build` | Create production build |
| `bun run build:dev` | Create development build |
| `bun run preview` | Preview production build locally |
| `bun test` | Run tests once (Vitest) |
| `bun test:watch` | Run tests in watch mode |
| `bun run lint` | Run ESLint |

---

## Future Integration

To move from mock data to production, the following API endpoints need to be implemented on the backend:

| Hook | Required Endpoint | Method |
|------|-------------------|--------|
| `useAPMCStats()` | `/api/apmc/stats` | GET |
| `useSubmitPrice()` | `/api/apmc/prices` | POST |
| `useBulkUpload()` | `/api/apmc/prices/bulk` | POST (multipart) |
| `useSubmissionHistory()` | `/api/apmc/submissions` | GET |
| `useMandiProfile()` | `/api/apmc/profile` | GET, PUT |
| `useIntegrationSettings()` | `/api/apmc/integration` | GET, PUT |
| `useMandiRegistration()` | `/api/apmc/register` | POST |

Additional requirements:
- Authentication via Better Auth (cookie-based sessions)
- File upload support for Excel/CSV bulk operations
- Webhook integration for external data sources
- Rate limiting for API submissions

---

## Related Documentation

- [Project Workflow](../PROJECT_WORKFLOW.md) - End-to-end system workflow documentation
- [Server API Documentation](../server/README.md) - Backend API reference
- [Consumer Portal](../consumer-portal/README.md) - End-user portal documentation

---

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## License

This project is part of the Ajrasakha platform.

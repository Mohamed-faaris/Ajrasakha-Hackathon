# Developer Portal

A React-based developer portal for API key management and Mandi Insights API access. This portal allows developers to generate, view, and revoke API keys for programmatic access to agricultural commodity price data.

## Overview

The Developer Portal provides a simple interface for:
- **User Authentication** - Secure login via email/password using Better Auth
- **API Key Management** - Create, view, and revoke API keys for API access
- **API Documentation** - Quick start guides and endpoint information
- **Self-Service Access** - Developers can manage their own API credentials

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 18** | UI library with hooks and functional components |
| **TypeScript** | Type-safe development |
| **Vite** | Build tool and development server |
| **Tailwind CSS** | Utility-first styling |
| **shadcn/ui** | Accessible UI components (Button, Card, Input, etc.) |
| **Better Auth** | Authentication and API key management |
| **React Router v7** | Client-side routing |
| **Lucide React** | Icon library |

## Prerequisites

- **Bun** runtime (see [bun.sh](https://bun.sh))
- Backend server running on `http://localhost:5000`

## Installation

```bash
# Navigate to the dev-portal directory
cd dev-portal

# Install dependencies
bun install
```

## Environment Configuration

Create a `.env` file in the dev-portal root:

```env
VITE_API_URL=http://localhost:5000/api
```

**Required Variables:**

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | Base URL for the backend API | Yes |

> **Note:** The dev-portal reads environment variables from the root `.env` file as well. See the main project README for shared configuration.

## Running the Development Server

```bash
# Start development server on port 5174
bun run dev
```

The portal will be available at `http://localhost:5174`

### Development Server Features

- **Hot Module Replacement (HMR)** - Instant updates on file changes
- **API Proxy** - Requests to `/api` are proxied to `http://localhost:5000`
- **TypeScript** - Automatic type checking

## Build Commands

```bash
# Build for production
bun run build

# Preview production build locally
bun run preview

# Run ESLint
bun run lint
```

Production builds are output to the `dist/` directory.

## Project Structure

```
dev-portal/
├── src/
│   ├── components/
│   │   └── ui/           # shadcn/ui components
│   ├── lib/
│   │   ├── api.ts        # API client and dev endpoints
│   │   ├── auth-client.ts # Better Auth client setup
│   │   └── utils.ts      # Utility functions
│   ├── pages/
│   │   ├── Login.tsx     # Authentication page
│   │   ├── Dashboard.tsx # Main developer dashboard
│   │   └── ApiKeys.tsx   # API key management
│   ├── App.tsx           # Router and route guards
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles + Tailwind
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## Available Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/login` | Public | Email/password authentication |
| `/dashboard` | Private | Overview, quick start, API info |
| `/api-keys` | Private | Create, view, revoke API keys |
| `/` | Redirect | Redirects to `/dashboard` |

## Authentication Flow

1. User enters credentials at `/login`
2. Better Auth validates against the server
3. Session cookie is set
4. Protected routes check `useSession()` hook
5. Unauthenticated users are redirected to `/login`

## API Key Usage

Once authenticated, developers can:

1. Navigate to **API Keys** page
2. Click **Create Key** and provide a name
3. Copy the generated key (shown only once)
4. Include the key in API requests via the `x-api-key` header:

```bash
curl "http://localhost:5000/api/dev/prices" \
  -H "x-api-key: sk_live_xxxxxxxxxxxx"
```

## Related Documentation

- See `WORKFLOW.md` for detailed architecture and development patterns
- Backend API docs available at `/api/dev/*` endpoints on the server

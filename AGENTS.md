# Environment Variables

## Pattern: Throw Errors for Missing Required Env Vars

**NEVER use fallback values with `||` for required configuration.**

Instead of:
```typescript
// BAD - Silent failure with wrong defaults
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
```

**DO THIS** - Throw explicit errors:
```typescript
// GOOD - Fail fast with clear error
const apiUrl = import.meta.env.VITE_API_URL;
if (!apiUrl) {
  throw new Error('VITE_API_URL environment variable is required');
}
```

## Required Environment Variables

### Server (`/server/.env` or root `.env`)
| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://...` |
| `BETTER_AUTH_SECRET` | Auth encryption secret | Generate with `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | Base URL for auth | `http://localhost:5000` |
| `BETTER_AUTH_TRUSTED_ORIGINS` | Allowed CORS origins | `http://localhost:5173,http://localhost:3000` |

### Consumer Portal (`VITE_` prefix required)
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | API base URL | `http://localhost:5000/api/consumer-portal` |
| `VITE_AUTH_BASE_URL` | Auth API base URL | `http://localhost:5000/api` |
| `VITE_FIREBASE_API_KEY` | Firebase client key | From Firebase Console |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | `project.firebaseapp.com` |

### Dev Portal (`VITE_` prefix required)
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | API base URL | `http://localhost:5000/api/dev` |

### APMC Portal (`VITE_` prefix required)
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | API base URL | `http://localhost:5000/api/apmc` |

## Common Errors

### "VITE_API_URL environment variable is required"
The frontend app cannot connect to the backend. Check:
1. `.env` file exists in project root
2. `VITE_API_URL` is defined
3. Server is running on the specified URL

### "BETTER_AUTH_SECRET is required"
Auth will not work without a secret. Generate one:
```bash
openssl rand -base64 32
```

## Single Source of Truth

All services read from the root `.env` file. Do not create separate `.env` files in subdirectories unless for local overrides (`.env.local`).

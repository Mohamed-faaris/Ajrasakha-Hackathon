# Developer Portal - Workflow Documentation

## 1. Architecture Overview

### Project Structure

```
dev-portal/
├── src/
│   ├── components/
│   │   └── ui/              # shadcn/ui components (card, button, input, sonner)
│   ├── lib/
│   │   ├── api.ts           # Typed API client for dev endpoints
│   │   ├── auth-client.ts   # Better Auth client configuration
│   │   └── utils.ts         # cn() utility for Tailwind classes
│   ├── pages/
│   │   ├── Login.tsx        # Authentication form with email/password
│   │   ├── Dashboard.tsx    # Overview with quick start guide
│   │   └── ApiKeys.tsx      # Full API key management UI
│   ├── App.tsx              # Router setup with Private/Public route guards
│   ├── main.tsx             # React app entry point
│   └── index.css            # Tailwind directives + CSS variables
├── index.html               # Vite HTML entry
├── vite.config.ts           # Vite + React plugin + path aliases
├── tailwind.config.js       # Tailwind + shadcn theme config
└── tsconfig.json            # TypeScript paths (@/* alias)
```

### Routing Setup

The application uses **React Router v7** with `BrowserRouter`:

```tsx
// App.tsx
<BrowserRouter>
  <Routes>
    <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
    <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
    <Route path="/api-keys" element={<PrivateRoute><ApiKeys /></PrivateRoute>} />
    <Route path="/" element={<Navigate to="/dashboard" />} />
  </Routes>
</BrowserRouter>
```

**Route Guards:**
- `PrivateRoute` - Redirects to `/login` if no session
- `PublicRoute` - Redirects to `/dashboard` if already authenticated

Both guards handle loading states with a spinner while checking session.

### Authentication Integration

Authentication is handled via **Better Auth** with the following setup:

```tsx
// lib/auth-client.ts
export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  fetchOptions: { credentials: 'include' },
  plugins: [apiKeyClient()],
});
```

The client uses:
- **Session cookies** for authentication state
- **API Key plugin** for key management methods
- **CORS credentials** for cross-origin cookie support

---

## 2. Features

### API Key Generation

**Flow:**
1. User enters a descriptive name (e.g., "Production App")
2. `authClient.apiKey.create({ name })` is called
3. Server generates key with format `sk_live_...`
4. **Full key is displayed only once** in a warning card
5. User must copy the key before dismissing

**UI Components:**
- Input field for key name
- Create button with loading state
- Warning card for displaying the new key
- Copy button with visual feedback

### API Key Management (View, Revoke)

**View Keys:**
- List all keys for the authenticated user
- Display: name, masked key (`prefix••••••`), creation date
- Keys are loaded via `authClient.apiKey.list()`

**Revoke Keys:**
- Trash icon button on each key row
- Confirmation dialog (`confirm()`)
- Calls `authClient.apiKey.delete({ keyId })`
- List refreshes after deletion

**Security Considerations:**
- Only key prefix is shown after creation
- Keys are masked in the UI (`••••••`)
- Deletion is permanent and immediate

### API Documentation Viewing

The Dashboard provides a **Quick Start** section with:
- Copyable cURL examples
- Base URL display with copy button
- Authentication header format (`x-api-key`)
- Endpoint overview (`/api/dev/*`)

**Code examples include:**
- Get prices with filters
- Get all crops
- Get states list

### Usage Analytics

Currently, the dashboard displays static rate limit info:
- **Rate Limit:** 100 requests per minute per API key

Future enhancements could include:
- Request count graphs
- Error rate tracking
- Key-specific usage stats

---

## 3. Authentication Flow

### Better Auth Integration

**Server-side (from `server/src/lib/auth.ts`):**

```typescript
export const createAuth = (db, client) => betterAuth({
  database: mongodbAdapter(db, { client }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  basePath: '/api/auth',
  trustedOrigins: env.BETTER_AUTH_TRUSTED_ORIGINS,
  emailAndPassword: { enabled: true },
  plugins: [
    apiKey({
      apiKeyHeaders: 'x-api-key',
      enableSessionForAPIKeys: true,
      permissions: {
        defaultPermissions: {
          prices: ['read'],
          crops: ['read'],
          states: ['read'],
        },
      },
    }),
  ],
});
```

**Client-side hooks:**

| Hook | Purpose |
|------|---------|
| `useSession()` | Get current session state |
| `signIn.email({ email, password })` | Authenticate user |
| `signOut()` | Clear session |
| `authClient.apiKey.create()` | Generate new API key |
| `authClient.apiKey.list()` | Fetch user's keys |
| `authClient.apiKey.delete()` | Revoke a key |

### API Key Authentication Flow

**For API requests (server-side):**

1. Request arrives with `x-api-key` header
2. Better Auth validates the key against the database
3. Key permissions are checked
4. Request proceeds to controller if authorized

**Example request:**

```bash
curl "http://localhost:5000/api/dev/prices" \
  -H "x-api-key: sk_live_abc123..."
```

### Protected Routes

All routes except `/login` are protected using the `PrivateRoute` component:

```tsx
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { data: session, isLoading } = useSession();
  
  if (isLoading) {
    return <Spinner />;  // Show while checking session
  }
  
  return session ? <>{children}</> : <Navigate to="/login" />;
}
```

---

## 4. API Integration

### Connection to Main Server

The dev-portal connects to the main Express server running on `localhost:5000`.

**Vite Proxy Configuration:**

```ts
// vite.config.ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true,
    },
  },
}
```

### API Endpoints Used

**Authentication (Better Auth):**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/sign-in/email` | POST | Email/password login |
| `/api/auth/sign-out` | POST | Logout |
| `/api/auth/session` | GET | Get current session |
| `/api/auth/api-key/create` | POST | Create new API key |
| `/api/auth/api-key/list` | GET | List user's API keys |
| `/api/auth/api-key/delete` | POST | Revoke an API key |

**Dev API (Data Endpoints):**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/dev/prices` | GET | Get prices with filters |
| `/api/dev/prices/latest` | GET | Get latest prices |
| `/api/dev/prices/trends` | GET | Get price trends |
| `/api/dev/crops` | GET | List all crops |
| `/api/dev/crops/search?q=` | GET | Search crops |
| `/api/dev/crops/:id` | GET | Get crop by ID |
| `/api/dev/states` | GET | List all states |
| `/api/dev/states/:code` | GET | Get state by code |

### API Client (`lib/api.ts`)

A lightweight typed API client:

```typescript
export const api = {
  get: async <T>(endpoint: string, options?: RequestInit): Promise<T> => { ... },
  post: async <T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> => { ... },
};

export const devApi = {
  prices: { getAll, getLatest, getTrends },
  crops: { getAll, search, getById },
  states: { getAll, getByCode },
};
```

All requests include `credentials: 'include'` for cookie-based auth.

---

## 5. Component Patterns

### shadcn/ui Components Used

| Component | Usage |
|-----------|-------|
| `Button` | Actions, navigation, form submission |
| `Card` | Content grouping (API info, key list, forms) |
| `Input` | Text entry (email, password, key name) |
| `Sonner` | Toast notifications (via `<Toaster />`) |

### Key Management UI Patterns

**Key Creation Form:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Create New API Key</CardTitle>
    <CardDescription>Create an API key to access the API</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="flex gap-3">
      <Input placeholder="e.g., Production App" ... />
      <Button onClick={createKey}>Create Key</Button>
    </div>
  </CardContent>
</Card>
```

**New Key Warning (One-time display):**
```tsx
<Card className="border-yellow-300 bg-yellow-50">
  <CardHeader>
    <CardTitle className="text-yellow-800">
      <AlertTriangle /> Save This Key
    </CardTitle>
    <CardDescription className="text-yellow-700">
      This is the only time you'll see this key.
    </CardDescription>
  </CardHeader>
  <CardContent>
    <code>{showNewKey}</code>
    <Button onClick={() => copyKey(showNewKey)}>
      <Copy /> / <Check />
    </Button>
  </CardContent>
</Card>
```

**Key List Item:**
```tsx
<div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border">
  <div>
    <p className="font-medium">{key.name}</p>
    <p className="font-mono">{key.prefix}••••••</p>
    <p className="text-xs text-slate-400">
      Created {new Date(key.createdAt).toLocaleDateString()}
    </p>
  </div>
  <Button variant="ghost" onClick={() => deleteKey(key.id)}>
    <Trash2 className="text-red-500" />
  </Button>
</div>
```

### Common Patterns

**Loading States:**
```tsx
if (isLoading) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin h-8 w-8 border-4 border-green-600 border-t-transparent rounded-full" />
    </div>
  );
}
```

**Copy to Clipboard:**
```tsx
const copyKey = (key: string) => {
  navigator.clipboard.writeText(key);
  setCopied(key);
  setTimeout(() => setCopied(null), 2000);
};
```

---

## 6. Development Workflow

### Adding New Features

1. **Create new page components** in `src/pages/`
2. **Add route** in `App.tsx` with appropriate route guard
3. **Update navigation** in page headers if needed
4. **Add API methods** in `lib/api.ts` if new endpoints are needed
5. **Use shadcn/ui components** for consistent UI
6. **Follow existing patterns** for loading states and error handling

### File Naming Conventions

- **Pages:** PascalCase (e.g., `ApiKeys.tsx`, `Dashboard.tsx`)
- **Components:** kebab-case for UI files (e.g., `card.tsx`, `button.tsx`)
- **Libraries:** camelCase (e.g., `auth-client.ts`, `api.ts`)

### Testing

**Manual Testing Checklist:**

- [ ] Login with valid credentials
- [ ] Login with invalid credentials (error handling)
- [ ] Session persistence after refresh
- [ ] Create API key
- [ ] Copy API key to clipboard
- [ ] Delete API key with confirmation
- [ ] Navigate between pages
- [ ] Direct URL access to protected routes (should redirect to login)
- [ ] Access `/login` while authenticated (should redirect to dashboard)

**API Testing:**

Use the dev-portal's API client or cURL to test endpoints:

```bash
# Get prices (requires API key)
curl "http://localhost:5000/api/dev/prices" \
  -H "x-api-key: YOUR_KEY_HERE"

# Get crops (requires API key)
curl "http://localhost:5000/api/dev/crops" \
  -H "x-api-key: YOUR_KEY_HERE"
```

### Code Style Guidelines

- Use **TypeScript** for all new files
- Prefer **functional components** with hooks
- Use **Tailwind classes** for styling (no CSS modules)
- Handle **loading and error states** explicitly
- Use **Lucide icons** for iconography
- Follow **shadcn/ui patterns** for component composition

### Environment Variables

Required in `.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

**Important:** All `VITE_` prefixed variables are exposed to the client. Never include secrets.

# Better Auth Implementation

## Backend Setup

### Environment Variables

```env
BETTER_AUTH_SECRET=<min-32-char-secret>
BETTER_AUTH_URL=http://localhost:5000
```

### Auth Instance (`src/lib/auth.ts`)

```ts
import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';

export const createAuth = (db: mongoose.mongo.Db) => {
  return betterAuth({
    database: mongodbAdapter(db),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    emailAndPassword: {
      enabled: true,
    },
  });
};
```

### Database Collections

Better Auth with MongoDB auto-creates collections on first run:
- `user` - User accounts
- `session` - Active sessions  
- `account` - Linked accounts (for social auth)
- `verification` - Email verification tokens

No migration needed for MongoDB adapter.

---

## API Endpoints

All endpoints are under `/api/auth`.

### Sign Up

**Curl:**
```bash
curl -X POST http://localhost:5000/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }'
```

**Request:**
```
POST /api/auth/sign-up/email
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"  // optional
}
```

**Response:**
```json
{
  "user": {
    "id": "...",
    "email": "user@example.com",
    "name": "John Doe",
    "emailVerified": false,
    "createdAt": "...",
    "updatedAt": "..."
  },
  "session": {
    "id": "...",
    "userId": "...",
    "expiresAt": "..."
  }
}
```

### Sign In

**Curl:**
```bash
curl -X POST http://localhost:5000/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**Request:**
```
POST /api/auth/sign-in/email
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Sign Out

**Curl:**
```bash
curl -X POST http://localhost:5000/api/auth/sign-out \
  -b cookies.txt
```

**Request:**
```
POST /api/auth/sign-out
```

### Get Session

**Curl:**
```bash
curl http://localhost:5000/api/auth/get-session \
  -b cookies.txt
```

**Response:**
```json
{
  "user": { ... },
  "session": { ... }
}
```

---

## Frontend Integration (React)

### 1. Install Package

```bash
bun add better-auth
```

### 2. Create Auth Client (`src/lib/auth-client.ts`)

```ts
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: 'http://localhost:5000',
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
} = authClient;
```

### 3. Usage Examples

#### Sign Up

```tsx
import { signUp } from '@/lib/auth-client';

const handleSignUp = async () => {
  await signUp.email({
    email: 'user@example.com',
    password: 'password123',
    name: 'John Doe',
  });
};
```

#### Sign In

```tsx
import { signIn } from '@/lib/auth-client';

const handleSignIn = async () => {
  await signIn.email({
    email: 'user@example.com',
    password: 'password123',
  });
};
```

#### Sign Out

```tsx
import { signOut } from '@/lib/auth-client';

const handleSignOut = async () => {
  await signOut();
};
```

#### Get Current User (useSession Hook)

```tsx
import { useSession } from '@/lib/auth-client';

function UserProfile() {
  const { data, isPending } = useSession();

  if (isPending) return <div>Loading...</div>;
  if (!data) return <div>Not logged in</div>;

  return (
    <div>
      <p>Email: {data.user.email}</p>
      <p>Name: {data.user.name}</p>
    </div>
  );
}
```

#### Protected Route Component

```tsx
import { useSession } from '@/lib/auth-client';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data, isPending } = useSession();

  if (isPending) return <div>Loading...</div>;
  if (!data) return <Navigate to="/login" />;

  return <>{children}</>;
}
```

---

## Session Management

Better Auth uses cookies for session management. Sessions are automatically:
- Created on sign-in/sign-up
- Sent with every request
- Validated on protected routes

### Access User on Backend

```ts
import { auth } from './lib/auth';

app.get('/api/protected', async (req, res) => {
  const session = await auth.api.getSession({
    headers: req.headers,
  });
  
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  res.json({ user: session.user });
});
```

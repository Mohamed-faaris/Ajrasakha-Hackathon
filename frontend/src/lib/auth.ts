import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  fetchOptions: {
    credentials: 'include',
  },
});

export const { signIn, signUp, signOut, useSession } = authClient;

// Helper functions for compatibility - deprecated, use better-auth directly
export function isAuthenticated() {
  throw new Error('Use useSession hook from auth instead');
}

export function getToken() {
  throw new Error('Better Auth uses session cookies, not tokens');
}

export function authHeaders(): Record<string, string> {
  return {};
}

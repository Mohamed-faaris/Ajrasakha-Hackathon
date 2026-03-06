import { createAuthClient } from 'better-auth/react';
import { emailOTPClient } from 'better-auth/client/plugins';
import { magicLinkClient } from 'better-auth/client/plugins';

const authBaseUrlEnv = import.meta.env.VITE_AUTH_BASE_URL;
if (!authBaseUrlEnv) {
    throw new Error("VITE_AUTH_BASE_URL environment variable is required");
}

const trimmedAuthBaseUrl = authBaseUrlEnv.replace(/\/+$/, "");
const AUTH_BASE_URL = trimmedAuthBaseUrl.endsWith('/auth')
    ? trimmedAuthBaseUrl
    : `${trimmedAuthBaseUrl}/auth`;

export const authClient = createAuthClient({
    baseURL: AUTH_BASE_URL,
    fetchOptions: {
        credentials: 'include',
    },
    plugins: [
        emailOTPClient(),
        magicLinkClient(),
    ],
});

export const { signIn, signUp, signOut, useSession } = authClient;

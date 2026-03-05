import { createAuthClient } from 'better-auth/react';
import { phoneNumberClient } from 'better-auth/client/plugins';
import { magicLinkClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
    baseURL: import.meta.env.VITE_AUTH_BASE_URL || 'http://localhost:5000/api',
    fetchOptions: {
        credentials: 'include',
    },
    plugins: [
        phoneNumberClient(),
        magicLinkClient(),
    ],
});

export const { signIn, signUp, signOut, useSession } = authClient;

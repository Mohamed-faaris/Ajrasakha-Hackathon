import { createAuthClient } from 'better-auth/react';
import { emailOTPClient } from 'better-auth/client/plugins/email-otp';
import { magicLinkClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
    baseURL: import.meta.env.VITE_AUTH_BASE_URL || 'http://localhost:5000/api/auth',
    fetchOptions: {
        credentials: 'include',
    },
    plugins: [
        emailOTPClient(),
        magicLinkClient(),
    ],
});

export const { signIn, signUp, signOut, useSession } = authClient;

import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { phoneNumber } from 'better-auth/plugins';
import { magicLink } from 'better-auth/plugins';
import { apiKey } from '@better-auth/api-key';
import mongoose from 'mongoose';
import { env } from '../config/env';
import { sendMagicLinkEmail } from '../services/mail.service';

export const createAuth = (db: mongoose.mongo.Db, client: mongoose.mongo.MongoClient) => {
  return betterAuth({
    database: mongodbAdapter(db, { client }),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    basePath: '/api/auth',
    trustedOrigins: env.BETTER_AUTH_TRUSTED_ORIGINS,
    advanced: {
      database: {
        generateId: () => crypto.randomUUID(),
      },
    },
    emailAndPassword: {
      enabled: true,
    },
    plugins: [
      phoneNumber({
        sendOTP: async ({ phoneNumber, code }) => {
          console.log(`[OTP] Phone: ${phoneNumber}, Code: ${code}`);
        },
      }),
      magicLink({
        sendMagicLink: async ({ email, url }) => {
          await sendMagicLinkEmail(email, url);
        },
      }),
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
};

export type Auth = ReturnType<typeof createAuth>;

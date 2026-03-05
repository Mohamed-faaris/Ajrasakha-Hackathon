import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { emailOTP } from 'better-auth/plugins/email-otp';
import { magicLink } from 'better-auth/plugins';
import { apiKey } from '@better-auth/api-key';
import mongoose from 'mongoose';
import { env } from '../config/env';
import { sendMagicLinkEmail } from '../services/mail.service';
import { sendEmail } from '../services/mail.service';

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
      emailOTP({
        async sendVerificationOTP({ email, otp, type }) {
          await sendEmail({
            to: email,
            subject: type === "sign-in" ? "Your Sign In Code" : "Your Verification Code",
            text: `Your OTP code is: ${otp}`,
          });
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

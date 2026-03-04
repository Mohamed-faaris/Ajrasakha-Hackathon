import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { phoneNumber } from 'better-auth/plugins';
import { magicLink } from 'better-auth/plugins';
import mongoose from 'mongoose';
import { env } from '../config/env';
import { sendMagicLinkEmail } from '../services/mail.service';

export const createAuth = (db: mongoose.mongo.Db) => {
  return betterAuth({
    database: mongodbAdapter(db),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins: env.BETTER_AUTH_TRUSTED_ORIGINS,
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
    ],
  });
};

export type Auth = ReturnType<typeof createAuth>;

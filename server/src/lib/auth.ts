import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import mongoose from 'mongoose';
import { env } from '../config/env';

export const createAuth = (db: mongoose.mongo.Db) => {
  return betterAuth({
    database: mongodbAdapter(db),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins: env.BETTER_AUTH_TRUSTED_ORIGINS,
    emailAndPassword: {
      enabled: true,
    },
  });
};

export type Auth = ReturnType<typeof createAuth>;

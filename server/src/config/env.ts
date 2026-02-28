import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config({
  path: "./.env",
});

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  MONGO_URI: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url().default('http://localhost:5000'),
  BETTER_AUTH_TRUSTED_ORIGINS: z.string().default('http://localhost:5173').transform((val) => val.split(',').map(s => s.trim())),
});

export const env = envSchema.parse(process.env);

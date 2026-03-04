import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load from root .env file (single source of truth)
const rootDir = path.resolve(__dirname, '../../../');
dotenv.config({
  path: path.join(rootDir, '.env'),
});

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  MONGO_URI: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url().default('http://localhost:5000'),
  BETTER_AUTH_TRUSTED_ORIGINS: z.string().default('http://localhost:5173').transform((val) => val.split(',').map(s => s.trim())),
  EMAIL_FROM: z.email().default('mohamedfaaris.dev@gmail.com'),
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.coerce.number().default(465),
  SMTP_USER: z.email().default('mohamedfaaris.dev@gmail.com'),
  SMTP_PASS: z.string().default(''),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error('\nEnvironment validation failed:\n');
  result.error.issues.forEach((err) => {
    console.error(`  - ${err.path.join('.')}: ${err.message}`);
  });
  console.error('\n');
  process.exit(1);
}

export const env = result.data;

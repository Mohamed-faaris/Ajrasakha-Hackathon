import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({
  path: path.resolve(__dirname, '../../.env'),
});

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  MONGO_URI: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url().default('http://localhost:5000'),
  BETTER_AUTH_TRUSTED_ORIGINS: z.string().default('http://localhost:5173').transform((val) => val.split(',').map(s => s.trim())),
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

import express from 'express';
import cors from 'cors';
import { toNodeHandler } from 'better-auth/node';
import type { Auth } from './lib/auth';

const createApp = (auth: Auth) => {
  const app = express();

  app.use(cors());

  app.all('/api/auth/{*any}', (req, res) => {
    return toNodeHandler(auth)(req, res);
  });

  app.use(express.json());

  return app;
};

export default createApp;

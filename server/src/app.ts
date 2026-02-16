import express from 'express';
import cors from 'cors';
import { toNodeHandler } from 'better-auth/node';
import type { Auth } from './lib/auth';
import {
  cropRoutes,
  stateRoutes,
  mandiRoutes,
  priceRoutes,
  createAlertRoutes,
  coverageRoutes,
  topMoverRoutes,
  mandiPriceRoutes,
  createUserProfileRoutes
} from './routes';

const createApp = (auth: Auth) => {
  const app = express();

  app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
  }));

  app.all('/api/auth/{*any}', (req, res) => {
    return toNodeHandler(auth)(req, res);
  });

  app.use(express.json());

  app.use('/api/crops', cropRoutes);
  app.use('/api/states', stateRoutes);
  app.use('/api/mandis', mandiRoutes);
  app.use('/api/prices', priceRoutes);
  app.use('/api/alerts', createAlertRoutes(auth));
  app.use('/api/coverage', coverageRoutes);
  app.use('/api/top-movers', topMoverRoutes);
  app.use('/api/mandi-prices', mandiPriceRoutes);
  app.use('/api/profile', createUserProfileRoutes(auth));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  return app;
};

export default createApp;

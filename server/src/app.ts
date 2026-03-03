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
  createUserProfileRoutes,
  adminRoutes,
  predictionRoutes
} from './routes';

// Health check helper for prediction engine
async function checkPredictionEngine(): Promise<{ status: string; latency?: number; error?: string }> {
  const start = Date.now();
  try {
    const response = await fetch('http://localhost:8000/health', { 
      signal: AbortSignal.timeout(5000) 
    });
    if (response.ok) {
      return { status: 'up', latency: Date.now() - start };
    }
    return { status: 'down', error: `HTTP ${response.status}` };
  } catch (error) {
    return { status: 'down', error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

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
  app.use('/api/admin', adminRoutes);
  app.use('/api/predictions', predictionRoutes);

  app.get('/api/health', async (_req, res) => {
    const predictionEngine = await checkPredictionEngine();
    
    const overallStatus = predictionEngine.status === 'up' ? 'healthy' : 'degraded';
    
    res.json({ 
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services: {
        server: { status: 'up' },
        predictionEngine
      }
    });
  });

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  return app;
};

export default createApp;

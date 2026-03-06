import express from 'express';
import cors from 'cors';
import { toNodeHandler } from 'better-auth/node';
import type { Auth } from './lib/auth';
import { env } from './config/env';
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
  predictionRoutes,
  createMapRoutes,
  analyticsPredictionRoutes
} from './routes';
import createDevPriceRoutes from './routes/dev.price.routes';
import devCropRoutes from './routes/dev.crop.routes';
import devStateRoutes from './routes/dev.state.routes';

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

const createConsumerPortalRouter = (auth: Auth) => {
  const router = express.Router();

  router.use(express.json());

  router.use('/crops', cropRoutes);
  router.use('/states', stateRoutes);
  router.use('/mandis', mandiRoutes);
  router.use('/prices', priceRoutes);
  router.use('/alerts', createAlertRoutes(auth));
  router.use('/coverage', coverageRoutes);
  router.use('/top-movers', topMoverRoutes);
  router.use('/mandi-prices', mandiPriceRoutes);
  router.use('/profile', createUserProfileRoutes(auth));
  router.use('/admin', adminRoutes);
  router.use('/predictions', predictionRoutes);
  router.use('/analytics', analyticsPredictionRoutes);
  router.use('/map-insights', createMapRoutes(auth));

  return router;
};

const createApp = (auth: Auth) => {
  const app = express();

  app.use(cors({
    origin: env.BETTER_AUTH_TRUSTED_ORIGINS,
    credentials: true
  }));

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

  app.all('/api/auth/*splat', (req, res) => toNodeHandler(auth)(req, res));
  app.use('/api/consumer-portal', createConsumerPortalRouter(auth));
  app.use('/api/dev/prices', createDevPriceRoutes(auth));
  app.use('/api/dev/crops', devCropRoutes);
  app.use('/api/dev/states', devStateRoutes);

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  return app;
};

export default createApp;

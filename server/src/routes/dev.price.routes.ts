import { Router } from 'express';
import { toNodeHandler } from 'better-auth/node';
import type { Auth } from '../lib/auth';
import * as priceController from '../controllers/price.controller';

const createDevPriceRoutes = (auth: Auth) => {
  const router = Router();

  router.all('/auth/{*any}', (req, res) => {
    return toNodeHandler(auth)(req, res);
  });

  router.get('/prices', priceController.getPrices);
  router.get('/prices/latest', priceController.getLatestPrices);
  router.get('/prices/trends', priceController.getPriceTrends);
  router.get('/prices/mandi/:mandiId/crop/:cropId', priceController.getPricesByMandiAndCrop);

  return router;
};

export default createDevPriceRoutes;

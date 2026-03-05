import { Router } from 'express';
import type { Auth } from '../lib/auth';
import { createAuthMiddleware } from '../middlewares/auth.middleware';
import * as mapController from '../controllers/map.controller';

const createMapRoutes = (auth: Auth) => {
  const router = Router();
  const authMiddleware = createAuthMiddleware(auth);

  router.post('/', authMiddleware, mapController.createMapInsight);
  router.get('/', authMiddleware, mapController.getMapInsights);
  router.get('/:id', authMiddleware, mapController.getMapInsightById);
  router.patch('/:id', authMiddleware, mapController.updateMapInsight);
  router.delete('/:id', authMiddleware, mapController.deleteMapInsight);

  return router;
};

export default createMapRoutes;

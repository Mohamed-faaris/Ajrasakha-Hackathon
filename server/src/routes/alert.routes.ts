import { Router } from 'express';
import * as alertController from '../controllers/alert.controller';
import type { Auth } from '../lib/auth';
import { createAuthMiddleware } from '../middlewares/auth.middleware';

const createAlertRoutes = (auth: Auth) => {
  const router = Router();
  const authMiddleware = createAuthMiddleware(auth);

  router.get('/', authMiddleware, alertController.getUserAlerts);
  router.get('/active', authMiddleware, alertController.getActiveAlerts);
  router.post('/', authMiddleware, ...alertController.createAlert);
  router.patch('/:alertId', authMiddleware, ...alertController.updateAlert);
  router.delete('/:alertId', authMiddleware, ...alertController.deleteAlert);
  router.patch('/:alertId/toggle', authMiddleware, ...alertController.toggleAlert);

  return router;
};

export default createAlertRoutes;

import { Router } from 'express';
import * as userProfileController from '../controllers/userProfile.controller';
import type { Auth } from '../lib/auth';
import { createAuthMiddleware } from '../middlewares/auth.middleware';

const createUserProfileRoutes = (auth: Auth) => {
  const router = Router();
  const authMiddleware = createAuthMiddleware(auth);

  router.get('/settings', authMiddleware, userProfileController.getSettings);
  router.patch('/settings', authMiddleware, ...userProfileController.updateProfile);
  router.get('/notifications', authMiddleware, userProfileController.getNotifications);
  router.patch('/notifications', authMiddleware, ...userProfileController.updateNotifications);
  router.get('/preferences', authMiddleware, userProfileController.getPreferences);
  router.patch('/preferences', authMiddleware, ...userProfileController.updatePreferences);
  router.get('/security', authMiddleware, userProfileController.getSecurity);
  router.patch('/security', authMiddleware, ...userProfileController.updateSecurity);

  router.get('/', authMiddleware, userProfileController.getProfile);
  router.patch('/', authMiddleware, ...userProfileController.updateProfile);
  router.delete('/', authMiddleware, userProfileController.deleteProfile);

  return router;
};

export default createUserProfileRoutes;

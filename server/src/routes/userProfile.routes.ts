import { Router } from 'express';
import * as userProfileController from '../controllers/userProfile.controller';
import type { Auth } from '../lib/auth';
import { createAuthMiddleware } from '../middlewares/auth.middleware';

const createUserProfileRoutes = (auth: Auth) => {
  const router = Router();
  const authMiddleware = createAuthMiddleware(auth);

  router.get('/', authMiddleware, userProfileController.getProfile);
  router.patch('/', authMiddleware, ...userProfileController.updateProfile);
  router.delete('/', authMiddleware, userProfileController.deleteProfile);

  return router;
};

export default createUserProfileRoutes;

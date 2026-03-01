import { type Request, type Response, type NextFunction } from 'express';
import type { Auth } from '../lib/auth';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name?: string;
      };
      session?: {
        id: string;
        userId: string;
        expiresAt: Date;
      };
    }
  }
}

export const createAuthMiddleware = (auth: Auth) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = await auth.api.getSession({
        headers: req.headers
      });

      if (!session) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      req.user = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name
      };
      req.session = session.session;

      next();
    } catch (error) {
      res.status(401).json({ error: 'Unauthorized' });
    }
  };
};

export const optionalAuthMiddleware = (auth: Auth) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = await auth.api.getSession({
        headers: req.headers
      });

      if (session) {
        req.user = {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name
        };
        req.session = session.session;
      }
    } catch {
      // Session not found, continue without user
    }

    next();
  };
};

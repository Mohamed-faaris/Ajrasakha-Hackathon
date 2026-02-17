import { type Request, type Response, type NextFunction } from 'express';
import { ZodError, type ZodType } from 'zod';

export const validateQuery = <T extends ZodType>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.parse(req.query);
      req.query = result as typeof req.query;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: 'Validation error',
          details: error.issues,
        });
        return;
      }
      res.status(400).json({ error: 'Invalid query parameters' });
    }
  };
};

export const validateParams = <T extends ZodType>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.parse(req.params);
      req.params = result as typeof req.params;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: 'Validation error',
          details: error.issues,
        });
        return;
      }
      res.status(400).json({ error: 'Invalid route parameters' });
    }
  };
};

export const validateBody = <T extends ZodType>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          error: 'Validation error',
          details: error.issues,
        });
        return;
      }
      res.status(400).json({ error: 'Invalid request body' });
    }
  };
};

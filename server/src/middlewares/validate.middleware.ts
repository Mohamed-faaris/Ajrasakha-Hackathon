import { type Request, type Response, type NextFunction } from 'express';
import { ZodError, type ZodType } from 'zod';

export const validateQuery = <T extends ZodType>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.parse(req.params);
      Object.defineProperty(req, 'params', { value: result, writable: true, enumerable: true, configurable: true });
      next();
    } catch (error: any) {
      console.error("VALIDATION ERROR CAUGHT:", error);
      if (error?.name === 'ZodError' || error instanceof ZodError) {
        res.status(400).json({
          error: 'Validation error',
          details: error.issues,
        });
        return;
      }
      res.status(400).json({ error: 'Invalid query parameters', actualError: error?.message || String(error) });
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

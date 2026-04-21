import { type Request, type Response, type NextFunction } from 'express';
import { ZodError } from 'zod';

type SchemaLike<T = unknown> = {
  parse: (input: unknown) => T;
};

const isValidationError = (error: unknown): error is { issues: unknown[]; name?: string } => {
  return typeof error === 'object' && error !== null && 'issues' in error;
};

const getValidationError = (error: unknown): { issues: unknown[] } | null => {
  if (error instanceof ZodError || isValidationError(error)) {
    return error as { issues: unknown[] };
  }
  return null;
};

export const validateQuery = <T>(schema: SchemaLike<T>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.parse(req.params);
      Object.defineProperty(req, 'params', { value: result, writable: true, enumerable: true, configurable: true });
      next();
    } catch (error: any) {
      console.error("VALIDATION ERROR CAUGHT:", error);
      const validationError = getValidationError(error);
      if (validationError) {
        res.status(400).json({
          error: 'Validation error',
          details: validationError.issues,
        });
        return;
      }
      res.status(400).json({ error: 'Invalid query parameters', actualError: error?.message || String(error) });
    }
  };
};

export const validateParams = <T>(schema: SchemaLike<T>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.parse(req.params);
      req.params = result as typeof req.params;
      next();
    } catch (error) {
      const validationError = getValidationError(error);
      if (validationError) {
        res.status(400).json({
          error: 'Validation error',
          details: validationError.issues,
        });
        return;
      }
      res.status(400).json({ error: 'Invalid route parameters' });
    }
  };
};

export const validateBody = <T>(schema: SchemaLike<T>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      const validationError = getValidationError(error);
      if (validationError) {
        res.status(400).json({
          error: 'Validation error',
          details: validationError.issues,
        });
        return;
      }
      res.status(400).json({ error: 'Invalid request body' });
    }
  };
};

import type { Request, Response } from 'express';
import { z } from 'zod';
import { AnalyticsPredictQuerySchema } from '@shared/schemas';
import * as analyticsPredictionService from '../services/analyticsPrediction.service';

export const getAnalyticsPredictions = async (req: Request, res: Response) => {
  try {
    const query = AnalyticsPredictQuerySchema.parse(req.query);
    const result = await analyticsPredictionService.getAnalyticsPredictions(query);
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: error.issues,
      });
    }

    if (error instanceof Error && error.message.includes('requires')) {
      return res.status(400).json({
        error: 'Invalid query combination',
        message: error.message,
      });
    }

    console.error('Error in getAnalyticsPredictions:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

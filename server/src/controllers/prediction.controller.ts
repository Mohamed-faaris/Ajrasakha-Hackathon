import { Request, Response } from 'express';
import * as predictionService from '../services/prediction.service';
import { z } from 'zod';

const PredictionParamsSchema = z.object({
  cropId: z.string().min(1),
  mandiId: z.string().min(1)
});

/**
 * GET /api/predictions/:cropId/:mandiId
 * Get prediction for a crop/mandi pair (cached or generate new)
 */
export const getPrediction = async (req: Request, res: Response) => {
  try {
    const { cropId, mandiId } = PredictionParamsSchema.parse(req.params);
    
    const prediction = await predictionService.getPrediction(cropId, mandiId);
    
    if (!prediction) {
      return res.status(404).json({
        error: 'Prediction not available',
        message: 'Insufficient historical data or prediction service unavailable'
      });
    }

    res.json(prediction);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid parameters',
        details: error.errors
      });
    }
    console.error('Error in getPrediction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * POST /api/predictions/:cropId/:mandiId/refresh
 * Force refresh prediction (admin only)
 */
export const refreshPrediction = async (req: Request, res: Response) => {
  try {
    const { cropId, mandiId } = PredictionParamsSchema.parse(req.params);
    
    const prediction = await predictionService.generatePrediction(cropId, mandiId);
    
    if (!prediction) {
      return res.status(404).json({
        error: 'Prediction generation failed',
        message: 'Insufficient historical data or prediction service unavailable'
      });
    }

    res.json(prediction);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid parameters',
        details: error.errors
      });
    }
    console.error('Error in refreshPrediction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/predictions/:cropId/:mandiId/status
 * Check if valid prediction exists
 */
export const checkPredictionStatus = async (req: Request, res: Response) => {
  try {
    const { cropId, mandiId } = PredictionParamsSchema.parse(req.params);
    
    const hasValid = await predictionService.hasValidPrediction(cropId, mandiId);
    const cached = hasValid ? await predictionService.getCachedPrediction(cropId, mandiId) : null;

    res.json({
      hasValidPrediction: hasValid,
      expiresAt: cached?.expiresAt || null,
      generatedAt: cached?.generatedAt || null,
      trend: cached?.trend || null
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid parameters',
        details: error.errors
      });
    }
    console.error('Error in checkPredictionStatus:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

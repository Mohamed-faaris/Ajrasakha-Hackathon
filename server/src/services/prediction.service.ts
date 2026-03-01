import { Prediction, Price } from '../models';
import axios from 'axios';

const PREDICTION_ENGINE_URL = process.env.PREDICTION_ENGINE_URL || 'http://localhost:8000';

interface PredictionDay {
  date: string;
  predictedPrice: number;
  confidence: number;
}

interface PredictionResult {
  cropId: string;
  mandiId: string;
  predictions: PredictionDay[];
  trend: 'Bullish' | 'Bearish' | 'Neutral';
  generatedAt: Date;
  expiresAt: Date;
}

/**
 * Get prediction for a crop/mandi pair.
 * Checks cache first, calls Python service if expired/missing.
 */
export const getPrediction = async (
  cropId: string,
  mandiId: string
): Promise<PredictionResult | null> => {
  // Check for valid cached prediction
  const cached = await Prediction.findOne({
    cropId,
    mandiId,
    expiresAt: { $gt: new Date() }
  }).lean();

  if (cached) {
    return {
      cropId: cached.cropId,
      mandiId: cached.mandiId,
      predictions: cached.predictions.map((p: any) => ({
        date: p.date.toISOString(),
        predictedPrice: p.predictedPrice,
        confidence: p.confidence
      })),
      trend: cached.trend as 'Bullish' | 'Bearish' | 'Neutral',
      generatedAt: cached.generatedAt,
      expiresAt: cached.expiresAt
    };
  }

  // No valid cache - generate new prediction
  return await generatePrediction(cropId, mandiId);
};

/**
 * Force generate a new prediction by calling Python service
 */
export const generatePrediction = async (
  cropId: string,
  mandiId: string
): Promise<PredictionResult | null> => {
  try {
    // Check if we have enough historical data
    const priceCount = await Price.countDocuments({ cropId, mandiId });
    if (priceCount < 3) {
      return null;
    }

    // Call Python prediction engine
    const response = await axios.post(
      `${PREDICTION_ENGINE_URL}/predictions/${cropId}/${mandiId}`,
      {},
      { timeout: 30000 }
    );

    const data = response.data;

    return {
      cropId: data.cropId,
      mandiId: data.mandiId,
      predictions: data.predictions.map((p: any) => ({
        date: new Date(p.date).toISOString(),
        predictedPrice: p.predictedPrice,
        confidence: p.confidence
      })),
      trend: data.trend,
      generatedAt: new Date(data.generatedAt),
      expiresAt: new Date(data.expiresAt)
    };
  } catch (error) {
    console.error('Error generating prediction:', error);
    return null;
  }
};

/**
 * Check if prediction exists and is valid
 */
export const hasValidPrediction = async (
  cropId: string,
  mandiId: string
): Promise<boolean> => {
  const count = await Prediction.countDocuments({
    cropId,
    mandiId,
    expiresAt: { $gt: new Date() }
  });
  return count > 0;
};

/**
 * Get cached prediction only (no generation)
 */
export const getCachedPrediction = async (
  cropId: string,
  mandiId: string
): Promise<PredictionResult | null> => {
  const cached = await Prediction.findOne({
    cropId,
    mandiId,
    expiresAt: { $gt: new Date() }
  }).lean();

  if (!cached) return null;

  return {
    cropId: cached.cropId,
    mandiId: cached.mandiId,
    predictions: cached.predictions.map((p: any) => ({
      date: p.date.toISOString(),
      predictedPrice: p.predictedPrice,
      confidence: p.confidence
    })),
    trend: cached.trend as 'Bullish' | 'Bearish' | 'Neutral',
    generatedAt: cached.generatedAt,
    expiresAt: cached.expiresAt
  };
};

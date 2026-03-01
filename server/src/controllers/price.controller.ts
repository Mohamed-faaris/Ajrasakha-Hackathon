import { type Request, type Response } from 'express';
import * as priceService from '../services/price.service';
import * as predictionService from '../services/prediction.service';
import { validateQuery, validateParams } from '../middlewares/validate.middleware';
import { GetPricesQuerySchema, GetLatestPricesQuerySchema, GetPriceTrendsQuerySchema, GetByMandiAndCropParamsSchema, PricesByMandiAndCropQuerySchema } from '@shared/schemas';

export const getPrices = async (req: Request, res: Response) => {
  const query = GetPricesQuerySchema.parse(req.query);
  const result = await priceService.getPrices(query);
  res.json(result.items);
};

export const getLatestPrices = [
  validateQuery(GetLatestPricesQuerySchema),
  async (req: Request, res: Response) => {
    const query = GetLatestPricesQuerySchema.parse(req.query);
    const prices = await priceService.getLatestPrices(query.cropId, query.mandiId, query.limit);
    res.json(prices);
  },
];

export const getPriceTrends = [
  validateQuery(GetPriceTrendsQuerySchema),
  async (req: Request, res: Response) => {
    const query = GetPriceTrendsQuerySchema.parse(req.query);
    const trends = await priceService.getPriceTrends(query.cropId, query.mandiId, query.days);
    res.json(trends);
  },
];

export const getPricesByMandiAndCrop = [
  validateParams(GetByMandiAndCropParamsSchema),
  validateQuery(PricesByMandiAndCropQuerySchema),
  async (req: Request, res: Response) => {
    const params = GetByMandiAndCropParamsSchema.parse(req.params);
    const query = PricesByMandiAndCropQuerySchema.parse(req.query);
    const prices = await priceService.getPricesByMandiAndCrop(params.mandiId, params.cropId, query.limit);
    res.json(prices);
  },
];

export const getPricePrediction = async (req: Request, res: Response) => {
  const { cropId, mandiId, days, lookback } = req.query as Record<string, string>;

  if (!cropId || !mandiId) {
    res.status(400).json({ error: 'cropId and mandiId query params are required' });
    return;
  }

  try {
    const result = await predictionService.predictPrice(
      cropId,
      mandiId,
      days ? parseInt(days, 10) : 7,
      lookback ? parseInt(lookback, 10) : 90
    );
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Prediction failed';
    res.status(404).json({ error: message });
  }
};

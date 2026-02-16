import { type Request, type Response } from 'express';
import * as priceService from '../services/price.service';
import { validateQuery, validateParams } from '../middlewares/validate.middleware';
import { z } from 'zod';

const PriceSourceSchema = z.enum(['agmarknet', 'enam', 'apmc', 'other', 'mandi-insights']);
const SortDirectionSchema = z.enum(['asc', 'desc']);

const GetByMandiAndCropParamsSchema = z.object({
  mandiId: z.string().min(1),
  cropId: z.string().min(1),
});

const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

const GetPricesQuerySchema = PaginationSchema.extend({
  cropId: z.string().optional(),
  stateId: z.string().optional(),
  mandiId: z.string().optional(),
  districtId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  source: PriceSourceSchema.optional(),
  sortBy: z.enum(['date', 'cropId', 'stateId', 'mandiId', 'modalPrice']).default('date'),
  sortOrder: SortDirectionSchema.default('desc'),
});

const GetLatestPricesQuerySchema = z.object({
  cropId: z.string().optional(),
  mandiId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const GetPriceTrendsQuerySchema = z.object({
  cropId: z.string().min(1),
  mandiId: z.string().min(1),
  days: z.coerce.number().int().min(1).max(365).default(30),
});

const PricesByMandiAndCropQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

export const getPrices = [
  validateQuery(GetPricesQuerySchema),
  async (req: Request, res: Response) => {
    const query = GetPricesQuerySchema.parse(req.query);
    const result = await priceService.getPrices(query);
    res.json(result);
  },
];

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

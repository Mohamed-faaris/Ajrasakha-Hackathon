import { type Request, type Response } from 'express';
import * as mandiPriceService from '../services/mandiPrice.service';
import { validateQuery, validateParams } from '../middlewares/validate.middleware';
import { GetMandiPricesQuerySchema, GetMandiPricesInBoundsQuerySchema, MandiIdParamsSchema } from '@shared/schemas';

export const getMandiPrices = [
  validateQuery(GetMandiPricesQuerySchema),
  async (req: Request, res: Response) => {
    const query = GetMandiPricesQuerySchema.parse(req.query);
    const prices = await mandiPriceService.getMandiPrices(query.stateName, query.cropId);
    res.json(prices);
  },
];

export const getMandiPricesInBounds = [
  validateQuery(GetMandiPricesInBoundsQuerySchema),
  async (req: Request, res: Response) => {
    const query = GetMandiPricesInBoundsQuerySchema.parse(req.query);
    const prices = await mandiPriceService.getMandiPricesInBounds(query.minLng, query.minLat, query.maxLng, query.maxLat, query.cropId);
    res.json(prices);
  },
];

export const getMandiPriceByMandiId = [
  validateParams(MandiIdParamsSchema),
  async (req: Request, res: Response) => {
    const params = MandiIdParamsSchema.parse(req.params);
    const price = await mandiPriceService.getMandiPriceByMandiId(params.mandiId);

    if (!price) {
      res.status(404).json({ error: 'Mandi price not found' });
      return;
    }

    res.json(price);
  },
];

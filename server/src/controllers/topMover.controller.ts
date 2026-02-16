import { type Request, type Response } from 'express';
import * as topMoverService from '../services/topMover.service';
import { validateQuery } from '../middlewares/validate.middleware';
import { GetTopMoversQuerySchema, LimitQuerySchema } from '@shared/schemas';

export const getTopMovers = [
  validateQuery(GetTopMoversQuerySchema),
  async (req: Request, res: Response) => {
    const query = GetTopMoversQuerySchema.parse(req.query);
    const movers = await topMoverService.getTopMovers(query.direction, query.limit);
    res.json(movers);
  },
];

export const getTopGainers = [
  validateQuery(LimitQuerySchema),
  async (req: Request, res: Response) => {
    const query = LimitQuerySchema.parse(req.query);
    const gainers = await topMoverService.getTopGainers(query.limit);
    res.json(gainers);
  },
];

export const getTopLosers = [
  validateQuery(LimitQuerySchema),
  async (req: Request, res: Response) => {
    const query = LimitQuerySchema.parse(req.query);
    const losers = await topMoverService.getTopLosers(query.limit);
    res.json(losers);
  },
];

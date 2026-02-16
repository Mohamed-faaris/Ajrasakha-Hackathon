import { type Request, type Response } from 'express';
import * as mandiService from '../services/mandi.service';
import { validateQuery, validateParams } from '../middlewares/validate.middleware';
import { GetByIdParamsSchema, GetByStateParamsSchema, SearchQuerySchema, BoundsQuerySchema } from '../schemas';

export const getAllMandis = async (req: Request, res: Response) => {
  const mandis = await mandiService.getAllMandis();
  res.json(mandis);
};

export const getMandiById = [
  validateParams(GetByIdParamsSchema),
  async (req: Request, res: Response) => {
    const params = GetByIdParamsSchema.parse(req.params);
    const mandi = await mandiService.getMandiById(params.id);
    
    if (!mandi) {
      res.status(404).json({ error: 'Mandi not found' });
      return;
    }
    
    res.json(mandi);
  },
];

export const getMandisByState = [
  validateParams(GetByStateParamsSchema),
  async (req: Request, res: Response) => {
    const params = GetByStateParamsSchema.parse(req.params);
    const mandis = await mandiService.getMandisByState(params.stateId);
    res.json(mandis);
  },
];

export const searchMandis = [
  validateQuery(SearchQuerySchema),
  async (req: Request, res: Response) => {
    const query = SearchQuerySchema.parse(req.query);
    const mandis = await mandiService.searchMandis(query.q);
    res.json(mandis);
  },
];

export const getMandisInBounds = [
  validateQuery(BoundsQuerySchema),
  async (req: Request, res: Response) => {
    const query = BoundsQuerySchema.parse(req.query);
    const mandis = await mandiService.getMandisInBounds(query.minLng, query.minLat, query.maxLng, query.maxLat);
    res.json(mandis);
  },
];

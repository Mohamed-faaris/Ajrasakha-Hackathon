import { type Request, type Response } from 'express';
import * as cropService from '../services/crop.service';
import { validateQuery, validateParams } from '../middlewares/validate.middleware';
import { GetByIdParamsSchema, SearchQuerySchema } from '../schemas';

export const getAllCrops = async (req: Request, res: Response) => {
  const crops = await cropService.getAllCrops();
  res.json(crops);
};

export const getCropById = [
  validateParams(GetByIdParamsSchema),
  async (req: Request, res: Response) => {
    const params = GetByIdParamsSchema.parse(req.params);
    const crop = await cropService.getCropById(params.id);
    
    if (!crop) {
      res.status(404).json({ error: 'Crop not found' });
      return;
    }
    
    res.json(crop);
  },
];

export const searchCrops = [
  validateQuery(SearchQuerySchema),
  async (req: Request, res: Response) => {
    const query = SearchQuerySchema.parse(req.query);
    const crops = await cropService.searchCrops(query.q);
    res.json(crops);
  },
];

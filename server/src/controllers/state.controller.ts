import { type Request, type Response } from 'express';
import * as stateService from '../services/state.service';
import { validateParams } from '../middlewares/validate.middleware';
import { GetByIdParamsSchema } from '@shared/schemas';

export const getAllStates = async (req: Request, res: Response) => {
  const states = await stateService.getAllStates();
  res.json(states);
};

export const getStateById = [
  validateParams(GetByIdParamsSchema),
  async (req: Request, res: Response) => {
    const params = GetByIdParamsSchema.parse(req.params);
    const state = await stateService.getStateById(params.id);
    
    if (!state) {
      res.status(404).json({ error: 'State not found' });
      return;
    }
    
    res.json(state);
  },
];

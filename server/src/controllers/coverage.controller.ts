import { type Request, type Response } from 'express';
import * as coverageService from '../services/coverage.service';

export const getCoverage = async (req: Request, res: Response) => {
  const coverage = await coverageService.getCoverage();
  res.json(coverage);
};

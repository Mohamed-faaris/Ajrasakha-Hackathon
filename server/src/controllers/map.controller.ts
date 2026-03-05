import { type Request, type Response } from 'express';
import * as mapService from '../services/map.service';

export const createMapInsight = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const payload = {
    ...req.body,
    userId,
  };

  const insight = await mapService.createMapInsight(payload);
  res.status(201).json(insight);
};

export const getMapInsights = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const insights = await mapService.getMapInsights(userId);
  res.json(insights);
};

export const getMapInsightById = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const id = req.params.id as string;
  const insight = await mapService.getMapInsightById(id, userId);

  if (!insight) {
    return res.status(404).json({ error: 'Insight not found' });
  }

  res.json(insight);
};

export const deleteMapInsight = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const id = req.params.id as string;
  const result = await mapService.deleteMapInsight(id, userId);

  if (result.deletedCount === 0) {
    return res.status(404).json({ error: 'Insight not found' });
  }

  res.status(204).send();
};

export const updateMapInsight = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const id = req.params.id as string;
  const insight = await mapService.updateMapInsight(id, userId, req.body);

  if (!insight) {
    return res.status(404).json({ error: 'Insight not found' });
  }

  res.json(insight);
};

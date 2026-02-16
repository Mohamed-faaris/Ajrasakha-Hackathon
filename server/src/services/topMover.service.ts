import { TopMover } from '../models';
import type { TopMoverDirection } from '@shared/types';

export const getTopMovers = async (direction?: TopMoverDirection, limit = 10) => {
  const filter = direction ? { direction } : {};
  
  return TopMover.find(filter)
    .sort({ changePct: direction === 'down' ? 1 : -1 })
    .limit(limit)
    .lean();
};

export const getTopGainers = async (limit = 10) => {
  return TopMover.find({ direction: 'up' })
    .sort({ changePct: -1 })
    .limit(limit)
    .lean();
};

export const getTopLosers = async (limit = 10) => {
  return TopMover.find({ direction: 'down' })
    .sort({ changePct: 1 })
    .limit(limit)
    .lean();
};

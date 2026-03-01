import { Coverage } from '../models';

export const getCoverage = async () => {
  const coverage = await Coverage.findById('current').lean();
  
  if (!coverage) {
    return {
      _id: 'current',
      totalApmcs: 0,
      coveredApmcs: 0,
      coveragePercent: 0,
      statesCovered: 0,
      totalPrices: 0,
      computedAt: new Date()
    };
  }

  return coverage;
};

export const updateCoverage = async (data: {
  totalApmcs: number;
  coveredApmcs: number;
  coveragePercent: number;
  statesCovered: number;
  latestDate?: Date;
}) => {
  return Coverage.findByIdAndUpdate(
    'current',
    { ...data, computedAt: new Date() },
    { upsert: true, new: true }
  ).lean();
};

import { Price } from '../models';
import type { GetPricesQuery, CropPrice, PriceSource, DataSource } from '@shared/types';

const sourceMap: Record<PriceSource, DataSource> = {
  'enam': 'eNAM',
  'agmarknet': 'Agmarknet',
  'apmc': 'State Portal',
  'other': 'State Portal',
  'mandi-insights': 'State Portal',
};

export const getPrices = async (query: GetPricesQuery): Promise<{ items: CropPrice[]; total: number; page: number; pageSize: number }> => {
  const {
    cropId,
    stateId,
    mandiId,
    districtId,
    dateFrom,
    dateTo,
    source,
    page = 1,
    pageSize = 20,
    sortBy = 'date',
    sortOrder = 'desc'
  } = query;

  const filter: Record<string, unknown> = {};

  if (cropId) filter.cropId = cropId;
  if (stateId) filter.stateId = stateId;
  if (mandiId) filter.mandiId = mandiId;
  if (districtId) filter.districtId = districtId;
  if (source) filter.source = source;
  
  if (dateFrom || dateTo) {
    filter.date = {};
    if (dateFrom) (filter.date as Record<string, Date>).$gte = new Date(dateFrom);
    if (dateTo) (filter.date as Record<string, Date>).$lte = new Date(dateTo);
  }

  const sort: Record<string, 1 | -1> = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  const total = await Price.countDocuments(filter);
  const items = await Price.find(filter)
    .sort(sort)
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .lean();

  const cropPrices: CropPrice[] = items.map((p) => ({
    id: p._id.toString(),
    date: p.date.toISOString().split('T')[0],
    stateCode: p.stateId,
    state: p.stateName,
    district: p.districtName,
    mandi: p.mandiName,
    crop: p.cropName,
    variety: p.cropName,
    minPrice: p.minPrice,
    maxPrice: p.maxPrice,
    modalPrice: p.modalPrice,
    unit: p.unit,
    source: sourceMap[p.source as PriceSource] || 'State Portal',
  }));

  return {
    items: cropPrices,
    total,
    page,
    pageSize
  };
};

export const getLatestPrices = async (cropId?: string, mandiId?: string, limit = 20) => {
  const filter: Record<string, unknown> = {};
  if (cropId) filter.cropId = cropId;
  if (mandiId) filter.mandiId = mandiId;

  return Price.find(filter)
    .sort({ date: -1 })
    .limit(limit)
    .lean();
};

export const getPriceTrends = async (cropId: string, mandiId: string, days = 30) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return Price.find({
    cropId,
    mandiId,
    date: { $gte: startDate }
  })
    .sort({ date: 1 })
    .select('date modalPrice')
    .lean();
};

export const getPricesByMandiAndCrop = async (mandiId: string, cropId: string, limit = 30) => {
  return Price.find({ mandiId, cropId })
    .sort({ date: -1 })
    .limit(limit)
    .lean();
};

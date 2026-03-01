import { Crop } from '../models';

export const getAllCrops = async () => {
  const crops = await Crop.find().sort({ name: 1 }).lean();
  return crops.map(crop => ({
    name: crop.name,
    category: crop.commodityGroup || 'Others',
  }));
};

export const getCropById = async (id: string) => {
  return Crop.findById(id).lean();
};

export const searchCrops = async (query: string) => {
  return Crop.find({
    name: { $regex: query, $options: 'i' }
  }).sort({ name: 1 }).lean();
};

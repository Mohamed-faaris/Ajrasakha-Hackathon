import { Crop } from '../models';

export const getAllCrops = async () => {
  return Crop.find().sort({ name: 1 }).lean();
};

export const getCropById = async (id: string) => {
  return Crop.findById(id).lean();
};

export const searchCrops = async (query: string) => {
  return Crop.find({
    name: { $regex: query, $options: 'i' }
  }).sort({ name: 1 }).lean();
};

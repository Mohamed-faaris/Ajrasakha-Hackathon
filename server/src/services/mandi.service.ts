import { Mandi } from '../models';

export const getAllMandis = async () => {
  return Mandi.find().sort({ name: 1 }).lean();
};

export const getMandiById = async (id: string) => {
  return Mandi.findById(id).lean();
};

export const getMandisByState = async (stateId: string) => {
  return Mandi.find({ stateId }).sort({ name: 1 }).lean();
};

export const searchMandis = async (query: string) => {
  return Mandi.find({
    name: { $regex: query, $options: 'i' }
  }).sort({ name: 1 }).lean();
};

export const getMandisInBounds = async (minLng: number, minLat: number, maxLng: number, maxLat: number) => {
  return Mandi.find({
    location: {
      $geoWithin: {
        $box: [
          [minLng, minLat],
          [maxLng, maxLat]
        ]
      }
    }
  }).lean();
};

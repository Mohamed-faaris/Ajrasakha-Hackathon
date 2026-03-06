import { Mandi } from '../models';

interface MandiDoc {
  _id: string;
  name: string;
  stateId: string;
  stateName: string;
  districtId?: string;
  districtName?: string;
  location?: { coordinates: [number, number] };
  isEnamIntegrated?: boolean;
  source?: string;
}

const transformMandi = (doc: MandiDoc) => ({
  id: doc._id,
  name: doc.name,
  stateId: doc.stateId,
  stateName: doc.stateName,
  district: doc.districtName || doc.districtId,
  latitude: doc.location?.coordinates?.[1] || 0,
  longitude: doc.location?.coordinates?.[0] || 0,
  isEnamIntegrated: doc.isEnamIntegrated,
  source: doc.source,
});

export const getAllMandis = async () => {
  const docs = await Mandi.find().sort({ name: 1 }).lean() as MandiDoc[];
  return docs.map(transformMandi);
};

export const getMandiById = async (id: string) => {
  const doc = await Mandi.findById(id).lean() as MandiDoc | null;
  return doc ? transformMandi(doc) : null;
};

export const getMandisByState = async (stateId: string) => {
  const docs = await Mandi.find({
    stateId: { $regex: new RegExp(`^${stateId}$`, 'i') }
  }).sort({ name: 1 }).lean() as MandiDoc[];
  return docs.map(transformMandi);
};

export const searchMandis = async (query: string) => {
  const docs = await Mandi.find({
    name: { $regex: query, $options: 'i' }
  }).sort({ name: 1 }).lean() as MandiDoc[];
  return docs.map(transformMandi);
};

export const getMandisInBounds = async (minLng: number, minLat: number, maxLng: number, maxLat: number) => {
  const docs = await Mandi.find({
    location: {
      $geoWithin: {
        $box: [
          [minLng, minLat],
          [maxLng, maxLat]
        ]
      }
    }
  }).lean() as MandiDoc[];
  return docs.map(transformMandi);
};

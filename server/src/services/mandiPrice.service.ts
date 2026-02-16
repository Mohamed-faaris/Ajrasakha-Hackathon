import { MandiPrice } from '../models';

export const getMandiPrices = async (stateName?: string, cropId?: string) => {
  const filter: Record<string, string> = {};
  if (stateName) filter.stateName = stateName.toUpperCase();
  if (cropId) filter.cropId = cropId;

  return MandiPrice.find(filter)
    .sort({ mandiName: 1 })
    .lean();
};

export const getMandiPricesInBounds = async (
  minLng: number,
  minLat: number,
  maxLng: number,
  maxLat: number,
  cropId?: string
) => {
  const filter: Record<string, unknown> = {
    location: {
      $geoWithin: {
        $box: [
          [minLng, minLat],
          [maxLng, maxLat]
        ]
      }
    }
  };

  if (cropId) filter.cropId = cropId;

  return MandiPrice.find(filter).lean();
};

export const getMandiPriceByMandiId = async (mandiId: string) => {
  return MandiPrice.findOne({ mandiId }).lean();
};

import { MapInsight } from '../models';

export interface CreateMapInsightPayload {
  userId: string;
  name: string;
  cropId?: string;
  cropName?: string;
  stateCodes?: string[];
  mandiIds?: string[];
  filters?: {
    dateRange?: {
      start?: Date;
      end?: Date;
    };
    priceRange?: {
      min?: number;
      max?: number;
    };
    sources?: string[];
  };
  viewType?: "heatmap" | "markers" | "choropleth" | "cluster";
  isPublic?: boolean;
}

export const createMapInsight = async (payload: CreateMapInsightPayload) => {
  const insight = new MapInsight(payload);
  return insight.save();
};

export const getMapInsights = async (userId: string) => {
  return MapInsight.find({ userId }).sort({ createdAt: -1 }).lean();
};

export const getMapInsightById = async (id: string, userId: string) => {
  return MapInsight.findOne({ _id: id, $or: [{ userId }, { isPublic: true }] }).lean();
};

export const deleteMapInsight = async (id: string, userId: string) => {
  return MapInsight.deleteOne({ _id: id, userId });
};

export const updateMapInsight = async (id: string, userId: string, updates: Partial<CreateMapInsightPayload>) => {
  return MapInsight.findOneAndUpdate(
    { _id: id, userId },
    { $set: updates },
    { new: true }
  ).lean();
};

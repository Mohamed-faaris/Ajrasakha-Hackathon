import { Alert, Crop } from '../models';
import type { Types } from 'mongoose';

export const createAlert = async (data: { userId: Types.ObjectId; cropId: string; mandiId?: string; thresholdPrice: number; direction: 'above' | 'below' }) => {
  const crop = await Crop.findById(data.cropId);
  if (!crop) throw new Error('Crop not found');

  const alert = await Alert.create({
    ...data,
    cropName: crop.name,
    isActive: true
  });

  return alert.toObject();
};

export const getUserAlerts = async (userId: Types.ObjectId) => {
  return Alert.find({ userId }).sort({ createdAt: -1 }).lean();
};

export const getActiveAlerts = async (userId: Types.ObjectId) => {
  return Alert.find({ userId, isActive: true }).sort({ createdAt: -1 }).lean();
};

export const updateAlert = async (
  alertId: string,
  userId: Types.ObjectId,
  updates: { thresholdPrice?: number; direction?: 'above' | 'below'; isActive?: boolean }
) => {
  return Alert.findOneAndUpdate(
    { id: alertId, userId },
    { $set: updates },
    { new: true }
  ).lean();
};

export const deleteAlert = async (alertId: string, userId: Types.ObjectId) => {
  const result = await Alert.findOneAndDelete({ id: alertId, userId });
  return !!result;
};

export const toggleAlert = async (alertId: string, userId: Types.ObjectId, isActive: boolean) => {
  return Alert.findOneAndUpdate(
    { id: alertId, userId },
    { $set: { isActive } },
    { new: true }
  ).lean();
};

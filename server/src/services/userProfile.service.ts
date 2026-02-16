import { UserProfile } from '../models';
import type { Types } from 'mongoose';

export const getProfile = async (userId: Types.ObjectId) => {
  return UserProfile.findOne({ userId }).lean();
};

export const createProfile = async (userId: Types.ObjectId, data: Record<string, unknown>) => {
  const profile = await UserProfile.create({ userId, ...data });
  return profile.toObject();
};

export const updateProfile = async (userId: Types.ObjectId, data: Record<string, unknown>) => {
  return UserProfile.findOneAndUpdate(
    { userId },
    { $set: data },
    { new: true, upsert: true }
  ).lean();
};

export const deleteProfile = async (userId: Types.ObjectId) => {
  const result = await UserProfile.findOneAndDelete({ userId });
  return !!result;
};

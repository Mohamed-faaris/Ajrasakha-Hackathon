import { UserProfile } from '../models';
import type { Types } from 'mongoose';

export const getProfile = async (userId: Types.ObjectId) => {
  return UserProfile.findOne({ userId }).lean();
};

export const getOrCreateProfile = async (userId: Types.ObjectId) => {
  const existing = await UserProfile.findOne({ userId }).lean();
  if (existing) return existing;

  const created = await UserProfile.create({ userId });
  return created.toObject();
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

export const getNotificationSettings = async (userId: Types.ObjectId) => {
  const profile = await getOrCreateProfile(userId);
  return profile.notificationSettings;
};

export const updateNotificationSettings = async (
  userId: Types.ObjectId,
  notificationSettings: Record<string, unknown>
) => {
  const updated = await UserProfile.findOneAndUpdate(
    { userId },
    { $set: { notificationSettings } },
    { new: true, upsert: true }
  ).lean();

  return updated?.notificationSettings;
};

export const getPreferences = async (userId: Types.ObjectId) => {
  const profile = await getOrCreateProfile(userId);
  return {
    language: profile.language,
    state: profile.state,
    district: profile.district,
    preferredCrops: profile.preferredCrops ?? [],
    preferredMandis: profile.preferredMandis ?? [],
    avatar: profile.avatar,
  };
};

export const updatePreferences = async (
  userId: Types.ObjectId,
  data: Record<string, unknown>
) => {
  const updated = await UserProfile.findOneAndUpdate(
    { userId },
    { $set: data },
    { new: true, upsert: true }
  ).lean();

  return {
    language: updated?.language,
    state: updated?.state,
    district: updated?.district,
    preferredCrops: updated?.preferredCrops ?? [],
    preferredMandis: updated?.preferredMandis ?? [],
    avatar: updated?.avatar,
  };
};

export const getSecurityInfo = async (userId: Types.ObjectId) => {
  const profile = await getOrCreateProfile(userId);
  return {
    phone: profile.phone,
  };
};

export const updateSecurityInfo = async (
  userId: Types.ObjectId,
  data: { phone?: string }
) => {
  const updated = await UserProfile.findOneAndUpdate(
    { userId },
    { $set: data },
    { new: true, upsert: true }
  ).lean();

  return {
    phone: updated?.phone,
  };
};

export const deleteProfile = async (userId: Types.ObjectId) => {
  const result = await UserProfile.findOneAndDelete({ userId });
  return !!result;
};

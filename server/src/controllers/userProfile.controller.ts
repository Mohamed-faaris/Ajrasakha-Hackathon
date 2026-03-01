import { type Request, type Response } from 'express';
import * as userProfileService from '../services/userProfile.service';
import { validateBody } from '../middlewares/validate.middleware';
import { Types } from 'mongoose';
import {
  UpdateUserProfileBodySchema,
  NotificationSettingsSchema,
  LanguageSchema,
} from '@shared/schemas';
import { z } from 'zod';

const UpdatePreferencesBodySchema = z.object({
  language: LanguageSchema.optional(),
  state: z.string().optional(),
  district: z.string().optional(),
  preferredCrops: z.array(z.string()).optional(),
  preferredMandis: z.array(z.string()).optional(),
  avatar: z.string().optional(),
});

const UpdateSecurityBodySchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/).optional(),
});

const getUserObjectId = (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
  return new Types.ObjectId(userId);
};

export const getProfile = async (req: Request, res: Response) => {
  const userId = getUserObjectId(req, res);
  if (!userId) return;

  const profile = await userProfileService.getOrCreateProfile(userId);
  res.json(profile);
};

export const updateProfile = [
  validateBody(UpdateUserProfileBodySchema),
  async (req: Request, res: Response) => {
    const userId = getUserObjectId(req, res);
    if (!userId) return;

    const body = UpdateUserProfileBodySchema.parse(req.body);
    const profile = await userProfileService.updateProfile(userId, body);
    res.json(profile);
  },
];

export const deleteProfile = async (req: Request, res: Response) => {
  const userId = getUserObjectId(req, res);
  if (!userId) return;

  await userProfileService.deleteProfile(userId);
  res.status(204).send();
};

export const getSettings = async (req: Request, res: Response) => {
  const userId = getUserObjectId(req, res);
  if (!userId) return;

  const profile = await userProfileService.getOrCreateProfile(userId);
  res.json(profile);
};

export const getNotifications = async (req: Request, res: Response) => {
  const userId = getUserObjectId(req, res);
  if (!userId) return;

  const notificationSettings = await userProfileService.getNotificationSettings(userId);
  res.json(notificationSettings);
};

export const updateNotifications = [
  validateBody(NotificationSettingsSchema),
  async (req: Request, res: Response) => {
    const userId = getUserObjectId(req, res);
    if (!userId) return;

    const body = NotificationSettingsSchema.parse(req.body);
    const notificationSettings = await userProfileService.updateNotificationSettings(userId, body);
    res.json(notificationSettings);
  },
];

export const getPreferences = async (req: Request, res: Response) => {
  const userId = getUserObjectId(req, res);
  if (!userId) return;

  const preferences = await userProfileService.getPreferences(userId);
  res.json(preferences);
};

export const updatePreferences = [
  validateBody(UpdatePreferencesBodySchema),
  async (req: Request, res: Response) => {
    const userId = getUserObjectId(req, res);
    if (!userId) return;

    const body = UpdatePreferencesBodySchema.parse(req.body);
    const preferences = await userProfileService.updatePreferences(userId, body);
    res.json(preferences);
  },
];

export const getSecurity = async (req: Request, res: Response) => {
  const userId = getUserObjectId(req, res);
  if (!userId) return;

  const security = await userProfileService.getSecurityInfo(userId);

  res.json({
    email: req.user?.email,
    name: req.user?.name,
    phone: security.phone,
    session: req.session
      ? {
        id: req.session.id,
        expiresAt: req.session.expiresAt,
      }
      : null,
  });
};

export const updateSecurity = [
  validateBody(UpdateSecurityBodySchema),
  async (req: Request, res: Response) => {
    const userId = getUserObjectId(req, res);
    if (!userId) return;

    const body = UpdateSecurityBodySchema.parse(req.body);
    const security = await userProfileService.updateSecurityInfo(userId, body);
    res.json(security);
  },
];

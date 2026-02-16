import { type Request, type Response } from 'express';
import * as userProfileService from '../services/userProfile.service';
import { validateBody } from '../middlewares/validate.middleware';
import { Types } from 'mongoose';
import { z } from 'zod';

const LanguageSchema = z.enum(['en', 'hi', 'mr', 'te', 'ta', 'kn', 'gu', 'pa']);

const NotificationSettingsSchema = z.object({
  email: z.object({
    enabled: z.boolean().default(true),
    priceAlerts: z.boolean().default(true),
    dailyDigest: z.boolean().default(false),
    weeklyReport: z.boolean().default(true),
  }),
  sms: z.object({
    enabled: z.boolean().default(false),
    priceAlerts: z.boolean().default(false),
  }),
  push: z.object({
    enabled: z.boolean().default(true),
    priceAlerts: z.boolean().default(true),
  }),
});

const FarmerDetailsSchema = z.object({
  isFarmer: z.boolean().default(false),
  farmSize: z.number().optional(),
  farmLocation: z.object({
    type: z.literal('Point'),
    coordinates: z.tuple([z.number(), z.number()]),
  }).optional(),
  primaryCrops: z.array(z.string()).optional(),
});

const TraderDetailsSchema = z.object({
  isTrader: z.boolean().default(false),
  companyName: z.string().optional(),
  gstNumber: z.string().optional(),
  tradingStates: z.array(z.string()).optional(),
});

const UpdateUserProfileBodySchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/).optional(),
  state: z.string().optional(),
  district: z.string().optional(),
  preferredCrops: z.array(z.string()).optional(),
  preferredMandis: z.array(z.string()).optional(),
  notificationSettings: NotificationSettingsSchema.partial().optional(),
  language: LanguageSchema.optional(),
  avatar: z.string().optional(),
  farmerDetails: FarmerDetailsSchema.partial().optional(),
  traderDetails: TraderDetailsSchema.partial().optional(),
});

export const getProfile = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const profile = await userProfileService.getProfile(new Types.ObjectId(userId));
  res.json(profile);
};

export const updateProfile = [
  validateBody(UpdateUserProfileBodySchema),
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const body = UpdateUserProfileBodySchema.parse(req.body);
    const profile = await userProfileService.updateProfile(new Types.ObjectId(userId), body);
    res.json(profile);
  },
];

export const deleteProfile = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  await userProfileService.deleteProfile(new Types.ObjectId(userId));
  res.status(204).send();
};

import { type Request, type Response } from 'express';
import * as userProfileService from '../services/userProfile.service';
import { validateBody } from '../middlewares/validate.middleware';
import { Types } from 'mongoose';
import { UpdateUserProfileBodySchema } from '../schemas';

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

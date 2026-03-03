import { type Request, type Response } from 'express';
import * as alertService from '../services/alert.service';
import * as firebaseService from '../services/firebase.service';
import { validateParams, validateBody } from '../middlewares/validate.middleware';
import { Types } from 'mongoose';
import {
  AlertIdParamsSchema,
  CreateAlertBodySchema,
  UpdateAlertBodySchema,
  ToggleAlertBodySchema,
  RegisterFCMTokenSchema,
} from '@shared/schemas';

export const createAlert = [
  validateBody(CreateAlertBodySchema),
  async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    try {
      const body = CreateAlertBodySchema.parse(req.body);
      const alert = await alertService.createAlert({
        userId: new Types.ObjectId(userId),
        ...body,
      });
      res.status(201).json(alert);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create alert';
      res.status(400).json({ error: message });
    }
  },
];

export const getUserAlerts = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const alerts = await alertService.getUserAlerts(new Types.ObjectId(userId));
  res.json(alerts);
};

export const getActiveAlerts = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const alerts = await alertService.getActiveAlerts(new Types.ObjectId(userId));
  res.json(alerts);
};

export const updateAlert = [
  validateParams(AlertIdParamsSchema),
  validateBody(UpdateAlertBodySchema),
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const params = AlertIdParamsSchema.parse(req.params);

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const body = UpdateAlertBodySchema.parse(req.body);
    const alert = await alertService.updateAlert(params.alertId, new Types.ObjectId(userId), body);

    if (!alert) {
      res.status(404).json({ error: 'Alert not found' });
      return;
    }

    res.json(alert);
  },
];

export const deleteAlert = [
  validateParams(AlertIdParamsSchema),
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const params = AlertIdParamsSchema.parse(req.params);

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const deleted = await alertService.deleteAlert(params.alertId, new Types.ObjectId(userId));

    if (!deleted) {
      res.status(404).json({ error: 'Alert not found' });
      return;
    }

    res.status(204).send();
  },
];

export const toggleAlert = [
  validateParams(AlertIdParamsSchema),
  validateBody(ToggleAlertBodySchema),
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const params = AlertIdParamsSchema.parse(req.params);
    const body = ToggleAlertBodySchema.parse(req.body);

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const alert = await alertService.toggleAlert(params.alertId, new Types.ObjectId(userId), body.isActive);

    if (!alert) {
      res.status(404).json({ error: 'Alert not found' });
      return;
    }

    res.json(alert);
  },
];

export const registerFCMToken = [
  validateBody(RegisterFCMTokenSchema),
  async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    try {
      const { token, device } = RegisterFCMTokenSchema.parse(req.body);
      const success = await firebaseService.registerFCMToken(userId, token, device);

      if (success) {
        res.json({ message: 'FCM token registered successfully' });
      } else {
        res.status(500).json({ error: 'Failed to register FCM token' });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to register FCM token';
      res.status(400).json({ error: message });
    }
  },
];

export const unregisterFCMToken = [
  validateBody(RegisterFCMTokenSchema.pick({ token: true })),
  async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    try {
      const { token } = req.body;
      const success = await firebaseService.removeInvalidToken(userId, token);

      if (success) {
        res.json({ message: 'FCM token unregistered successfully' });
      } else {
        res.status(404).json({ error: 'Token not found' });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to unregister FCM token';
      res.status(400).json({ error: message });
    }
  },
];

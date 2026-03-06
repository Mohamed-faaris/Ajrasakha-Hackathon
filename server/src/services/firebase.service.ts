import { UserProfile } from '../models';
import type { IAlert } from '../models';
import type { Types } from 'mongoose';

let messaging: any = null;

try {
  const firebaseConfig = require('../config/firebase');
  messaging = firebaseConfig.messaging;
} catch (error) {
  console.warn('Firebase config not found, push notifications will be disabled');
}

interface NotificationResult {
  successCount: number;
  failureCount: number;
  invalidTokens: string[];
}

export const sendPushNotification = async (
  tokens: string[],
  title: string,
  body: string,
  data?: object
): Promise<NotificationResult> => {
  const result: NotificationResult = {
    successCount: 0,
    failureCount: 0,
    invalidTokens: [],
  };

  if (!messaging || tokens.length === 0) {
    return result;
  }

  const message = {
    notification: {
      title,
      body,
    },
    data: data ? Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, String(value)])
    ) : {},
    tokens,
  };

  try {
    const response = await messaging.sendEachForMulticast(message);

    result.successCount = response.successCount;
    result.failureCount = response.failureCount;

    response.responses.forEach((resp: any, idx: number) => {
      if (!resp.success) {
        const errorCode = resp.error?.code;
        if (
          errorCode === 'messaging/invalid-registration-token' ||
          errorCode === 'messaging/registration-token-not-registered'
        ) {
          result.invalidTokens.push(tokens[idx]);
        }
      }
    });

    return result;
  } catch (error) {
    console.error('Error sending push notification:', error);
    result.failureCount = tokens.length;
    return result;
  }
};

export const getUserFCMTokens = async (userId: string | Types.ObjectId): Promise<string[]> => {
  const userProfile = await UserProfile.findOne({ userId }).lean();
  
  if (!userProfile || !(userProfile as any).fcmTokens || (userProfile as any).fcmTokens.length === 0) {
    return [];
  }

  return (userProfile as any).fcmTokens.map((tokenObj: any) => tokenObj.token);
};

export const removeInvalidToken = async (
  userId: string | Types.ObjectId,
  token: string
): Promise<boolean> => {
  try {
    const result = await UserProfile.findOneAndUpdate(
      { userId },
      { $pull: { fcmTokens: { token } } },
      { new: true }
    );
    return !!result;
  } catch (error) {
    console.error('Error removing invalid FCM token:', error);
    return false;
  }
};

export const cleanupInvalidTokens = async (
  userId: string | Types.ObjectId,
  invalidTokens: string[]
): Promise<void> => {
  if (invalidTokens.length === 0) return;

  try {
    await UserProfile.findOneAndUpdate(
      { userId },
      { $pull: { fcmTokens: { token: { $in: invalidTokens } } } }
    );
    console.log(`Cleaned up ${invalidTokens.length} invalid FCM tokens for user ${userId}`);
  } catch (error) {
    console.error('Error cleaning up invalid FCM tokens:', error);
  }
};

export const sendPriceAlertNotification = async (
  userId: string | Types.ObjectId,
  alert: IAlert,
  priceData: any
): Promise<NotificationResult> => {
  const tokens = await getUserFCMTokens(userId);
  
  if (tokens.length === 0) {
    return { successCount: 0, failureCount: 0, invalidTokens: [] };
  }

  const cropName = alert.cropName || 'Your crop';
  const mandiName = alert.mandiName || 'your selected mandi';
  const currentPrice = priceData?.modalPrice || priceData?.currentPrice || 'N/A';
  const thresholdPrice = alert.thresholdPrice;
  const direction = alert.direction === 'above' ? 'above' : 'below';
  const unit = priceData?.unit || 'Qtl';

  const title = `Price Alert: ${cropName}`;
  const body = thresholdPrice
    ? `${cropName} at ${mandiName} is now ${direction} ₹${thresholdPrice}/${unit}. Current price: ₹${currentPrice}/${unit}`
    : `${cropName} at ${mandiName} has a price update. Current price: ₹${currentPrice}/${unit}`;

  const data = {
    type: 'price_alert',
    alertId: alert.id,
    cropId: alert.cropId,
    cropName: alert.cropName,
    mandiId: alert.mandiId || '',
    mandiName: alert.mandiName || '',
    currentPrice: String(currentPrice),
    thresholdPrice: String(thresholdPrice || ''),
    direction: alert.direction || '',
    deepLink: `ajrasakha://price/${alert.cropId}/${alert.mandiId || ''}`,
  };

  const result = await sendPushNotification(tokens, title, body, data);

  if (result.invalidTokens.length > 0) {
    await cleanupInvalidTokens(userId, result.invalidTokens);
  }

  return result;
};

export const sendTrendAlertNotification = async (
  userId: string | Types.ObjectId,
  alert: IAlert,
  trendData: any
): Promise<NotificationResult> => {
  const tokens = await getUserFCMTokens(userId);
  
  if (tokens.length === 0) {
    return { successCount: 0, failureCount: 0, invalidTokens: [] };
  }

  const cropName = alert.cropName || 'Your crop';
  const mandiName = alert.mandiName || 'your selected mandi';
  const trendDirection = alert.trendDirection === 'increase' ? 'increasing' : 'decreasing';
  const percentage = alert.percentage || trendData?.percentage || 0;
  const days = alert.days || trendData?.days || 7;

  const title = `Trend Alert: ${cropName}`;
  const body = percentage > 0
    ? `${cropName} at ${mandiName} is ${trendDirection} by ${percentage}% over the last ${days} days.`
    : `${cropName} at ${mandiName} shows a ${trendDirection} trend over the last ${days} days.`;

  const data = {
    type: 'trend_alert',
    alertId: alert.id,
    cropId: alert.cropId,
    cropName: alert.cropName,
    mandiId: alert.mandiId || '',
    mandiName: alert.mandiName || '',
    trendDirection: alert.trendDirection || '',
    percentage: String(percentage),
    days: String(days),
    deepLink: `ajrasakha://trend/${alert.cropId}/${alert.mandiId || ''}`,
  };

  const result = await sendPushNotification(tokens, title, body, data);

  if (result.invalidTokens.length > 0) {
    await cleanupInvalidTokens(userId, result.invalidTokens);
  }

  return result;
};

export const registerFCMToken = async (
  userId: string | Types.ObjectId,
  token: string,
  device?: string
): Promise<boolean> => {
  try {
    const result = await UserProfile.findOneAndUpdate(
      { userId },
      {
        $addToSet: {
          fcmTokens: {
            token,
            device: device || 'unknown',
            createdAt: new Date(),
            lastUsedAt: new Date(),
          },
        },
      },
      { upsert: true, new: true }
    );
    return !!result;
  } catch (error) {
    console.error('Error registering FCM token:', error);
    return false;
  }
};

export const updateTokenLastUsed = async (
  userId: string | Types.ObjectId,
  token: string
): Promise<void> => {
  try {
    await UserProfile.findOneAndUpdate(
      { userId, 'fcmTokens.token': token },
      { $set: { 'fcmTokens.$.lastUsedAt': new Date() } }
    );
  } catch (error) {
    console.error('Error updating FCM token last used:', error);
  }
};

import { Alert, Crop } from '../models';

export type AlertType = 'price' | 'trend' | 'both';
export type PriceDirection = 'above' | 'below';
export type TrendDirection = 'increase' | 'decrease';

export interface CreateAlertData {
  userId: string;
  cropId: string;
  mandiId?: string;
  alertType: AlertType;
  thresholdPrice?: number;
  priceDirection?: PriceDirection;
  percentage?: number;
  days?: number;
  trendDirection?: TrendDirection;
  cooldownHours?: number;
  message?: string;
}

export interface PriceData {
  cropId: string;
  mandiId?: string;
  modalPrice: number;
  minPrice?: number;
  maxPrice?: number;
  unit?: string;
  date?: Date;
}

export interface PriceHistoryPoint {
  date: Date;
  modalPrice: number;
}

export interface TriggeredAlert {
  alert: ReturnType<typeof Alert.prototype.toObject>;
  triggeredPrice?: number;
  triggeredPercentage?: number;
  triggeredAt: Date;
}

export const createAlert = async (data: CreateAlertData) => {
  const crop = await Crop.findById(data.cropId);
  if (!crop) throw new Error('Crop not found');

  // Validate based on alert type
  if (data.alertType === 'price' || data.alertType === 'both') {
    if (data.thresholdPrice === undefined || data.thresholdPrice === null) {
      throw new Error('Price alerts require thresholdPrice');
    }
    if (!data.priceDirection) {
      throw new Error('Price alerts require priceDirection (above/below)');
    }
  }

  if (data.alertType === 'trend' || data.alertType === 'both') {
    if (data.percentage === undefined || data.percentage === null) {
      throw new Error('Trend alerts require percentage');
    }
    if (!data.days || data.days < 1) {
      throw new Error('Trend alerts require days (minimum 1)');
    }
    if (!data.trendDirection) {
      throw new Error('Trend alerts require trendDirection (increase/decrease)');
    }
  }

  const alert = await Alert.create({
    ...data,
    cropName: crop.name,
    isActive: true,
    cooldownHours: data.cooldownHours ?? 24,
  });

  return alert.toObject();
};

export const getUserAlerts = async (userId: string) => {
  return Alert.find({ userId }).sort({ createdAt: -1 }).lean();
};

export const getActiveAlerts = async (userId: string) => {
  return Alert.find({ userId, isActive: true }).sort({ createdAt: -1 }).lean();
};

export interface UpdateAlertData {
  alertType?: AlertType;
  thresholdPrice?: number;
  priceDirection?: PriceDirection;
  percentage?: number;
  days?: number;
  trendDirection?: TrendDirection;
  cooldownHours?: number;
  isActive?: boolean;
  message?: string;
}

export const updateAlert = async (
  alertId: string,
  userId: string,
  updates: UpdateAlertData
) => {
  // If updating alert type or related fields, validate the new configuration
  const alert = await Alert.findOne({ id: alertId, userId });
  if (!alert) return null;

  const newAlertType = updates.alertType ?? alert.alertType;
  const newThresholdPrice = updates.thresholdPrice ?? alert.thresholdPrice;
  const newPriceDirection = updates.priceDirection ?? alert.direction;
  const newPercentage = updates.percentage ?? alert.percentage;
  const newDays = updates.days ?? alert.days;
  const newTrendDirection = updates.trendDirection ?? alert.trendDirection;

  if (newAlertType === 'price' || newAlertType === 'both') {
    if (newThresholdPrice === undefined || newThresholdPrice === null) {
      throw new Error('Price alerts require thresholdPrice');
    }
    if (!newPriceDirection) {
      throw new Error('Price alerts require priceDirection (above/below)');
    }
  }

  if (newAlertType === 'trend' || newAlertType === 'both') {
    if (newPercentage === undefined || newPercentage === null) {
      throw new Error('Trend alerts require percentage');
    }
    if (!newDays || newDays < 1) {
      throw new Error('Trend alerts require days (minimum 1)');
    }
    if (!newTrendDirection) {
      throw new Error('Trend alerts require trendDirection (increase/decrease)');
    }
  }

  const updateData: Record<string, unknown> = { ...updates };
  if (updates.priceDirection !== undefined) {
    updateData.direction = updates.priceDirection;
    delete updateData.priceDirection;
  }

  return Alert.findOneAndUpdate(
    { id: alertId, userId },
    { $set: updateData },
    { new: true }
  ).lean();
};

export const deleteAlert = async (alertId: string, userId: string) => {
  const result = await Alert.findOneAndDelete({ id: alertId, userId });
  return !!result;
};

export const toggleAlert = async (alertId: string, userId: string, isActive: boolean) => {
  return Alert.findOneAndUpdate(
    { id: alertId, userId },
    { $set: { isActive } },
    { new: true }
  ).lean();
};

export const getAlertsForProcessing = async (): Promise<ReturnType<typeof Alert.prototype.toObject>[]> => {
  return Alert.find({ isActive: true }).lean();
};

export const processPriceAlerts = async (
  latestPriceData: PriceData
): Promise<TriggeredAlert[]> => {
  const triggeredAlerts: TriggeredAlert[] = [];
  const now = new Date();

  const alerts = await Alert.find({
    isActive: true,
    $or: [{ alertType: 'price' }, { alertType: 'both' }],
    cropId: latestPriceData.cropId,
    $and: [
      {
        $or: [
          { mandiId: { $exists: false } },
          { mandiId: null },
          { mandiId: '' },
          { mandiId: latestPriceData.mandiId },
        ],
      },
    ],
  }).lean();

  for (const alert of alerts) {
    // Check cooldown
    if (alert.lastNotifiedAt && alert.cooldownHours) {
      const cooldownEnd = new Date(alert.lastNotifiedAt);
      cooldownEnd.setHours(cooldownEnd.getHours() + alert.cooldownHours);
      if (cooldownEnd > now) {
        continue;
      }
    }

    // Check price condition
    const currentPrice = latestPriceData.modalPrice;
    const thresholdPrice = alert.thresholdPrice;
    const direction = alert.direction;

    if (thresholdPrice === undefined || thresholdPrice === null) {
      continue;
    }

    let conditionMet = false;
    if (direction === 'above' && currentPrice >= thresholdPrice) {
      conditionMet = true;
    } else if (direction === 'below' && currentPrice <= thresholdPrice) {
      conditionMet = true;
    }

    if (conditionMet) {
      triggeredAlerts.push({
        alert,
        triggeredPrice: currentPrice,
        triggeredAt: now,
      });
    }
  }

  return triggeredAlerts;
};

export const processTrendAlerts = async (
  priceHistory: PriceHistoryPoint[],
  cropId: string,
  mandiId?: string
): Promise<TriggeredAlert[]> => {
  const triggeredAlerts: TriggeredAlert[] = [];
  const now = new Date();

  if (priceHistory.length < 2) {
    return triggeredAlerts;
  }

  const alerts = await Alert.find({
    isActive: true,
    $or: [{ alertType: 'trend' }, { alertType: 'both' }],
    cropId: cropId,
    $and: [
      {
        $or: [
          { mandiId: { $exists: false } },
          { mandiId: null },
          { mandiId: '' },
          { mandiId: mandiId },
        ],
      },
    ],
  }).lean();

  // Sort price history by date
  const sortedHistory = [...priceHistory].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  for (const alert of alerts) {
    // Check cooldown
    if (alert.lastNotifiedAt && alert.cooldownHours) {
      const cooldownEnd = new Date(alert.lastNotifiedAt);
      cooldownEnd.setHours(cooldownEnd.getHours() + alert.cooldownHours);
      if (cooldownEnd > now) {
        continue;
      }
    }

    const alertDays = alert.days || 7;
    const alertPercentage = alert.percentage || 0;
    const trendDirection = alert.trendDirection;

    if (!trendDirection || alertPercentage === undefined || alertPercentage === null) {
      continue;
    }

    // Get price from N days ago
    const cutoffDate = new Date(now);
    cutoffDate.setDate(cutoffDate.getDate() - alertDays);

    const oldPricePoint = sortedHistory.find(
      (p) => new Date(p.date) <= cutoffDate
    );
    const latestPricePoint = sortedHistory[sortedHistory.length - 1];

    if (!oldPricePoint || !latestPricePoint) {
      continue;
    }

    const oldPrice = oldPricePoint.modalPrice;
    const latestPrice = latestPricePoint.modalPrice;

    // Calculate percentage change
    const percentageChange = ((latestPrice - oldPrice) / oldPrice) * 100;

    let conditionMet = false;
    if (trendDirection === 'increase' && percentageChange >= alertPercentage) {
      conditionMet = true;
    } else if (trendDirection === 'decrease' && percentageChange <= -alertPercentage) {
      conditionMet = true;
    }

    if (conditionMet) {
      triggeredAlerts.push({
        alert,
        triggeredPercentage: Math.abs(percentageChange),
        triggeredAt: now,
      });
    }
  }

  return triggeredAlerts;
};

export interface MarkAlertTriggeredData {
  triggeredPrice?: number;
  triggeredPercentage?: number;
  message?: string;
}

export const markAlertTriggered = async (
  alertId: string,
  data?: MarkAlertTriggeredData
): Promise<ReturnType<typeof Alert.prototype.toObject> | null> => {
  const now = new Date();

  const updateData: Record<string, unknown> = {
    lastNotifiedAt: now,
    triggeredAt: now,
  };

  if (data?.message) {
    updateData.message = data.message;
  }

  // Store triggered data in a metadata field if needed
  // Note: The current schema doesn't have triggerCount or triggeredData fields
  // They would need to be added to the schema for full functionality

  return Alert.findOneAndUpdate(
    { id: alertId },
    { $set: updateData },
    { new: true }
  ).lean();
};

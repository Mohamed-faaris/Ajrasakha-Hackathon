import { Alert, Price } from '../models';
import * as alertService from '../services/alert.service';
import * as firebaseService from '../services/firebase.service';
import type { TriggeredAlert, PriceData, PriceHistoryPoint } from '../services/alert.service';

export const ALERT_PROCESSOR_SCHEDULE = '0 * * * *';

interface ProcessingStats {
  alertsChecked: number;
  alertsTriggered: number;
  notificationsSent: number;
  notificationsFailed: number;
}

interface AlertGroup {
  cropId: string;
  mandiId: string | null;
  alerts: ReturnType<typeof Alert.prototype.toObject>[];
}

export const getLatestPrice = async (
  cropId: string,
  mandiId: string
): Promise<ReturnType<typeof Price.prototype.toObject> | null> => {
  return Price.findOne({ cropId, mandiId })
    .sort({ date: -1 })
    .lean();
};

export const getPriceHistory = async (
  cropId: string,
  mandiId: string,
  days: number
): Promise<PriceHistoryPoint[]> => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const prices = await Price.find({
    cropId,
    mandiId,
    date: { $gte: cutoffDate },
  })
    .sort({ date: 1 })
    .select('date modalPrice')
    .lean();

  return prices.map((p) => ({
    date: p.date,
    modalPrice: p.modalPrice,
  }));
};

export const sendNotificationsForTriggeredAlerts = async (
  triggeredAlerts: TriggeredAlert[]
): Promise<{ successCount: number; failureCount: number }> => {
  let successCount = 0;
  let failureCount = 0;

  for (const triggered of triggeredAlerts) {
    const { alert } = triggered;

    try {
      let result;

      if (triggered.triggeredPrice !== undefined) {
        result = await firebaseService.sendPriceAlertNotification(
          alert.userId,
          alert as any,
          {
            modalPrice: triggered.triggeredPrice,
            currentPrice: triggered.triggeredPrice,
          }
        );
      } else if (triggered.triggeredPercentage !== undefined) {
        result = await firebaseService.sendTrendAlertNotification(
          alert.userId,
          alert as any,
          {
            percentage: triggered.triggeredPercentage,
          }
        );
      }

      if (result) {
        successCount += result.successCount;
        failureCount += result.failureCount;
      }
    } catch (error) {
      console.error(`[AlertProcessor] Failed to send notification for alert ${alert.id}:`, error);
      failureCount++;
    }
  }

  return { successCount, failureCount };
};

const groupAlertsByCropMandi = (
  alerts: ReturnType<typeof Alert.prototype.toObject>[]
): AlertGroup[] => {
  const groups = new Map<string, AlertGroup>();

  for (const alert of alerts) {
    const mandiId = alert.mandiId || 'null';
    const key = `${alert.cropId}:${mandiId}`;

    if (!groups.has(key)) {
      groups.set(key, {
        cropId: alert.cropId,
        mandiId: alert.mandiId || null,
        alerts: [],
      });
    }

    groups.get(key)!.alerts.push(alert);
  }

  return Array.from(groups.values());
};

export const processAlertsJob = async (): Promise<ProcessingStats> => {
  console.log('[AlertProcessor] Starting alert processing job...');
  const startTime = Date.now();

  const stats: ProcessingStats = {
    alertsChecked: 0,
    alertsTriggered: 0,
    notificationsSent: 0,
    notificationsFailed: 0,
  };

  try {
    const activeAlerts = await alertService.getAlertsForProcessing();
    stats.alertsChecked = activeAlerts.length;

    if (activeAlerts.length === 0) {
      console.log('[AlertProcessor] No active alerts to process');
      return stats;
    }

    console.log(`[AlertProcessor] Found ${activeAlerts.length} active alerts`);

    const groupedAlerts = groupAlertsByCropMandi(activeAlerts);
    console.log(`[AlertProcessor] Grouped into ${groupedAlerts.length} unique crop+mandi combinations`);

    for (const group of groupedAlerts) {
      const { cropId, mandiId } = group;

      try {
        if (!mandiId) {
          console.log(`[AlertProcessor] Skipping alerts without mandiId for crop ${cropId}`);
          continue;
        }

        const latestPrice = await getLatestPrice(cropId, mandiId);
        if (!latestPrice) {
          console.log(`[AlertProcessor] No price data found for crop ${cropId}, mandi ${mandiId}`);
          continue;
        }

        const priceData: PriceData = {
          cropId,
          mandiId,
          modalPrice: latestPrice.modalPrice,
          minPrice: latestPrice.minPrice,
          maxPrice: latestPrice.maxPrice,
          unit: latestPrice.unit,
          date: latestPrice.date,
        };

        const priceTriggeredAlerts = await alertService.processPriceAlerts(priceData);

        const maxDays = Math.max(
          ...group.alerts
            .filter((a) => a.days && a.days > 0)
            .map((a) => a.days || 7),
          7
        );
        const priceHistory = await getPriceHistory(cropId, mandiId, maxDays);
        const trendTriggeredAlerts = await alertService.processTrendAlerts(
          priceHistory,
          cropId,
          mandiId
        );

        const allTriggeredAlerts = [...priceTriggeredAlerts, ...trendTriggeredAlerts];

        if (allTriggeredAlerts.length > 0) {
          console.log(
            `[AlertProcessor] Triggered ${allTriggeredAlerts.length} alerts for crop ${cropId}, mandi ${mandiId}`
          );

          const { successCount, failureCount } =
            await sendNotificationsForTriggeredAlerts(allTriggeredAlerts);
          stats.notificationsSent += successCount;
          stats.notificationsFailed += failureCount;

          for (const triggered of allTriggeredAlerts) {
            await alertService.markAlertTriggered(triggered.alert.id, {
              triggeredPrice: triggered.triggeredPrice,
              triggeredPercentage: triggered.triggeredPercentage,
            });
            stats.alertsTriggered++;
          }
        }
      } catch (groupError) {
        console.error(
          `[AlertProcessor] Error processing group crop=${cropId}, mandi=${mandiId}:`,
          groupError
        );
      }
    }

    const duration = Date.now() - startTime;
    console.log(
      `[AlertProcessor] Job completed in ${duration}ms - ` +
        `Checked: ${stats.alertsChecked}, ` +
        `Triggered: ${stats.alertsTriggered}, ` +
        `Notifications Sent: ${stats.notificationsSent}, ` +
        `Failed: ${stats.notificationsFailed}`
    );

    return stats;
  } catch (error) {
    console.error('[AlertProcessor] Fatal error in alert processing job:', error);
    throw error;
  }
};

export default processAlertsJob;

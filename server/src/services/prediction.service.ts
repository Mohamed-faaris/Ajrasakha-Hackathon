import { Price } from '../models';

export interface PredictionPoint {
  date: string;
  predictedPrice: number;
  lower: number;
  upper: number;
}

export interface PredictionResult {
  cropId: string;
  cropName: string;
  mandiId: string;
  mandiName: string;
  method: 'linear_regression' | 'moving_average';
  historicalDays: number;
  predictions: PredictionPoint[];
}

function linearRegression(xs: number[], ys: number[]): { slope: number; intercept: number; rmse: number } {
  const n = xs.length;
  const xMean = xs.reduce((a, b) => a + b, 0) / n;
  const yMean = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - xMean) * (ys[i] - yMean);
    den += (xs[i] - xMean) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = yMean - slope * xMean;
  const rmse = Math.sqrt(ys.map((y, i) => (y - (slope * xs[i] + intercept)) ** 2).reduce((a, b) => a + b, 0) / n);
  return { slope, intercept, rmse };
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function predictPrice(
  cropId: string,
  mandiId: string,
  forecastDays = 7,
  lookbackDays = 90
): Promise<PredictionResult> {
  forecastDays = Math.min(forecastDays, 30);
  lookbackDays = Math.max(lookbackDays, 14);

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - lookbackDays);

  const records = await Price.find({ cropId, mandiId, date: { $gte: startDate } })
    .sort({ date: 1 })
    .select('date modalPrice cropName mandiName')
    .lean();

  if (records.length === 0) {
    throw new Error(`No price data found for cropId="${cropId}" mandiId="${mandiId}"`);
  }

  const cropName = records[0].cropName;
  const mandiName = records[0].mandiName;
  const prices = records.map(r => r.modalPrice);
  const lastDate = new Date(records[records.length - 1].date);

  let predictions: PredictionPoint[];
  let method: PredictionResult['method'];

  if (records.length >= 10) {
    method = 'linear_regression';
    const xs = records.map((_, i) => i);
    const { slope, intercept, rmse } = linearRegression(xs, prices);
    const z = 1.282; // 80% confidence interval

    predictions = Array.from({ length: forecastDays }, (_, i) => {
      const xFuture = xs.length + i;
      const predicted = slope * xFuture + intercept;
      const margin = z * rmse * Math.sqrt(1 + 1 / xs.length);
      return {
        date: toDateStr(addDays(lastDate, i + 1)),
        predictedPrice: Math.max(0, round2(predicted)),
        lower: Math.max(0, round2(predicted - margin)),
        upper: Math.max(0, round2(predicted + margin)),
      };
    });
  } else {
    method = 'moving_average';
    const window = prices.slice(-7);
    const avg = window.reduce((a, b) => a + b, 0) / window.length;
    const margin = avg * 0.1;

    predictions = Array.from({ length: forecastDays }, (_, i) => ({
      date: toDateStr(addDays(lastDate, i + 1)),
      predictedPrice: round2(avg),
      lower: Math.max(0, round2(avg - margin)),
      upper: round2(avg + margin),
    }));
  }

  return { cropId, cropName, mandiId, mandiName, method, historicalDays: records.length, predictions };
}

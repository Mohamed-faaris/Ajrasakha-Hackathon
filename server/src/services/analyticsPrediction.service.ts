import { Prediction, Price } from '../models';
import * as predictionService from './prediction.service';
import type {
  AnalyticsPredictQuery,
  AnalyticsPredictResponse,
  APMCRow,
  CropRow,
  PredictionTrend,
  StateRow,
} from '@shared/types';

const MIN_PRICE_COUNT = 3;
const FALLBACK_GENERATION_CAP = 25;

type PredictionLevel = AnalyticsPredictResponse['level'];

interface EligiblePair {
  stateId: string;
  stateName: string;
  mandiId: string;
  mandiName: string;
  cropId: string;
  cropName: string;
  priceCount: number;
}

interface PredictionDoc {
  cropId: string;
  mandiId: string;
  trend: PredictionTrend;
  generatedAt: Date;
  expiresAt: Date;
  predictions: Array<{
    date: Date;
    predictedPrice: number;
    confidence: number;
  }>;
}

const pairKey = (cropId: string, mandiId: string) => `${cropId}::${mandiId}`;

const toCaseInsensitiveExactMatch = (value: string) => new RegExp(`^${value}$`, 'i');

const resolveLevel = ({ stateId, mandiId, cropId }: AnalyticsPredictQuery): PredictionLevel => {
  if (cropId) return 'prediction';
  if (mandiId) return 'crops';
  if (stateId) return 'apmcs';
  return 'states';
};

export const validateAnalyticsPredictQuery = (query: AnalyticsPredictQuery) => {
  if (query.mandiId && !query.stateId) {
    throw new Error('mandiId requires stateId');
  }
  if (query.cropId && (!query.stateId || !query.mandiId)) {
    throw new Error('cropId requires stateId and mandiId');
  }
};

const getEligiblePairs = async (query: AnalyticsPredictQuery): Promise<EligiblePair[]> => {
  const match: Record<string, unknown> = {};
  if (query.stateId) match.stateId = toCaseInsensitiveExactMatch(query.stateId);
  if (query.mandiId) match.mandiId = toCaseInsensitiveExactMatch(query.mandiId);
  if (query.cropId) match.cropId = toCaseInsensitiveExactMatch(query.cropId);

  const docs = await Price.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          stateId: '$stateId',
          stateName: '$stateName',
          mandiId: '$mandiId',
          mandiName: '$mandiName',
          cropId: '$cropId',
          cropName: '$cropName',
        },
        priceCount: { $sum: 1 },
      },
    },
    { $match: { priceCount: { $gte: MIN_PRICE_COUNT } } },
    {
      $project: {
        _id: 0,
        stateId: '$_id.stateId',
        stateName: '$_id.stateName',
        mandiId: '$_id.mandiId',
        mandiName: '$_id.mandiName',
        cropId: '$_id.cropId',
        cropName: '$_id.cropName',
        priceCount: 1,
      },
    },
  ]);

  return docs as EligiblePair[];
};

const getValidPredictionsForPairs = async (pairs: EligiblePair[]): Promise<Map<string, PredictionDoc>> => {
  const map = new Map<string, PredictionDoc>();
  if (pairs.length === 0) return map;

  const pairSet = new Set(pairs.map((pair) => pairKey(pair.cropId, pair.mandiId)));
  const cropIds = [...new Set(pairs.map((pair) => pair.cropId))];
  const mandiIds = [...new Set(pairs.map((pair) => pair.mandiId))];

  const docs = await Prediction.find({
    expiresAt: { $gt: new Date() },
    cropId: { $in: cropIds },
    mandiId: { $in: mandiIds },
  })
    .select('cropId mandiId trend generatedAt expiresAt predictions')
    .lean();

  for (const doc of docs) {
    const key = pairKey(doc.cropId, doc.mandiId);
    if (!pairSet.has(key)) continue;
    map.set(key, doc as PredictionDoc);
  }

  return map;
};

const generateMissingPredictions = async (
  pairs: EligiblePair[],
  existingPredictions: Map<string, PredictionDoc>
): Promise<{ generatedOnMiss: number; skippedOnCap: number }> => {
  const missingPairs = pairs.filter((pair) => !existingPredictions.has(pairKey(pair.cropId, pair.mandiId)));
  if (missingPairs.length === 0) {
    return { generatedOnMiss: 0, skippedOnCap: 0 };
  }

  const pairsToGenerate = missingPairs.slice(0, FALLBACK_GENERATION_CAP);
  const skippedOnCap = Math.max(0, missingPairs.length - FALLBACK_GENERATION_CAP);

  const generated = await Promise.all(
    pairsToGenerate.map(async (pair) => {
      const prediction = await predictionService.getPrediction(pair.cropId, pair.mandiId);
      return Number(Boolean(prediction));
    })
  );

  return {
    generatedOnMiss: generated.reduce((sum, value) => sum + value, 0),
    skippedOnCap,
  };
};

const buildStateRows = (pairs: EligiblePair[], predictionMap: Map<string, PredictionDoc>): StateRow[] => {
  const stateMap = new Map<
    string,
    {
      row: StateRow;
      mandiIds: Set<string>;
    }
  >();

  for (const pair of pairs) {
    const key = pair.stateId;
    if (!stateMap.has(key)) {
      stateMap.set(key, {
        row: {
          stateId: pair.stateId,
          stateName: pair.stateName,
          totalApmcs: 0,
          eligiblePairs: 0,
          predictionsAvailable: 0,
        },
        mandiIds: new Set<string>(),
      });
    }

    const state = stateMap.get(key)!;
    state.row.eligiblePairs += 1;
    state.mandiIds.add(pair.mandiId);
    if (predictionMap.has(pairKey(pair.cropId, pair.mandiId))) {
      state.row.predictionsAvailable += 1;
    }
  }

  return [...stateMap.values()]
    .map(({ row, mandiIds }) => ({
      ...row,
      totalApmcs: mandiIds.size,
    }))
    .sort((a, b) => a.stateName.localeCompare(b.stateName));
};

const buildApmcRows = (pairs: EligiblePair[], predictionMap: Map<string, PredictionDoc>): APMCRow[] => {
  const apmcMap = new Map<
    string,
    {
      row: APMCRow;
      cropIds: Set<string>;
    }
  >();

  for (const pair of pairs) {
    const key = pair.mandiId;
    if (!apmcMap.has(key)) {
      apmcMap.set(key, {
        row: {
          stateId: pair.stateId,
          stateName: pair.stateName,
          mandiId: pair.mandiId,
          mandiName: pair.mandiName,
          eligibleCrops: 0,
          eligiblePairs: 0,
          predictionsAvailable: 0,
        },
        cropIds: new Set<string>(),
      });
    }

    const apmc = apmcMap.get(key)!;
    apmc.row.eligiblePairs += 1;
    apmc.cropIds.add(pair.cropId);
    if (predictionMap.has(pairKey(pair.cropId, pair.mandiId))) {
      apmc.row.predictionsAvailable += 1;
    }
  }

  return [...apmcMap.values()]
    .map(({ row, cropIds }) => ({
      ...row,
      eligibleCrops: cropIds.size,
    }))
    .sort((a, b) => a.mandiName.localeCompare(b.mandiName));
};

const buildCropRows = (pairs: EligiblePair[], predictionMap: Map<string, PredictionDoc>): CropRow[] => {
  return pairs
    .map((pair) => {
      const prediction = predictionMap.get(pairKey(pair.cropId, pair.mandiId));
      const nextPrediction = prediction?.predictions?.[0];

      return {
        stateId: pair.stateId,
        stateName: pair.stateName,
        mandiId: pair.mandiId,
        mandiName: pair.mandiName,
        cropId: pair.cropId,
        cropName: pair.cropName,
        priceCount: pair.priceCount,
        hasPrediction: Boolean(prediction),
        trend: prediction?.trend ?? null,
        nextPredictedPrice: nextPrediction?.predictedPrice ?? null,
        confidence: nextPrediction?.confidence ?? null,
      };
    })
    .sort((a, b) => a.cropName.localeCompare(b.cropName));
};

export const getAnalyticsPredictions = async (
  query: AnalyticsPredictQuery
): Promise<AnalyticsPredictResponse> => {
  validateAnalyticsPredictQuery(query);

  const level = resolveLevel(query);

  if (level === 'prediction') {
    const prediction = await predictionService.getPrediction(query.cropId!, query.mandiId!);
    return {
      level,
      filters: query,
      generatedOnMiss: 0,
      skippedOnCap: 0,
      cap: FALLBACK_GENERATION_CAP,
      data: prediction,
    };
  }

  const pairs = await getEligiblePairs(query);
  const existingPredictions = await getValidPredictionsForPairs(pairs);
  const generationResult = await generateMissingPredictions(pairs, existingPredictions);
  const predictionMap = await getValidPredictionsForPairs(pairs);

  let data: AnalyticsPredictResponse['data'];
  if (level === 'states') {
    data = buildStateRows(pairs, predictionMap);
  } else if (level === 'apmcs') {
    data = buildApmcRows(pairs, predictionMap);
  } else {
    data = buildCropRows(pairs, predictionMap);
  }

  return {
    level,
    filters: query,
    generatedOnMiss: generationResult.generatedOnMiss,
    skippedOnCap: generationResult.skippedOnCap,
    cap: FALLBACK_GENERATION_CAP,
    data,
  };
};

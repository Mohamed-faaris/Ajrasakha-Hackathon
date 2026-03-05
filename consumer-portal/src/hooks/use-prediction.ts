import { useTypedQuery, queryKeys } from "./use-api";
import { apiClient } from "@/lib/api-client";
import type { PredictionResult, PredictionStatus } from "@shared/types";

export function usePrediction(cropId?: string, mandiId?: string) {
  return useTypedQuery(
    queryKeys.prediction(cropId, mandiId),
    () => apiClient.getPrediction(cropId!, mandiId!),
    {
      enabled: !!cropId && !!mandiId,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
}

export function usePredictionStatus(cropId?: string, mandiId?: string) {
  return useTypedQuery(
    queryKeys.predictionStatus(cropId, mandiId),
    () => apiClient.getPredictionStatus(cropId!, mandiId!),
    {
      enabled: !!cropId && !!mandiId,
      staleTime: 1 * 60 * 1000, // 1 minute
    }
  );
}

export type { PredictionResult, PredictionStatus };

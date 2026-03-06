import { useTypedQuery, queryKeys } from './use-api';
import { apiClient } from '@/lib/api-client';
import type { AnalyticsPredictQuery } from '@shared/types';

export function useAnalyticsPredictions(query: AnalyticsPredictQuery, enabled = true) {
  return useTypedQuery(
    queryKeys.analyticsPredictions(query.stateId, query.mandiId, query.cropId),
    () => apiClient.getAnalyticsPredictions(query),
    {
      staleTime: 2 * 60 * 1000,
      enabled,
    }
  );
}

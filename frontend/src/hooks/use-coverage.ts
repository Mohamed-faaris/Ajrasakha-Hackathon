import { useTypedQuery, queryKeys } from "./use-api";
import { apiClient } from "@/lib/api-client";
import type { StateCoverage, ArbitrageOpportunity } from "@shared/types";

export function useStateCoverage() {
  return useTypedQuery(
    queryKeys.stateCoverage(),
    () => apiClient.getStateCoverage(),
    {
      staleTime: 10 * 60 * 1000,
    }
  );
}

export function useArbitrageOpportunities() {
  return useTypedQuery(
    queryKeys.arbitrageOpportunities(),
    () => apiClient.getArbitrageOpportunities(),
    {
      staleTime: 5 * 60 * 1000,
    }
  );
}

export type { StateCoverage, ArbitrageOpportunity };
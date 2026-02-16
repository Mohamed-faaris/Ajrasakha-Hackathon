import { useTypedQuery, queryKeys } from "./use-api";
import { apiClient } from "@/lib/api-client";
import type { CropInfo, Mandi, State } from "@shared/types";

export function useCrops() {
  return useTypedQuery(
    queryKeys.crops(),
    () => apiClient.getCrops(),
    {
      staleTime: 30 * 60 * 1000,
    }
  );
}

export function useStates() {
  return useTypedQuery(
    queryKeys.states(),
    () => apiClient.getStates(),
    {
      staleTime: 30 * 60 * 1000,
    }
  );
}

export function useMandis(stateCode?: string) {
  return useTypedQuery(
    queryKeys.mandis(stateCode),
    () => apiClient.getMandis(stateCode),
    {
      staleTime: 30 * 60 * 1000,
      enabled: true,
    }
  );
}

export type { CropInfo, Mandi, State };
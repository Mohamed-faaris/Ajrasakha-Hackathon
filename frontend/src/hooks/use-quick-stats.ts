import { useTypedQuery, queryKeys } from "./use-api";
import { apiClient, type QuickStats } from "@/lib/api-client";

export function useQuickStats() {
  return useTypedQuery(
    queryKeys.quickStats(),
    () => apiClient.getQuickStats(),
    {
      staleTime: 60 * 1000,
      refetchInterval: 5 * 60 * 1000,
    }
  );
}

export type { QuickStats };
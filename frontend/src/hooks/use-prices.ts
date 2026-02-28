import { useTypedQuery, queryKeys } from "./use-api";
import { apiClient, type PriceFilters } from "@/lib/api-client";
import type { CropPrice, FrontendPriceTrend, TopMover } from "@shared/types";

export function usePrices(filters?: PriceFilters) {
  return useTypedQuery(
    queryKeys.prices(filters),
    () => apiClient.getPrices(filters),
    {
      enabled: true,
    }
  );
}

export function usePriceTrend(crop: string, months?: number) {
  return useTypedQuery(
    queryKeys.priceTrend(crop, months),
    () => apiClient.getPriceTrend(crop, months),
    {
      enabled: !!crop && crop.length > 0,
    }
  );
}

export function useTopMovers() {
  return useTypedQuery(
    queryKeys.topMovers(),
    () => apiClient.getTopMovers(),
    {
      staleTime: 2 * 60 * 1000,
    }
  );
}

export type { PriceFilters };
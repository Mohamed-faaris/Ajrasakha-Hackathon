import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient, type PriceFilters } from "@/lib/api-client";
import type { UseQueryOptions, UseMutationOptions } from "@tanstack/react-query";

export const queryKeys = {
  prices: (filters?: PriceFilters) => ["prices", filters] as const,
  priceTrend: (crop: string, months?: number) => ["priceTrend", crop, months] as const,
  topMovers: () => ["topMovers"] as const,
  crops: () => ["crops"] as const,
  states: () => ["states"] as const,
  mandis: (stateCode?: string) => ["mandis", stateCode] as const,
  alerts: () => ["alerts"] as const,
  stateCoverage: () => ["stateCoverage"] as const,
  arbitrageOpportunities: () => ["arbitrageOpportunities"] as const,
  quickStats: () => ["quickStats"] as const,
  profileSettings: () => ["profileSettings"] as const,
  notificationSettings: () => ["notificationSettings"] as const,
  profilePreferences: () => ["profilePreferences"] as const,
  profileSecurity: () => ["profileSecurity"] as const,
};

export function useTypedQuery<TData, TError = Error>(
  key: ReturnType<typeof queryKeys[keyof typeof queryKeys]>,
  fetcher: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: key,
    queryFn: fetcher,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    ...options,
  });
}

export function useTypedMutation<TData, TError = Error, TVariables = void, TContext = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: Omit<UseMutationOptions<TData, TError, TVariables, TContext>, "mutationFn">
) {
  return useMutation({
    mutationFn,
    ...options,
  });
}

export function createQueryHooks<TData, TParams extends Record<string, unknown> | undefined = undefined>(
  keyFactory: (params: TParams) => readonly unknown[],
  fetcher: (params: TParams) => Promise<TData>
) {
  return {
    useQuery: (params: TParams, options?: Omit<UseQueryOptions<TData>, "queryKey" | "queryFn">) => {
      return useQuery({
        queryKey: keyFactory(params),
        queryFn: () => fetcher(params),
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
        ...options,
      });
    },
    getQueryKey: keyFactory,
  };
}

export { useQueryClient };
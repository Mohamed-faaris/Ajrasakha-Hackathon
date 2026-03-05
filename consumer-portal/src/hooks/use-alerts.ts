import { useTypedQuery, useTypedMutation, queryKeys, useQueryClient } from "./use-api";
import { apiClient } from "@/lib/api-client";
import type { PriceAlert, AlertDirection } from "@shared/types";
import { toast } from "./use-toast";

export function useAlerts() {
  return useTypedQuery(
    queryKeys.alerts(),
    () => apiClient.getAlerts(),
    {
      staleTime: 30 * 1000,
    }
  );
}

export interface CreateAlertInput {
  crop: string;
  threshold?: number;
  type?: AlertDirection;
  alertType?: "price" | "trend" | "both";
  mandiId?: string;
  percentage?: number;
  days?: number;
  trendDirection?: "increase" | "decrease";
  cooldownHours?: number;
}

export function useCreateAlert() {
  const queryClient = useQueryClient();

  return useTypedMutation<PriceAlert, Error, CreateAlertInput>(
    (input) => apiClient.createAlert(input),
    {
    onMutate: async (newAlert) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.alerts() });
      const previousAlerts = queryClient.getQueryData<PriceAlert[]>(queryKeys.alerts());
      const optimisticAlert: PriceAlert = {
        id: `temp-${Date.now()}`,
        cropId: newAlert.crop,
        cropName: newAlert.crop,
        alertType: newAlert.alertType ?? "price",
        thresholdType: newAlert.type,
        direction: newAlert.type,
        thresholdPrice: newAlert.threshold,
        percentage: newAlert.percentage,
        days: newAlert.days,
        trendDirection: newAlert.trendDirection,
        cooldownHours: newAlert.cooldownHours,
        mandiId: newAlert.mandiId,
        isActive: true,
      };
      if (previousAlerts) {
        queryClient.setQueryData<PriceAlert[]>(queryKeys.alerts(), [...previousAlerts, optimisticAlert]);
      }
      return { previousAlerts };
    },
    onError: (_err, _newAlert, context) => {
      if (context?.previousAlerts) {
        queryClient.setQueryData(queryKeys.alerts(), context.previousAlerts);
      }
      toast({
        title: "Error",
        description: "Failed to create alert. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts() });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Alert created successfully.",
      });
    },
    }
  );
}

export function useDeleteAlert() {
  const queryClient = useQueryClient();

  return useTypedMutation<void, Error, string>(
    (id) => apiClient.deleteAlert(id),
    {
    onMutate: async (alertId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.alerts() });
      const previousAlerts = queryClient.getQueryData<PriceAlert[]>(queryKeys.alerts());
      if (previousAlerts) {
        queryClient.setQueryData<PriceAlert[]>(
          queryKeys.alerts(),
          previousAlerts.filter((alert) => alert.id !== alertId)
        );
      }
      return { previousAlerts };
    },
    onError: (_err, _alertId, context) => {
      if (context?.previousAlerts) {
        queryClient.setQueryData(queryKeys.alerts(), context.previousAlerts);
      }
      toast({
        title: "Error",
        description: "Failed to delete alert. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts() });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Alert deleted successfully.",
      });
    },
    }
  );
}

export type { AlertDirection };

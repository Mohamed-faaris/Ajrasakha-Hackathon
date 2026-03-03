import { apiClient, type ProfilePreferences, type ProfileSecurity, type UserProfileSettings } from "@/lib/api-client";
import type { NotificationSettings } from "@shared/types";
import { useQueryClient, useTypedMutation, useTypedQuery, queryKeys } from "./use-api";
import { toast } from "./use-toast";

export function useProfileSettings() {
    return useTypedQuery(queryKeys.profileSettings(), () => apiClient.getProfileSettings());
}

export function useUpdateProfileSettings() {
    const queryClient = useQueryClient();

    return useTypedMutation<UserProfileSettings, Error, UserProfileSettings>(
        (payload) => apiClient.updateProfileSettings(payload),
        {
            onSuccess: (data) => {
                queryClient.setQueryData(queryKeys.profileSettings(), data);
                toast({ title: "Saved", description: "Account settings updated." });
            },
            onError: () => {
                toast({
                    title: "Error",
                    description: "Failed to update account settings.",
                    variant: "destructive",
                });
            },
        }
    );
}

export function useNotificationSettings() {
    return useTypedQuery(queryKeys.notificationSettings(), () => apiClient.getNotificationSettings());
}

export function useUpdateNotificationSettings() {
    const queryClient = useQueryClient();

    return useTypedMutation<NotificationSettings, Error, NotificationSettings>(
        (payload) => apiClient.updateNotificationSettings(payload),
        {
            onSuccess: (data) => {
                queryClient.setQueryData(queryKeys.notificationSettings(), data);
                toast({ title: "Saved", description: "Notification settings updated." });
            },
            onError: () => {
                toast({
                    title: "Error",
                    description: "Failed to update notification settings.",
                    variant: "destructive",
                });
            },
        }
    );
}

export function useProfilePreferences() {
    return useTypedQuery(queryKeys.profilePreferences(), () => apiClient.getProfilePreferences());
}

export function useUpdateProfilePreferences() {
    const queryClient = useQueryClient();

    return useTypedMutation<ProfilePreferences, Error, Partial<ProfilePreferences>>(
        (payload) => apiClient.updateProfilePreferences(payload),
        {
            onSuccess: (data) => {
                queryClient.setQueryData(queryKeys.profilePreferences(), data);
                toast({ title: "Saved", description: "Preferences updated." });
            },
            onError: () => {
                toast({
                    title: "Error",
                    description: "Failed to update preferences.",
                    variant: "destructive",
                });
            },
        }
    );
}

export function useProfileSecurity() {
    return useTypedQuery(queryKeys.profileSecurity(), () => apiClient.getProfileSecurity());
}

export function useUpdateProfileSecurity() {
    const queryClient = useQueryClient();

    return useTypedMutation<{ phone?: string }, Error, { phone?: string }>(
        (payload) => apiClient.updateProfileSecurity(payload),
        {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: queryKeys.profileSecurity() });
                queryClient.invalidateQueries({ queryKey: queryKeys.profileSettings() });
                toast({ title: "Saved", description: "Security settings updated." });
            },
            onError: () => {
                toast({
                    title: "Error",
                    description: "Failed to update security settings.",
                    variant: "destructive",
                });
            },
        }
    );
}

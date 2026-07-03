import { useAuth } from "@/components/auth/Auth";
import { useSeizeSettings } from "@/contexts/SeizeSettingsContext";
import type { ApiUpdateWaveNotificationPreferencesRequest } from "@/generated/models/ApiUpdateWaveNotificationPreferencesRequest";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiWaveNotificationPreferences } from "@/generated/models/ApiWaveNotificationPreferences";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { useWaveNotificationSubscription } from "@/hooks/useWaveNotificationSubscription";
import { commonApiPost } from "@/services/api/common-api";
import { useCallback, useMemo, useState } from "react";
import {
  ALL_GROUP_MENTION,
  getAllDropsTooltip,
  type NotificationLoadingTarget,
} from "./waveNotificationSettings.helpers";

export function useWavePreferenceSettings(wave: ApiWave) {
  const { seizeSettings } = useSeizeSettings();
  const { setToast } = useAuth();
  const [loadingTarget, setLoadingTarget] =
    useState<NotificationLoadingTarget | null>(null);

  const {
    data,
    refetch,
    isFetching: preferencesFetching = false,
    isPending: preferencesPending = false,
  } = useWaveNotificationSubscription(wave);

  const allDropsNotificationsSubscribersLimit =
    seizeSettings.all_drops_notifications_subscribers_limit;
  const disableAllDropsSelection =
    wave.metrics.subscribers_count >= allDropsNotificationsSubscribersLimit;

  const enabledGroupNotifications = useMemo(
    () => data?.enabled_group_notifications ?? [],
    [data?.enabled_group_notifications]
  );

  const subscribedToAllDrops = !!data?.subscribed;
  const allDropsEnabled = subscribedToAllDrops;
  const allGroupNotificationsEnabled =
    enabledGroupNotifications.includes(ALL_GROUP_MENTION);
  const loading =
    loadingTarget !== null || preferencesPending || preferencesFetching;
  const preferencesUnavailable = !data && !preferencesPending;

  const updateNotificationPreferences = useCallback(
    async ({
      body,
      target,
      errorMessage,
    }: {
      readonly body: ApiUpdateWaveNotificationPreferencesRequest;
      readonly target: NotificationLoadingTarget;
      readonly errorMessage: string;
    }) => {
      setLoadingTarget(target);
      try {
        await commonApiPost<
          ApiUpdateWaveNotificationPreferencesRequest,
          ApiWaveNotificationPreferences
        >({
          endpoint: `notifications/wave-subscription/${wave.id}`,
          body,
        });
        await refetch();
      } catch (error) {
        setToast({
          type: "error",
          title: "Couldn't update notification settings.",
          description: "Please try again.",
          details: getToastErrorDetails(error, errorMessage),
        });
      } finally {
        setLoadingTarget(null);
      }
    },
    [wave.id, refetch, setToast]
  );

  const toggleAllGroupNotifications = useCallback(async () => {
    await updateNotificationPreferences({
      target: "all-group",
      body: {
        subscribed: subscribedToAllDrops,
        enabled_group_notifications: allGroupNotificationsEnabled
          ? []
          : [ALL_GROUP_MENTION],
      },
      errorMessage: allGroupNotificationsEnabled
        ? "Unable to disable @ALL notifications"
        : "Unable to enable @ALL notifications",
    });
  }, [
    allGroupNotificationsEnabled,
    subscribedToAllDrops,
    updateNotificationPreferences,
  ]);

  const toggleAllDropsNotifications = useCallback(async () => {
    if (!subscribedToAllDrops && disableAllDropsSelection) {
      return;
    }

    await updateNotificationPreferences({
      target: "all-drops",
      body: {
        subscribed: !subscribedToAllDrops,
        enabled_group_notifications: enabledGroupNotifications,
      },
      errorMessage: subscribedToAllDrops
        ? "Unable to disable all-message notifications"
        : "Unable to enable all-message notifications",
    });
  }, [
    disableAllDropsSelection,
    enabledGroupNotifications,
    subscribedToAllDrops,
    updateNotificationPreferences,
  ]);

  const onAllGroupNotificationsClick = useCallback(() => {
    void toggleAllGroupNotifications();
  }, [toggleAllGroupNotifications]);

  const onAllDropsNotificationsClick = useCallback(() => {
    void toggleAllDropsNotifications();
  }, [toggleAllDropsNotifications]);

  const onRetryClick = useCallback(() => {
    void refetch();
  }, [refetch]);

  const allGroupTooltip = allGroupNotificationsEnabled
    ? "Click to disable @ALL notifications"
    : "Click to enable @ALL notifications";
  const allDropsTooltip = getAllDropsTooltip({
    disableAllDropsSelection,
    subscribedToAllDrops,
    subscribersLimit: allDropsNotificationsSubscribersLimit,
  });

  return {
    allDropsEnabled,
    allGroupNotificationsEnabled,
    allDropsTooltip,
    allGroupTooltip,
    disableAllDropsSelection,
    loading,
    loadingTarget,
    onAllDropsNotificationsClick,
    onAllGroupNotificationsClick,
    onRetryClick,
    preferencesFetching,
    preferencesUnavailable,
  };
}

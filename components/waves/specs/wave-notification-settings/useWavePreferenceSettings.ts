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
  type NotificationLoadingTarget,
} from "./waveNotificationSettings.helpers";
import {
  formatWaveNotificationSettingsInteger,
  waveNotificationSettingsMessage,
} from "./waveNotificationSettings.messages";

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
          title: waveNotificationSettingsMessage(
            "waves.notificationSettings.preferences.error.updateTitle"
          ),
          description: waveNotificationSettingsMessage(
            "waves.notificationSettings.preferences.error.description"
          ),
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
        ? waveNotificationSettingsMessage(
            "waves.notificationSettings.preferences.error.disableAllMentions"
          )
        : waveNotificationSettingsMessage(
            "waves.notificationSettings.preferences.error.enableAllMentions"
          ),
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
        ? waveNotificationSettingsMessage(
            "waves.notificationSettings.preferences.error.disableAllMessages"
          )
        : waveNotificationSettingsMessage(
            "waves.notificationSettings.preferences.error.enableAllMessages"
          ),
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

  const allDropsUnavailableDescription = waveNotificationSettingsMessage(
    "waves.notificationSettings.allMessages.unavailableDescription",
    {
      count: formatWaveNotificationSettingsInteger(
        allDropsNotificationsSubscribersLimit
      ),
    }
  );

  return {
    allDropsEnabled,
    allGroupNotificationsEnabled,
    allDropsUnavailableDescription,
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

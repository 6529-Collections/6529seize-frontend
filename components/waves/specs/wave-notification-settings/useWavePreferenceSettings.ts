import { useAuth } from "@/components/auth/Auth";
import { useSeizeSettings } from "@/contexts/SeizeSettingsContext";
import type { ApiUpdateWaveNotificationPreferencesRequest } from "@/generated/models/ApiUpdateWaveNotificationPreferencesRequest";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiWaveNotificationPreferences } from "@/generated/models/ApiWaveNotificationPreferences";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { formatInteger } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { useWaveNotificationSubscription } from "@/hooks/useWaveNotificationSubscription";
import { commonApiPost } from "@/services/api/common-api";
import { useCallback, useMemo, useState } from "react";
import {
  ALL_GROUP_MENTION,
  getAllDropsTooltip,
  type NotificationLoadingTarget,
} from "./waveNotificationSettings.helpers";

const WAVE_NOTIFICATION_SETTINGS_LOCALE = DEFAULT_LOCALE;

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
          title: t(
            WAVE_NOTIFICATION_SETTINGS_LOCALE,
            "waves.notificationSettings.preferences.error.updateTitle"
          ),
          description: t(
            WAVE_NOTIFICATION_SETTINGS_LOCALE,
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
        ? t(
            WAVE_NOTIFICATION_SETTINGS_LOCALE,
            "waves.notificationSettings.preferences.error.disableAllMentions"
          )
        : t(
            WAVE_NOTIFICATION_SETTINGS_LOCALE,
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
        ? t(
            WAVE_NOTIFICATION_SETTINGS_LOCALE,
            "waves.notificationSettings.preferences.error.disableAllMessages"
          )
        : t(
            WAVE_NOTIFICATION_SETTINGS_LOCALE,
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

  const allGroupTooltip = allGroupNotificationsEnabled
    ? t(
        WAVE_NOTIFICATION_SETTINGS_LOCALE,
        "waves.notificationSettings.allMentions.tooltip.disable"
      )
    : t(
        WAVE_NOTIFICATION_SETTINGS_LOCALE,
        "waves.notificationSettings.allMentions.tooltip.enable"
      );
  const allDropsTooltip = getAllDropsTooltip({
    disableAllDropsSelection,
    subscribedToAllDrops,
    labels: {
      unavailable: t(
        WAVE_NOTIFICATION_SETTINGS_LOCALE,
        "waves.notificationSettings.allMessages.tooltip.unavailable",
        {
          count: formatInteger(
            WAVE_NOTIFICATION_SETTINGS_LOCALE,
            allDropsNotificationsSubscribersLimit
          ),
        }
      ),
      disable: t(
        WAVE_NOTIFICATION_SETTINGS_LOCALE,
        "waves.notificationSettings.allMessages.tooltip.disable"
      ),
      enable: t(
        WAVE_NOTIFICATION_SETTINGS_LOCALE,
        "waves.notificationSettings.allMessages.tooltip.enable"
      ),
    },
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

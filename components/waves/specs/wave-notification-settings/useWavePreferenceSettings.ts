import { useAuth } from "@/components/auth/Auth";
import type { ApiUpdateWaveNotificationPreferencesRequest } from "@/generated/models/ApiUpdateWaveNotificationPreferencesRequest";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiWaveNotificationPreferences } from "@/generated/models/ApiWaveNotificationPreferences";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { useWaveNotificationSubscription } from "@/hooks/useWaveNotificationSubscription";
import { commonApiPost } from "@/services/api/common-api";
import { useCallback, useMemo, useState } from "react";
import {
  BROADCAST_MENTION_PREFERENCE,
  type NotificationLoadingTarget,
} from "./waveNotificationSettings.helpers";
import { waveNotificationSettingsMessage } from "./waveNotificationSettings.messages";

export function useWavePreferenceSettings(wave: ApiWave) {
  const { setToast } = useAuth();
  const [loadingTarget, setLoadingTarget] =
    useState<NotificationLoadingTarget | null>(null);

  const {
    data,
    refetch,
    isFetching: preferencesFetching = false,
    isPending: preferencesPending = false,
  } = useWaveNotificationSubscription(wave);

  const enabledGroupNotifications = useMemo(
    () => data?.enabled_group_notifications ?? [],
    [data?.enabled_group_notifications]
  );

  const subscribedToAllDrops = !!data?.subscribed;
  const allDropsEnabled = subscribedToAllDrops;
  const broadcastMentionsEnabled = enabledGroupNotifications.includes(
    BROADCAST_MENTION_PREFERENCE
  );
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

  const toggleBroadcastMentions = useCallback(async () => {
    await updateNotificationPreferences({
      target: "broadcast-mentions",
      body: {
        subscribed: subscribedToAllDrops,
        enabled_group_notifications: broadcastMentionsEnabled
          ? []
          : [BROADCAST_MENTION_PREFERENCE],
      },
      errorMessage: broadcastMentionsEnabled
        ? waveNotificationSettingsMessage(
            "waves.notificationSettings.preferences.error.disableBroadcastMentions"
          )
        : waveNotificationSettingsMessage(
            "waves.notificationSettings.preferences.error.enableBroadcastMentions"
          ),
    });
  }, [
    broadcastMentionsEnabled,
    subscribedToAllDrops,
    updateNotificationPreferences,
  ]);

  const toggleAllDropsNotifications = useCallback(async () => {
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
    enabledGroupNotifications,
    subscribedToAllDrops,
    updateNotificationPreferences,
  ]);

  const onBroadcastMentionsClick = useCallback(() => {
    void toggleBroadcastMentions();
  }, [toggleBroadcastMentions]);

  const onAllDropsNotificationsClick = useCallback(() => {
    void toggleAllDropsNotifications();
  }, [toggleAllDropsNotifications]);

  const onRetryClick = useCallback(() => {
    void refetch();
  }, [refetch]);

  return {
    allDropsEnabled,
    broadcastMentionsEnabled,
    loading,
    loadingTarget,
    onAllDropsNotificationsClick,
    onBroadcastMentionsClick,
    onRetryClick,
    preferencesFetching,
    preferencesUnavailable,
  };
}

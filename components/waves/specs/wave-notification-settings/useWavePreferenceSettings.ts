import { useAuth } from "@/components/auth/Auth";
import type { ApiUpdateWaveNotificationPreferencesRequest } from "@/generated/models/ApiUpdateWaveNotificationPreferencesRequest";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiWaveNotificationPreferences } from "@/generated/models/ApiWaveNotificationPreferences";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { useWaveNotificationSubscription } from "@/hooks/useWaveNotificationSubscription";
import { commonApiPost } from "@/services/api/common-api";
import { useCallback, useState } from "react";
import {
  BROADCAST_MENTION_PREFERENCE,
  type NotificationLevel,
} from "./waveNotificationSettings.helpers";
import { waveNotificationSettingsMessage } from "./waveNotificationSettings.messages";

const MENTIONS_ONLY = "mentions-only";
const ALL_MESSAGES = "all-messages";

export function useWavePreferenceSettings(wave: ApiWave) {
  const { setToast } = useAuth();
  const [loadingTarget, setLoadingTarget] = useState<NotificationLevel | null>(
    null
  );
  const {
    data,
    refetch,
    isFetching: preferencesFetching = false,
    isPending: preferencesPending = false,
  } = useWaveNotificationSubscription(wave);

  let notificationLevel: NotificationLevel = MENTIONS_ONLY;
  if (data?.subscribed) {
    notificationLevel = ALL_MESSAGES;
  } else if (
    data?.enabled_group_notifications.includes(BROADCAST_MENTION_PREFERENCE)
  ) {
    notificationLevel = "broadcast-mentions";
  }
  const loading =
    loadingTarget !== null || preferencesPending || preferencesFetching;
  const preferencesUnavailable = !data && !preferencesPending;

  const onLevelSelect = useCallback(
    async (level: NotificationLevel) => {
      if (loading || preferencesUnavailable || level === notificationLevel)
        return;
      setLoadingTarget(level);
      let errorKey:
        | "enableAllMessages"
        | "disableAllMessages"
        | "enableBroadcastMentions"
        | "disableBroadcastMentions" = "disableBroadcastMentions";
      if (level === ALL_MESSAGES) errorKey = "enableAllMessages";
      else if (notificationLevel === ALL_MESSAGES)
        errorKey = "disableAllMessages";
      else if (level === "broadcast-mentions")
        errorKey = "enableBroadcastMentions";
      try {
        await commonApiPost<
          ApiUpdateWaveNotificationPreferencesRequest,
          ApiWaveNotificationPreferences
        >({
          endpoint: `notifications/wave-subscription/${wave.id}`,
          body: {
            subscribed: level === ALL_MESSAGES,
            enabled_group_notifications:
              level === MENTIONS_ONLY ? [] : [BROADCAST_MENTION_PREFERENCE],
          },
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
          details: getToastErrorDetails(
            error,
            waveNotificationSettingsMessage(
              `waves.notificationSettings.preferences.error.${errorKey}`
            )
          ),
        });
      } finally {
        setLoadingTarget(null);
      }
    },
    [
      loading,
      preferencesUnavailable,
      notificationLevel,
      wave.id,
      refetch,
      setToast,
    ]
  );

  const onRetryClick = useCallback(() => {
    void refetch();
  }, [refetch]);

  return {
    notificationLevel,
    loading,
    loadingTarget,
    onLevelSelect,
    onRetryClick,
    preferencesFetching,
    preferencesUnavailable,
  };
}

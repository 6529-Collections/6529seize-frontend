import { useAuth } from "@/components/auth/Auth";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiWave } from "@/generated/models/ApiWave";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { commonApiDelete, commonApiPost } from "@/services/api/common-api";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { getErrorMessage } from "./waveNotificationSettings.helpers";

const WAVE_NOTIFICATION_SETTINGS_LOCALE = DEFAULT_LOCALE;

export function useWaveMuteSettings(wave: ApiWave) {
  const queryClient = useQueryClient();
  const { setToast } = useAuth();
  const isMuted = wave.metrics.muted;
  const [muteLoading, setMuteLoading] = useState<boolean>(false);

  const toggleMute = useCallback(async () => {
    setMuteLoading(true);
    try {
      if (isMuted) {
        await commonApiDelete({ endpoint: `waves/${wave.id}/mute` });
      } else {
        await commonApiPost({ endpoint: `waves/${wave.id}/mute`, body: {} });
      }
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [QueryKey.WAVE, { wave_id: wave.id }],
        }),
        queryClient.invalidateQueries({
          queryKey: [QueryKey.WAVES_OVERVIEW],
        }),
        queryClient.invalidateQueries({
          queryKey: [QueryKey.WAVES_V2],
        }),
        queryClient.invalidateQueries({
          queryKey: [QueryKey.OFFICIAL_WAVES],
        }),
      ]);
    } catch (error) {
      const defaultMessage = isMuted
        ? t(
            WAVE_NOTIFICATION_SETTINGS_LOCALE,
            "waves.notificationSettings.mute.error.fallbackUnmute"
          )
        : t(
            WAVE_NOTIFICATION_SETTINGS_LOCALE,
            "waves.notificationSettings.mute.error.fallbackMute"
          );
      setToast({
        type: "error",
        title: isMuted
          ? t(
              WAVE_NOTIFICATION_SETTINGS_LOCALE,
              "waves.notificationSettings.mute.error.unmuteTitle"
            )
          : t(
              WAVE_NOTIFICATION_SETTINGS_LOCALE,
              "waves.notificationSettings.mute.error.muteTitle"
            ),
        description: t(
          WAVE_NOTIFICATION_SETTINGS_LOCALE,
          "waves.notificationSettings.mute.error.description"
        ),
        details: getToastErrorDetails(
          error,
          getErrorMessage(error, defaultMessage)
        ),
      });
    } finally {
      setMuteLoading(false);
    }
  }, [isMuted, wave.id, queryClient, setToast]);

  const onMuteClick = useCallback(() => {
    void toggleMute();
  }, [toggleMute]);

  const muteTooltip = isMuted
    ? t(
        WAVE_NOTIFICATION_SETTINGS_LOCALE,
        "waves.notificationSettings.mute.tooltip.disable"
      )
    : t(
        WAVE_NOTIFICATION_SETTINGS_LOCALE,
        "waves.notificationSettings.mute.tooltip.enable"
      );

  return {
    isMuted,
    muteLoading,
    muteTooltip,
    onMuteClick,
  };
}

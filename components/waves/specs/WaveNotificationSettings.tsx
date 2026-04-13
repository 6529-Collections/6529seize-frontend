"use client";

import { useAuth } from "@/components/auth/Auth";
import { Spinner } from "@/components/dotLoader/DotLoader";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useSeizeSettings } from "@/contexts/SeizeSettingsContext";
import { ApiDropGroupMention } from "@/generated/models/ApiDropGroupMention";
import type { ApiUpdateWaveNotificationPreferencesRequest } from "@/generated/models/ApiUpdateWaveNotificationPreferencesRequest";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiWaveNotificationPreferences } from "@/generated/models/ApiWaveNotificationPreferences";
import { useWaveNotificationSubscription } from "@/hooks/useWaveNotificationSubscription";
import { commonApiDelete, commonApiPost } from "@/services/api/common-api";
import { faBellSlash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";

interface WaveRatingProps {
  readonly wave: ApiWave;
}

type NotificationLoadingTarget = "all-group" | "all-drops";

const ALL_GROUP_MENTION = ApiDropGroupMention.All;

const getErrorMessage = (error: unknown, defaultMessage: string) =>
  typeof error === "string" ? error : defaultMessage;

export default function WaveNotificationSettings({ wave }: WaveRatingProps) {
  const queryClient = useQueryClient();
  const { seizeSettings } = useSeizeSettings();
  const disableAllDropsSelection =
    wave.metrics.subscribers_count >=
    seizeSettings.all_drops_notifications_subscribers_limit;

  const [isMuted, setIsMuted] = useState<boolean>(wave.metrics.muted);
  const [muteLoading, setMuteLoading] = useState<boolean>(false);

  const {
    data,
    refetch,
    isPending: preferencesPending = false,
  } = useWaveNotificationSubscription(wave);

  const { setToast } = useAuth();

  const [loadingTarget, setLoadingTarget] =
    useState<NotificationLoadingTarget | null>(null);

  const enabledGroupNotifications = useMemo(
    () => data?.enabled_group_notifications ?? [],
    [data?.enabled_group_notifications]
  );

  const subscribedToAllDrops = !!data?.subscribed;
  const allDropsEnabled = subscribedToAllDrops && !disableAllDropsSelection;
  const allGroupNotificationsEnabled =
    enabledGroupNotifications.includes(ALL_GROUP_MENTION);
  const loading = loadingTarget !== null || preferencesPending || !data;
  const following = wave.subscribed_actions.length > 0;

  useEffect(() => {
    setIsMuted(wave.metrics.muted);
  }, [wave.metrics.muted]);

  const toggleMute = useCallback(async () => {
    setMuteLoading(true);
    try {
      if (isMuted) {
        await commonApiDelete({ endpoint: `waves/${wave.id}/mute` });
      } else {
        await commonApiPost({ endpoint: `waves/${wave.id}/mute`, body: {} });
      }
      setIsMuted(!isMuted);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [QueryKey.WAVE, { wave_id: wave.id }],
        }),
        queryClient.invalidateQueries({
          queryKey: [QueryKey.WAVES_OVERVIEW],
        }),
      ]);
    } catch (error) {
      const defaultMessage = isMuted
        ? "Unable to unmute wave"
        : "Unable to mute wave";
      setToast({
        message: getErrorMessage(error, defaultMessage),
        type: "error",
      });
    } finally {
      setMuteLoading(false);
    }
  }, [isMuted, wave.id, queryClient, setToast]);

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
          message: getErrorMessage(error, errorMessage),
          type: "error",
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
        ? "Unable to disable all drop notifications"
        : "Unable to enable all drop notifications",
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

  const onMuteClick = useCallback(() => {
    void toggleMute();
  }, [toggleMute]);

  const getAllGroupTooltip = () => {
    return allGroupNotificationsEnabled
      ? "Click to disable @ALL notifications"
      : "Click to enable @ALL notifications";
  };

  const getAllDropsTooltip = () => {
    if (disableAllDropsSelection) {
      return `'All' notifications unavailable for waves with ${seizeSettings.all_drops_notifications_subscribers_limit.toLocaleString()}+ followers.`;
    }
    return subscribedToAllDrops
      ? "Click to disable notifications for all drops"
      : "Click to enable notifications for all drops";
  };

  const getButtonStyle = (active: boolean) => {
    return active
      ? "tw-bg-iron-800 tw-text-primary-400 tw-font-medium"
      : "tw-text-iron-400 desktop-hover:hover:tw-text-iron-300 tw-bg-transparent";
  };

  const getAllDropsButtonStyle = () => {
    if (disableAllDropsSelection) {
      return "tw-text-iron-500 tw-bg-transparent tw-cursor-not-allowed";
    }
    return getButtonStyle(allDropsEnabled);
  };

  const renderAllDropsIcon = (className: string) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="2"
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 0 1-1.44-4.282m3.102.069a18.03 18.03 0 0 1-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 0 1 8.835 2.535M10.34 6.66a23.847 23.847 0 0 0 8.835-2.535m0 0A23.74 23.74 0 0 0 18.795 3m.38 1.125a23.91 23.91 0 0 1 1.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 0 0 1.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 0 1 0 3.46"
      />
    </svg>
  );

  if (!following) {
    return null;
  }

  const getMuteTooltip = () => {
    return isMuted ? "Click to unmute this wave" : "Click to mute this wave";
  };

  if (isMuted) {
    return (
      <div className="tw-w-full">
        <OverlayTrigger
          overlay={
            <Tooltip id={`mute-tooltip-${wave.id}`} placement="top">
              {getMuteTooltip()}
            </Tooltip>
          }
        >
          <button
            disabled={muteLoading}
            onClick={onMuteClick}
            className="tw-flex tw-h-10 tw-w-full tw-items-center tw-justify-center tw-gap-2 tw-whitespace-nowrap tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-transparent tw-px-3 tw-text-xs tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out desktop-hover:hover:tw-text-iron-300 lg:tw-h-9"
            aria-label="Unmute wave"
          >
            {muteLoading ? (
              <Spinner dimension={14} />
            ) : (
              <>
                <FontAwesomeIcon
                  icon={faBellSlash}
                  className="tw-size-3.5 tw-flex-shrink-0"
                />
                <span>Muted</span>
              </>
            )}
          </button>
        </OverlayTrigger>
      </div>
    );
  }

  return (
    <div className="tw-grid tw-w-full tw-grid-cols-2 tw-gap-x-1.5 tw-text-xs">
      <OverlayTrigger
        overlay={
          <Tooltip id={`all-group-tooltip-${wave.id}`} placement="top">
            {getAllGroupTooltip()}
          </Tooltip>
        }
      >
        <button
          disabled={loading}
          onClick={onAllGroupNotificationsClick}
          className={`tw-flex tw-h-10 tw-w-full tw-items-center tw-justify-center tw-whitespace-nowrap tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-px-2.5 tw-py-2 tw-transition tw-duration-300 tw-ease-out lg:tw-h-9 ${getButtonStyle(allGroupNotificationsEnabled)}`}
          aria-label="Receive ALL mention notifications"
        >
          {loadingTarget === "all-group" ? (
            <Spinner dimension={12} />
          ) : (
            <span>@ALL</span>
          )}
        </button>
      </OverlayTrigger>

      <OverlayTrigger
        overlay={
          <Tooltip id={`all-drops-tooltip-${wave.id}`} placement="top">
            {getAllDropsTooltip()}
          </Tooltip>
        }
      >
        <button
          disabled={loading || disableAllDropsSelection}
          onClick={onAllDropsNotificationsClick}
          className={`tw-flex tw-h-10 tw-w-full tw-items-center tw-justify-center tw-whitespace-nowrap tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-px-2.5 tw-py-2 tw-transition tw-duration-300 tw-ease-out lg:tw-h-9 ${getAllDropsButtonStyle()}`}
          aria-label="Receive all drop notifications"
        >
          {loadingTarget === "all-drops" ? (
            <Spinner dimension={12} />
          ) : (
            renderAllDropsIcon("tw-size-4 tw-flex-shrink-0")
          )}
        </button>
      </OverlayTrigger>
    </div>
  );
}

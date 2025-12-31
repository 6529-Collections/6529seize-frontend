"use client";

import { useAuth } from "@/components/auth/Auth";
import { Spinner } from "@/components/dotLoader/DotLoader";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useSeizeSettings } from "@/contexts/SeizeSettingsContext";
import { ApiWave } from "@/generated/models/ApiWave";
import { useWaveNotificationSubscription } from "@/hooks/useWaveNotificationSubscription";
import { commonApiDelete, commonApiPost } from "@/services/api/common-api";
import { faAt, faBellSlash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";

interface WaveRatingProps {
  readonly wave: ApiWave;
}

export default function WaveNotificationSettings({ wave }: WaveRatingProps) {
  const queryClient = useQueryClient();
  const { seizeSettings } = useSeizeSettings();
  const disableSelection =
    wave.metrics.subscribers_count >=
    seizeSettings.all_drops_notifications_subscribers_limit;

  const [following, setFollowing] = useState<boolean>(false);
  const [isAllEnabled, setIsAllEnabled] = useState<boolean>();
  const [isMuted, setIsMuted] = useState<boolean>(wave.metrics.muted);
  const [muteLoading, setMuteLoading] = useState<boolean>(false);

  const { data, refetch } = useWaveNotificationSubscription(wave);

  const { setToast } = useAuth();

  const [loading, setLoading] = useState<boolean>(false);
  const [loadingTarget, setLoadingTarget] = useState<"mentions" | "all" | null>(
    null
  );

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
      queryClient.invalidateQueries({
        queryKey: [QueryKey.WAVE, { wave_id: wave.id }],
      });
      queryClient.invalidateQueries({
        queryKey: [QueryKey.WAVES_OVERVIEW],
      });
    } catch (error) {
      const defaultMessage = isMuted
        ? "Unable to unmute wave"
        : "Unable to mute wave";
      const errorMessage = typeof error === "string" ? error : defaultMessage;
      setToast({
        message: errorMessage,
        type: "error",
      });
    } finally {
      setMuteLoading(false);
    }
  }, [isMuted, wave.id, queryClient, setToast]);

  useEffect(() => {
    setIsAllEnabled(data?.subscribed && !disableSelection);
  }, [data, disableSelection]);

  const toggleNotifications = useCallback(
    async (enableAll: boolean) => {
      if (enableAll === isAllEnabled) return;

      setLoadingTarget(enableAll ? "all" : "mentions");
      setLoading(true);

      if (enableAll) {
        try {
          await commonApiPost({
            endpoint: `notifications/wave-subscription/${wave.id}`,
            body: {},
          });
          await refetch();
          setLoading(false);
          setLoadingTarget(null);
        } catch (error) {
          setLoading(false);
          setLoadingTarget(null);
          setToast({
            message:
              typeof error === "string"
                ? error
                : "Unable to subscribe to all drops",
            type: "error",
          });
        }
      } else {
        try {
          await commonApiDelete({
            endpoint: `notifications/wave-subscription/${wave.id}`,
          });
          await refetch();
          setLoading(false);
          setLoadingTarget(null);
        } catch (error) {
          setLoading(false);
          setLoadingTarget(null);
          setToast({
            message:
              typeof error === "string"
                ? error
                : "Unable to subscribe to mentions",
            type: "error",
          });
        }
      }
    },
    [isAllEnabled, wave.id, refetch, setToast]
  );

  useEffect(() => {
    setFollowing(!!wave.subscribed_actions.length);
    refetch();
  }, [wave.subscribed_actions.length, refetch]);

  const getMentionsTooltip = () => {
    return isAllEnabled ? "Click to switch to mentions-only notifications" : "";
  };

  const getAllTooltip = () => {
    if (disableSelection) {
      return `'All' notifications unavailable for waves with ${seizeSettings.all_drops_notifications_subscribers_limit.toLocaleString()}+ followers.`;
    }
    return !isAllEnabled ? "Click to enable notifications for all drops" : "";
  };

  const getActiveButtonStyle = () => {
    return "tw-bg-iron-800 tw-text-primary-400 tw-font-medium";
  };

  const getInactiveButtonStyle = () => {
    return "tw-text-iron-400 desktop-hover:hover:tw-text-iron-300 tw-bg-transparent";
  };

  const getDisabledButtonStyle = () => {
    return "tw-text-iron-500 tw-bg-transparent tw-cursor-not-allowed";
  };

  if (!following) {
    return null;
  }

  const getMuteTooltip = () => {
    return isMuted ? "Click to unmute this wave" : "Click to mute this wave";
  };

  if (isMuted) {
    return (
      <div className="tw-space-y-1.5">
        <div className="tw-flex tw-items-center tw-justify-between tw-gap-1.5">
          <OverlayTrigger
            overlay={
              <Tooltip id={`mute-tooltip-${wave.id}`} placement="top">
                {getMuteTooltip()}
              </Tooltip>
            }>
            <button
              disabled={muteLoading}
              onClick={toggleMute}
              className="tw-flex tw-items-center tw-gap-2 tw-whitespace-nowrap tw-h-10 lg:tw-h-9 tw-px-3 tw-text-xs tw-border tw-border-iron-700 tw-border-solid tw-rounded-lg tw-bg-transparent tw-text-iron-400 desktop-hover:hover:tw-text-iron-300 tw-transition tw-duration-300 tw-ease-out"
              aria-label="Unmute wave">
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
      </div>
    );
  }

  return (
    <div className="tw-space-y-1.5">
      <div className="tw-flex tw-items-center tw-justify-between tw-gap-1.5">
        <div className="tw-flex tw-items-center tw-whitespace-nowrap tw-h-10 lg:tw-h-9 tw-px-1 tw-text-xs tw-border tw-border-iron-700 tw-border-solid tw-rounded-lg tw-overflow-hidden">
          {isAllEnabled ? (
            <OverlayTrigger
              overlay={
                <Tooltip id={`mentions-tooltip-${wave.id}`} placement="top">
                  {getMentionsTooltip()}
                </Tooltip>
              }>
              <button
                disabled={loading}
                onClick={() => toggleNotifications(false)}
                className={`tw-px-3 tw-py-2 tw-rounded-md tw-border-0 tw-transition tw-duration-300 tw-ease-out tw-flex tw-items-center tw-justify-center ${getInactiveButtonStyle()}`}
                aria-label="Receive mentions-only notifications">
                {loading && loadingTarget === "mentions" ? (
                  <Spinner dimension={12} />
                ) : (
                  <FontAwesomeIcon
                    icon={faAt}
                    className="tw-size-3.5 tw-flex-shrink-0"
                  />
                )}
              </button>
            </OverlayTrigger>
          ) : (
            <button
              disabled={loading}
              onClick={() => toggleNotifications(false)}
              className={`tw-px-3 tw-py-2 tw-rounded-md tw-border-0 tw-transition tw-duration-300 tw-ease-out tw-flex tw-items-center tw-justify-center ${getActiveButtonStyle()}`}
              aria-label="Receive mentions-only notifications">
              {loading && loadingTarget === "mentions" ? (
                <Spinner dimension={12} />
              ) : (
                <FontAwesomeIcon
                  icon={faAt}
                  className="tw-size-3.5 tw-flex-shrink-0"
                />
              )}
            </button>
          )}

          {disableSelection ? (
            <OverlayTrigger
              overlay={
                <Tooltip id={`all-tooltip-${wave.id}`} placement="top">
                  {getAllTooltip()}
                </Tooltip>
              }>
              <button
                disabled={true}
                className={`tw-px-3 tw-py-2 lg:tw-px-2.5 lg:tw-py-1.5 tw-rounded-md tw-border-0 tw-transition tw-duration-300 tw-ease-out tw-flex tw-items-center tw-justify-center ${getDisabledButtonStyle()}`}
                aria-label="Receive all notifications">
                {loading && loadingTarget === "all" ? (
                  <Spinner dimension={12} />
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                    className="tw-size-4 tw-flex-shrink-0">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 0 1-1.44-4.282m3.102.069a18.03 18.03 0 0 1-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 0 1 8.835 2.535M10.34 6.66a23.847 23.847 0 0 0 8.835-2.535m0 0A23.74 23.74 0 0 0 18.795 3m.38 1.125a23.91 23.91 0 0 1 1.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 0 0 1.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 0 1 0 3.46"
                    />
                  </svg>
                )}
              </button>
            </OverlayTrigger>
          ) : isAllEnabled ? (
            <button
              disabled={loading}
              onClick={() => toggleNotifications(true)}
              className={`tw-px-3 tw-py-2 lg:tw-px-2.5 lg:tw-py-1.5 tw-rounded-md tw-border-0 tw-transition tw-duration-300 tw-ease-out tw-flex tw-items-center tw-justify-center ${getActiveButtonStyle()}`}
              aria-label="Receive all notifications">
              {loading && loadingTarget === "all" ? (
                <Spinner dimension={12} />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                  className="tw-size-4 tw-flex-shrink-0">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 0 1-1.44-4.282m3.102.069a18.03 18.03 0 0 1-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 0 1 8.835 2.535M10.34 6.66a23.847 23.847 0 0 0 8.835-2.535m0 0A23.74 23.74 0 0 0 18.795 3m.38 1.125a23.91 23.91 0 0 1 1.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 0 0 1.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 0 1 0 3.46"
                  />
                </svg>
              )}
            </button>
          ) : (
            <OverlayTrigger
              overlay={
                <Tooltip id={`all-tooltip-${wave.id}`} placement="top">
                  {getAllTooltip()}
                </Tooltip>
              }>
              <button
                disabled={loading}
                onClick={() => toggleNotifications(true)}
                className={`tw-px-3 tw-py-2 lg:tw-px-2.5 lg:tw-py-1.5 tw-rounded-md tw-border-0 tw-transition tw-duration-300 tw-ease-out tw-flex tw-items-center tw-justify-center ${getInactiveButtonStyle()}`}
                aria-label="Receive all notifications">
                {loading && loadingTarget === "all" ? (
                  <Spinner dimension={12} />
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                    className="tw-size-4 tw-flex-shrink-0">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 0 1-1.44-4.282m3.102.069a18.03 18.03 0 0 1-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 0 1 8.835 2.535M10.34 6.66a23.847 23.847 0 0 0 8.835-2.535m0 0A23.74 23.74 0 0 0 18.795 3m.38 1.125a23.91 23.91 0 0 1 1.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 0 0 1.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 0 1 0 3.46"
                    />
                  </svg>
                )}
              </button>
            </OverlayTrigger>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useCallback, useEffect, useState } from "react";
import { ApiWave } from "../../../generated/models/ApiWave";
import { ApiWaveCreditType } from "../../../generated/models/ApiWaveCreditType";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAt, faBullhorn } from "@fortawesome/free-solid-svg-icons";
import { useWaveNotificationSubscription } from "../../../hooks/useWaveNotificationSubscription";
import {
  commonApiDelete,
  commonApiPost,
} from "../../../services/api/common-api";
import { useAuth } from "../../auth/Auth";
import { useSeizeSettings } from "../../../contexts/SeizeSettingsContext";
import { Spinner } from "../../dotLoader/DotLoader";
import { OverlayTrigger, Tooltip } from "react-bootstrap";

const CREDIT_TYPE_LABELS: Record<ApiWaveCreditType, string> = {
  [ApiWaveCreditType.Tdh]: "TDH",
  [ApiWaveCreditType.Rep]: "REP",
};

interface WaveRatingProps {
  readonly wave: ApiWave;
}

export default function WaveNotificationSettings({ wave }: WaveRatingProps) {
  const { seizeSettings } = useSeizeSettings();
  const disableSelection =
    wave.metrics.subscribers_count >=
    seizeSettings.all_drops_notifications_subscribers_limit;

  const [following, setFollowing] = useState<boolean>(false);
  const [isAllEnabled, setIsAllEnabled] = useState<boolean>();

  const { data, refetch } = useWaveNotificationSubscription(wave);

  const { setToast } = useAuth();

  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    setIsAllEnabled(data?.subscribed && !disableSelection);
  }, [data, disableSelection]);

  const toggleNotifications = useCallback(async () => {
    if (isAllEnabled) {
      try {
        setLoading(true);
        await commonApiDelete({
          endpoint: `notifications/wave-subscription/${wave.id}`,
        });
        await refetch();
        setLoading(false);
        setToast({
          message:
            "You will only receive notifications for mentions in this wave",
          type: "success",
        });
      } catch (error) {
        setLoading(false);
        setToast({
          message:
            typeof error === "string"
              ? error
              : "Unable to subscribe to mentions",
          type: "error",
        });
      }
    } else {
      try {
        setLoading(true);
        await commonApiPost({
          endpoint: `notifications/wave-subscription/${wave.id}`,
          body: {},
        });
        await refetch();
        setLoading(false);
        setToast({
          message: "You will receive notifications for all drops in this wave",
          type: "success",
        });
      } catch (error) {
        setLoading(false);
        setToast({
          message:
            typeof error === "string"
              ? error
              : "Unable to subscribe to all drops",
          type: "error",
        });
      }
    }
  }, [isAllEnabled, wave.id, refetch, setToast]);

  useEffect(() => {
    setFollowing(!!wave.subscribed_actions.length);
    refetch();
  }, [wave.subscribed_actions.length, refetch]);

  const getTooltipContent = () => {
    if (disableSelection) {
      return `'All' notifications unavailable for waves with ${seizeSettings.all_drops_notifications_subscribers_limit.toLocaleString()}+ followers.`;
    }
    return isAllEnabled
      ? "Click to switch to mentions-only notifications"
      : "Click to enable notifications for all drops";
  };

  if (!following) {
    return null;
  }

  return (
    <div className="tw-space-y-1.5">
      <div className="tw-flex tw-items-center tw-justify-between tw-gap-1.5">
        <OverlayTrigger
          placement="top"
          overlay={
            <Tooltip id={`notification-tooltip-${wave.id}`}>
              {getTooltipContent()}
            </Tooltip>
          }
        >
          <span className="tw-inline-block">
            <button
              disabled={disableSelection || loading}
              onClick={toggleNotifications}
              className={`tw-relative tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-w-10 tw-h-10 tw-border tw-border-solid tw-transition tw-duration-300 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 ${
                disableSelection 
                  ? "tw-bg-iron-800 tw-border-iron-700 tw-text-iron-500 tw-cursor-not-allowed" 
                  : isAllEnabled
                    ? "tw-bg-iron-800 tw-border-iron-700 tw-border tw-border-solid tw-text-primary-400 desktop-hover:hover:tw-bg-iron-700 desktop-hover:hover:tw-border-iron-650"
                    : "tw-bg-iron-800 tw-border-iron-700 tw-border tw-border-solid tw-text-primary-400 desktop-hover:hover:tw-bg-iron-700 desktop-hover:hover:tw-border-iron-650"
              }`}
              aria-label={
                isAllEnabled
                  ? "Receiving all notifications (click to change)"
                  : "Receiving mention notifications (click to change)"
              }
            >
              {loading ? (
                <Spinner dimension={16} />
              ) : (
                <FontAwesomeIcon
                  icon={isAllEnabled ? faBullhorn : faAt}
                  className="tw-size-3.5"
                />
              )}
            </button>
          </span>
        </OverlayTrigger>
      </div>
    </div>
  );
}

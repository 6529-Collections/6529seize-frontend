import React, { useCallback, useEffect, useState } from "react";
import { ApiWave } from "../../../generated/models/ApiWave";
import { ApiWaveCreditType } from "../../../generated/models/ApiWaveCreditType";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAt, faBullhorn } from "@fortawesome/free-solid-svg-icons";
import { Button, ButtonGroup } from "react-bootstrap";
import { useWaveNotificationSubscription } from "../../../hooks/useWaveNotificationSubscription";
import {
  commonApiDelete,
  commonApiPost,
} from "../../../services/api/common-api";
import { useAuth } from "../../auth/Auth";
import { useSeizeSettings } from "../../../contexts/SeizeSettingsContext";
import { Spinner } from "../../dotLoader/DotLoader";

const CREDIT_TYPE_LABELS: Record<ApiWaveCreditType, string> = {
  [ApiWaveCreditType.Tdh]: "TDH",
  [ApiWaveCreditType.Rep]: "REP",
};

interface WaveRatingProps {
  readonly wave: ApiWave;
}

export default function WaveNotificationSettings({ wave }: WaveRatingProps) {
  const seizeSettings = useSeizeSettings();
  const disableSelection =
    wave.metrics.subscribers_count >=
    seizeSettings.all_drops_notifications_subscribers_limit;

  const [following, setFollowing] = useState<boolean>(false);
  const [isAllEnabled, setIsAllEnabled] = useState<boolean>();

  const { data, refetch } = useWaveNotificationSubscription(wave);

  const { setToast } = useAuth();

  const [loadingAll, setLoadingAll] = useState<boolean>(false);
  const [loadingMentions, setLoadingMentions] = useState<boolean>(false);

  useEffect(() => {
    if (data) {
      setIsAllEnabled(data.subscribed);
    } else {
      setIsAllEnabled(false);
    }
  }, [data]);

  const toggleAllNotifications = useCallback(async () => {
    if (isAllEnabled) {
      try {
        setLoadingMentions(true);
        await commonApiDelete({
          endpoint: `notifications/wave-subscription/${wave.id}`,
        });
        await refetch();
        setLoadingMentions(false);
        setToast({
          message:
            "You will only receive notifications for mentions in this wave",
          type: "success",
        });
      } catch (error) {
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
        setLoadingAll(true);
        await commonApiPost({
          endpoint: `notifications/wave-subscription/${wave.id}`,
          body: {},
        });
        await refetch();
        setLoadingAll(false);
        setToast({
          message: "You will receive notifications for all drops in this wave",
          type: "success",
        });
      } catch (error) {
        setToast({
          message:
            typeof error === "string"
              ? error
              : "Unable to subscribe to all drops",
          type: "error",
        });
      }
    }
  }, [isAllEnabled, wave.id, refetch]);

  useEffect(() => {
    setFollowing(!!wave.subscribed_actions.length);
    refetch();
  }, [wave.subscribed_actions.length, refetch]);

  const printSubtext = () => {
    if (!following) {
      return (
        <div className="tw-text-xs tw-text-iron-400">
          You must follow this wave to change notification settings.
        </div>
      );
    }
    if (disableSelection) {
      return (
        <div className="tw-text-xs tw-text-iron-400">
          &apos;All&apos; notifications are not available for waves with{" "}
          {seizeSettings.all_drops_notifications_subscribers_limit.toLocaleString()}{" "}
          or more followers.
        </div>
      );
    }
  };

  return (
    <div className="tw-text-sm tw-flex tw-flex-col tw-gap-y-1.5">
      <span className="tw-font-medium tw-text-iron-500">
        Notification Settings
      </span>
      {following && (
        <ButtonGroup
          aria-label="Notification settings"
          style={{ width: "100%" }}>
          <Button
            disabled={
              disableSelection || !following || loadingAll || loadingMentions
            }
            onClick={toggleAllNotifications}
            variant={isAllEnabled && following ? "light" : "outline-light"}
            className="tw-hover:tw-bg-red-500"
            style={{
              flex: 1,
            }}>
            <div className="tw-flex tw-items-center tw-justify-center tw-gap-x-1 tw-font-medium tw-text-md">
              {loadingAll ? (
                <Spinner dimension={14} />
              ) : (
                <FontAwesomeIcon icon={faBullhorn} width={14} height={14} />
              )}
              All
            </div>
          </Button>
          <Button
            disabled={
              disableSelection || !following || loadingMentions || loadingAll
            }
            onClick={toggleAllNotifications}
            variant={!isAllEnabled && following ? "light" : "outline-light"}
            style={{ flex: 1 }}>
            <div className="tw-flex tw-items-center tw-justify-center tw-gap-x-1 tw-font-medium tw-text-md">
              {loadingMentions ? (
                <Spinner dimension={14} />
              ) : (
                <FontAwesomeIcon icon={faAt} width={14} height={14} />
              )}
              Mentions
            </div>
          </Button>
        </ButtonGroup>
      )}
      {printSubtext()}
    </div>
  );
}

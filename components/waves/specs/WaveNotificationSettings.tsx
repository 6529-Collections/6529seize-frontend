import React, { useCallback, useEffect, useState } from "react";
import { ApiWave } from "../../../generated/models/ApiWave";
import { ApiWaveCreditType } from "../../../generated/models/ApiWaveCreditType";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAt, faGlobe } from "@fortawesome/free-solid-svg-icons";
import { Button } from "react-bootstrap";
import { ButtonGroup } from "react-bootstrap";
import { useWaveNotificationSubscription } from "../../../hooks/useWaveNotificationSubscription";
import {
  commonApiDelete,
  commonApiPost,
} from "../../../services/api/common-api";
import { useAuth } from "../../auth/Auth";

const CREDIT_TYPE_LABELS: Record<ApiWaveCreditType, string> = {
  [ApiWaveCreditType.Tdh]: "TDH",
  [ApiWaveCreditType.Rep]: "REP",
};

interface WaveRatingProps {
  readonly wave: ApiWave;
}

export default function WaveNotificationSettings({ wave }: WaveRatingProps) {
  const disableSelection = wave.metrics.subscribers_count >= 10;
  const following = !!wave.subscribed_actions.length;

  const [isAllEnabled, setIsAllEnabled] = useState<boolean>();

  const { data, refetch } = useWaveNotificationSubscription(wave);

  const { setToast } = useAuth();

  useEffect(() => {
    if (data) {
      setIsAllEnabled(data.subscribed_to_all_drops);
    } else {
      setIsAllEnabled(false);
    }
  }, [data]);

  const toggleAllNotifications = useCallback(async () => {
    if (isAllEnabled) {
      try {
        await commonApiDelete({
          endpoint: `notifications/subscribe-to-all-drops/${wave.id}`,
        });
        await refetch();
        setToast({
          message:
            "You will only receive notifications for mentions in this wave",
          type: "success",
        });
      } catch (error) {
        console.error(error);
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
        await commonApiPost({
          endpoint: `notifications/subscribe-to-all-drops/${wave.id}`,
          body: {},
        });
        await refetch();
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

  return (
    <div className="tw-text-sm tw-flex tw-flex-col tw-gap-y-1.5">
      <span className="tw-font-medium tw-text-iron-500">
        Notification Settings
      </span>
      <ButtonGroup aria-label="Notification settings" style={{ width: "100%" }}>
        <Button
          disabled={disableSelection || !following}
          onClick={toggleAllNotifications}
          variant={isAllEnabled && following ? "light" : "outline-light"}
          className="tw-hover:tw-bg-red-500"
          style={{
            flex: 1,
          }}>
          <div className="tw-flex tw-items-center tw-justify-center tw-gap-x-1">
            <FontAwesomeIcon icon={faGlobe} width={16} height={16} />
            All
          </div>
        </Button>
        <Button
          disabled={disableSelection || !following}
          onClick={toggleAllNotifications}
          variant={!isAllEnabled && following ? "light" : "outline-light"}
          style={{ flex: 1 }}>
          <div className="tw-flex tw-items-center tw-justify-center tw-gap-x-1">
            <FontAwesomeIcon icon={faAt} width={16} height={16} />
            Mentions
          </div>
        </Button>
      </ButtonGroup>
      {!following ? (
        <div className="tw-text-xs tw-text-iron-400">
          You must follow this wave to change notification settings.
        </div>
      ) : disableSelection ? (
        <div className="tw-text-xs tw-text-iron-400">
          &apos;All&apos; notifications are not available for waves with 3 or
          more subscribers.
        </div>
      ) : null}
    </div>
  );
}

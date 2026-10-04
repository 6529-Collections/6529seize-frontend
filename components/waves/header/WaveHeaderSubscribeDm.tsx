"use client";

import { useState } from "react";
import type { ApiWave } from "@/generated/models/ApiWave";
import { ApiWaveSubscriptionTargetAction } from "@/generated/models/ApiWaveSubscriptionTargetAction";
import type { ApiWaveSubscriptionActions } from "@/generated/models/ApiWaveSubscriptionActions";
import {
  commonApiDeleteWithBody,
  commonApiPost,
} from "@/services/api/common-api";
import { useAuth } from "@/components/auth/Auth";
import Button from "@/components/utils/button/Button";
import { getToastErrorDetails } from "@/helpers/toast.helpers";

interface WaveHeaderSubscribeDmProps {
  readonly wave: ApiWave;
  readonly size?: "sm" | "md" | undefined;
}

export default function WaveHeaderSubscribeDm({
  wave,
  size = "sm",
}: WaveHeaderSubscribeDmProps) {
  const { setToast, requestAuth } = useAuth();
  const dmSubscribed = wave.subscribed_actions.includes(
    ApiWaveSubscriptionTargetAction.DmOnDropCreated
  );
  const label = dmSubscribed ? "Subscribed" : "Subscribe";
  const [mutating, setMutating] = useState(false);

  const onToggle = async (): Promise<void> => {
    setMutating(true);
    const { success } = await requestAuth();
    if (!success) {
      setMutating(false);
      return;
    }
    try {
      if (dmSubscribed) {
        await commonApiDeleteWithBody<
          ApiWaveSubscriptionActions,
          ApiWaveSubscriptionActions
        >({
          endpoint: `waves/${wave.id}/subscribe-dm`,
          body: {},
        });
      } else {
        await commonApiPost<
          ApiWaveSubscriptionActions,
          ApiWaveSubscriptionActions
        >({
          endpoint: `waves/${wave.id}/subscribe-dm`,
          body: {},
        });
      }
    } catch (error) {
      setToast({
        type: "error",
        title: dmSubscribed
          ? "Couldn't unsubscribe from DM notifications."
          : "Couldn't subscribe to DM notifications.",
        description: "Please try again.",
        details: getToastErrorDetails(error),
      });
    } finally {
      setMutating(false);
    }
  };

  return (
    <Button
      onClick={onToggle}
      loading={mutating}
      variant={dmSubscribed ? "secondary" : "primary"}
      size={size}
    >
      <span>{label}</span>
    </Button>
  );
}
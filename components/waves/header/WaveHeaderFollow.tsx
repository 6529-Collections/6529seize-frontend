"use client";

import { useContext, useState } from "react";
import type { ApiWave } from "@/generated/models/ApiWave";
import { useMutation } from "@tanstack/react-query";
import type { ApiWaveSubscriptionActions } from "@/generated/models/ApiWaveSubscriptionActions";
import {
  commonApiDeleteWithBody,
  commonApiPost,
} from "@/services/api/common-api";
import { useAuth } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import Button from "@/components/utils/button/Button";
import { WAVE_DEFAULT_SUBSCRIPTION_ACTIONS } from "@/components/react-query-wrapper/utils/query-utils";
import { getToastErrorDetails } from "@/helpers/toast.helpers";

export enum WaveFollowBtnSize {
  SMALL = "SMALL",
  MEDIUM = "MEDIUM",
}

const SVG_CLASSES: Record<WaveFollowBtnSize, string> = {
  [WaveFollowBtnSize.SMALL]: "tw-h-4 tw-w-4",
  [WaveFollowBtnSize.MEDIUM]: "tw-h-5 tw-w-5",
};

const BUTTON_SIZES: Record<WaveFollowBtnSize, "sm" | "md"> = {
  [WaveFollowBtnSize.SMALL]: "sm",
  [WaveFollowBtnSize.MEDIUM]: "md",
};

interface WaveHeaderFollowProps {
  readonly wave: ApiWave;
  readonly subscribeToAllDrops?: boolean | undefined;
  readonly size?: WaveFollowBtnSize | undefined;
  readonly fullWidth?: boolean | undefined;
}

export default function WaveHeaderFollow({
  wave,
  subscribeToAllDrops = false,
  size = WaveFollowBtnSize.MEDIUM,
  fullWidth = false,
}: WaveHeaderFollowProps) {
  const { setToast, requestAuth } = useAuth();
  const { onWaveFollowChange } = useContext(ReactQueryWrapperContext);
  const following = !!wave.subscribed_actions.length;
  const label = following ? "Joined" : "Join";
  const [mutating, setMutating] = useState(false);

  const followMutation = useMutation({
    mutationFn: async () => {
      await commonApiPost<
        ApiWaveSubscriptionActions,
        ApiWaveSubscriptionActions
      >({
        endpoint: `waves/${wave.id}/subscriptions`,
        body: {
          actions: WAVE_DEFAULT_SUBSCRIPTION_ACTIONS,
        },
      });
      if (subscribeToAllDrops) {
        await commonApiPost({
          endpoint: `notifications/wave-subscription/${wave.id}`,
          body: {},
        });
      }
    },
    onSuccess: () => {
      onWaveFollowChange({
        waveId: wave.id,
        following: true,
      });
    },
    onError: (error) => {
      setToast({
        type: "error",
        title: "Couldn't join this wave.",
        description: "Please try again.",
        details: getToastErrorDetails(error),
      });
    },
    onSettled: () => {
      setMutating(false);
    },
  });

  const unFollowMutation = useMutation({
    mutationFn: async () => {
      await commonApiDeleteWithBody<
        ApiWaveSubscriptionActions,
        ApiWaveSubscriptionActions
      >({
        endpoint: `waves/${wave.id}/subscriptions`,
        body: {
          actions: WAVE_DEFAULT_SUBSCRIPTION_ACTIONS,
        },
      });
    },
    onSuccess: () => {
      onWaveFollowChange({
        waveId: wave.id,
        following: false,
      });
    },
    onError: (error) => {
      setToast({
        type: "error",
        title: "Couldn't leave this wave.",
        description: "Please try again.",
        details: getToastErrorDetails(error),
      });
    },
    onSettled: () => {
      setMutating(false);
    },
  });

  const onFollow = async (): Promise<void> => {
    setMutating(true);
    const { success } = await requestAuth();
    if (!success) {
      setMutating(false);
      return;
    }
    if (following) {
      await unFollowMutation.mutateAsync();
      return;
    }
    await followMutation.mutateAsync();
  };

  const printIcon = () => {
    if (following) {
      return (
        <svg
          className="tw-h-3 tw-w-3 tw-flex-shrink-0"
          viewBox="0 0 17 15"
          fill="none"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M14.7953 0.853403L5.24867 10.0667L2.71534 7.36007C2.24867 6.92007 1.51534 6.8934 0.982005 7.26674C0.462005 7.6534 0.315338 8.3334 0.635338 8.88007L3.63534 13.7601C3.92867 14.2134 4.43534 14.4934 5.00867 14.4934C5.55534 14.4934 6.07534 14.2134 6.36867 13.7601C6.84867 13.1334 16.0087 2.2134 16.0087 2.2134C17.2087 0.986737 15.7553 -0.093263 14.7953 0.84007V0.853403Z"
            fill="currentColor"
          />
        </svg>
      );
    }
    return (
      <svg
        className={`${SVG_CLASSES[size]} tw-flex-shrink-0`}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 5V19M5 12H19"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  return (
    <Button
      onClick={onFollow}
      loading={mutating}
      variant={following ? "secondary" : "primary"}
      size={BUTTON_SIZES[size]}
      fullWidth={fullWidth}
    >
      {!mutating && printIcon()}
      <span>{label}</span>
    </Button>
  );
}

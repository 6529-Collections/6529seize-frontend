"use client";

import { useContext, useEffect, useState } from "react";
import { ApiWave } from "../../../generated/models/ApiWave";
import { AuthContext } from "../../auth/Auth";
import { ReactQueryWrapperContext } from "../../react-query-wrapper/ReactQueryWrapper";
import { useMutation } from "@tanstack/react-query";
import {
  commonApiDeleteWithBody,
  commonApiPost,
} from "../../../services/api/common-api";
import { ApiWaveSubscriptionActions } from "../../../generated/models/ApiWaveSubscriptionActions";
import CircleLoader from "../../distribution-plan-tool/common/CircleLoader";
import { WAVE_DEFAULT_SUBSCRIPTION_ACTIONS } from "../../react-query-wrapper/utils/query-utils";

enum WaveItemFollowState {
  FOLLOWING = "FOLLOWING",
  FOLLOW = "FOLLOW",
  CANT_FOLLOW = "CANT_FOLLOW",
}

export default function WaveItemFollow({ wave }: { readonly wave: ApiWave }) {
  const { connectedProfile, activeProfileProxy, setToast, requestAuth } =
    useContext(AuthContext);
  const { onWaveFollowChange } = useContext(ReactQueryWrapperContext);
  const isSubscribed = !!wave.subscribed_actions.length;
  const label = isSubscribed ? "Following" : "Follow";
  const getCanSubscribe = () =>
    !!connectedProfile?.handle && !activeProfileProxy;
  const [canSubscribe, setCanSubscribe] = useState(getCanSubscribe());
  useEffect(
    () => setCanSubscribe(getCanSubscribe()),
    [connectedProfile, activeProfileProxy]
  );

  const [mutating, setMutating] = useState(false);
  const getIsDisabled = () => mutating || !canSubscribe;
  const [isDisabled, setIsDisabled] = useState(getIsDisabled());
  useEffect(() => setIsDisabled(getIsDisabled()), [mutating, canSubscribe]);

  const getState = (): WaveItemFollowState => {
    if (!canSubscribe) {
      return WaveItemFollowState.CANT_FOLLOW;
    }
    if (isSubscribed) {
      return WaveItemFollowState.FOLLOWING;
    }
    return WaveItemFollowState.FOLLOW;
  };

  const [state, setState] = useState(getState());
  useEffect(() => setState(getState()), [isSubscribed, canSubscribe]);

  const CLASSES: Record<WaveItemFollowState, string> = {
    [WaveItemFollowState.FOLLOWING]:
      "tw-bg-iron-800 tw-text-iron-300 hover:tw-bg-iron-700 hover:tw-border-iron-700 focus-visible:tw-outline-iron-700 tw-border-iron-800",
    [WaveItemFollowState.FOLLOW]:
      "tw-text-white hover:tw-bg-primary-600 hover:tw-border-primary-600 focus-visible:tw-outline-primary-600 tw-bg-primary-500 tw-border-primary-500",
    [WaveItemFollowState.CANT_FOLLOW]:
      "tw-opacity-50 tw-cursor-not-allowed tw-bg-primary-500 tw-ring-primary-500 tw-text-white",
  };

  const subscribeMutation = useMutation({
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
    },
    onSuccess: () => {
      onWaveFollowChange({
        waveId: wave.id,
        following: true,
      });
    },
    onError: (error) => {
      setToast({
        message: error as unknown as string,
        type: "error",
      });
    },
    onSettled: () => {
      setMutating(false);
    },
  });

  const unSubscribeMutation = useMutation({
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
        message: error as unknown as string,
        type: "error",
      });
    },
    onSettled: () => {
      setMutating(false);
    },
  });

  const onSubscribe = async (
    e: React.MouseEvent<HTMLButtonElement>
  ): Promise<void> => {
    e.preventDefault();
    setMutating(true);
    const { success } = await requestAuth();
    if (!success) {
      setMutating(false);
      return;
    }
    if (isSubscribed) {
      await unSubscribeMutation.mutateAsync();
      return;
    }
    await subscribeMutation.mutateAsync();
  };

  return (
    <div
      className={`tw-p-[1px] tw-w-full sm:tw-w-auto tw-flex tw-rounded-lg tw-bg-gradient-to-b ${
        state === WaveItemFollowState.FOLLOW
          ? " tw-from-primary-400 tw-to-primary-500"
          : "tw-from-iron-700 tw-to-iron-700"
      }`}>
      <button
        onClick={onSubscribe}
        type="button"
        disabled={isDisabled}
        className={`${CLASSES[state]} tw-flex tw-w-full sm:tw-w-auto tw-gap-x-1.5 tw-items-center tw-justify-center tw-border tw-border-solid tw-rounded-lg tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-shadow-sm focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 tw-transition tw-duration-300 tw-ease-out`}>
        {mutating ? (
          <CircleLoader />
        ) : isSubscribed ? (
          <svg
            className="tw-h-3 tw-w-3"
            viewBox="0 0 17 15"
            fill="none"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            width="17"
            height="15">
            <path
              d="M14.7953 0.853403L5.24867 10.0667L2.71534 7.36007C2.24867 6.92007 1.51534 6.8934 0.982005 7.26674C0.462005 7.6534 0.315338 8.3334 0.635338 8.88007L3.63534 13.7601C3.92867 14.2134 4.43534 14.4934 5.00867 14.4934C5.55534 14.4934 6.07534 14.2134 6.36867 13.7601C6.84867 13.1334 16.0087 2.2134 16.0087 2.2134C17.2087 0.986737 15.7553 -0.093263 14.7953 0.84007V0.853403Z"
              fillRule="evenodd"
              clipRule="evenodd"
              fill="currentColor"></path>
          </svg>
        ) : (
          <svg
            className="tw-h-5 tw-w-5 -tw-ml-1"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 5V19M5 12H19"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"></path>
          </svg>
        )}
        {!mutating && label}
      </button>
    </div>
  );
}

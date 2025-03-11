import { useContext, useState } from "react";
import { ApiWave } from "../../../generated/models/ApiWave";
import { useMutation } from "@tanstack/react-query";
import { ApiWaveSubscriptionActions } from "../../../generated/models/ApiWaveSubscriptionActions";
import {
  commonApiDeleWithBody,
  commonApiPost,
} from "../../../services/api/common-api";
import { AuthContext } from "../../auth/Auth";
import { ReactQueryWrapperContext } from "../../react-query-wrapper/ReactQueryWrapper";
import CircleLoader, {
  CircleLoaderSize,
} from "../../distribution-plan-tool/common/CircleLoader";
import { WAVE_DEFAULT_SUBSCRIPTION_ACTIONS } from "../../react-query-wrapper/utils/query-utils";

export enum WaveFollowBtnSize {
  SMALL = "SMALL",
  MEDIUM = "MEDIUM",
}

const BUTTON_CLASSES: Record<WaveFollowBtnSize, string> = {
  [WaveFollowBtnSize.SMALL]: "tw-gap-x-1 tw-px-2.5 tw-py-2 tw-text-xs",
  [WaveFollowBtnSize.MEDIUM]: "tw-gap-x-2 tw-px-3.5 tw-py-2.5 tw-text-sm",
};

const SVG_CLASSES: Record<WaveFollowBtnSize, string> = {
  [WaveFollowBtnSize.SMALL]: "tw-h-4 tw-w-4",
  [WaveFollowBtnSize.MEDIUM]: "tw-h-5 tw-w-5",
};

const LOADER_SIZES: Record<WaveFollowBtnSize, CircleLoaderSize> = {
  [WaveFollowBtnSize.SMALL]: CircleLoaderSize.SMALL,
  [WaveFollowBtnSize.MEDIUM]: CircleLoaderSize.MEDIUM,
};

export default function WaveHeaderFollow({
  wave,
  subscribeToAllDrops = false,
  size = WaveFollowBtnSize.MEDIUM,
}: {
  readonly wave: ApiWave;
  readonly subscribeToAllDrops?: boolean;
  readonly size?: WaveFollowBtnSize;
}) {
  const { setToast, requestAuth } = useContext(AuthContext);
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
        message: error as unknown as string,
        type: "error",
      });
    },
    onSettled: () => {
      setMutating(false);
    },
  });

  const unFollowMutation = useMutation({
    mutationFn: async () => {
      await commonApiDeleWithBody<
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
    if (mutating) {
      return <CircleLoader size={LOADER_SIZES[size]} />;
    } else if (following) {
      return (
        <svg
          className="tw-h-3 tw-w-3"
          viewBox="0 0 17 15"
          fill="none"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M14.7953 0.853403L5.24867 10.0667L2.71534 7.36007C2.24867 6.92007 1.51534 6.8934 0.982005 7.26674C0.462005 7.6534 0.315338 8.3334 0.635338 8.88007L3.63534 13.7601C3.92867 14.2134 4.43534 14.4934 5.00867 14.4934C5.55534 14.4934 6.07534 14.2134 6.36867 13.7601C6.84867 13.1334 16.0087 2.2134 16.0087 2.2134C17.2087 0.986737 15.7553 -0.093263 14.7953 0.84007V0.853403Z"
            fill="currentColor"
          />
        </svg>
      );
    } else {
      return (
        <svg
          className={SVG_CLASSES[size]}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 5V19M5 12H19"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    }
  };

  return (
    <div className="tw-flex tw-items-center">
      <button
        onClick={onFollow}
        disabled={mutating}
        type="button"
        className={`${BUTTON_CLASSES[size]} ${
          following
            ? "tw-bg-iron-800 tw-ring-iron-800 tw-text-iron-300 hover:tw-bg-iron-700 hover:tw-ring-iron-700"
            : "tw-bg-primary-500 tw-ring-primary-500 hover:tw-bg-primary-600 hover:tw-ring-primary-600 tw-text-white"
        } tw-flex tw-items-center tw-cursor-pointer tw-rounded-lg tw-font-semibold tw-border-0 tw-ring-1 tw-ring-inset tw-transition tw-duration-300 tw-ease-out`}>
        {printIcon()}
        <span>{label}</span>
      </button>
    </div>
  );
}

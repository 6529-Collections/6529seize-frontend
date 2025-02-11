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

export default function WaveHeaderFollow({ wave }: { readonly wave: ApiWave }) {
  const { setToast, requestAuth } = useContext(AuthContext);
  const { onWaveFollowChange } = useContext(ReactQueryWrapperContext);
  const following = !!wave.subscribed_actions.length;
  const label = following ? "Following" : "Follow";
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

  const renderButtonIcon = () => {
    if (mutating) {
      return (
        <div className="tw-mr-1">
          <CircleLoader size={CircleLoaderSize.SMALL} />
        </div>
      );
    }

    if (following) {
      return (
        <svg
          className="tw-h-3 tw-w-3 tw-flex-shrink-0 -tw-ml-0.5"
          width="17"
          height="15"
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
        className="tw-h-5 tw-w-5 -tw-ml-1.5"
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

  const getButtonClassName = () => {
    const baseClasses = "tw-flex tw-gap-x-1.5 tw-items-center tw-border tw-border-solid tw-rounded-lg tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-shadow-sm focus-visible:tw-outline focus-visible:tw-outline-2 tw-outline-offset-2 tw-transition tw-duration-300 tw-ease-out";
    
    if (following) {
      return `${baseClasses} tw-bg-iron-800 hover:tw-bg-iron-700 hover:tw-border-iron-700 tw-border-iron-800 tw-ring-1 tw-ring-iron-700 hover:tw-ring-iron-650 tw-text-iron-300 focus-visible:tw-outline-iron-700`;
    }
    
    return `${baseClasses} tw-border-primary-500 tw-bg-primary-500 hover:tw-bg-primary-600 hover:tw-border-primary-600 focus-visible:tw-outline-primary-600 tw-text-white`;
  };

  return (
    <div
      className={following ? "" : "tw-p-[1px] tw-rounded-lg tw-bg-gradient-to-b tw-from-primary-400 tw-to-primary-500"}
    >
      <button
        onClick={onFollow}
        disabled={mutating}
        type="button"
        className={getButtonClassName()}
      >
        {renderButtonIcon()}
        <span>{label}</span>
      </button>
    </div>
  );
}

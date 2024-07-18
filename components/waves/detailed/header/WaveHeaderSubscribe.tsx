import { useContext, useState } from "react";
import { Wave } from "../../../../generated/models/Wave";
import { useMutation } from "@tanstack/react-query";
import { WaveSubscriptionActions } from "../../../../generated/models/WaveSubscriptionActions";
import { WaveSubscriptionTargetAction } from "../../../../generated/models/WaveSubscriptionTargetAction";
import {
  commonApiDeleWithBody,
  commonApiPost,
} from "../../../../services/api/common-api";
import { AuthContext } from "../../../auth/Auth";
import { ReactQueryWrapperContext } from "../../../react-query-wrapper/ReactQueryWrapper";
import CircleLoader from "../../../distribution-plan-tool/common/CircleLoader";

export default function WaveHeaderSubscribe({ wave }: { readonly wave: Wave }) {
  const { setToast, requestAuth } = useContext(AuthContext);
  const { onWaveSubscriptionChange } = useContext(ReactQueryWrapperContext);
  const isSubscribed = !!wave.subscribed_actions.length;
  const label = isSubscribed ? "Joined" : "Join";
  const [mutating, setMutating] = useState(false);

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      await commonApiPost<WaveSubscriptionActions, WaveSubscriptionActions>({
        endpoint: `waves/${wave.id}/subscriptions`,
        body: {
          actions: Object.values(WaveSubscriptionTargetAction),
        },
      });
    },
    onSuccess: () => {
      onWaveSubscriptionChange();
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
      await commonApiDeleWithBody<
        WaveSubscriptionActions,
        WaveSubscriptionActions
      >({
        endpoint: `waves/${wave.id}/subscriptions`,
        body: {
          actions: Object.values(WaveSubscriptionTargetAction),
        },
      });
    },
    onSuccess: () => {
      onWaveSubscriptionChange();
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

  const onSubscribe = async (): Promise<void> => {
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
    <button
      onClick={onSubscribe}
      disabled={mutating}
      type="button"
      className={`tw-flex tw-items-center tw-gap-x-2 tw-cursor-pointer tw-px-3.5 tw-py-2.5 sm:tw-text-sm tw-rounded-lg tw-font-semibold  tw-border-0 tw-ring-1 tw-ring-inset ${
        isSubscribed
          ? "tw-bg-iron-800 tw-ring-iron-800 tw-text-iron-300 hover:tw-bg-iron-700 hover:tw-ring-iron-700"
          : "tw-bg-primary-500 tw-ring-primary-500 hover:tw-bg-primary-600 hover:tw-ring-primary-600 tw-text-white"
      } tw-transition tw-duration-300 tw-ease-out`}
    >
      {mutating ? (
        <div className="tw-mr-1">
          <CircleLoader />
        </div>
      ) : isSubscribed ? (
        <svg
          className="tw-h-3 tw-w-3"
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
      ) : (
        <svg
          className="tw-h-5 tw-w-5 -tw-ml-1"
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
      )}
      <span>{label}</span>
    </button>
  );
}

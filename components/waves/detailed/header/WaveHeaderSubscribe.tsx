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
  const label = isSubscribed ? "Subscribed" : "Subscribe";
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
      className="tw-inline-flex tw-items-center tw-gap-x-2 tw-cursor-pointer tw-bg-primary-500 tw-px-3.5 tw-py-2.5 tw-text-sm tw-rounded-lg tw-font-semibold tw-text-white hover:tw-text-white tw-border-0 tw-ring-1 tw-ring-inset tw-ring-primary-500 hover:tw-ring-primary-600 placeholder:tw-text-iron-300 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset tw-shadow-sm hover:tw-bg-primary-600 tw-transition tw-duration-300 tw-ease-out"
    >
      {mutating && <CircleLoader />}
      <svg
        className="tw-h-5 tw-w-5 tw-flex-shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 15.5H7.5C6.10444 15.5 5.40665 15.5 4.83886 15.6722C3.56045 16.06 2.56004 17.0605 2.17224 18.3389C2 18.9067 2 19.6044 2 21M19 21V15M16 18H22M14.5 7.5C14.5 9.98528 12.4853 12 10 12C7.51472 12 5.5 9.98528 5.5 7.5C5.5 5.01472 7.51472 3 10 3C12.4853 3 14.5 5.01472 14.5 7.5Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>{label}</span>
    </button>
  );
}

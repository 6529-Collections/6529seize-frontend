import { useContext, useEffect, useState } from "react";
import { Wave } from "../../../generated/models/Wave";
import { AuthContext } from "../../auth/Auth";
import { ReactQueryWrapperContext } from "../../react-query-wrapper/ReactQueryWrapper";
import { useMutation } from "@tanstack/react-query";
import {
  commonApiDeleWithBody,
  commonApiPost,
} from "../../../services/api/common-api";
import { WaveSubscriptionActions } from "../../../generated/models/WaveSubscriptionActions";
import { WaveSubscriptionTargetAction } from "../../../generated/models/WaveSubscriptionTargetAction";
import CircleLoader from "../../distribution-plan-tool/common/CircleLoader";

enum WaveItemJoinState {
  JOINED = "JOINED",
  JOIN = "JOIN",
  CANT_JOIN = "DISABLED",
}

export default function WaveItemJoin({ wave }: { readonly wave: Wave }) {
  const { connectedProfile, activeProfileProxy, setToast, requestAuth } =
    useContext(AuthContext);
  const { onWaveSubscriptionChange } = useContext(ReactQueryWrapperContext);
  const isSubscribed = !!wave.subscribed_actions.length;
  const label = isSubscribed ? "JOINED" : "JOIN";
  const getCanSubscribe = () =>
    !!connectedProfile?.profile?.handle && !activeProfileProxy;
  const [canSubscribe, setCanSubscribe] = useState(getCanSubscribe());
  useEffect(
    () => setCanSubscribe(getCanSubscribe()),
    [connectedProfile, activeProfileProxy]
  );

  const [mutating, setMutating] = useState(false);
  const getIsDisabled = () => mutating || !canSubscribe;
  const [isDisabled, setIsDisabled] = useState(getIsDisabled());
  useEffect(() => setIsDisabled(getIsDisabled()), [mutating, canSubscribe]);

  const getState = (): WaveItemJoinState => {
    if (!canSubscribe) {
      return WaveItemJoinState.CANT_JOIN;
    }
    if (isSubscribed) {
      return WaveItemJoinState.JOINED;
    }
    return WaveItemJoinState.JOIN;
  };

  const [state, setState] = useState(getState());
  useEffect(() => setState(getState()), [isSubscribed, canSubscribe]);

  const CLASSES: Record<WaveItemJoinState, string> = {
    [WaveItemJoinState.JOINED]:
      "tw-bg-iron-800 tw-ring-iron-800 tw-text-iron-300 hover:tw-bg-iron-700 hover:tw-ring-iron-700",
    [WaveItemJoinState.JOIN]:
      "tw-bg-primary-500 tw-ring-primary-500 hover:tw-bg-primary-600 hover:tw-ring-primary-600 tw-text-white",
    [WaveItemJoinState.CANT_JOIN]:
      "tw-opacity-50 tw-cursor-not-allowed tw-bg-primary-500 tw-ring-primary-500 tw-text-white",
  };

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
      type="button"
      disabled={isDisabled}
      className={`${CLASSES[state]} tw-flex tw-items-center tw-gap-x-2 tw-px-3.5 tw-py-2.5 sm:tw-text-sm tw-rounded-lg tw-font-semibold  tw-border-0 tw-ring-1 tw-ring-inset tw-transition tw-duration-300 tw-ease-out`}
    >
      {mutating ? <CircleLoader /> : label}
    </button>
  );
}

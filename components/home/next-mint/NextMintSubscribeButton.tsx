"use client";

import { useNextMintSubscription } from "@/hooks/useNextMintSubscription";

export function NextMintSubscribeButton() {
  const {
    nextSubscription,
    isSubscribed,
    isLoading: isSubscriptionLoading,
    isMutating: isSubscriptionMutating,
    canToggle,
    toggleSubscription,
  } = useNextMintSubscription();

  let subscriptionActionLabel = "Subscribe";
  if (isSubscriptionMutating) {
    subscriptionActionLabel = "Updating...";
  } else if (isSubscribed) {
    subscriptionActionLabel = "Subscribed";
  }

  const isSubscriptionUnavailable = !isSubscriptionLoading && !nextSubscription;
  const onSubscriptionToggle = () => {
    void toggleSubscription();
  };

  return (
    <button
      type="button"
      onClick={onSubscriptionToggle}
      disabled={
        !canToggle || isSubscriptionLoading || isSubscriptionUnavailable
      }
      className="tw-inline-flex tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-white/15 tw-bg-white/[0.04] tw-px-2.5 tw-py-0.5 tw-text-[11px] tw-font-medium tw-text-iron-200 tw-transition hover:tw-bg-white/[0.08] disabled:tw-cursor-not-allowed disabled:tw-opacity-50"
      aria-label="Toggle next mint subscription"
    >
      {subscriptionActionLabel}
    </button>
  );
}

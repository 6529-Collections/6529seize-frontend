import React, { useContext, useState } from "react";
import { Drop } from "../../../../generated/models/Drop";
import { AuthContext } from "../../../auth/Auth";
import { ReactQueryWrapperContext } from "../../../react-query-wrapper/ReactQueryWrapper";
import { commonApiDeleWithBody, commonApiPost } from "../../../../services/api/common-api";
import { useMutation } from "@tanstack/react-query";
import { IdentitySubscriptionTargetAction } from "../../../../generated/models/IdentitySubscriptionTargetAction";
import { IdentitySubscriptionActions } from "../../../../generated/models/IdentitySubscriptionActions";

interface WaveDetailedDropMobileMenuFollowProps {
  readonly drop: Drop;
  readonly onFollowChange: () => void
}

const WaveDetailedDropMobileMenuFollow: React.FC<
  WaveDetailedDropMobileMenuFollowProps
> = ({ drop, onFollowChange }) => {
  const isFollowing = !!drop.author.subscribed_actions.length
  const label = isFollowing ? "Unfollow" : "Follow"

  const { setToast, requestAuth } = useContext(AuthContext);
  const { invalidateDrops } = useContext(ReactQueryWrapperContext);
  const [mutating, setMutating] = useState(false);

  const followMutation = useMutation({
    mutationFn: async () => {
      await commonApiPost<
        IdentitySubscriptionActions,
        IdentitySubscriptionActions
      >({
        endpoint: `identities/${drop.author.id}/subscriptions`,
        body: {
          actions: Object.values(IdentitySubscriptionTargetAction).filter(
            (i) => i !== IdentitySubscriptionTargetAction.DropVoted
          ),
        },
      });
    },
    onSuccess: () => {
      invalidateDrops();
      onFollowChange();
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
        IdentitySubscriptionActions,
        IdentitySubscriptionActions
      >({
        endpoint: `identities/${drop.author.id}/subscriptions`,
        body: {
          actions: Object.values(IdentitySubscriptionTargetAction).filter(
            (i) => i !== IdentitySubscriptionTargetAction.DropVoted
          ),
        },
      });
    },
    onSuccess: () => {
      invalidateDrops();
      onFollowChange();
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
    if (isFollowing) {
      await unFollowMutation.mutateAsync();
      return;
    }
    await followMutation.mutateAsync();
  };
  return (
    <button
      onClick={onFollow}
      disabled={mutating}
      className={`tw-border-0 tw-flex tw-items-center tw-gap-x-4 tw-p-4 tw-bg-iron-950 tw-rounded-xl ${
        mutating ? 'tw-opacity-50 tw-cursor-default' : 'active:tw-bg-iron-800'
      } tw-transition-colors tw-duration-200`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
        className="tw-size-5 tw-flex-shrink-0 tw-text-iron-300"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z"
        />
      </svg>
      <span className="tw-text-iron-300 tw-font-semibold tw-text-base">
        {label} {drop.author.handle}
      </span>
    </button>
  );
};

export default WaveDetailedDropMobileMenuFollow;

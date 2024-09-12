import React, { useContext, useState } from "react";
import { Drop } from "../../../../generated/models/Drop";
import Tippy from "@tippyjs/react";
import { AuthContext } from "../../../auth/Auth";
import { ReactQueryWrapperContext } from "../../../react-query-wrapper/ReactQueryWrapper";
import { useMutation } from "@tanstack/react-query";
import {
  commonApiDeleWithBody,
  commonApiPost,
} from "../../../../services/api/common-api";
import CircleLoader, {
  CircleLoaderSize,
} from "../../../distribution-plan-tool/common/CircleLoader";
import { IdentitySubscriptionActions } from "../../../../generated/models/IdentitySubscriptionActions";
import { IdentitySubscriptionTargetAction } from "../../../../generated/models/IdentitySubscriptionTargetAction";

enum FOLLOW_STATE {
  FOLLOWING = "FOLLOWING",
  NOT_FOLLOWING = "NOT_FOLLOWING",
}

export default function WaveDetailedDropFollowAuthor({
  drop,
}: {
  readonly drop: Drop;
}) {
  const followState = drop.author.subscribed_actions.length
    ? FOLLOW_STATE.FOLLOWING
    : FOLLOW_STATE.NOT_FOLLOWING;

  const components: Record<FOLLOW_STATE, React.ReactNode> = {
    [FOLLOW_STATE.FOLLOWING]: (
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
    ),
    [FOLLOW_STATE.NOT_FOLLOWING]: (
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
    ),
  };

  const classes: Record<FOLLOW_STATE, string> = {
    [FOLLOW_STATE.FOLLOWING]: "tw-text-primary-500 hover:tw-text-primary-400",
    [FOLLOW_STATE.NOT_FOLLOWING]: "tw-text-iron-500 hover:tw-text-iron-50",
  };

  const tooltipText: Record<FOLLOW_STATE, string> = {
    [FOLLOW_STATE.FOLLOWING]: "Following",
    [FOLLOW_STATE.NOT_FOLLOWING]: "Follow",
  };

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
          actions: Object.values(IdentitySubscriptionTargetAction),
        },
      });
    },
    onSuccess: () => {
      invalidateDrops();
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
          actions: Object.values(IdentitySubscriptionTargetAction),
        },
      });
    },
    onSuccess: () => {
      invalidateDrops();
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
    if (followState === FOLLOW_STATE.FOLLOWING) {
      await unFollowMutation.mutateAsync();
      return;
    }
    await followMutation.mutateAsync();
  };

  return (
    <Tippy content={tooltipText[followState]} placement="top">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onFollow();
        }}
        disabled={mutating}
        className={`${classes[followState]} tw-flex tw-border-none tw-bg-transparent -tw-mx-1 tw-px-1 tw-py-0 tw-rounded-full tw-m-0 tw-transition tw-duration-300 tw-ease-out`}
      >
        {mutating ? (
          <CircleLoader size={CircleLoaderSize.SMALL} />
        ) : (
          components[followState]
        )}
      </button>
    </Tippy>
  );
}

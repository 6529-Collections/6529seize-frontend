"use client";

import { useContext, useEffect, useRef, useState } from "react";
import {
  QueryKey,
  ReactQueryWrapperContext,
} from "@/components/react-query-wrapper/ReactQueryWrapper";
import { AuthContext } from "@/components/auth/Auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { ApiIdentitySubscriptionActions } from "@/generated/models/ApiIdentitySubscriptionActions";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import {
  commonApiDeleteWithBody,
  commonApiFetch,
  commonApiPost,
} from "@/services/api/common-api";
import { ApiIdentitySubscriptionTargetAction } from "@/generated/models/ApiIdentitySubscriptionTargetAction";
import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { Tooltip } from "react-tooltip";

export enum UserFollowBtnSize {
  SMALL = "SMALL",
  MEDIUM = "MEDIUM",
}

export const FOLLOW_BTN_BUTTON_CLASSES: Record<UserFollowBtnSize, string> = {
  [UserFollowBtnSize.SMALL]: "tw-gap-x-1 tw-px-3 tw-py-2 tw-text-xs",
  [UserFollowBtnSize.MEDIUM]:
    "tw-gap-x-1 tw-px-3 md:tw-px-3.5 tw-py-2 md:tw-py-2.5 tw-text-sm",
};

export const FOLLOW_BTN_SVG_CLASSES: Record<UserFollowBtnSize, string> = {
  [UserFollowBtnSize.SMALL]: "tw-h-3 tw-w-3 md:tw-h-4 md:tw-w-4 -tw-ml-1",
  [UserFollowBtnSize.MEDIUM]: "tw-h-4 tw-w-4 md:tw-h-5 md:tw-w-5 -tw-ml-1",
};

export const FOLLOW_BTN_LOADER_SIZES: Record<
  UserFollowBtnSize,
  CircleLoaderSize
> = {
  [UserFollowBtnSize.SMALL]: CircleLoaderSize.SMALL,
  [UserFollowBtnSize.MEDIUM]: CircleLoaderSize.MEDIUM,
};

const DIRECT_MESSAGE_BUTTON_CLASSES: Record<UserFollowBtnSize, string> = {
  [UserFollowBtnSize.SMALL]: "tw-size-8",
  [UserFollowBtnSize.MEDIUM]: "tw-size-9 md:tw-size-10",
};

const DIRECT_MESSAGE_ICON_CLASSES: Record<UserFollowBtnSize, string> = {
  [UserFollowBtnSize.SMALL]: "tw-size-3",
  [UserFollowBtnSize.MEDIUM]: "tw-size-3.5 md:tw-size-4",
};

export default function UserFollowBtn({
  handle,
  size = UserFollowBtnSize.MEDIUM,
  onDirectMessage,
  directMessageLoading,
}: {
  readonly handle: string;
  readonly size?: UserFollowBtnSize | undefined;
  readonly onDirectMessage?: (() => void | Promise<void>) | undefined;
  readonly directMessageLoading?: boolean | undefined;
}) {
  const { onIdentityFollowChange } = useContext(ReactQueryWrapperContext);
  const { setToast, requestAuth } = useContext(AuthContext);
  const [mutating, setMutating] = useState<boolean>(false);
  const [directMessageMutating, setDirectMessageMutating] =
    useState<boolean>(false);
  const directMessageMutatingRef = useRef(false);

  const { data: subscriptions, isFetching } =
    useQuery<ApiIdentitySubscriptionActions>({
      queryKey: [QueryKey.IDENTITY_FOLLOWING_ACTIONS, handle],
      queryFn: async () =>
        await commonApiFetch<ApiIdentitySubscriptionActions>({
          endpoint: `/identities/${handle}/subscriptions`,
        }),
    });
  const isInitialStatusLoading = isFetching && subscriptions === undefined;

  const getFollowing = () => !!subscriptions?.actions.length;
  const getLabel = () => (getFollowing() ? "Following" : "Follow");

  const [following, setFollowing] = useState<boolean>(getFollowing());
  const [label, setLabel] = useState<string>(getLabel());
  useEffect(() => {
    setFollowing(getFollowing());
    setLabel(getLabel());
  }, [subscriptions]);

  const followMutation = useMutation({
    mutationFn: async () => {
      await commonApiPost<
        ApiIdentitySubscriptionActions,
        ApiIdentitySubscriptionActions
      >({
        endpoint: `identities/${handle}/subscriptions`,
        body: {
          actions: Object.values(ApiIdentitySubscriptionTargetAction).filter(
            (i) => i !== ApiIdentitySubscriptionTargetAction.DropVoted
          ),
        },
      });
    },
    onSuccess: () => {
      onIdentityFollowChange();
    },
    onError: (error) => {
      setToast({
        type: "error",
        title: "Couldn't follow this profile.",
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
        ApiIdentitySubscriptionActions,
        ApiIdentitySubscriptionActions
      >({
        endpoint: `identities/${handle}/subscriptions`,
        body: {
          actions: Object.values(ApiIdentitySubscriptionTargetAction).filter(
            (i) => i !== ApiIdentitySubscriptionTargetAction.DropVoted
          ),
        },
      });
    },
    onSuccess: () => {
      onIdentityFollowChange();
    },
    onError: (error) => {
      setToast({
        type: "error",
        title: "Couldn't unfollow this profile.",
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

  const isDirectMessagePending =
    directMessageMutating || !!directMessageLoading;

  const onDirectMessageClick = async (): Promise<void> => {
    if (
      !onDirectMessage ||
      directMessageMutatingRef.current ||
      directMessageLoading
    ) {
      return;
    }

    directMessageMutatingRef.current = true;
    setDirectMessageMutating(true);

    try {
      await onDirectMessage();
    } finally {
      directMessageMutatingRef.current = false;
      setDirectMessageMutating(false);
    }
  };

  let followButtonStateClass =
    "tw-bg-iron-200 tw-text-iron-950 tw-ring-white hover:tw-bg-iron-300 hover:tw-ring-iron-300";
  if (isInitialStatusLoading) {
    followButtonStateClass = "tw-bg-iron-800 tw-text-iron-300 tw-ring-iron-800";
  } else if (following) {
    followButtonStateClass =
      "tw-bg-iron-800 tw-text-iron-300 tw-ring-iron-800 hover:tw-bg-iron-700 hover:tw-ring-iron-700";
  }

  const directMessageTooltipId = `dm-${handle}`;

  return (
    <div className="tw-flex tw-items-center tw-gap-x-2">
      {onDirectMessage && (
        <>
          <button
            onClick={onDirectMessageClick}
            disabled={isDirectMessagePending}
            type="button"
            aria-label="Send direct message"
            className={`${DIRECT_MESSAGE_BUTTON_CLASSES[size]} tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-iron-800 tw-font-semibold tw-text-iron-300 tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-transition tw-duration-300 tw-ease-out enabled:tw-cursor-pointer enabled:hover:tw-bg-iron-700 enabled:hover:tw-ring-iron-600 disabled:tw-cursor-default disabled:tw-opacity-70`}
            data-tooltip-id={directMessageTooltipId}
          >
            {isDirectMessagePending ? (
              <CircleLoader size={CircleLoaderSize.SMALL} />
            ) : (
              <FontAwesomeIcon
                icon={faPaperPlane}
                className={DIRECT_MESSAGE_ICON_CLASSES[size]}
              />
            )}
          </button>
          <Tooltip
            id={directMessageTooltipId}
            place="top"
            offset={8}
            delayShow={250}
            opacity={1}
            positionStrategy="fixed"
            style={TOOLTIP_STYLES}
          >
            <span className="tw-text-xs">Direct Message</span>
          </Tooltip>
        </>
      )}
      <button
        onClick={onFollow}
        disabled={mutating || isInitialStatusLoading}
        type="button"
        aria-label={following ? "Unfollow" : "Follow"}
        className={`${FOLLOW_BTN_BUTTON_CLASSES[size]} ${followButtonStateClass} tw-flex tw-cursor-pointer tw-items-center tw-rounded-lg tw-border-0 tw-font-semibold tw-ring-1 tw-ring-inset tw-transition tw-duration-300 tw-ease-out`}
      >
        {mutating || isInitialStatusLoading ? (
          <CircleLoader size={FOLLOW_BTN_LOADER_SIZES[size]} />
        ) : following ? (
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
            className={FOLLOW_BTN_SVG_CLASSES[size]}
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
        <span className="tw-font-semibold">{label}</span>
      </button>
    </div>
  );
}

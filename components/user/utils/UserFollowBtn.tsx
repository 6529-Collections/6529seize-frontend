"use client";

import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useContext, useEffect, useState } from "react";
import { Tooltip } from "react-tooltip";

import { AuthContext } from "@/components/auth/Auth";
import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import {
  QueryKey,
  ReactQueryWrapperContext,
} from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiIdentitySubscriptionActions } from "@/generated/models/ApiIdentitySubscriptionActions";
import { ApiIdentitySubscriptionTargetAction } from "@/generated/models/ApiIdentitySubscriptionTargetAction";
import {
  commonApiDeleteWithBody,
  commonApiFetch,
  commonApiPost,
} from "@/services/api/common-api";


export enum UserFollowBtnSize {
  SMALL = "SMALL",
  MEDIUM = "MEDIUM",
}

export const FOLLOW_BTN_BUTTON_CLASSES: Record<UserFollowBtnSize, string> = {
  [UserFollowBtnSize.SMALL]: "tw-gap-x-1 tw-px-3 tw-py-2 tw-text-xs",
  [UserFollowBtnSize.MEDIUM]:
    "tw-gap-x-2 tw-px-3 md:tw-px-3.5 tw-py-2 md:tw-py-2.5 tw-text-sm",
};

export const FOLLOW_BTN_SVG_CLASSES: Record<UserFollowBtnSize, string> = {
  [UserFollowBtnSize.SMALL]: "tw-h-3 tw-w-3 md:tw-h-4 md:tw-w-4",
  [UserFollowBtnSize.MEDIUM]: "tw-h-4 tw-w-4 md:tw-h-5 md:tw-w-5",
};

export const FOLLOW_BTN_LOADER_SIZES: Record<
  UserFollowBtnSize,
  CircleLoaderSize
> = {
  [UserFollowBtnSize.SMALL]: CircleLoaderSize.SMALL,
  [UserFollowBtnSize.MEDIUM]: CircleLoaderSize.MEDIUM,
};

export default function UserFollowBtn({
  handle,
  size = UserFollowBtnSize.MEDIUM,
  onDirectMessage,
  directMessageLoading,
}: {
  readonly handle: string;
  readonly size?: UserFollowBtnSize | undefined;
  readonly onDirectMessage?: (() => void) | undefined;
  readonly directMessageLoading?: boolean | undefined;
}) {
  const { onIdentityFollowChange } = useContext(ReactQueryWrapperContext);
  const { setToast, requestAuth } = useContext(AuthContext);
  const [mutating, setMutating] = useState<boolean>(false);

  const { data: subscriptions, isFetching } =
    useQuery<ApiIdentitySubscriptionActions>({
      queryKey: [QueryKey.IDENTITY_FOLLOWING_ACTIONS, handle],
      queryFn: async () =>
        await commonApiFetch<ApiIdentitySubscriptionActions>({
          endpoint: `/identities/${handle}/subscriptions`,
        }),
    });

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

  return (
    <div className="tw-flex tw-items-center tw-gap-x-2">
      {onDirectMessage && following && (
        <>
          <button
            onClick={onDirectMessage}
            aria-label="Send direct message"
            className="tw-flex tw-cursor-pointer tw-items-center tw-rounded-lg tw-border-0 tw-bg-iron-800 tw-px-3 tw-py-3 tw-font-semibold tw-text-iron-300 tw-ring-1 tw-ring-inset tw-ring-iron-800 tw-transition tw-duration-300 tw-ease-out hover:tw-bg-iron-700 hover:tw-ring-iron-700"
            data-tooltip-id={`dm-${handle}`}
          >
            {directMessageLoading ? (
              <CircleLoader size={CircleLoaderSize.SMALL} />
            ) : (
              <FontAwesomeIcon icon={faPaperPlane} className="tw-h-4 tw-w-4" />
            )}
          </button>
          <Tooltip
            id={`dm-${handle}`}
            place="left"
            delayShow={250}
            style={{
              backgroundColor: "#1F2937",
              color: "white",
              padding: "4px 8px",
            }}
          >
            Direct Message
          </Tooltip>
        </>
      )}
      <button
        onClick={onFollow}
        disabled={mutating || isFetching}
        type="button"
        aria-label={following ? "Unfollow" : "Follow"}
        className={`${FOLLOW_BTN_BUTTON_CLASSES[size]} ${
          following
            ? "tw-bg-iron-800 tw-text-iron-300 tw-ring-iron-800 hover:tw-bg-iron-700 hover:tw-ring-iron-700"
            : "tw-bg-iron-200 tw-text-iron-950 tw-ring-white hover:tw-bg-iron-300 hover:tw-ring-iron-300"
        } tw-flex tw-cursor-pointer tw-items-center tw-rounded-lg tw-border-0 tw-font-semibold tw-ring-1 tw-ring-inset tw-transition tw-duration-300 tw-ease-out`}
      >
        {mutating || isFetching ? (
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
        <span>{label}</span>
      </button>
    </div>
  );
}

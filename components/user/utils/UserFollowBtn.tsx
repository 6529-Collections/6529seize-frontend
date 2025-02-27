import { useContext, useEffect, useState } from "react";
import {
  QueryKey,
  ReactQueryWrapperContext,
} from "../../react-query-wrapper/ReactQueryWrapper";
import { AuthContext } from "../../auth/Auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ApiIdentitySubscriptionActions } from "../../../generated/models/ApiIdentitySubscriptionActions";
import {
  commonApiDeleWithBody,
  commonApiFetch,
  commonApiPost,
} from "../../../services/api/common-api";
import { ApiIdentitySubscriptionTargetAction } from "../../../generated/models/ApiIdentitySubscriptionTargetAction";
import CircleLoader, {
  CircleLoaderSize,
} from "../../distribution-plan-tool/common/CircleLoader";
import { useAccount } from "wagmi";

export enum UserFollowBtnSize {
  SMALL = "SMALL",
  MEDIUM = "MEDIUM",
}

export default function UserFollowBtn({
  handle,
  size = UserFollowBtnSize.MEDIUM,
}: {
  readonly handle: string;
  readonly size?: UserFollowBtnSize;
}) {
  const BUTTON_CLASSES: Record<UserFollowBtnSize, string> = {
    [UserFollowBtnSize.SMALL]: "tw-gap-x-1 tw-px-2.5 tw-py-0.5 tw-text-xs",
    [UserFollowBtnSize.MEDIUM]: "tw-gap-x-2 tw-px-3.5 tw-py-2.5 tw-text-sm",
  };

  const SVG_CLASSES: Record<UserFollowBtnSize, string> = {
    [UserFollowBtnSize.SMALL]: "tw-h-4 tw-w-4",
    [UserFollowBtnSize.MEDIUM]: "tw-h-5 tw-w-5",
  };

  const LOADER_SIZES: Record<UserFollowBtnSize, CircleLoaderSize> = {
    [UserFollowBtnSize.SMALL]: CircleLoaderSize.SMALL,
    [UserFollowBtnSize.MEDIUM]: CircleLoaderSize.MEDIUM,
  };

  const { onIdentityFollowChange } = useContext(ReactQueryWrapperContext);
  const { setToast, requestAuth, connectedProfile } = useContext(AuthContext);
  const { address } = useAccount();
  const [mutating, setMutating] = useState<boolean>(false);
  
  // Check if this is the user's own profile
  const isOwnProfile = connectedProfile?.profile?.handle?.toLowerCase() === handle.toLowerCase();
  
  // Don't render the button if this is the user's own profile
  if (isOwnProfile) {
    return null;
  }
  
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
      // Prevent self-following
      if (isOwnProfile) {
        throw new Error("You cannot follow yourself");
      }
      
      // Additional check to prevent self-following
      if (connectedProfile?.profile?.handle?.toLowerCase() === handle.toLowerCase()) {
        throw new Error("You cannot follow yourself");
      }
      
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
      await commonApiDeleWithBody<
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
    // Prevent self-following
    if (isOwnProfile) {
      setToast({
        message: "You cannot follow yourself",
        type: "error",
      });
      return;
    }
    
    // Additional check to prevent self-following
    if (connectedProfile?.profile?.handle?.toLowerCase() === handle.toLowerCase()) {
      setToast({
        message: "You cannot follow yourself",
        type: "error",
      });
      return;
    }
    
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
    <button
      onClick={onFollow}
      disabled={mutating || isFetching}
      type="button"
      className={`${BUTTON_CLASSES[size]} ${
        following
          ? "tw-bg-iron-800 tw-ring-iron-800 tw-text-iron-300 hover:tw-bg-iron-700 hover:tw-ring-iron-700"
          : "tw-bg-primary-500 tw-ring-primary-500 hover:tw-bg-primary-600 hover:tw-ring-primary-600 tw-text-white"
      } tw-flex tw-items-center tw-cursor-pointer tw-rounded-lg tw-font-semibold tw-border-0 tw-ring-1 tw-ring-inset tw-transition tw-duration-300 tw-ease-out`}
    >
      {mutating || isFetching ? (
        <CircleLoader size={LOADER_SIZES[size]} />
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
          className={SVG_CLASSES[size]}
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

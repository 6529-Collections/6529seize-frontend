import { FC, useState, useContext, useEffect } from "react";
import { ApiProfileMin } from "../../../../generated/models/ApiProfileMin";
import { UserFollowBtnSize } from "../../../user/utils/UserFollowBtn";
import { useMutation, useQuery } from "@tanstack/react-query";
import CircleLoader, {
  CircleLoaderSize,
} from "../../../distribution-plan-tool/common/CircleLoader";
import {
  QueryKey,
  ReactQueryWrapperContext,
} from "../../../react-query-wrapper/ReactQueryWrapper";
import { AuthContext } from "../../../auth/Auth";
import { ApiIdentitySubscriptionActions } from "../../../../generated/models/ApiIdentitySubscriptionActions";
import {
  commonApiDeleWithBody,
  commonApiFetch,
  commonApiPost,
} from "../../../../services/api/common-api";
import { ApiIdentitySubscriptionTargetAction } from "../../../../generated/models/ApiIdentitySubscriptionTargetAction";

interface NotificationIdentitySubscribedFollowBtnProps {
  readonly profile: ApiProfileMin;
  readonly size?: UserFollowBtnSize;
}

const NotificationIdentitySubscribedFollowBtn: FC<
  NotificationIdentitySubscribedFollowBtnProps
> = ({ profile, size = UserFollowBtnSize.MEDIUM }) => {
  const BUTTON_CLASSES: Record<UserFollowBtnSize, string> = {
    [UserFollowBtnSize.SMALL]: "tw-gap-x-1 tw-px-2.5 tw-py-1.5 tw-text-xs",
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
  const { setToast, requestAuth } = useContext(AuthContext);
  const [mutating, setMutating] = useState<boolean>(false);

  const getFollowing = () => !!profile.subscribed_actions.length;
  const getLabel = () => (getFollowing() ? "Following" : "Follow");

  const [following, setFollowing] = useState<boolean>(getFollowing());
  const [label, setLabel] = useState<string>(getLabel());
  useEffect(() => {
    setFollowing(getFollowing());
    setLabel(getLabel());
  }, [profile.subscribed_actions]);

  const followMutation = useMutation({
    mutationFn: async () => {
      await commonApiPost<
        ApiIdentitySubscriptionActions,
        ApiIdentitySubscriptionActions
      >({
        endpoint: `identities/${profile.handle}/subscriptions`,
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
        endpoint: `identities/${profile.handle}/subscriptions`,
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
      <button
        onClick={onFollow}
        disabled={mutating}
        type="button"
        className={`${BUTTON_CLASSES[size]} ${
          following
            ? "tw-bg-iron-800 tw-ring-iron-800 tw-text-iron-300 hover:tw-bg-iron-700 hover:tw-ring-iron-700"
            : "tw-bg-primary-500 tw-ring-primary-500 hover:tw-bg-primary-600 hover:tw-ring-primary-600 tw-text-white"
        } tw-flex tw-items-center tw-cursor-pointer tw-rounded-lg tw-font-semibold tw-border-0 tw-ring-1 tw-ring-inset tw-transition tw-duration-300 tw-ease-out`}
      >
        {mutating ? (
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
    </div>
  );
};

export default NotificationIdentitySubscribedFollowBtn;

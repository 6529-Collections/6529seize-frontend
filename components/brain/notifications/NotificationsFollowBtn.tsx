"use client";

import { useAuth } from "@/components/auth/Auth";
import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import {
  FOLLOW_BTN_BUTTON_CLASSES,
  FOLLOW_BTN_LOADER_SIZES,
  UserFollowBtnSize,
} from "@/components/user/utils/UserFollowBtn";
import type { ApiIdentitySubscriptionActions } from "@/generated/models/ApiIdentitySubscriptionActions";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import {
  commonApiDeleteWithBody,
  commonApiPost,
} from "@/services/api/common-api";
import { useMutation } from "@tanstack/react-query";
import type { FC } from "react";
import { useContext, useState } from "react";
import {
  DEFAULT_SUBSCRIPTION_BODY,
  FollowBtnCheckIcon,
  FollowBtnPlusIcon,
} from "./notificationsFollowShared";

interface NotificationsFollowBtnProps {
  readonly profile: ApiProfileMin;
  readonly size?: UserFollowBtnSize | undefined;
  readonly followLabel?: string | undefined;
  readonly followingLabel?: string | undefined;
}

const NotificationsFollowBtn: FC<NotificationsFollowBtnProps> = ({
  profile,
  size = UserFollowBtnSize.MEDIUM,
  followLabel = "Follow",
  followingLabel = "Following",
}) => {
  const { onIdentityFollowChange } = useContext(ReactQueryWrapperContext);
  const { setToast, requestAuth } = useAuth();
  const [mutating, setMutating] = useState<boolean>(false);

  const handle = profile.handle?.trim();
  const following = profile.subscribed_actions.length > 0;
  const label = following ? followingLabel : followLabel;

  const followMutation = useMutation({
    mutationFn: async () => {
      if (!handle) {
        throw new Error("Missing profile handle.");
      }
      await commonApiPost<
        ApiIdentitySubscriptionActions,
        ApiIdentitySubscriptionActions
      >({
        endpoint: `identities/${handle}/subscriptions`,
        body: DEFAULT_SUBSCRIPTION_BODY,
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
      if (!handle) {
        throw new Error("Missing profile handle.");
      }
      await commonApiDeleteWithBody<
        ApiIdentitySubscriptionActions,
        ApiIdentitySubscriptionActions
      >({
        endpoint: `identities/${handle}/subscriptions`,
        body: DEFAULT_SUBSCRIPTION_BODY,
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
    if (!handle) {
      setToast({
        type: "error",
        title: "Couldn't follow this profile.",
        description: "This profile is missing a handle.",
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
    <div className="tw-flex tw-items-center tw-gap-x-2">
      <button
        onClick={onFollow}
        disabled={mutating}
        type="button"
        className={`${FOLLOW_BTN_BUTTON_CLASSES[size]} ${
          following
            ? "tw-bg-iron-800 tw-text-iron-300 tw-ring-iron-800 hover:tw-bg-iron-700 hover:tw-ring-iron-700"
            : "tw-bg-primary-500 tw-text-white tw-ring-primary-500 hover:tw-bg-primary-600 hover:tw-ring-primary-600"
        } tw-flex tw-cursor-pointer tw-items-center tw-rounded-lg tw-border-0 tw-font-semibold tw-ring-1 tw-ring-inset tw-transition tw-duration-300 tw-ease-out`}
      >
        {(() => {
          if (mutating)
            return <CircleLoader size={FOLLOW_BTN_LOADER_SIZES[size]} />;
          if (following) return <FollowBtnCheckIcon />;
          return <FollowBtnPlusIcon size={size} />;
        })()}
        <span>{label}</span>
      </button>
    </div>
  );
};

export default NotificationsFollowBtn;

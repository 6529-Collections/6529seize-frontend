"use client";

import { AuthContext } from "@/components/auth/Auth";
import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import {
  FOLLOW_BTN_BUTTON_CLASSES,
  FOLLOW_BTN_LOADER_SIZES,
  UserFollowBtnSize,
} from "@/components/user/utils/UserFollowBtn";
import type { ApiIdentitySubscriptionActions } from "@/generated/models/ApiIdentitySubscriptionActions";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
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
}

const NotificationsFollowBtn: FC<NotificationsFollowBtnProps> = ({
  profile,
  size = UserFollowBtnSize.MEDIUM,
}) => {
  const { onIdentityFollowChange } = useContext(ReactQueryWrapperContext);
  const { setToast, requestAuth } = useContext(AuthContext);
  const [mutating, setMutating] = useState<boolean>(false);

  const following = profile.subscribed_actions.length > 0;
  const label = following ? "Following" : "Follow";

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
      await commonApiDeleteWithBody<
        ApiIdentitySubscriptionActions,
        ApiIdentitySubscriptionActions
      >({
        endpoint: `identities/${profile.handle}/subscriptions`,
        body: DEFAULT_SUBSCRIPTION_BODY,
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
        className={`${FOLLOW_BTN_BUTTON_CLASSES[size]} ${
          following
            ? "tw-bg-iron-800 tw-text-iron-300 tw-ring-iron-800 hover:tw-bg-iron-700 hover:tw-ring-iron-700"
            : "tw-bg-primary-500 tw-text-white tw-ring-primary-500 hover:tw-bg-primary-600 hover:tw-ring-primary-600"
        } tw-flex tw-cursor-pointer tw-items-center tw-rounded-lg tw-border-0 tw-font-semibold tw-ring-1 tw-ring-inset tw-transition tw-duration-300 tw-ease-out`}
      >
        {mutating ? (
          <CircleLoader size={FOLLOW_BTN_LOADER_SIZES[size]} />
        ) : following ? (
          <FollowBtnCheckIcon />
        ) : (
          <FollowBtnPlusIcon size={size} />
        )}
        <span>{label}</span>
      </button>
    </div>
  );
};

export default NotificationsFollowBtn;

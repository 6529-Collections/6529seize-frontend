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
import { commonApiPost } from "@/services/api/common-api";
import type { FC } from "react";
import { useContext, useState } from "react";
import {
  DEFAULT_SUBSCRIPTION_BODY,
  FollowBtnCheckIcon,
  FollowBtnPlusIcon,
} from "./notificationsFollowShared";

interface NotificationsFollowAllBtnProps {
  readonly profiles: readonly ApiProfileMin[];
  readonly size?: UserFollowBtnSize | undefined;
}

const NotificationsFollowAllBtn: FC<NotificationsFollowAllBtnProps> = ({
  profiles,
  size = UserFollowBtnSize.SMALL,
}) => {
  const { onIdentityFollowChange } = useContext(ReactQueryWrapperContext);
  const { setToast, requestAuth } = useContext(AuthContext);
  const [mutating, setMutating] = useState(false);

  const toFollow = profiles.filter(
    (p) => p.handle && (p.subscribed_actions?.length ?? 0) === 0
  );
  const allFollowed = toFollow.length === 0;
  const label = allFollowed ? "Following All" : "Follow All";

  const onFollowAll = async (): Promise<void> => {
    if (allFollowed) return;
    setMutating(true);
    const { success } = await requestAuth();
    if (!success) {
      setMutating(false);
      return;
    }
    try {
      await Promise.all(
        toFollow.map((profile) =>
          commonApiPost<
            ApiIdentitySubscriptionActions,
            ApiIdentitySubscriptionActions
          >({
            endpoint: `identities/${profile.handle}/subscriptions`,
            body: DEFAULT_SUBSCRIPTION_BODY,
          })
        )
      );
      onIdentityFollowChange();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : String(error),
        type: "error",
      });
    } finally {
      setMutating(false);
    }
  };

  return (
    <div className="tw-flex tw-items-center tw-gap-x-2">
      <button
        onClick={onFollowAll}
        disabled={mutating || allFollowed}
        type="button"
        className={`${FOLLOW_BTN_BUTTON_CLASSES[size]} ${
          allFollowed
            ? "tw-cursor-default tw-bg-iron-800 tw-text-iron-300 tw-ring-iron-800"
            : "tw-cursor-pointer tw-bg-primary-500 tw-text-white tw-ring-primary-500 hover:tw-bg-primary-600 hover:tw-ring-primary-600"
        } tw-flex tw-items-center tw-rounded-lg tw-border-0 tw-font-semibold tw-ring-1 tw-ring-inset tw-transition tw-duration-300 tw-ease-out disabled:tw-opacity-70`}
      >
        {(() => {
          if (mutating)
            return <CircleLoader size={FOLLOW_BTN_LOADER_SIZES[size]} />;
          if (allFollowed) return <FollowBtnCheckIcon />;
          return <FollowBtnPlusIcon size={size} />;
        })()}
        <span>{label}</span>
      </button>
    </div>
  );
};

export default NotificationsFollowAllBtn;

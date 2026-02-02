"use client";

import type { FC } from "react";
import { useState, useContext } from "react";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import {
  FOLLOW_BTN_BUTTON_CLASSES,
  FOLLOW_BTN_LOADER_SIZES,
  FOLLOW_BTN_SVG_CLASSES,
  UserFollowBtnSize,
} from "@/components/user/utils/UserFollowBtn";
import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { AuthContext } from "@/components/auth/Auth";
import type { ApiIdentitySubscriptionActions } from "@/generated/models/ApiIdentitySubscriptionActions";
import { commonApiPost } from "@/services/api/common-api";
import { ApiIdentitySubscriptionTargetAction } from "@/generated/models/ApiIdentitySubscriptionTargetAction";

const SUBSCRIPTION_BODY: ApiIdentitySubscriptionActions = {
  actions: Object.values(ApiIdentitySubscriptionTargetAction).filter(
    (i) => i !== ApiIdentitySubscriptionTargetAction.DropVoted
  ),
};

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
            body: SUBSCRIPTION_BODY,
          })
        )
      );
      onIdentityFollowChange();
    } catch (error) {
      setToast({
        message: error as unknown as string,
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
            ? "tw-bg-iron-800 tw-ring-iron-800 tw-text-iron-300 tw-cursor-default"
            : "tw-bg-primary-500 tw-ring-primary-500 hover:tw-bg-primary-600 hover:tw-ring-primary-600 tw-text-white tw-cursor-pointer"
        } tw-flex tw-items-center tw-rounded-lg tw-font-semibold tw-border-0 tw-ring-1 tw-ring-inset tw-transition tw-duration-300 tw-ease-out disabled:tw-opacity-70`}>
        {mutating ? (
          <CircleLoader size={FOLLOW_BTN_LOADER_SIZES[size]} />
        ) : allFollowed ? (
          <svg
            className="tw-h-3 tw-w-3"
            width="17"
            height="15"
            viewBox="0 0 17 15"
            fill="none"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg">
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
            xmlns="http://www.w3.org/2000/svg">
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

export default NotificationsFollowAllBtn;

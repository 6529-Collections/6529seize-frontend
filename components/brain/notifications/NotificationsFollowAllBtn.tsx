"use client";

import { useAuth } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import {
  FOLLOW_BUTTON_SIZES,
  UserFollowBtnSize,
} from "@/components/user/utils/UserFollowBtn";
import Button from "@/components/utils/button/Button";
import type { ApiIdentitySubscriptionActions } from "@/generated/models/ApiIdentitySubscriptionActions";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import { commonApiPost } from "@/services/api/common-api";
import type { FC } from "react";
import { useContext, useMemo, useState } from "react";
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
  const { setToast, requestAuth } = useAuth();
  const [mutating, setMutating] = useState(false);

  const handlesToFollow = useMemo(() => {
    const seenHandles = new Set<string>();
    const handles: string[] = [];

    for (const profile of profiles) {
      const handle = profile.handle?.trim();
      if (!handle || profile.subscribed_actions.length > 0) {
        continue;
      }

      const normalizedHandle = handle.toLowerCase();
      if (seenHandles.has(normalizedHandle)) {
        continue;
      }

      seenHandles.add(normalizedHandle);
      handles.push(handle);
    }

    return handles;
  }, [profiles]);
  const allFollowed = handlesToFollow.length === 0;
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
      const results = await Promise.allSettled(
        handlesToFollow.map((handle) =>
          commonApiPost<
            ApiIdentitySubscriptionActions,
            ApiIdentitySubscriptionActions
          >({
            endpoint: `identities/${handle}/subscriptions`,
            body: DEFAULT_SUBSCRIPTION_BODY,
          })
        )
      );
      const hasFulfilled = results.some((r) => r.status === "fulfilled");
      const rejected = results.filter(
        (r): r is PromiseRejectedResult => r.status === "rejected"
      );
      if (hasFulfilled) onIdentityFollowChange();
      if (rejected.length > 0) {
        const messages = rejected.map((r) =>
          r.reason instanceof Error ? r.reason.message : String(r.reason)
        );
        setToast({
          message: messages.join("; "),
          type: "error",
        });
      }
    } finally {
      setMutating(false);
    }
  };

  return (
    <div className="tw-flex tw-items-center tw-gap-x-2">
      <Button
        onClick={onFollowAll}
        disabled={allFollowed}
        loading={mutating}
        hideChildrenWhenLoading
        variant={allFollowed ? "secondary" : "primary"}
        size={FOLLOW_BUTTON_SIZES[size]}
      >
        {allFollowed ? <FollowBtnCheckIcon /> : <FollowBtnPlusIcon size={size} />}
        <span>{label}</span>
      </Button>
    </div>
  );
};

export default NotificationsFollowAllBtn;

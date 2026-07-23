"use client";

import { useAuth } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { WAVE_DEFAULT_SUBSCRIPTION_ACTIONS } from "@/components/react-query-wrapper/utils/query-utils";
import {
  FOLLOW_BUTTON_SIZES,
  UserFollowBtnSize,
} from "@/components/user/utils/UserFollowBtn";
import Button from "@/components/utils/button/Button";
import type { ApiWaveSubscriptionActions } from "@/generated/models/ApiWaveSubscriptionActions";
import type { ApiWaveOverview } from "@/generated/models/ApiWaveOverview";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  commonApiDeleteWithBody,
  commonApiPost,
} from "@/services/api/common-api";
import { useMutation } from "@tanstack/react-query";
import { useContext, useState } from "react";
import {
  FollowBtnCheckIcon,
  FollowBtnPlusIcon,
} from "../notificationsFollowShared";

export default function NotificationWaveFollowBtn({
  wave,
  size = UserFollowBtnSize.SMALL,
  followLabel = t(DEFAULT_LOCALE, "notifications.waveFollowButton.join"),
  followingLabel = t(DEFAULT_LOCALE, "notifications.waveFollowButton.joined"),
}: {
  readonly wave: ApiWaveOverview;
  readonly size?: UserFollowBtnSize | undefined;
  readonly followLabel?: string | undefined;
  readonly followingLabel?: string | undefined;
}) {
  const { setToast, requestAuth } = useAuth();
  const { onWaveFollowChange } = useContext(ReactQueryWrapperContext);
  const [followingOverride, setFollowingOverride] = useState<boolean | null>(
    null
  );
  const [mutating, setMutating] = useState(false);
  const following =
    followingOverride ?? wave.context_profile_context?.subscribed ?? false;

  const followMutation = useMutation({
    mutationFn: async () => {
      await commonApiPost<
        ApiWaveSubscriptionActions,
        ApiWaveSubscriptionActions
      >({
        endpoint: `waves/${wave.id}/subscriptions`,
        body: {
          actions: WAVE_DEFAULT_SUBSCRIPTION_ACTIONS,
        },
      });
      await commonApiPost({
        endpoint: `notifications/wave-subscription/${wave.id}`,
        body: {},
      });
    },
    onSuccess: () => {
      setFollowingOverride(true);
      onWaveFollowChange({
        waveId: wave.id,
        following: true,
      });
    },
    onError: (error) => {
      setToast({
        type: "error",
        title: "Couldn't follow this wave.",
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
        ApiWaveSubscriptionActions,
        ApiWaveSubscriptionActions
      >({
        endpoint: `waves/${wave.id}/subscriptions`,
        body: {
          actions: WAVE_DEFAULT_SUBSCRIPTION_ACTIONS,
        },
      });
    },
    onSuccess: () => {
      setFollowingOverride(false);
      onWaveFollowChange({
        waveId: wave.id,
        following: false,
      });
    },
    onError: (error) => {
      setToast({
        type: "error",
        title: "Couldn't unfollow this wave.",
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

  const label = following ? followingLabel : followLabel;
  return (
    <div className="tw-flex tw-items-center tw-gap-x-2">
      <Button
        onClick={onFollow}
        loading={mutating}
        hideChildrenWhenLoading
        variant={following ? "secondary" : "primary"}
        size={FOLLOW_BUTTON_SIZES[size]}
      >
        {following ? <FollowBtnCheckIcon /> : <FollowBtnPlusIcon size={size} />}
        <span>{label}</span>
      </Button>
    </div>
  );
}

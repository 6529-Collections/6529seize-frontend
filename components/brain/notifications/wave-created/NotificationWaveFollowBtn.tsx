"use client";

import { useAuth } from "@/components/auth/Auth";
import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { WAVE_DEFAULT_SUBSCRIPTION_ACTIONS } from "@/components/react-query-wrapper/utils/query-utils";
import {
  FOLLOW_BTN_BUTTON_CLASSES,
  FOLLOW_BTN_LOADER_SIZES,
  UserFollowBtnSize,
} from "@/components/user/utils/UserFollowBtn";
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
  const icon = (() => {
    if (mutating) {
      return <CircleLoader size={FOLLOW_BTN_LOADER_SIZES[size]} />;
    }

    if (following) {
      return <FollowBtnCheckIcon />;
    }

    return <FollowBtnPlusIcon size={size} />;
  })();

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
        {icon}
        <span>{label}</span>
      </button>
    </div>
  );
}

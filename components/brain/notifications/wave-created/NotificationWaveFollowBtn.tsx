"use client";

import { WAVE_DEFAULT_SUBSCRIPTION_ACTIONS } from "@/components/react-query-wrapper/utils/query-utils";
import {
  FOLLOW_BUTTON_SIZES,
  UserFollowBtnSize,
} from "@/components/user/utils/UserFollowBtn";
import Button from "@/components/utils/button/Button";
import type { ApiWaveOverview } from "@/generated/models/ApiWaveOverview";
import { useWaveJoin } from "@/hooks/waves/useWaveJoin";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { useState } from "react";
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
  // Overview payloads carry membership as a flag; the local override keeps the
  // button current until the notification refetches.
  const [followingOverride, setFollowingOverride] = useState<boolean | null>(
    null
  );
  const following =
    followingOverride ?? wave.context_profile_context?.subscribed ?? false;
  const { isPending, join, leave } = useWaveJoin(
    {
      id: wave.id,
      subscribed_actions: following ? WAVE_DEFAULT_SUBSCRIPTION_ACTIONS : [],
    },
    { subscribeToAllDrops: true }
  );

  const onFollow = async (): Promise<void> => {
    const changed = await (following ? leave() : join());
    if (changed) {
      setFollowingOverride(!following);
    }
  };

  const label = following ? followingLabel : followLabel;
  return (
    <div className="tw-flex tw-items-center tw-gap-x-2">
      <Button
        onClick={onFollow}
        loading={isPending}
        hideChildrenWhenLoading
        variant={following ? "secondary" : "primary"}
        size={FOLLOW_BUTTON_SIZES[size]}
        aria-label={label}
      >
        {following ? <FollowBtnCheckIcon /> : <FollowBtnPlusIcon size={size} />}
        <span>{label}</span>
      </Button>
    </div>
  );
}

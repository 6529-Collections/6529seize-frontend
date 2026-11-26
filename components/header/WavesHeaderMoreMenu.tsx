"use client";

import ProfileWavesFeedIcon from "@/components/common/icons/ProfileWavesFeedIcon";
import ShareArrowIcon from "@/components/common/icons/ShareArrowIcon";
import type { CompactMenuItem } from "@/components/compact-menu";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import HeaderSearchButton from "./header-search/HeaderSearchButton";
import { useHeaderPageShare } from "./share/HeaderPageShareButton";
import { useScrollPositionContext } from "@/contexts/ScrollPositionContext";
import {
  PROFILE_WAVES_FEED_HREF,
  PROFILE_WAVES_FEED_SCROLL_KEY,
} from "@/helpers/waves/profile-feed-navigation";

export default function WavesHeaderMoreMenu({
  isCapacitor,
  showPageShareAction,
}: {
  readonly isCapacitor: boolean;
  readonly showPageShareAction: boolean;
}) {
  const locale = useBrowserLocale();
  const { setPosition } = useScrollPositionContext();
  const { isPending, sharePage } = useHeaderPageShare(isCapacitor);
  const items: CompactMenuItem[] = [
    {
      id: "profile-feed",
      label: t(locale, "waves.mobile.profileFeed.title"),
      href: PROFILE_WAVES_FEED_HREF,
      onSelect: () => setPosition(PROFILE_WAVES_FEED_SCROLL_KEY, 0),
      icon: <ProfileWavesFeedIcon />,
    },
  ];
  if (showPageShareAction) {
    items.push({
      id: "share-page",
      label: t(locale, "headerPageShare.trigger.ariaLabel"),
      icon: <ShareArrowIcon aria-hidden="true" className="tw-size-4" />,
      disabled: isPending,
      onSelect: () => void sharePage(),
      deferUntilClosed: true,
    });
  }
  return (
    <HeaderSearchButton
      wave={null}
      additionalMenuItems={items}
      morePresentation="sheet"
    />
  );
}

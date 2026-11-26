"use client";

import { useMyStream } from "@/contexts/wave/MyStreamContext";
import useIsMobileLayoutViewport from "@/hooks/useIsMobileLayoutViewport";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import Link from "next/link";
import React from "react";
import { getIconButtonClasses } from "@/components/utils/button/iconButtonStyles";
import { getIconButtonLayoutSurfaceClasses } from "@/components/utils/button/iconButtonLayouts";
import { useWaveFeatureUsage } from "@/hooks/useWaveFeatureUsage";
import { waveFeatureAttributes } from "@/services/analytics/waveFeatureUsage";
import ProfileWavesFeedIcon from "@/components/common/icons/ProfileWavesFeedIcon";

export const PROFILE_FEED_TOOLTIP_ID = "profile-feed-shortcut-tooltip";

function isModifiedClick(event: React.MouseEvent<HTMLAnchorElement>) {
  return (
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    event.button === 1 ||
    event.button === 2
  );
}

export function WebProfileFeedShortcut({
  basePath,
  isCollapsed,
  mobile = false,
}: {
  readonly basePath: string;
  readonly isCollapsed: boolean;
  readonly mobile?: boolean;
}) {
  const { activeWave } = useMyStream();
  const { ref: featureUsageRef } = useWaveFeatureUsage("sidebar");
  const locale = useBrowserLocale();
  const isMobileLayoutViewport = useIsMobileLayoutViewport();
  const opensMobileFeed = mobile || isMobileLayoutViewport;
  const href = opensMobileFeed ? `${basePath}?view=profile-feed` : basePath;
  const isActive = activeWave.id === null && !opensMobileFeed;
  const profileFeedLabel = t(locale, "waves.mobile.profileFeed.title");

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (opensMobileFeed || event.defaultPrevented || isModifiedClick(event)) {
      return;
    }

    event.preventDefault();
    activeWave.set(null, { isDirectMessage: false });
  };

  if (isCollapsed) {
    return (
      <div className="tw-flex tw-h-11 tw-shrink-0 tw-items-center tw-justify-center">
        <Link
          href={href}
          ref={featureUsageRef}
          {...waveFeatureAttributes("sidebar_entry", "profile_feed")}
          prefetch={false}
          onClick={handleClick}
          aria-label={profileFeedLabel}
          aria-current={isActive ? "page" : undefined}
          className={getIconButtonClasses({ layout: "toolbar-filled" })}
          data-tooltip-id={PROFILE_FEED_TOOLTIP_ID}
          data-tooltip-content={t(locale, "waves.sidebar.openProfileFeed")}
        >
          <span className={getIconButtonLayoutSurfaceClasses("toolbar-filled")}>
            <ProfileWavesFeedIcon />
          </span>
        </Link>
      </div>
    );
  }

  return (
    <Link
      href={href}
      ref={featureUsageRef}
      {...waveFeatureAttributes("sidebar_entry", "profile_feed")}
      prefetch={false}
      onClick={handleClick}
      aria-label={profileFeedLabel}
      aria-current={isActive ? "page" : undefined}
      className={getIconButtonClasses({ layout: "toolbar" })}
      data-tooltip-id={PROFILE_FEED_TOOLTIP_ID}
      data-tooltip-content={t(locale, "waves.sidebar.openProfileFeed")}
    >
      <span className={getIconButtonLayoutSurfaceClasses("toolbar")}>
        <ProfileWavesFeedIcon />
      </span>
    </Link>
  );
}

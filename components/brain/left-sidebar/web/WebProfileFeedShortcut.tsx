"use client";

import { useMyStream } from "@/contexts/wave/MyStreamContext";
import { SidebarIconTile } from "../waves/SidebarIconTile";
import useIsMobileLayoutViewport from "@/hooks/useIsMobileLayoutViewport";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import Link from "next/link";
import React from "react";
import {
  WAVE_HEADER_ACTION_CLASSES,
  WAVE_HEADER_ACTION_SURFACE_CLASSES,
} from "../waves/WaveHeaderActions";
import { useWaveFeatureUsage } from "@/hooks/useWaveFeatureUsage";
import { waveFeatureAttributes } from "@/services/analytics/waveFeatureUsage";

export const PROFILE_FEED_TOOLTIP_ID = "profile-feed-shortcut-tooltip";

function MasonryGridIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="tw-size-4 tw-flex-shrink-0"
    >
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  );
}

function ProfileFeedAvatar({ isActive }: { readonly isActive: boolean }) {
  return (
    <div className="tw-relative tw-size-8 tw-flex-shrink-0">
      <SidebarIconTile variant={isActive ? "selected" : "neutral"}>
        <MasonryGridIcon />
      </SidebarIconTile>
    </div>
  );
}

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
      <div
        className={`tw-group tw-flex tw-items-center tw-justify-center tw-py-2 tw-transition-all tw-duration-200 tw-ease-out ${
          isActive
            ? "tw-bg-iron-700/60 desktop-hover:hover:tw-bg-iron-700/70"
            : "desktop-hover:hover:tw-bg-iron-900/70"
        }`}
      >
        <Link
          href={href}
          ref={featureUsageRef}
          {...waveFeatureAttributes("sidebar_entry", "profile_feed")}
          prefetch={false}
          onClick={handleClick}
          aria-label={profileFeedLabel}
          aria-current={isActive ? "page" : undefined}
          className="tw-flex tw-items-center tw-justify-center tw-no-underline"
          data-tooltip-id={PROFILE_FEED_TOOLTIP_ID}
          data-tooltip-content={t(locale, "waves.sidebar.openProfileFeed")}
        >
          <ProfileFeedAvatar isActive={isActive} />
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
      className={`${WAVE_HEADER_ACTION_CLASSES} ${isActive ? "tw-text-primary-300" : "tw-text-iron-300"}`}
      data-tooltip-id={PROFILE_FEED_TOOLTIP_ID}
      data-tooltip-content={t(locale, "waves.sidebar.openProfileFeed")}
    >
      <span className={WAVE_HEADER_ACTION_SURFACE_CLASSES}>
        <MasonryGridIcon />
      </span>
    </Link>
  );
}

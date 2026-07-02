"use client";

import { useMyStream } from "@/contexts/wave/MyStreamContext";
import Link from "next/link";
import React from "react";

export const PROFILE_FEED_TOOLTIP_ID = "profile-feed-shortcut-tooltip";

const PROFILE_FEED_LABEL = "Profile Waves Feed";

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
    <div
      className={`tw-relative tw-size-8 tw-rounded-full tw-border tw-border-solid tw-transition tw-duration-200 desktop-hover:group-hover:tw-brightness-110 ${
        isActive
          ? "tw-border-primary-300/75 tw-opacity-100"
          : "tw-border-iron-700/80 tw-opacity-90 desktop-hover:group-hover:tw-border-iron-500/80 desktop-hover:group-hover:tw-opacity-100"
      }`}
    >
      <div
        className={`tw-h-full tw-w-full tw-rounded-full ${
          isActive ? "tw-bg-primary-500/90" : "tw-bg-iron-900"
        }`}
      />
      <div
        className={`tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center ${
          isActive ? "tw-text-primary-50" : "tw-text-iron-400"
        }`}
      >
        <MasonryGridIcon />
      </div>
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
}: {
  readonly basePath: string;
  readonly isCollapsed: boolean;
}) {
  const { activeWave } = useMyStream();
  const isActive = activeWave.id === null;

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented || isModifiedClick(event)) {
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
            : "desktop-hover:hover:tw-bg-iron-800/70"
        }`}
      >
        <Link
          href={basePath}
          prefetch={false}
          onClick={handleClick}
          aria-label={PROFILE_FEED_LABEL}
          aria-current={isActive ? "page" : undefined}
          className="tw-flex tw-items-center tw-justify-center tw-no-underline"
          data-tooltip-id={PROFILE_FEED_TOOLTIP_ID}
          data-tooltip-content={PROFILE_FEED_LABEL}
        >
          <ProfileFeedAvatar isActive={isActive} />
        </Link>
      </div>
    );
  }

  return (
    <div
      className={`tw-group tw-mt-2 tw-flex tw-items-center tw-gap-x-4 tw-px-5 tw-py-2 tw-transition-all tw-duration-200 tw-ease-out ${
        isActive
          ? "tw-bg-iron-700/60 desktop-hover:hover:tw-bg-iron-700/70"
          : "desktop-hover:hover:tw-bg-iron-800/80"
      }`}
    >
      <Link
        href={basePath}
        prefetch={false}
        onClick={handleClick}
        aria-current={isActive ? "page" : undefined}
        className={`tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-space-x-3 tw-py-1 tw-no-underline tw-transition-all tw-duration-200 tw-ease-out ${
          isActive
            ? "tw-font-medium tw-text-white desktop-hover:group-hover:tw-text-white"
            : "tw-font-normal tw-text-iron-400 desktop-hover:group-hover:tw-text-iron-300"
        }`}
      >
        <ProfileFeedAvatar isActive={isActive} />
        <div className="tw-min-w-0 tw-flex-1">
          <div className="tw-truncate tw-text-sm">{PROFILE_FEED_LABEL}</div>
        </div>
      </Link>
    </div>
  );
}

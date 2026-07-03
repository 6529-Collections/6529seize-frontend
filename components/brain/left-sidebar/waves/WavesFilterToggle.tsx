"use client";

import React from "react";
import { useAuth } from "@/components/auth/Auth";
import { useShowFollowingWaves } from "@/hooks/useShowFollowingWaves";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

// Pure helper function for authentication state logic (testable)
const checkConnectedIdentity = (
  connectedHandle: string | null | undefined,
  activeProfileProxy: unknown
): boolean => {
  return (
    connectedHandle !== null &&
    connectedHandle !== undefined &&
    (activeProfileProxy === null || activeProfileProxy === undefined)
  );
};

/**
 * WavesFilterToggle component that renders an app-like button group to filter waves.
 * Shows "All" and "Joined" options in a segmented control style.
 * Only renders when the user is authenticated with a connected identity (not using a proxy).
 * Uses localStorage to persist the toggle state across sessions.
 *
 * @returns JSX element containing the button group toggle, or null if user is not authenticated or on error
 */
const WavesFilterToggle = (): React.JSX.Element | null => {
  // Hooks must be called unconditionally at the top level
  const followingHookResult = useShowFollowingWaves();
  const authResult = useAuth();

  // Extract data before any early returns
  const [following, setFollowing] = followingHookResult;
  const { connectedProfile, activeProfileProxy } = authResult;

  // Check authentication state using pure helper function - hook must be called before any returns
  const connectedHandle = connectedProfile?.handle;
  const isConnectedIdentity = checkConnectedIdentity(
    connectedHandle,
    activeProfileProxy
  );

  // Early return for non-authenticated users
  if (!isConnectedIdentity) {
    return null;
  }

  const getButtonClassName = (isActive: boolean) => {
    const baseClass =
      "tw-inline-flex tw-h-6 tw-items-center tw-justify-center tw-rounded-md tw-border-0 tw-px-2.5 tw-text-xs tw-font-medium tw-leading-none tw-transition tw-duration-300 tw-ease-out";

    if (isActive) {
      return `${baseClass} tw-bg-iron-800 tw-text-iron-50`;
    }

    return `${baseClass} tw-text-iron-400 desktop-hover:hover:tw-text-iron-300 tw-bg-iron-950`;
  };

  const filterLabel = t(DEFAULT_LOCALE, "waves.sidebar.filterAriaLabel");

  return (
    <fieldset className="tw-m-0 tw-flex tw-h-8 tw-min-w-0 tw-items-center tw-overflow-hidden tw-whitespace-nowrap tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-p-1 tw-text-xs">
      <legend className="tw-sr-only">{filterLabel}</legend>
      <button
        type="button"
        aria-pressed={!following}
        className={getButtonClassName(!following)}
        onClick={() => setFollowing(false)}
      >
        {t(DEFAULT_LOCALE, "waves.sidebar.filterAll")}
      </button>
      <button
        type="button"
        aria-pressed={following}
        className={getButtonClassName(following)}
        onClick={() => setFollowing(true)}
      >
        {t(DEFAULT_LOCALE, "waves.sidebar.filterJoined")}
      </button>
    </fieldset>
  );
};

WavesFilterToggle.displayName = "WavesFilterToggle";
export default WavesFilterToggle;

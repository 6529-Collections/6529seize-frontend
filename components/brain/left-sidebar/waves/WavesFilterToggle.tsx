"use client";

import React, { useMemo } from "react";
import { useShowFollowingWaves } from "../../../../hooks/useShowFollowingWaves";
import { useAuth } from "../../../auth/Auth";

// Pure helper function for authentication state logic (testable)
const checkConnectedIdentity = (connectedHandle: string | null | undefined, activeProfileProxy: unknown): boolean => {
  return !!connectedHandle && !activeProfileProxy;
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
  const [following, setFollowing] = followingHookResult || [false, () => {}];
  const { connectedProfile, activeProfileProxy } = authResult || {};

  // Check authentication state using pure helper function - hook must be called before any returns
  const connectedHandle = connectedProfile?.handle;
  const isConnectedIdentity = useMemo(() => {
    return checkConnectedIdentity(connectedHandle, activeProfileProxy);
  }, [connectedHandle, activeProfileProxy]);

  // Safe extraction with fallbacks - return early if hooks failed
  if (!followingHookResult) {
    console.warn('[WavesFilterToggle] useShowFollowingWaves hook failed - component will not render', {
      component: 'WavesFilterToggle',
      error: 'hook_failure',
      hook: 'useShowFollowingWaves'
    });
    return null;
  }

  // Early return for non-authenticated users
  if (!isConnectedIdentity) {
    return null;
  }

  const getButtonClassName = (isActive: boolean) => {
    const baseClass =
      "tw-px-2.5 tw-py-1 tw-border-0 tw-rounded-md tw-transition tw-duration-300 tw-ease-out tw-text-xs tw-font-medium";

    if (isActive) {
      return `${baseClass} tw-bg-iron-800 tw-text-iron-50`;
    }

    return `${baseClass} tw-text-iron-400 desktop-hover:hover:tw-text-iron-300 tw-bg-iron-950`;
  };

  // Render the button group toggle with error boundary for rendering issues
  try {
    return (
      <div className="tw-flex tw-items-center tw-whitespace-nowrap tw-h-8 tw-px-1 tw-text-xs tw-border tw-border-iron-700 tw-border-solid tw-rounded-lg tw-overflow-hidden tw-bg-iron-950">
        <button
          className={getButtonClassName(!following)}
          onClick={() => setFollowing(false)}
        >
          All
        </button>
        <button
          className={getButtonClassName(following)}
          onClick={() => setFollowing(true)}
        >
          Joined
        </button>
      </div>
    );
  } catch (error) {
    console.warn('[WavesFilterToggle] Rendering error occurred', {
      component: 'WavesFilterToggle',
      error: 'rendering_failure',
      errorMessage: error instanceof Error ? error.message : String(error),
      following,
      connectedHandle: !!connectedHandle
    });
    return null;
  }
};

WavesFilterToggle.displayName = "WavesFilterToggle";
export default WavesFilterToggle;
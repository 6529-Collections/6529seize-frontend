"use client";

import React, { useMemo } from "react";
import CommonSwitch from "../../../utils/switch/CommonSwitch";
import { useShowFollowingWaves } from "../../../../hooks/useShowFollowingWaves";
import { useAuth } from "../../../auth/Auth";

// Pure helper function for authentication state logic (testable)
const checkConnectedIdentity = (connectedHandle: string | null | undefined, activeProfileProxy: unknown): boolean => {
  return !!connectedHandle && !activeProfileProxy;
};

/**
 * JoinedToggle component that renders a switch to filter waves by joined status.
 * Only renders when the user is authenticated with a connected identity (not using a proxy).
 * Uses localStorage to persist the toggle state across sessions.
 * 
 * @returns JSX element containing the toggle switch, or null if user is not authenticated or on error
 */
const JoinedToggle = (): React.JSX.Element | null => {
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
    console.warn('[JoinedToggle] useShowFollowingWaves hook failed - component will not render', {
      component: 'JoinedToggle',
      error: 'hook_failure',
      hook: 'useShowFollowingWaves'
    });
    return null;
  }

  // Early return for non-authenticated users
  if (!isConnectedIdentity) {
    return null;
  }

  // Render the toggle with error boundary for rendering issues
  try {
    return <CommonSwitch label="Joined" isOn={following} setIsOn={setFollowing} />;
  } catch (error) {
    console.warn('[JoinedToggle] Rendering error occurred', {
      component: 'JoinedToggle',
      error: 'rendering_failure',
      errorMessage: error instanceof Error ? error.message : String(error),
      following,
      connectedHandle: !!connectedHandle
    });
    return null;
  }
};

JoinedToggle.displayName = "JoinedToggle";
export default JoinedToggle;
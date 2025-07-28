"use client";

import React, { useMemo } from "react";
import CommonSwitch from "../../../utils/switch/CommonSwitch";
import { useShowFollowingWaves } from "../../../../hooks/useShowFollowingWaves";
import { useAuth } from "../../../auth/Auth";

/**
 * JoinedToggle component that renders a switch to filter waves by joined status.
 * Only renders when the user is authenticated with a connected identity (not using a proxy).
 * Uses localStorage to persist the toggle state across sessions.
 * 
 * @returns JSX element containing the toggle switch, or null if user is not authenticated or on error
 */
const JoinedToggle = () => {
  try {
    const followingHookResult = useShowFollowingWaves();
    const authResult = useAuth();

    // Safe extraction with fallbacks
    const [following, setFollowing] = followingHookResult || [false, (_: boolean) => {}];
    const { connectedProfile, activeProfileProxy } = authResult || {};

    const isConnectedIdentity = useMemo(() => {
      try {
        return !!connectedProfile?.handle && !activeProfileProxy;
      } catch (error) {
        console.warn("Error checking connected identity:", error);
        return false;
      }
    }, [connectedProfile?.handle, activeProfileProxy]);

    if (!isConnectedIdentity) {
      return null;
    }

    return <CommonSwitch label="Joined" isOn={following} setIsOn={setFollowing} />;
  } catch (error) {
    console.warn("JoinedToggle component error:", error);
    return null;
  }
};

JoinedToggle.displayName = "JoinedToggle";
export default JoinedToggle;
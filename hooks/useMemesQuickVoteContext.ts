"use client";

import { useAuth } from "@/components/auth/Auth";
import { useSeizeSettings } from "@/contexts/SeizeSettingsContext";
import { useWavesWritesPaused } from "@/hooks/useWavesMovePhase";
import { useMemo } from "react";

export const useMemesQuickVoteContext = () => {
  const { connectedProfile, activeProfileProxy } = useAuth();
  const { seizeSettings, isLoaded } = useSeizeSettings();
  // Quick vote only casts votes, which are paused for the move to the 6529
  // Network.
  const wavesWritesPaused = useWavesWritesPaused();

  const contextProfile = useMemo(() => {
    const normalizedHandle = connectedProfile?.handle?.trim();
    return normalizedHandle ?? null;
  }, [connectedProfile?.handle]);

  const memesWaveId = seizeSettings.memes_wave_id ?? null;
  const isEnabled =
    isLoaded &&
    typeof memesWaveId === "string" &&
    memesWaveId.length > 0 &&
    typeof contextProfile === "string" &&
    contextProfile.length > 0 &&
    activeProfileProxy === null &&
    !wavesWritesPaused;

  return {
    contextProfile,
    isEnabled,
    isLoaded,
    memesWaveId,
    proxyId: activeProfileProxy?.id ?? null,
  };
};

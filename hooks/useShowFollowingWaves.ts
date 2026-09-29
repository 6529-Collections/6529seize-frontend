"use client";

import { useCallback } from "react";
import { useWaveSidebarCollection } from "./useWaveSidebarCollection";

/** Compatibility adapter for the followed-wave data source. */
export function useShowFollowingWaves(): [boolean, (value: boolean) => void] {
  const [collection, setCollection] = useWaveSidebarCollection();
  const setFollowing = useCallback(
    (value: boolean) => setCollection(value ? "joined" : "all"),
    [setCollection]
  );
  return [collection === "joined", setFollowing];
}

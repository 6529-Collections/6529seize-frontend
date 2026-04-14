"use client";

import useLocalPreference from "@/hooks/useLocalPreference";
import { useCallback } from "react";

export type ProfileCurationViewMode = "masonry" | "list";

const isProfileCurationViewMode = (
  value: unknown
): value is ProfileCurationViewMode => value === "masonry" || value === "list";

export function useProfileCurationViewMode(key: string) {
  const [viewMode, setViewMode] = useLocalPreference<ProfileCurationViewMode>(
    `profile-curation-view:${key}`,
    "masonry",
    isProfileCurationViewMode
  );

  const toggleViewMode = useCallback(() => {
    setViewMode(viewMode === "masonry" ? "list" : "masonry");
  }, [setViewMode, viewMode]);

  return { viewMode, setViewMode, toggleViewMode };
}

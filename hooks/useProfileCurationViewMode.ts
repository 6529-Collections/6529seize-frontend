"use client";

import { useCallback, useState } from "react";

type ProfileCurationViewMode = "masonry" | "list";

export function useProfileCurationViewMode() {
  const [viewMode, setViewMode] = useState<ProfileCurationViewMode>("masonry");

  const toggleViewMode = useCallback(() => {
    setViewMode(viewMode === "masonry" ? "list" : "masonry");
  }, [setViewMode, viewMode]);

  return { viewMode, setViewMode, toggleViewMode };
}

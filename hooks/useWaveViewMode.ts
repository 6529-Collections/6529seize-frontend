"use client";

import { useState, useEffect, useCallback } from "react";

export type WaveViewMode = "chat" | "gallery";

const STORAGE_KEY = "waveViewModes";

type WaveViewModes = Record<string, WaveViewMode>;

export function useWaveViewMode(waveId: string) {
  const [allModes, setAllModes] = useState<WaveViewModes>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? (JSON.parse(stored) as WaveViewModes) : {};
      } catch {
        return {};
      }
    }
    return {};
  });

  const viewMode: WaveViewMode = allModes[waveId] ?? "chat";

  const setViewMode = useCallback(
    (mode: WaveViewMode | ((prev: WaveViewMode) => WaveViewMode)) => {
      setAllModes((prev) => {
        const current = prev[waveId] ?? "chat";
        const next = typeof mode === "function" ? mode(current) : mode;

        return { ...prev, [waveId]: next };
      });
    },
    [waveId]
  );

  const toggleViewMode = useCallback(() => {
    setViewMode((prev) => (prev === "chat" ? "gallery" : "chat"));
  }, [setViewMode]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allModes));
    } catch (e) {
      console.warn("Error saving wave view modes to localStorage:", e);
    }
  }, [allModes]);

  return { viewMode, setViewMode, toggleViewMode };
}

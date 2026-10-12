"use client";

import { useSeizeSettingsOptional } from "@/contexts/SeizeSettingsContext";
import { parseConsolidationPolicy } from "@/helpers/consolidationPolicy";
import { useMemo } from "react";

export function useConsolidationPolicy() {
  const settings = useSeizeSettingsOptional();
  const value = settings?.seizeSettings.consolidation;
  const available = settings?.isLoaded && !settings.loadError;
  const policy = useMemo(
    () => (available ? parseConsolidationPolicy(value) : null),
    [available, value]
  );
  return {
    policy,
    isLoading: !!settings && !settings.isLoaded && !settings.loadError,
    reload: settings?.loadSeizeSettings,
  };
}

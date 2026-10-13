"use client";

import { useSeizeSettingsOptional } from "@/contexts/SeizeSettingsContext";
import {
  parseConsolidationLimits,
  parseConsolidationPolicy,
} from "@/helpers/consolidationPolicy";
import { useMemo } from "react";

export function useConsolidationPolicy() {
  const settings = useSeizeSettingsOptional();
  const value = settings?.seizeSettings.consolidation;
  const available = settings?.isLoaded && !settings.loadError;
  // Keep successfully loaded limits during a failed background refresh.
  // Signing above the ungated boundary still requires a healthy policy read.
  const limitsAvailable = settings?.isLoaded;
  const limits = useMemo(
    () => (limitsAvailable ? parseConsolidationLimits(value) : null),
    [limitsAvailable, value]
  );
  const policy = useMemo(
    () => (available ? parseConsolidationPolicy(value) : null),
    [available, value]
  );
  return {
    policy,
    limits,
    isLoading: !!settings && !settings.isLoaded && !settings.loadError,
    reload: settings?.loadSeizeSettings,
  };
}

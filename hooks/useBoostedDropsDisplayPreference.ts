"use client";

import useLocalPreference from "@/hooks/useLocalPreference";
import {
  DEFAULT_BOOSTED_DROPS_DISPLAY_PREFERENCE,
  isBoostedDropsDisplayPreference,
  type BoostedDropsDisplayPreference,
} from "@/types/boosted-drops.types";

export const BOOSTED_DROPS_DISPLAY_PREFERENCE_KEY =
  "waveChatBoostedDropsDisplayPreference";

export function useBoostedDropsDisplayPreference(): [
  BoostedDropsDisplayPreference,
  (preference: BoostedDropsDisplayPreference) => void,
] {
  return useLocalPreference<BoostedDropsDisplayPreference>(
    BOOSTED_DROPS_DISPLAY_PREFERENCE_KEY,
    DEFAULT_BOOSTED_DROPS_DISPLAY_PREFERENCE,
    isBoostedDropsDisplayPreference
  );
}

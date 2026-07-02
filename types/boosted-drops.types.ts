export enum TimeWindow {
  DAY = "DAY",
  WEEK = "WEEK",
  MONTH = "MONTH",
}

export const TIME_WINDOW_MS: Record<TimeWindow, number> = {
  [TimeWindow.DAY]: 24 * 60 * 60 * 1000,
  [TimeWindow.WEEK]: 7 * 24 * 60 * 60 * 1000,
  [TimeWindow.MONTH]: 30 * 24 * 60 * 60 * 1000,
};

export const BOOSTED_DROPS_DISPLAY_PREFERENCES = [
  "expanded",
  "compact",
  "hidden",
] as const;

export type BoostedDropsDisplayPreference =
  (typeof BOOSTED_DROPS_DISPLAY_PREFERENCES)[number];

export const DEFAULT_BOOSTED_DROPS_DISPLAY_PREFERENCE =
  "compact" satisfies BoostedDropsDisplayPreference;

export const isBoostedDropsDisplayPreference = (
  value: unknown
): value is BoostedDropsDisplayPreference =>
  typeof value === "string" &&
  BOOSTED_DROPS_DISPLAY_PREFERENCES.includes(
    value as BoostedDropsDisplayPreference
  );

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

export const TIME_WINDOW_LABELS: Record<TimeWindow, string> = {
  [TimeWindow.DAY]: "Day",
  [TimeWindow.WEEK]: "Week",
  [TimeWindow.MONTH]: "Month",
};

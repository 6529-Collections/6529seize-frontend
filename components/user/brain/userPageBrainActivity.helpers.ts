import { numberWithCommas } from "@/helpers/Helpers";
import { Time } from "@/helpers/time";

const DAY_MS = Time.days(1).toMillis();
const WEEKDAY_COUNT = 7;
const MONTH_LABEL_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  timeZone: "UTC",
});
const DAY_LABEL_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export interface UserPageBrainActivityResponse {
  readonly last_date: string;
  readonly date_samples: readonly number[];
}

export type UserPageBrainActivityCellState = "padding" | "empty" | "active";
export type UserPageBrainActivityIntensity = 0 | 1 | 2 | 3 | 4;

export interface UserPageBrainActivityCell {
  readonly key: string;
  readonly isoDate: string | null;
  readonly count: number;
  readonly title: string | null;
  readonly ariaLabel: string | null;
  readonly state: UserPageBrainActivityCellState;
  readonly intensity: UserPageBrainActivityIntensity;
}

export interface UserPageBrainActivityMonthLabel {
  readonly key: string;
  readonly label: string;
  readonly column: number;
}

export interface UserPageBrainActivityViewModel {
  readonly totalDrops: number;
  readonly maxCount: number;
  readonly weekCount: number;
  readonly monthLabels: readonly UserPageBrainActivityMonthLabel[];
  readonly cells: readonly UserPageBrainActivityCell[];
}

function parseUtcDate(value: string): Date | null {
  const [dayPart, monthPart, yearPart] = value.split(".");
  const day = Number(dayPart);
  const month = Number(monthPart);
  const year = Number(yearPart);

  if (
    !Number.isInteger(day) ||
    !Number.isInteger(month) ||
    !Number.isInteger(year) ||
    day <= 0 ||
    month <= 0 ||
    month > 12
  ) {
    return null;
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getCountLabel(count: number): string {
  return count === 1 ? "1 drop" : `${numberWithCommas(count)} drops`;
}

function getIntensity(
  count: number,
  maxCount: number
): UserPageBrainActivityIntensity {
  if (count <= 0 || maxCount <= 0) {
    return 0;
  }

  const ratio = count / maxCount;
  if (ratio <= 0.25) {
    return 1;
  }
  if (ratio <= 0.5) {
    return 2;
  }
  if (ratio <= 0.75) {
    return 3;
  }

  return 4;
}

export function buildUserPageBrainActivityViewModel(
  activity: UserPageBrainActivityResponse
): UserPageBrainActivityViewModel | null {
  if (
    !Array.isArray(activity.date_samples) ||
    activity.date_samples.length === 0
  ) {
    return null;
  }

  const lastDate = parseUtcDate(activity.last_date);
  if (!lastDate) {
    return null;
  }

  const normalizedSamples = activity.date_samples.map((sample) =>
    typeof sample === "number" && Number.isFinite(sample) && sample >= 0
      ? Math.floor(sample)
      : 0
  );
  const startMs =
    lastDate.getTime() - (normalizedSamples.length - 1) * DAY_MS;
  const totalDrops = normalizedSamples.reduce((sum, count) => sum + count, 0);
  const maxCount = normalizedSamples.reduce(
    (highest, count) => Math.max(highest, count),
    0
  );
  const startDate = new Date(startMs);
  const leadingPaddingCount = startDate.getUTCDay();
  const trailingPaddingCount =
    (WEEKDAY_COUNT -
      ((leadingPaddingCount + normalizedSamples.length) % WEEKDAY_COUNT)) %
    WEEKDAY_COUNT;
  const monthLabels: UserPageBrainActivityMonthLabel[] = [];
  const seenMonths = new Set<string>();

  const cells: UserPageBrainActivityCell[] = Array.from(
    { length: leadingPaddingCount },
    (_, index) => ({
      key: `padding-start-${index}`,
      isoDate: null,
      count: 0,
      title: null,
      ariaLabel: null,
      state: "padding",
      intensity: 0,
    })
  );

  normalizedSamples.forEach((count, index) => {
    const date = new Date(startMs + index * DAY_MS);
    const isoDate = toIsoDate(date);
    const monthKey = `${date.getUTCFullYear()}-${date.getUTCMonth()}`;
    const weekIndex = Math.floor((leadingPaddingCount + index) / WEEKDAY_COUNT);

    if (date.getUTCDate() === 1 && !seenMonths.has(monthKey)) {
      seenMonths.add(monthKey);
      monthLabels.push({
        key: `month-${monthKey}`,
        label: MONTH_LABEL_FORMATTER.format(date),
        column: weekIndex,
      });
    }

    const title = `${DAY_LABEL_FORMATTER.format(date)}: ${getCountLabel(count)}`;
    cells.push({
      key: isoDate,
      isoDate,
      count,
      title,
      ariaLabel: title,
      state: count > 0 ? "active" : "empty",
      intensity: getIntensity(count, maxCount),
    });
  });

  for (let index = 0; index < trailingPaddingCount; index += 1) {
    cells.push({
      key: `padding-end-${index}`,
      isoDate: null,
      count: 0,
      title: null,
      ariaLabel: null,
      state: "padding",
      intensity: 0,
    });
  }

  return {
    totalDrops,
    maxCount,
    weekCount: cells.length / WEEKDAY_COUNT,
    monthLabels,
    cells,
  };
}

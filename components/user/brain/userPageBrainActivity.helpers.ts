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

type UserPageBrainActivityCellState = "padding" | "empty" | "active";
type UserPageBrainActivityIntensity = 0 | 1 | 2 | 3 | 4;

export interface UserPageBrainActivityCell {
  readonly key: string;
  readonly isoDate: string | null;
  readonly count: number;
  readonly ariaLabel: string | null;
  readonly state: UserPageBrainActivityCellState;
  readonly intensity: UserPageBrainActivityIntensity;
}

interface UserPageBrainActivityMonthLabel {
  readonly key: string;
  readonly label: string;
  readonly labelColumn: number;
  readonly firstVisibleColumn: number;
  readonly lastVisibleColumn: number;
}

export interface UserPageBrainActivityViewModel {
  readonly resetKey: string;
  readonly periodLabel: string;
  readonly totalDrops: number;
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
  return count === 1
    ? "1 public post"
    : `${numberWithCommas(count)} public posts`;
}

function getQuantileValue(
  sortedCounts: readonly number[],
  percentile: number
): number {
  if (sortedCounts.length === 0) {
    return 0;
  }

  const clampedPercentile = Math.min(1, Math.max(0, percentile));
  const rank = Math.max(
    0,
    Math.ceil(clampedPercentile * sortedCounts.length) - 1
  );
  return sortedCounts[rank] ?? 0;
}

function getIntensity(
  count: number,
  thresholds: Readonly<{
    first: number;
    second: number;
    third: number;
    max: number;
  }>
): UserPageBrainActivityIntensity {
  if (count <= 0) {
    return 0;
  }

  if (count >= thresholds.max) {
    return 4;
  }

  if (count <= thresholds.first) {
    return 1;
  }
  if (count <= thresholds.second) {
    return 2;
  }
  if (count <= thresholds.third) {
    return 3;
  }
  return 4;
}

function getSamplesSignature(samples: readonly number[]): string {
  let hash = 0;

  for (const sample of samples) {
    hash = (hash * 31 + sample) >>> 0;
  }

  return hash.toString(36);
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
  const activeCounts = normalizedSamples
    .filter((sample) => sample > 0)
    .sort((left, right) => left - right);
  const intensityThresholds = {
    first: getQuantileValue(activeCounts, 0.25),
    second: getQuantileValue(activeCounts, 0.5),
    third: getQuantileValue(activeCounts, 0.75),
    max: activeCounts[activeCounts.length - 1] ?? 0,
  } as const;
  const startDate = new Date(
    lastDate.getTime() - (normalizedSamples.length - 1) * DAY_MS
  );
  const samples = normalizedSamples.map((count, index) => ({
    date: new Date(startDate.getTime() + index * DAY_MS),
    count,
  }));

  const totalDrops = samples.reduce((sum, sample) => sum + sample.count, 0);
  const leadingPaddingCount = startDate.getUTCDay();
  const trailingPaddingCount =
    (WEEKDAY_COUNT - ((leadingPaddingCount + samples.length) % WEEKDAY_COUNT)) %
    WEEKDAY_COUNT;
  const monthColumns = new Map<
    string,
    {
      readonly key: string;
      readonly label: string;
      preferredLabelColumn: number;
      firstVisibleColumn: number;
      lastVisibleColumn: number;
    }
  >();

  const cells: UserPageBrainActivityCell[] = Array.from(
    { length: leadingPaddingCount },
    (_, index) => ({
      key: `padding-start-${index}`,
      isoDate: null,
      count: 0,
      ariaLabel: null,
      state: "padding",
      intensity: 0,
    })
  );

  samples.forEach(({ date, count }, index) => {
    const isoDate = toIsoDate(date);
    const monthKey = `${date.getUTCFullYear()}-${date.getUTCMonth()}`;
    const weekIndex = Math.floor((leadingPaddingCount + index) / WEEKDAY_COUNT);
    const labelStartColumn = weekIndex + (date.getUTCDay() === 0 ? 0 : 1);

    const existingMonth = monthColumns.get(monthKey);
    if (existingMonth) {
      existingMonth.lastVisibleColumn = weekIndex;
    } else {
      monthColumns.set(monthKey, {
        key: `month-${monthKey}`,
        label: MONTH_LABEL_FORMATTER.format(date),
        preferredLabelColumn: labelStartColumn,
        firstVisibleColumn: weekIndex,
        lastVisibleColumn: weekIndex,
      });
    }

    const ariaLabel = `${DAY_LABEL_FORMATTER.format(date)}: ${getCountLabel(count)}`;
    cells.push({
      key: isoDate,
      isoDate,
      count,
      ariaLabel,
      state: count > 0 ? "active" : "empty",
      intensity: getIntensity(count, intensityThresholds),
    });
  });

  for (let index = 0; index < trailingPaddingCount; index += 1) {
    cells.push({
      key: `padding-end-${index}`,
      isoDate: null,
      count: 0,
      ariaLabel: null,
      state: "padding",
      intensity: 0,
    });
  }

  const monthLabels = Array.from(monthColumns.values()).map((month) => ({
    key: month.key,
    label: month.label,
    labelColumn: Math.min(month.preferredLabelColumn, month.lastVisibleColumn),
    firstVisibleColumn: month.firstVisibleColumn,
    lastVisibleColumn: month.lastVisibleColumn,
  }));

  return {
    resetKey: `${toIsoDate(lastDate)}:${getSamplesSignature(normalizedSamples)}`,
    periodLabel: "the last 12 months",
    totalDrops,
    weekCount: cells.length / WEEKDAY_COUNT,
    monthLabels,
    cells,
  };
}

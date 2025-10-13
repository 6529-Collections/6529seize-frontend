import { formatNumberWithCommas } from "@/helpers/Helpers";

export function clampToRange(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }
  if (max <= min) {
    return min;
  }
  return Math.min(Math.max(value, min), max);
}

export function calculatePercentage(value: number, total: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(total) || total <= 0) {
    return 0;
  }
  const ratio = (value / total) * 100;
  return Math.min(Math.max(ratio, 0), 100);
}

export function formatPercentLabel(value: number, suffix: string): string {
  const rounded = Number.isFinite(value) ? Math.round(value) : 0;
  return `${rounded}% ${suffix}`;
}

export function formatRateValue(value: number): string {
  if (!Number.isFinite(value)) {
    return "0";
  }
  return formatNumberWithCommas(Math.max(0, Math.round(value)));
}

export function formatPlainNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return "-";
  }
  return formatNumberWithCommas(Math.max(0, Math.round(value)));
}

export function formatMultiplierDisplay(multiplier: number): string {
  if (!Number.isFinite(multiplier)) {
    return "0.00× Base TDH";
  }
  return `${multiplier.toFixed(2)}× Base TDH`;
}

export function extractCountdownLabel(input: string): string | null {
  if (typeof input !== "string") {
    return null;
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  const match = trimmed.match(/\b(?:in|within)\s+(\d+)\s+([a-zA-Z]+)\b/i);
  if (!match) {
    return null;
  }

  const [, rawValue, rawUnit] = match;
  const value = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(value) || value < 0) {
    return null;
  }

  const unitBase = rawUnit.toLowerCase();
  const pluralUnit =
    value === 1
      ? unitBase.replace(/s$/, "")
      : unitBase.endsWith("s")
        ? unitBase
        : `${unitBase}s`;

  const normalizedUnit = pluralUnit.replace(/_/g, " ");

  return `${value} ${normalizedUnit}`;
}

const TIMEFRAME_UNIT_TO_MONTHS: Record<string, number> = {
  day: 1 / 30,
  days: 1 / 30,
  d: 1 / 30,
  week: 1 / 4.345,
  weeks: 1 / 4.345,
  wk: 1 / 4.345,
  wks: 1 / 4.345,
  month: 1,
  months: 1,
  mo: 1,
  mos: 1,
  year: 12,
  years: 12,
  yr: 12,
  yrs: 12,
};

export function parseTimeframeToMonths(input: string): number | null {
  if (typeof input !== "string") {
    return null;
  }

  const sanitized = input.trim();
  if (!sanitized) {
    return null;
  }

  const match = sanitized.match(
    /(\d+(?:\.\d+)?)\s*(day|days|d|week|weeks|wk|wks|month|months|mo|mos|year|years|yr|yrs)\b/i
  );

  if (!match) {
    return null;
  }

  const value = Number.parseFloat(match[1]);
  if (!Number.isFinite(value) || value < 0) {
    return null;
  }

  const unitKey = match[2].toLowerCase();
  const multiplier = TIMEFRAME_UNIT_TO_MONTHS[unitKey];
  if (!Number.isFinite(multiplier)) {
    return null;
  }

  const months = value * multiplier;
  if (!Number.isFinite(months)) {
    return null;
  }

  return Math.max(0, months);
}

export function formatLastUpdatedLabel(
  isoString: string | null | undefined
): string | null {
  if (!isoString) {
    return null;
  }

  const parsed = new Date(isoString);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const now = Date.now();
  const deltaMs = now - parsed.getTime();
  if (deltaMs < 30_000) {
    return "Updated just now";
  }

  const minuteMs = 60_000;
  const minutes = Math.round(deltaMs / minuteMs);
  if (minutes < 60) {
    return `Updated ${minutes} min ago`;
  }

  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `Updated ${hours} hr${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.round(hours / 24);
  if (days < 7) {
    return `Updated ${days} day${days === 1 ? "" : "s"} ago`;
  }

  const dateFormatter = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  });
  const timeFormatter = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  return `Updated ${dateFormatter.format(parsed)} • ${timeFormatter.format(parsed)}`;
}

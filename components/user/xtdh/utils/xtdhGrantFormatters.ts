import {
  PARSE_ERROR_ARRAY_NAME,
  parseTokenExpressionToRanges,
} from "@/components/nft-picker/NftPicker.utils";
import type { ParseErrorArray } from "@/components/nft-picker/NftPicker.utils";

const isParseErrorArray = (error: unknown): error is ParseErrorArray => {
  if (!(error instanceof Error)) {
    return false;
  }

  const candidate = error as Partial<ParseErrorArray>;
  return (
    candidate.name === PARSE_ERROR_ARRAY_NAME && Array.isArray(candidate.errors)
  );
};

const numberFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 0,
});

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric",
});

const ALL_TOKENS_LABEL = "All tokens";
const UNKNOWN_TOKENS_LABEL = "an unknown number of tokens";

export type TargetTokensCountInfo =
  | { kind: "all"; label: string; count: null }
  | { kind: "count"; label: string; count: number }
  | { kind: "unknown"; label: string; count: null };

export const getTargetTokensCountInfo = (
  count: number | null | undefined
): TargetTokensCountInfo => {
  if (count == null) {
    return { kind: "all", label: ALL_TOKENS_LABEL, count: null };
  }

  if (!Number.isFinite(count) || count < 0) {
    return {
      kind: "unknown",
      label: UNKNOWN_TOKENS_LABEL,
      count: null,
    };
  }

  const normalizedCount = Math.trunc(count);

  return {
    kind: "count",
    label: numberFormatter.format(normalizedCount),
    count: normalizedCount,
  };
};

export const formatTargetTokens = (tokens: readonly string[]): string => {
  if (!tokens.length) {
    return ALL_TOKENS_LABEL;
  }

  const tokensExpression = tokens.join(",");
  const fallbackLabel = tokens.join(", ");

  try {
    const ranges = parseTokenExpressionToRanges(tokensExpression);
    if (!ranges.length) {
      return ALL_TOKENS_LABEL;
    }

    return ranges
      .map((range) => {
        const start = range.start.toString();
        const end = range.end.toString();
        return range.start === range.end ? start : `${start}-${end}`;
      })
      .join(", ");
  } catch (error: unknown) {
    if (isParseErrorArray(error)) {
      console.error(
        "[formatTargetTokens] Failed to parse target tokens expression:",
        error
      );
      return fallbackLabel;
    }
    throw error;
  }
};

interface DateTimeFormatOptions {
  readonly fallbackLabel?: string | undefined;
  readonly includeTime?: boolean | undefined;
}

export const formatDateTime = (
  timestamp: number | null,
  options?: DateTimeFormatOptions
) => {
  if (timestamp == null || timestamp <= 0) {
    return options?.fallbackLabel ?? "No expiry";
  }

  // Normalize timestamp: values > 1 trillion are assumed milliseconds,
  // otherwise treat as seconds
  const normalizedTimestamp =
    timestamp > 1_000_000_000_000 ? timestamp : timestamp * 1000;
  const date = new Date(normalizedTimestamp);
  if (!Number.isFinite(date.getTime())) {
    return "Invalid date";
  }

  if (options?.includeTime === false) {
    return dateFormatter.format(date);
  }

  return dateTimeFormatter.format(date);
};

export const formatAmount = (value: number) => {
  if (!Number.isFinite(value)) {
    return "0";
  }

  return numberFormatter.format(Math.trunc(value));
};

export const formatTargetTokensCount = (
  tokensCount: number | null | undefined
): string => getTargetTokensCountInfo(tokensCount).label;

const createDecimalFormatter = (maximumFractionDigits: number) =>
  new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  });

const decimalFormatters = new Map<number, Intl.NumberFormat>();

const PRECISION_THRESHOLDS = {
  VERY_SMALL: 0.01,
  SMALL: 1,
  MEDIUM: 100,
  LARGE: 1000,
} as const;

function formatDecimal(value: number, maximumFractionDigits: number): string {
  if (!decimalFormatters.has(maximumFractionDigits)) {
    decimalFormatters.set(
      maximumFractionDigits,
      createDecimalFormatter(maximumFractionDigits)
    );
  }

  return decimalFormatters.get(maximumFractionDigits)!.format(value);
}

export const formatTdhRatePerToken = (
  totalRate: number,
  tokensCount: number | null
): string | null => {
  if (!Number.isFinite(totalRate) || tokensCount == null) {
    return null;
  }

  const normalizedTokensCount = Math.trunc(tokensCount);

  if (!Number.isFinite(normalizedTokensCount) || normalizedTokensCount <= 0) {
    return null;
  }

  const perTokenValue = totalRate / normalizedTokensCount;
  if (!Number.isFinite(perTokenValue)) {
    return null;
  }

  const absoluteValue = Math.abs(perTokenValue);

  if (absoluteValue < PRECISION_THRESHOLDS.VERY_SMALL) {
    return formatDecimal(perTokenValue, 4);
  }

  if (absoluteValue < PRECISION_THRESHOLDS.SMALL) {
    return formatDecimal(perTokenValue, 3);
  }

  if (absoluteValue < PRECISION_THRESHOLDS.MEDIUM) {
    return formatDecimal(perTokenValue, 2);
  }

  if (absoluteValue < PRECISION_THRESHOLDS.LARGE) {
    return formatDecimal(perTokenValue, 1);
  }

  return formatDecimal(perTokenValue, 0);
};

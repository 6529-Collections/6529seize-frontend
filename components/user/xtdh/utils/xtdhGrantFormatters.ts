import { parseTokenExpressionToRanges } from "@/components/nft-picker/NftPicker.utils";
import type { ParseError } from "@/components/nft-picker/NftPicker.types";

const PARSE_ERROR_ARRAY_NAME = "ParseErrorArray";

type ParseErrorArray = ParseError[] &
  Error & { name: typeof PARSE_ERROR_ARRAY_NAME };

const isParseErrorArray = (error: unknown): error is ParseErrorArray => {
  if (!Array.isArray(error)) {
    return false;
  }

  const { name } = error as { name?: unknown };
  return typeof name === "string" && name === PARSE_ERROR_ARRAY_NAME;
};

const numberFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 0,
});

export type TargetTokensCountInfo =
  | { kind: "all"; label: string; count: null }
  | { kind: "count"; label: string; count: number | null };

export const getTargetTokensCountInfo = (
  count: number | null | undefined
): TargetTokensCountInfo => {
  if (
    count === null ||
    count === undefined ||
    !Number.isFinite(count) ||
    count <= 0
  ) {
    return { kind: "all", label: "All tokens", count: null };
  }

  const normalizedCount = Math.floor(count);

  return {
    kind: "count",
    label: numberFormatter.format(normalizedCount),
    count: normalizedCount,
  };
};

export const formatTargetTokens = (tokens: readonly string[]): string => {
  if (!tokens.length) {
    return "All tokens";
  }

  const tokensExpression = tokens.join(",");
  const fallbackLabel = tokens.join(", ");

  try {
    const ranges = parseTokenExpressionToRanges(tokensExpression);
    if (!ranges.length) {
      return "All tokens";
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
  readonly fallbackLabel?: string;
}

export const formatDateTime = (
  timestamp: number | null,
  options?: DateTimeFormatOptions
) => {
  if (!timestamp || timestamp <= 0) {
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

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
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
  if (!Number.isFinite(totalRate) || !tokensCount || tokensCount <= 0) {
    return null;
  }

  const perTokenValue = totalRate / tokensCount;
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

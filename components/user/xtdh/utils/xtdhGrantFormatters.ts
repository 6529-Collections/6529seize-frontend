import { parseTokenExpressionToRanges } from "@/components/nft-picker/NftPicker.utils";

const numberFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 0,
});

export type TargetTokensCountInfo =
  | { kind: "all"; label: string; count: null }
  | { kind: "count"; label: string; count: number | null };

export const getTargetTokensCountInfo = (
  tokensCount: number | null | undefined
): TargetTokensCountInfo => {
  if (
    tokensCount === null ||
    tokensCount === undefined ||
    !Number.isFinite(tokensCount) ||
    tokensCount <= 0
  ) {
    return { kind: "all", label: "All tokens", count: null };
  }

  const normalizedCount = Math.max(0, Math.floor(tokensCount));

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

  try {
    const ranges = parseTokenExpressionToRanges(tokens.join(","));
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
  } catch (error) {
    return tokens.join(", ");
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

  return numberFormatter.format(Math.floor(value));
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
  let maximumFractionDigits = 0;

  if (absoluteValue === 0) {
    maximumFractionDigits = 0;
  } else if (absoluteValue < 0.01) {
    maximumFractionDigits = 4;
  } else if (absoluteValue < 1) {
    maximumFractionDigits = 3;
  } else if (absoluteValue < 100) {
    maximumFractionDigits = 2;
  } else if (absoluteValue < 1000) {
    maximumFractionDigits = 1;
  }

  return formatDecimal(perTokenValue, maximumFractionDigits);
};

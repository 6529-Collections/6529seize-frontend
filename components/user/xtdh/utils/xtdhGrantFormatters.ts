import { parseTokenExpressionToRanges } from "@/components/nft-picker/NftPicker.utils";

const numberFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 0,
});

export type TargetTokensCountInfo =
  | { kind: "all"; label: string; count: null }
  | { kind: "count"; label: string; count: number | null };

export const getTargetTokensCountInfo = (
  tokens: readonly string[]
): TargetTokensCountInfo => {
  if (!tokens.length) {
    return { kind: "all", label: "All tokens", count: null };
  }

  try {
    const ranges = parseTokenExpressionToRanges(tokens.join(","));
    if (!ranges.length) {
      return { kind: "all", label: "All tokens", count: null };
    }

    const total = ranges.reduce<bigint>((sum, range) => {
      const rangeSize = range.end - range.start + BigInt(1);
      return sum + rangeSize;
    }, BigInt(0));

    if (total <= BigInt(Number.MAX_SAFE_INTEGER)) {
      const numericTotal = Number(total);
      return {
        kind: "count",
        label: numberFormatter.format(numericTotal),
        count: numericTotal,
      };
    }

    return {
      kind: "count",
      label: total.toString(),
      count: null,
    };
  } catch (error) {
    const fallbackCount = tokens.length;
    if (!fallbackCount) {
      return { kind: "all", label: "All tokens", count: null };
    }
    return {
      kind: "count",
      label: numberFormatter.format(fallbackCount),
      count: fallbackCount,
    };
  }
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

export const formatTargetTokensCount = (tokens: readonly string[]): string =>
  getTargetTokensCountInfo(tokens).label;

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

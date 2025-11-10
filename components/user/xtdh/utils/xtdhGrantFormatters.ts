import { parseTokenExpressionToRanges } from "@/components/nft-picker/NftPicker.utils";

const numberFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 0,
});

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

export const formatDateTime = (timestamp: number | null) => {
  if (!timestamp || timestamp <= 0) {
    return "No expiry";
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

export const formatTargetTokensCount = (tokens: readonly string[]): string => {
  if (!tokens.length) {
    return "All tokens";
  }

  try {
    const ranges = parseTokenExpressionToRanges(tokens.join(","));
    if (!ranges.length) {
      return "All tokens";
    }

    const total = ranges.reduce<bigint>((sum, range) => {
      const rangeSize = range.end - range.start + BigInt(1);
      return sum + rangeSize;
    }, BigInt(0));

    if (total <= BigInt(Number.MAX_SAFE_INTEGER)) {
      return numberFormatter.format(Number(total));
    }

    return total.toString();
  } catch (error) {
    return numberFormatter.format(tokens.length);
  }
};

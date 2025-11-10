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

export const formatDateTime = (timestampSeconds: number | null) => {
  if (!timestampSeconds || timestampSeconds <= 0) {
    return "No expiry";
  }

  const date = new Date(timestampSeconds * 1000);
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

export const formatAmount = (value: number) =>
  new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 6,
  }).format(value);

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
      const rangeSize = range.end - range.start + 1n;
      return sum + rangeSize;
    }, 0n);

    if (total <= BigInt(Number.MAX_SAFE_INTEGER)) {
      return numberFormatter.format(Number(total));
    }

    return total.toString();
  } catch (error) {
    return numberFormatter.format(tokens.length);
  }
};

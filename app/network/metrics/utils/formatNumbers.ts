export function formatNumberWithCommas(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatCompactNumber(value: number): string {
  const absValue = Math.abs(value);
  if (absValue >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2).replace(/\.?0+$/, "")}B`;
  }
  if (absValue >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace(/\.?0+$/, "")}M`;
  }
  if (absValue >= 1_000) {
    return `${(value / 1_000).toFixed(1).replace(/\.?0+$/, "")}K`;
  }
  return formatNumberWithCommas(value);
}

export function formatPercent(value: number | null): string {
  if (value === null) return "N/A";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(0)}%`;
}

export function formatChange(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${formatCompactNumber(value)}`;
}

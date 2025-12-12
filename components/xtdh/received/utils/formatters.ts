const integerFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 0,
});

const decimalFormatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatCount(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "0";
  }

  return integerFormatter.format(Math.max(0, Math.floor(value)));
}

export function formatXtdhValue(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "0";
  }

  return decimalFormatter.format(value);
}

export function formatXtdhRate(value: number | null | undefined): string {
  return formatXtdhValue(value);
}

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

export function isNotificationNumber(
  value: number | null | undefined
): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function getNotificationRatingColor(value: number): string {
  if (value > 0) return "tw-text-green";
  if (value < 0) return "tw-text-red";
  return "tw-text-iron-400";
}

export function formatSignedNotificationNumber(value: number): string {
  if (value === 0) return "0";
  const formattedValue = value.toLocaleString();
  return value > 0 ? `+${formattedValue}` : formattedValue;
}

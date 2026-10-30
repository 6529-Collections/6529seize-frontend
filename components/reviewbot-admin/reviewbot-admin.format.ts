// Usage timestamps are UTC instants. The zone is fixed and printed, so the
// dashboard reads the same for every operator and every server zone.
const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  month: "short",
  timeZone: "UTC",
  timeZoneName: "short",
  year: "numeric",
});

export function formatDateTime(value: string): string {
  if (!value) {
    return "unknown";
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "unknown"
    : dateTimeFormatter.format(date);
}

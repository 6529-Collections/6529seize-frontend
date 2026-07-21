export const getTimeAgo = (milliseconds: number): string => {
  const timeDifference = Date.now() - milliseconds;
  const seconds = Math.floor(timeDifference / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(months / 12);
  if (years > 0) return `${years} year${years > 1 ? "s" : ""} ago`;
  if (months > 0) return `${months} month${months > 1 ? "s" : ""} ago`;
  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  return "Just now";
};

export const getTimeAgoShort = (
  milliseconds: number,
  referenceTime: number = Date.now(),
  alwaysRelative: boolean = false
): string => {
  const timeDifference = referenceTime - milliseconds;
  const seconds = Math.floor(timeDifference / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (alwaysRelative) {
    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return "<1m";
  }
  if (days > 1)
    return new Date(milliseconds).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  if (days === 1) return "Yesterday";
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return "Just now";
};

interface TimeUntilPart {
  readonly value: number;
  readonly unit: "year" | "month" | "day" | "hour" | "minute";
}

const formatTimeUntilPart = (
  { value, unit }: TimeUntilPart,
  isFuture: boolean
): string => {
  const prefix = isFuture ? "in" : "";
  const pluralSuffix = value > 1 ? "s" : "";
  const suffix = isFuture ? "" : "ago";
  return `${prefix} ${value} ${unit}${pluralSuffix} ${suffix}`;
};

export const getTimeUntil = (milliseconds: number): string => {
  let timeDifference = milliseconds - Date.now();
  const isFuture = timeDifference >= 0;
  timeDifference = Math.abs(timeDifference);
  const seconds = Math.floor(timeDifference / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(months / 12);
  const timeParts: readonly TimeUntilPart[] = [
    { value: years, unit: "year" },
    { value: months, unit: "month" },
    { value: days, unit: "day" },
    { value: hours, unit: "hour" },
    { value: minutes, unit: "minute" },
  ];
  const timePart = timeParts.find(({ value }) => value > 0);
  return timePart ? formatTimeUntilPart(timePart, isFuture) : "Just now";
};

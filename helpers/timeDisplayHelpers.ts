export const getTimeAgo = (milliseconds: number): string => {
  const timeDifference = new Date().getTime() - milliseconds;
  const minutes = Math.floor(Math.floor(timeDifference / 1000) / 60);
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
  const minutes = Math.floor(
    Math.floor((referenceTime - milliseconds) / 1000) / 60
  );
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

export const getTimeUntil = (milliseconds: number): string => {
  let timeDifference = milliseconds - new Date().getTime();
  const isFuture = timeDifference >= 0;
  timeDifference = Math.abs(timeDifference);
  const minutes = Math.floor(Math.floor(timeDifference / 1000) / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(months / 12);
  const format = (value: number, unit: string) =>
    `${isFuture ? "in" : ""} ${value} ${unit}${value > 1 ? "s" : ""} ${isFuture ? "" : "ago"}`;
  if (years > 0) return format(years, "year");
  if (months > 0) return format(months, "month");
  if (days > 0) return format(days, "day");
  if (hours > 0) return format(hours, "hour");
  if (minutes > 0) return format(minutes, "minute");
  return "Just now";
};

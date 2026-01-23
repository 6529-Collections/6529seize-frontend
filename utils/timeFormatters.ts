/**
 * Format timestamp into readable countdown or date
 * @param timestamp Future timestamp in milliseconds or null
 * @returns Formatted string for display
 */
export function formatCountdown(timestamp: number | null): string {
  if (timestamp === null) return "";

  const now = Date.now();
  const timeRemaining = timestamp - now;

  // Already passed
  if (timeRemaining <= 0) return "Now";

  // Less than a day
  if (timeRemaining < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(timeRemaining / (60 * 60 * 1000));
    const minutes = Math.floor(
      (timeRemaining % (60 * 60 * 1000)) / (60 * 1000)
    );

    if (hours === 0) return `in ${minutes}m`;
    return `in ${hours}h ${minutes}m`;
  }

  // Less than a week
  if (timeRemaining < 7 * 24 * 60 * 60 * 1000) {
    const days = Math.floor(timeRemaining / (24 * 60 * 60 * 1000));
    const hours = Math.floor(
      (timeRemaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000)
    );

    return `in ${days}d ${hours}h`;
  }

  // Format as date for distant future
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

/**
 * Format timestamp into verbose countdown display with labels.
 * @param timestampSeconds Future timestamp in SECONDS (Unix timestamp)
 * @returns Formatted string like "2d 3h 4m 5s"
 */
export function formatCountdownVerbose(timestampSeconds: number): string {
  const now = Date.now();
  const targetMs = timestampSeconds * 1000;
  const diff = Math.max(0, targetMs - now);

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);

  return parts.join(" : ");
}

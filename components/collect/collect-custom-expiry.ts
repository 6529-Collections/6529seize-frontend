const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const MIN_DURATION_SECONDS = 300;
// The backend uses the latest block's timestamp and allows five minutes through
// thirty days. Its accepted block can lag wall time by up to two minutes.
const MAX_DURATION_SECONDS = 30 * 86_400 - 120;

type CollectCustomExpiryIssue = "invalid" | "ambiguous" | "tooSoon" | "tooLate";

type CollectCustomExpiryResult =
  | { readonly issue: null; readonly expiresAt: number }
  | { readonly issue: CollectCustomExpiryIssue; readonly expiresAt: null };

/** A datetime-local value has no UTC suffix or timezone conversion. */
export function formatCollectCustomExpiryInput(timestampMs: number): string {
  if (!Number.isSafeInteger(timestampMs)) return "";
  const date = new Date(timestampMs);
  const year = date.getFullYear();
  if (!Number.isInteger(year) || year < 1 || year > 9999) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${String(year).padStart(4, "0")}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function defaultCollectCustomExpiryInput(nowMs = Date.now()): string {
  return formatCollectCustomExpiryInput(nowMs + 7 * DAY_MS);
}

function isAmbiguousLocalTime(date: Date, input: string): boolean {
  const timestamp = date.getTime();
  const currentOffset = date.getTimezoneOffset();
  const offsets = new Set<number>();
  // Read neighboring offsets rather than assuming a daylight-saving shift is
  // one hour. Only an exact second occurrence of the chosen local time rejects.
  for (let hours = -48; hours <= 48; hours += 1) {
    offsets.add(new Date(timestamp + hours * HOUR_MS).getTimezoneOffset());
  }
  for (const offset of offsets) {
    if (offset === currentOffset) continue;
    const alternative = timestamp + (offset - currentOffset) * MINUTE_MS;
    if (formatCollectCustomExpiryInput(alternative) === input) return true;
  }
  return false;
}

/** Resolve once on preparation; refresh must preserve this exact Unix-seconds expiry. */
export function resolveCollectCustomExpiry(
  input: string,
  nowMs = Date.now()
): CollectCustomExpiryResult {
  if (
    !Number.isSafeInteger(nowMs) ||
    nowMs < 0 ||
    formatCollectCustomExpiryInput(nowMs) === "" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(input)
  ) {
    return { issue: "invalid", expiresAt: null };
  }
  const year = Number(input.slice(0, 4));
  const month = Number(input.slice(5, 7));
  const day = Number(input.slice(8, 10));
  const hour = Number(input.slice(11, 13));
  const minute = Number(input.slice(14, 16));
  const date = new Date(0);
  // setFullYear avoids Date's special constructor interpretation of years 0–99.
  date.setFullYear(year, month - 1, day);
  date.setHours(hour, minute, 0, 0);
  const timestamp = date.getTime();
  // Reject calendar overflow and nonexistent local times normalized by Date.
  if (formatCollectCustomExpiryInput(timestamp) !== input) {
    return { issue: "invalid", expiresAt: null };
  }
  if (isAmbiguousLocalTime(date, input)) {
    return { issue: "ambiguous", expiresAt: null };
  }
  const expiresAt = timestamp / 1000;
  const nowSeconds = Math.floor(nowMs / 1000);
  if (expiresAt < nowSeconds + MIN_DURATION_SECONDS) {
    return { issue: "tooSoon", expiresAt: null };
  }
  if (expiresAt > nowSeconds + MAX_DURATION_SECONDS) {
    return { issue: "tooLate", expiresAt: null };
  }
  // Bounds reject the absolute choice; they never clamp or extend it.
  return { issue: null, expiresAt };
}

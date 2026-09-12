import { resolveCollectCustomExpiry } from "./collect-custom-expiry";

// The API bounds order duration against the latest fresh block, which can lag
// wall-clock time by up to two minutes. Keep the requested expiry within that cap.
const COLLECT_ORDER_EXPIRY_MARGIN_SECONDS = 120;

export function collectOrderExpiry(
  expiryHours: string,
  now = Date.now()
): number {
  return (
    Math.floor(now / 1000) +
    Number(expiryHours) * 3600 -
    COLLECT_ORDER_EXPIRY_MARGIN_SECONDS
  );
}

export function resolveCollectOrderExpiry(
  value: { readonly expiryHours: string; readonly expiryDateTime?: string },
  now = Date.now()
): number | null {
  if (value.expiryHours === "custom")
    return resolveCollectCustomExpiry(value.expiryDateTime ?? "", now)
      .expiresAt;
  if (!["24", "168", "720"].includes(value.expiryHours)) return null;
  return collectOrderExpiry(value.expiryHours, now);
}

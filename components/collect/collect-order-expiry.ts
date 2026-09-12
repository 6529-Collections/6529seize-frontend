// The API bounds order duration against the latest fresh block, which can lag
// wall-clock time by up to two minutes. Keep the requested expiry within that cap.
export const COLLECT_ORDER_EXPIRY_MARGIN_SECONDS = 120;

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

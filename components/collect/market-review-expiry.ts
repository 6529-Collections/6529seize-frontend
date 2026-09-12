const MAX_DATE_MILLISECONDS = 8_640_000_000_000_000;

/** Review deadlines are Unix milliseconds; zero means a fresh review is required. */
export function isValidMarketReviewExpiry(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value > 0 &&
    value <= MAX_DATE_MILLISECONDS
  );
}

export function isFreshMarketReviewExpiry(
  value: unknown,
  now = Date.now()
): boolean {
  return (
    isValidMarketReviewExpiry(value) &&
    Number.isSafeInteger(now) &&
    now >= 0 &&
    value > now
  );
}

const UINT32_RANGE = 2 ** 32;
const NEUTRAL_RANDOM_UNIT = 0.5;

// Uniform value in [0, 1) from the platform CSPRNG. If Web Crypto is missing
// the helpers degrade to a neutral midpoint instead of throwing, so retry
// scheduling never fails just because jitter is unavailable.
function getRandomUnit(): number {
  try {
    const values = new Uint32Array(1);
    globalThis.crypto.getRandomValues(values);
    return (values[0] ?? 0) / UINT32_RANGE;
  } catch {
    return NEUTRAL_RANDOM_UNIT;
  }
}

/**
 * Scales `baseDelayMs` by a uniform factor drawn from the half-open range
 * [1 - ratio, 1 + ratio), then rounds to whole milliseconds (so the rounded
 * result can equal either bound).
 */
export function applyDelayJitter(baseDelayMs: number, ratio: number): number {
  return Math.round(baseDelayMs * (1 - ratio + getRandomUnit() * ratio * 2));
}

/**
 * Runs `callback` after a uniform random delay in [0, maxDelayMs) and returns
 * a function that cancels it. Spreads work that every connected client would
 * otherwise start in the same instant, such as a resync after a socket
 * reconnect following a deploy.
 */
export function scheduleStaggered(
  callback: () => void,
  maxDelayMs: number
): () => void {
  const timer = setTimeout(callback, Math.floor(getRandomUnit() * maxDelayMs));
  return () => clearTimeout(timer);
}

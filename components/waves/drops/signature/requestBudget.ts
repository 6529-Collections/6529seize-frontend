import { getStructuredApiErrorStatus } from "@/services/api/common-api";

/** A request refused with 429: every request pauses, nothing failed. */
export class RateLimitedError extends Error {}

interface RequestBudgetOptions {
  /** At most this many requests start within any `windowMs`. */
  readonly maxRequestsPerWindow: number;
  readonly windowMs: number;
  /** A 429 pauses every request for its Retry-After, within these bounds. */
  readonly minPauseMs: number;
  readonly maxPauseMs: number;
  /** Each request is aborted after this long. */
  readonly timeoutMs: number;
}

interface RequestBudget {
  /** Waits for a start slot, then runs the request (see `run`). */
  readonly request: <T>(
    send: (signal: AbortSignal) => Promise<T>
  ) => Promise<T>;
  /**
   * Waits until a request may start: after any pause and within the budget.
   * The slot is reserved before waiting, so callers start in call order and
   * two callers woken at the same moment never share one slot.
   */
  readonly takeSlot: () => Promise<void>;
  /**
   * Runs a request whose slot was taken, with its own timeout. A 429 pauses
   * every request and is rethrown as a RateLimitedError.
   */
  readonly run: <T>(send: (signal: AbortSignal) => Promise<T>) => Promise<T>;
  /** How much longer requests are paused after a 429 (0: not paused). */
  readonly pauseRemainingMs: () => number;
}

const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/** The Retry-After header of a failed request, when it has one. */
function readRetryAfter(error: unknown): string | null {
  if (typeof error !== "object" || error === null || !("headers" in error)) {
    return null;
  }
  const { headers } = error as {
    readonly headers?: { readonly get?: unknown } | null;
  };
  if (typeof headers?.get !== "function") {
    return null;
  }
  const value: unknown = (
    headers as { readonly get: (name: string) => unknown }
  ).get("retry-after");
  return typeof value === "string" ? value : null;
}

/** The pause a Retry-After value asks for: seconds, or an HTTP date. */
function requestedPauseMs(retryAfter: string | null, now: number): number {
  if (retryAfter === null || retryAfter.trim() === "") {
    return 0;
  }
  const seconds = Number(retryAfter);
  const requested = Number.isFinite(seconds)
    ? seconds * 1000
    : Date.parse(retryAfter) - now;
  return Number.isFinite(requested) ? requested : 0;
}

/**
 * A shared request budget: at most `maxRequestsPerWindow` request starts per
 * `windowMs`, and a pause for every request after a 429.
 */
export function createRequestBudget({
  maxRequestsPerWindow,
  windowMs,
  minPauseMs,
  maxPauseMs,
  timeoutMs,
}: RequestBudgetOptions): RequestBudget {
  /** Start times of recent and reserved requests, in ascending order. */
  const starts: number[] = [];
  /** No request starts before this time (after a 429). */
  let pausedUntil = 0;

  /**
   * Reserved starts lie at most a pause and a few windows ahead. Any later
   * one means the clock was set back; such reservations are forgotten.
   */
  const reservationHorizonMs = maxPauseMs + 10 * windowMs;

  const forgetPastStarts = (now: number): void => {
    while (starts.length > 0 && (starts[0] ?? now) <= now - windowMs) {
      starts.shift();
    }
    if ((starts.at(-1) ?? now) - now > reservationHorizonMs) {
      starts.length = 0;
    }
  };

  /** Reserves the earliest start the pause and the budget allow. */
  const reserveStart = (now: number): number => {
    forgetPastStarts(now);
    const limiting = starts.at(-maxRequestsPerWindow);
    const start = Math.max(
      now,
      pausedUntil,
      limiting === undefined ? now : limiting + windowMs
    );
    starts.push(start);
    return start;
  };

  const releaseStart = (start: number): void => {
    const index = starts.indexOf(start);
    if (index >= 0) {
      starts.splice(index, 1);
    }
  };

  const takeSlot = async (): Promise<void> => {
    const start = reserveStart(Date.now());
    const delay = start - Date.now();
    if (delay <= 0) {
      return;
    }
    await wait(delay);
    if (pausedUntil > Date.now()) {
      // A 429 arrived while this caller waited: its reserved start falls
      // inside the pause, so it reserves a start after the pause instead.
      releaseStart(start);
      await takeSlot();
    }
  };

  const pauseFor = (error: unknown): void => {
    const now = Date.now();
    const pauseMs = Math.min(
      maxPauseMs,
      Math.max(minPauseMs, requestedPauseMs(readRetryAfter(error), now))
    );
    pausedUntil = Math.max(pausedUntil, now + pauseMs);
  };

  const run = async <T>(
    send: (signal: AbortSignal) => Promise<T>
  ): Promise<T> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await send(controller.signal);
    } catch (error) {
      if (getStructuredApiErrorStatus(error) === 429) {
        pauseFor(error);
        throw new RateLimitedError("rate limited");
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  };

  return {
    request: async (send) => {
      await takeSlot();
      return run(send);
    },
    takeSlot,
    run,
    pauseRemainingMs: () => Math.max(0, pausedUntil - Date.now()),
  };
}

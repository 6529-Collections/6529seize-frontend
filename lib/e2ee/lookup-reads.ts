/** Cosmetic identity reads: one flight per key, bounded retries, no timers. */
const RETRY_DELAYS = [30_000, 120_000, 600_000] as const;
const NEGATIVE_CACHE_MS = 300_000;
const MAX_CONCURRENT = 8;

interface Failure {
  attempts: number;
  retryAt: number;
  exhausted: boolean;
}

export class LookupDeferred extends Error {
  constructor() {
    super("Identity lookup deferred");
    this.name = "LookupDeferred";
  }
}

export function lookupStatus(error: unknown): number | null {
  if (typeof error !== "object" || error === null || !("status" in error)) {
    return null;
  }
  return typeof error.status === "number" ? error.status : null;
}

/** Accept seconds or an HTTP date; absent/malformed headers use our backoff. */
export function lookupRetryAfterMs(error: unknown, now: number): number {
  if (typeof error !== "object" || error === null) return 0;
  if ("retryAfterMs" in error && typeof error.retryAfterMs === "number") {
    return Number.isFinite(error.retryAfterMs)
      ? Math.max(0, error.retryAfterMs)
      : 0;
  }
  if (
    !("response" in error) ||
    typeof error.response !== "object" ||
    error.response === null ||
    !("headers" in error.response)
  )
    return 0;
  const headers = error.response.headers;
  if (!(headers instanceof Headers)) return 0;
  const value = headers.get("Retry-After")?.trim();
  if (!value) return 0;
  if (/^\d+$/.test(value)) {
    const ms = Number(value) * 1000;
    return Number.isFinite(ms) ? ms : 0;
  }
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(0, date - now) : 0;
}

function cancelled(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (("name" in error && error.name === "AbortError") ||
      ("code" in error && error.code === "E2EE_ACCOUNT_CHANGED"))
  );
}

export class LookupReads {
  private readonly failures = new Map<string, Failure>();
  private readonly flights = new Map<string, Promise<unknown>>();
  private readonly waiting: (() => void)[] = [];
  private active = 0;
  private cooldownUntil = 0;

  constructor(
    private readonly now: () => number = Date.now,
    private readonly available: () => boolean = () => true
  ) {}

  /** An actual reopen/reconnect may renew an exhausted budget, never a cooldown. */
  resume(keys?: readonly string[]): void {
    for (const key of keys ?? this.failures.keys()) {
      const failure = this.failures.get(key);
      if (failure?.exhausted && this.now() >= failure.retryAt) {
        this.failures.delete(key);
      }
    }
  }

  read<T>(key: string, fetch: () => Promise<T>): Promise<T> {
    const existing = this.flights.get(key);
    if (existing) return existing as Promise<T>;
    const run = this.run(key, fetch).finally(() => this.flights.delete(key));
    this.flights.set(key, run);
    return run;
  }

  canRead(key: string): boolean {
    try {
      this.check(key);
      return true;
    } catch {
      return false;
    }
  }

  private check(key: string): void {
    if (!this.available() || this.now() < this.cooldownUntil) {
      throw new LookupDeferred();
    }
    const failure = this.failures.get(key);
    if (failure && (failure.exhausted || this.now() < failure.retryAt)) {
      throw new LookupDeferred();
    }
  }

  private async acquire(): Promise<void> {
    if (this.active < MAX_CONCURRENT) {
      this.active += 1;
      return;
    }
    await new Promise<void>((resolve) => this.waiting.push(resolve));
  }

  private release(): void {
    const next = this.waiting.shift();
    if (next) next();
    else this.active -= 1;
  }

  private failed(key: string, error: unknown): void {
    if (cancelled(error) || error instanceof LookupDeferred) return;
    const status = lookupStatus(error);
    const retryable =
      status === null ||
      status === 0 ||
      status === 408 ||
      status === 429 ||
      status >= 500;
    const attempts = (this.failures.get(key)?.attempts ?? 0) + 1;
    const backoff =
      RETRY_DELAYS[Math.min(attempts - 1, RETRY_DELAYS.length - 1)]!;
    const delay = Math.max(
      retryable ? backoff : NEGATIVE_CACHE_MS,
      lookupRetryAfterMs(error, this.now())
    );
    const retryAt = this.now() + delay;
    this.failures.set(key, {
      attempts,
      retryAt,
      exhausted: !retryable || attempts > RETRY_DELAYS.length,
    });
    if (status === 429)
      this.cooldownUntil = Math.max(this.cooldownUntil, retryAt);
  }

  private async run<T>(key: string, fetch: () => Promise<T>): Promise<T> {
    this.check(key);
    await this.acquire();
    try {
      // Another lookup can rate-limit the shared budget while this one queues.
      this.check(key);
      const result = await fetch();
      this.failures.delete(key);
      return result;
    } catch (error) {
      this.failed(key, error);
      throw error;
    } finally {
      this.release();
    }
  }
}

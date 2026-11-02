// Every entry costs map and bookkeeping memory, even a tiny cached failure.
const ENTRY_OVERHEAD_BYTES = 1024;

type Entry<T> = {
  readonly value: T;
  readonly bytes: number;
  readonly expiresAt: number;
};

type Flight<T> = {
  readonly controller: AbortController;
  readonly promise: Promise<T>;
  subscribers: number;
};

export type CacheableResult<T> = {
  readonly value: T;
  /** Memory the value keeps alive. Values over the per-entry cap are served, not kept. */
  readonly bytes: number;
  /** How long to keep the value. Zero or less serves it without keeping it. */
  readonly ttlMs: number;
};

type BoundedResultCacheOptions = {
  readonly maxBytes: number;
  readonly maxEntryBytes: number;
  readonly now?: (() => number) | undefined;
};

const abortReason = (signal: AbortSignal): Error =>
  signal.reason instanceof Error
    ? signal.reason
    : new Error("The request was aborted.");

/**
 * A least-recently-used result cache bounded by bytes, with single-flight
 * loading: concurrent callers for one key share one job. The job's signal
 * aborts only when every caller waiting on it has aborted.
 */
export class BoundedResultCache<T> {
  private readonly entries = new Map<string, Entry<T>>();
  private readonly flights = new Map<string, Flight<T>>();
  private readonly maxBytes: number;
  private readonly maxEntryBytes: number;
  private readonly now: () => number;
  private totalBytes = 0;

  constructor({ maxBytes, maxEntryBytes, now }: BoundedResultCacheOptions) {
    if (
      !Number.isSafeInteger(maxBytes) ||
      !Number.isSafeInteger(maxEntryBytes) ||
      maxEntryBytes <= 0 ||
      maxEntryBytes > maxBytes
    ) {
      throw new RangeError(
        "Cache budgets must be positive, with the entry cap inside the total."
      );
    }
    this.maxBytes = maxBytes;
    this.maxEntryBytes = maxEntryBytes;
    this.now = now ?? (() => Date.now());
  }

  load(
    key: string,
    job: (signal: AbortSignal) => Promise<CacheableResult<T>>,
    signal?: AbortSignal
  ): Promise<T> {
    if (signal?.aborted) {
      return Promise.reject(abortReason(signal));
    }
    const cached = this.read(key);
    if (cached) {
      return Promise.resolve(cached.value);
    }
    const flight = this.flights.get(key) ?? this.start(key, job);
    return this.join(key, flight, signal);
  }

  private read(key: string): Entry<T> | undefined {
    const entry = this.entries.get(key);
    if (!entry) {
      return undefined;
    }
    this.entries.delete(key);
    if (entry.expiresAt <= this.now()) {
      this.totalBytes -= entry.bytes;
      return undefined;
    }
    // Reinserting moves the entry to the most recently used end.
    this.entries.set(key, entry);
    return entry;
  }

  private store(key: string, result: CacheableResult<T>): void {
    const bytes =
      Math.max(0, Math.ceil(result.bytes)) +
      key.length * 2 +
      ENTRY_OVERHEAD_BYTES;
    if (
      !Number.isFinite(result.ttlMs) ||
      result.ttlMs <= 0 ||
      !Number.isSafeInteger(bytes) ||
      bytes > this.maxEntryBytes
    ) {
      return;
    }
    this.remove(key);
    this.entries.set(key, {
      value: result.value,
      bytes,
      expiresAt: this.now() + result.ttlMs,
    });
    this.totalBytes += bytes;
    for (const oldestKey of this.entries.keys()) {
      if (this.totalBytes <= this.maxBytes) {
        break;
      }
      this.remove(oldestKey);
    }
  }

  private remove(key: string): void {
    const entry = this.entries.get(key);
    if (entry) {
      this.entries.delete(key);
      this.totalBytes -= entry.bytes;
    }
  }

  private start(
    key: string,
    job: (signal: AbortSignal) => Promise<CacheableResult<T>>
  ): Flight<T> {
    const controller = new AbortController();
    // An async wrapper starts the job synchronously and turns a job that
    // throws before returning its promise into an ordinary rejection.
    const run = async (): Promise<T> => {
      const result = await job(controller.signal);
      this.store(key, result);
      return result.value;
    };
    const promise = run();
    const flight: Flight<T> = { controller, promise, subscribers: 0 };
    const settle = () => {
      if (this.flights.get(key) === flight) {
        this.flights.delete(key);
      }
    };
    promise.then(settle).catch(settle);
    this.flights.set(key, flight);
    return flight;
  }

  private async join(
    key: string,
    flight: Flight<T>,
    signal: AbortSignal | undefined
  ): Promise<T> {
    flight.subscribers += 1;
    if (!signal) {
      return flight.promise;
    }

    let onAbort = (): void => undefined;
    const aborted = new Promise<never>((_resolve, reject) => {
      onAbort = () => {
        this.leave(key, flight);
        reject(abortReason(signal));
      };
    });
    signal.addEventListener("abort", onAbort, { once: true });
    try {
      return await Promise.race([flight.promise, aborted]);
    } finally {
      signal.removeEventListener("abort", onAbort);
    }
  }

  private leave(key: string, flight: Flight<T>): void {
    flight.subscribers -= 1;
    if (flight.subscribers > 0) {
      return;
    }
    // Nobody waits any more: stop the job, and let the next caller start a
    // fresh one instead of joining an abandoned flight.
    flight.controller.abort();
    if (this.flights.get(key) === flight) {
      this.flights.delete(key);
    }
  }
}

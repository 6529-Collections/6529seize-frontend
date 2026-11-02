import {
  BoundedResultCache,
  type CacheableResult,
} from "@/lib/cache/boundedResultCache";

// Each entry is charged its value bytes, two bytes per key character and a
// fixed 1 KiB overhead; keys below are one character long.
const KIB = 1024;
const entryBytes = (valueBytes: number) => valueBytes + 2 + KIB;

const result = (
  value: string,
  bytes = 0,
  ttlMs = 60_000
): CacheableResult<string> => ({ value, bytes, ttlMs });

const deferred = <T>() => {
  let resolve: (value: T) => void = () => undefined;
  let reject: (error: Error) => void = () => undefined;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
};

const createCache = (
  options: Partial<{
    maxBytes: number;
    maxEntryBytes: number;
    now: () => number;
  }> = {}
) =>
  new BoundedResultCache<string>({
    maxBytes: options.maxBytes ?? 64 * KIB,
    maxEntryBytes: options.maxEntryBytes ?? 16 * KIB,
    now: options.now,
  });

describe("BoundedResultCache", () => {
  it("serves a kept result without running the job again", async () => {
    const cache = createCache();
    const job = jest.fn(async () => result("first"));

    await expect(cache.load("a", job)).resolves.toBe("first");
    await expect(cache.load("a", job)).resolves.toBe("first");

    expect(job).toHaveBeenCalledTimes(1);
  });

  it("evicts the least recently used entries once the byte budget is exceeded", async () => {
    const cache = createCache({
      maxBytes: entryBytes(4 * KIB) * 2,
      maxEntryBytes: entryBytes(4 * KIB),
    });
    const load = (key: string) =>
      cache.load(key, async () => result(key, 4 * KIB));

    await load("a");
    await load("b");
    // Reading "a" makes "b" the least recently used entry.
    await cache.load("a", async () => result("stale"));
    await load("c");

    const reload = jest.fn(async () => result("reloaded", 4 * KIB));
    await expect(cache.load("a", reload)).resolves.toBe("a");
    await expect(cache.load("c", reload)).resolves.toBe("c");
    expect(reload).not.toHaveBeenCalled();
    await expect(cache.load("b", reload)).resolves.toBe("reloaded");
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("serves but never keeps a result above the per-entry cap", async () => {
    const cache = createCache({ maxEntryBytes: entryBytes(4 * KIB) });
    const job = jest.fn(async () => result("large", 4 * KIB + 1));

    await expect(cache.load("a", job)).resolves.toBe("large");
    await expect(cache.load("a", job)).resolves.toBe("large");

    expect(job).toHaveBeenCalledTimes(2);
  });

  it("expires entries after their time to live", async () => {
    let now = 1_000;
    const cache = createCache({ now: () => now });
    const job = jest.fn(async () => result("value", 0, 30_000));

    await cache.load("a", job);
    now += 29_999;
    await cache.load("a", job);
    expect(job).toHaveBeenCalledTimes(1);
    now += 1;
    await cache.load("a", job);
    expect(job).toHaveBeenCalledTimes(2);
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    "does not keep a result with a time to live of %p",
    async (ttlMs) => {
      const cache = createCache();
      const job = jest.fn(async () => result("value", 0, ttlMs));

      await cache.load("a", job);
      await cache.load("a", job);

      expect(job).toHaveBeenCalledTimes(2);
    }
  );

  it("shares one job between concurrent callers for the same key", async () => {
    const cache = createCache();
    const pending = deferred<CacheableResult<string>>();
    const job = jest.fn(() => pending.promise);

    const first = cache.load("a", job);
    const second = cache.load("a", job);
    const other = cache.load("b", async () => result("other"));
    pending.resolve(result("shared"));

    await expect(Promise.all([first, second, other])).resolves.toEqual([
      "shared",
      "shared",
      "other",
    ]);
    expect(job).toHaveBeenCalledTimes(1);
  });

  it("propagates a thrown job error to every waiter without keeping it", async () => {
    const cache = createCache();
    const pending = deferred<CacheableResult<string>>();
    const failing = jest.fn(() => pending.promise);

    const first = cache.load("a", failing);
    const second = cache.load("a", failing);
    pending.reject(new Error("busy"));

    await expect(first).rejects.toThrow("busy");
    await expect(second).rejects.toThrow("busy");
    await expect(cache.load("a", async () => result("later"))).resolves.toBe(
      "later"
    );
    expect(failing).toHaveBeenCalledTimes(1);
  });

  it("fails a job that throws before returning its promise", async () => {
    const cache = createCache();

    await expect(
      cache.load("a", () => {
        throw new Error("synchronous");
      })
    ).rejects.toThrow("synchronous");
    await expect(cache.load("a", async () => result("later"))).resolves.toBe(
      "later"
    );
  });

  it("keeps the job running while any caller still waits", async () => {
    const cache = createCache();
    const pending = deferred<CacheableResult<string>>();
    let jobSignal: AbortSignal | undefined;
    const job = jest.fn((signal: AbortSignal) => {
      jobSignal = signal;
      return pending.promise;
    });
    const leaving = new AbortController();

    const abandoned = cache.load("a", job, leaving.signal);
    const waiting = cache.load("a", job, new AbortController().signal);
    leaving.abort(new Error("left"));

    await expect(abandoned).rejects.toThrow("left");
    expect(jobSignal?.aborted).toBe(false);
    pending.resolve(result("done"));
    await expect(waiting).resolves.toBe("done");
  });

  it("aborts an abandoned job and starts a fresh one for the next caller", async () => {
    const cache = createCache();
    const signals: AbortSignal[] = [];
    const abandonedJob = deferred<CacheableResult<string>>();
    const controller = new AbortController();

    const abandoned = cache.load(
      "a",
      (signal) => {
        signals.push(signal);
        return abandonedJob.promise;
      },
      controller.signal
    );
    controller.abort(new Error("left"));

    await expect(abandoned).rejects.toThrow("left");
    expect(signals[0]?.aborted).toBe(true);
    await expect(cache.load("a", async () => result("fresh"))).resolves.toBe(
      "fresh"
    );
    abandonedJob.reject(new Error("aborted job"));
  });

  it("rejects an already aborted caller without starting a job", async () => {
    const cache = createCache();
    const controller = new AbortController();
    // A non-Error abort reason still rejects with an Error.
    controller.abort("gone");
    const job = jest.fn(async () => result("unused"));

    await expect(cache.load("a", job, controller.signal)).rejects.toThrow(
      "The request was aborted."
    );
    expect(job).not.toHaveBeenCalled();
  });

  it.each([
    { maxBytes: 0, maxEntryBytes: 0 },
    { maxBytes: 10, maxEntryBytes: 11 },
    { maxBytes: 1.5, maxEntryBytes: 1 },
  ])("rejects an invalid budget: %j", (options) => {
    expect(() => new BoundedResultCache<string>(options)).toThrow(RangeError);
  });
});

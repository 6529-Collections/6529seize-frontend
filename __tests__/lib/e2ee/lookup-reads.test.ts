/** @jest-environment node */
import {
  LookupDeferred,
  LookupReads,
  lookupRetryAfterMs,
} from "@/lib/e2ee/lookup-reads";
import { E2eeApiError } from "@/lib/e2ee/api-errors";

const unavailable = () =>
  new E2eeApiError({ status: 503, message: "unavailable" });

describe("identity lookup request budget", () => {
  it("aborts stalled requests, releases queued reads, and backs off timeouts", async () => {
    jest.useFakeTimers();
    try {
      const reads = new LookupReads(() => 0);
      const signals: AbortSignal[] = [];
      const stalled = Array.from({ length: 8 }, (_, n) =>
        reads.read(String(n), (signal) => {
          signals.push(signal);
          return new Promise<never>(() => undefined);
        })
      );
      const settled = Promise.allSettled(stalled);
      const queued = reads.read("queued", async () => "done");
      await jest.advanceTimersByTimeAsync(10_000);
      expect(await settled).toEqual(
        Array.from({ length: 8 }, () => ({
          status: "rejected",
          reason: expect.objectContaining({ status: 408 }),
        }))
      );
      expect(signals.every((signal) => signal.aborted)).toBe(true);
      await expect(queued).resolves.toBe("done");
      expect(reads.canRead("0")).toBe(false);
      expect(jest.getTimerCount()).toBe(0);
    } finally {
      jest.useRealTimers();
    }
  });

  it("forwards caller cancellation without consuming the retry budget", async () => {
    const reads = new LookupReads(() => 0);
    const caller = new AbortController();
    let requestSignal: AbortSignal | undefined;
    const request = reads.read(
      "alice",
      (signal) => {
        requestSignal = signal;
        return new Promise<never>(() => undefined);
      },
      caller.signal
    );
    const rejected = expect(request).rejects.toMatchObject({
      name: "AbortError",
    });
    await Promise.resolve();
    caller.abort();
    await rejected;
    expect(requestSignal?.aborted).toBe(true);
    await expect(reads.read("alice", async () => "Alice")).resolves.toBe(
      "Alice"
    );
  });

  it("does not send requests on repeated syncs before a retry deadline", async () => {
    let now = 0;
    const reads = new LookupReads(() => now);
    const fetch = jest.fn().mockRejectedValue(unavailable());
    await expect(reads.read("alice", fetch)).rejects.toThrow();
    for (let i = 0; i < 100; i += 1)
      await expect(reads.read("alice", fetch)).rejects.toBeInstanceOf(
        LookupDeferred
      );
    expect(fetch).toHaveBeenCalledTimes(1);
    for (const delay of [30_000, 120_000, 600_000]) {
      now += delay;
      await expect(reads.read("alice", fetch)).rejects.toThrow();
    }
    now += 600_000;
    await expect(reads.read("alice", fetch)).rejects.toBeInstanceOf(
      LookupDeferred
    );
    expect(fetch).toHaveBeenCalledTimes(4);
    reads.resume(["alice"]);
    fetch.mockResolvedValue("Alice");
    await expect(reads.read("alice", fetch)).resolves.toBe("Alice");
    expect(fetch).toHaveBeenCalledTimes(5);
  });

  it("shares a flight and honors Retry-After across both lookup stages", async () => {
    let now = 0;
    const reads = new LookupReads(() => now);
    const fetch = jest.fn().mockRejectedValue(
      new E2eeApiError({
        status: 429,
        message: "limited",
        retryAfterMs: 90_000,
      })
    );
    const first = reads.read("profile:alice", fetch);
    expect(reads.read("profile:alice", fetch)).toBe(first);
    await expect(first).rejects.toThrow("limited");
    now = 89_999;
    reads.resume();
    await expect(reads.read("device:bob", fetch)).rejects.toBeInstanceOf(
      LookupDeferred
    );
    expect(fetch).toHaveBeenCalledTimes(1);
    now = 90_000;
    fetch.mockResolvedValue("Bob");
    await expect(reads.read("device:bob", fetch)).resolves.toBe("Bob");
  });

  it("limits all callers to eight concurrent requests", async () => {
    const reads = new LookupReads(() => 0);
    const release: ((value: string) => void)[] = [];
    const fetch = jest.fn(
      () => new Promise<string>((resolve) => release.push(resolve))
    );
    const requests = Array.from({ length: 12 }, (_, n) =>
      reads.read(String(n), fetch)
    );
    await Promise.resolve();
    expect(fetch).toHaveBeenCalledTimes(8);
    release.forEach((resolve) => resolve("done"));
    await Promise.resolve();
    await Promise.resolve();
    // Let completions hand their slots to the remaining requests.
    await new Promise<void>((resolve) => setImmediate(resolve));
    release.slice(8).forEach((resolve) => resolve("done"));
    await expect(Promise.all(requests)).resolves.toHaveLength(12);
  });

  it("does not dispatch queued lookups after the shared budget is rate limited", async () => {
    const reads = new LookupReads(() => 0);
    const fetch = jest
      .fn()
      .mockRejectedValue(new E2eeApiError({ status: 429, message: "limited" }));
    const results = await Promise.allSettled(
      Array.from({ length: 20 }, (_, n) => reads.read(String(n), fetch))
    );
    expect(results.every((result) => result.status === "rejected")).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(8);
  });

  it("does not burn retry budgets for cancellation or offline/hidden work", async () => {
    let available = false;
    const reads = new LookupReads(
      () => 0,
      () => available
    );
    const fetch = jest
      .fn()
      .mockRejectedValue(new DOMException("cancelled", "AbortError"));
    await expect(reads.read("alice", fetch)).rejects.toBeInstanceOf(
      LookupDeferred
    );
    expect(fetch).not.toHaveBeenCalled();
    available = true;
    for (let n = 0; n < 5; n += 1)
      await expect(reads.read("alice", fetch)).rejects.toThrow("cancelled");
    expect(fetch).toHaveBeenCalledTimes(5);
  });

  it("does not automatically retry a missing identity or reset its cooldown on reopen", async () => {
    let now = 0;
    const reads = new LookupReads(() => now);
    const fetch = jest
      .fn()
      .mockRejectedValue(new E2eeApiError({ status: 404, message: "missing" }));
    await expect(reads.read("alice", fetch)).rejects.toThrow("missing");
    now = 299_999;
    reads.resume();
    await expect(reads.read("alice", fetch)).rejects.toBeInstanceOf(
      LookupDeferred
    );
    now = 300_000;
    await expect(reads.read("alice", fetch)).rejects.toBeInstanceOf(
      LookupDeferred
    );
    expect(fetch).toHaveBeenCalledTimes(1);
    reads.resume();
    fetch.mockResolvedValue("Alice");
    await expect(reads.read("alice", fetch)).resolves.toBe("Alice");
  });

  it("reads seconds and HTTP dates without accepting invalid headers", () => {
    const error = (value: string) => ({
      response: { headers: new Headers({ "Retry-After": value }) },
    });
    const now = Date.parse("2026-11-09T10:00:00Z");
    expect(lookupRetryAfterMs(error("90"), now)).toBe(90_000);
    expect(
      lookupRetryAfterMs(error("Mon, 09 Nov 2026 10:02:00 GMT"), now)
    ).toBe(120_000);
    expect(lookupRetryAfterMs(error("invalid"), now)).toBe(0);
  });
});

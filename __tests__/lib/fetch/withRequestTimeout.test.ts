import { createDeferredPromise } from "@/__tests__/utils/deferredPromise";
import { withRequestTimeout } from "@/lib/fetch/withRequestTimeout";

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

it("aborts a stalled read and rejects even if the request ignores cancellation", async () => {
  const pending = createDeferredPromise<string>();
  let requestSignal: AbortSignal | undefined;
  const result = withRequestTimeout(
    (signal) => {
      requestSignal = signal;
      return pending.promise;
    },
    { timeoutMs: 15_000 }
  );
  const failure = expect(result).rejects.toMatchObject({
    name: "TimeoutError",
  });
  await jest.advanceTimersByTimeAsync(15_000);
  await failure;
  expect(requestSignal?.aborted).toBe(true);
  pending.resolve("too late");
  expect(jest.getTimerCount()).toBe(0);
});

it("preserves caller cancellation and removes the deadline", async () => {
  const controller = new AbortController();
  const pending = createDeferredPromise<string>();
  const result = withRequestTimeout(() => pending.promise, {
    signal: controller.signal,
    timeoutMs: 15_000,
  });
  const failure = expect(result).rejects.toMatchObject({ name: "AbortError" });
  controller.abort();
  await failure;
  expect(jest.getTimerCount()).toBe(0);
});

it("disposes the deadline after success", async () => {
  await expect(
    withRequestTimeout(async () => "loaded", { timeoutMs: 15_000 })
  ).resolves.toBe("loaded");
  expect(jest.getTimerCount()).toBe(0);
});

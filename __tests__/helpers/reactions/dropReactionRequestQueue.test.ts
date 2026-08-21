import { createDeferredPromise } from "@/__tests__/utils/deferredPromise";
import {
  __resetDropReactionRequestQueueForTests,
  enqueueDropReactionRequest,
} from "@/helpers/reactions/dropReactionRequestQueue";

describe("dropReactionRequestQueue", () => {
  beforeEach(() => {
    __resetDropReactionRequestQueueForTests();
  });

  it("runs requests for the same drop in order", async () => {
    const firstRequest = createDeferredPromise<void>();
    const order: string[] = [];

    const first = enqueueDropReactionRequest("drop-1", async () => {
      order.push("first-started");
      await firstRequest.promise;
      order.push("first-finished");
    });
    const second = enqueueDropReactionRequest("drop-1", async () => {
      order.push("second-started");
    });

    await Promise.resolve();
    expect(order).toEqual(["first-started"]);

    firstRequest.resolve();
    await Promise.all([first, second]);

    expect(order).toEqual([
      "first-started",
      "first-finished",
      "second-started",
    ]);
  });

  it("continues the queue after a failed request", async () => {
    const firstError = new Error("first request failed");
    const first = enqueueDropReactionRequest("drop-1", async () => {
      throw firstError;
    });
    const secondRequest = jest.fn(async () => undefined);
    const second = enqueueDropReactionRequest("drop-1", secondRequest);

    await expect(first).rejects.toBe(firstError);
    await second;

    expect(secondRequest).toHaveBeenCalledTimes(1);
  });

  it("continues the queue after a request throws synchronously", async () => {
    const firstError = new Error("first request threw");
    const first = enqueueDropReactionRequest("drop-1", () => {
      throw firstError;
    });
    const secondRequest = jest.fn(async () => undefined);
    const second = enqueueDropReactionRequest("drop-1", secondRequest);

    await expect(first).rejects.toBe(firstError);
    await second;

    expect(secondRequest).toHaveBeenCalledTimes(1);
  });

  it("keeps different drops independent", async () => {
    const firstDropRequest = createDeferredPromise<void>();
    const order: string[] = [];

    const firstDrop = enqueueDropReactionRequest("drop-1", async () => {
      order.push("drop-1-started");
      await firstDropRequest.promise;
    });
    const secondDrop = enqueueDropReactionRequest("drop-2", async () => {
      order.push("drop-2-started");
    });

    await secondDrop;
    expect(order).toEqual(["drop-1-started", "drop-2-started"]);

    firstDropRequest.resolve();
    await firstDrop;
  });

  it("times out a stalled request and continues the queue", async () => {
    jest.useFakeTimers();
    try {
      let firstSignal: AbortSignal | undefined;
      const first = enqueueDropReactionRequest(
        "drop-1",
        async (signal) => {
          firstSignal = signal;
          await new Promise<void>(() => undefined);
        },
        { timeoutMs: 100 }
      );
      const firstFailure = expect(first).rejects.toMatchObject({
        message: "Reaction request timed out",
        name: "TimeoutError",
      });
      const secondRequest = jest.fn(async () => undefined);
      const second = enqueueDropReactionRequest("drop-1", secondRequest);

      await Promise.resolve();
      expect(secondRequest).not.toHaveBeenCalled();

      await jest.advanceTimersByTimeAsync(100);
      await firstFailure;
      await second;

      expect(firstSignal?.aborted).toBe(true);
      expect(secondRequest).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });
});

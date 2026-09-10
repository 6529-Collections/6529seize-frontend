import {
  AdmissionQueue,
  AdmissionQueueError,
} from "@/lib/fetch/admissionQueue";

describe("AdmissionQueue", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("admits one caller at a time in FIFO order", async () => {
    const queue = new AdmissionQueue({ maxPending: 2, waitMs: 100 });
    const order: number[] = [];
    const releaseFirst = await queue.acquire();
    const second = queue.acquire().then((release) => {
      order.push(2);
      return release;
    });
    const third = queue.acquire().then((release) => {
      order.push(3);
      return release;
    });
    await Promise.resolve();
    expect(order).toEqual([]);

    releaseFirst();
    const releaseSecond = await second;
    expect(order).toEqual([2]);
    releaseSecond();
    const releaseThird = await third;
    expect(order).toEqual([2, 3]);
    releaseThird();
    expect(jest.getTimerCount()).toBe(0);
  });

  it("rejects excess pending callers without releasing the active caller", async () => {
    const queue = new AdmissionQueue({ maxPending: 1, waitMs: 100 });
    const releaseFirst = await queue.acquire();
    let admittedSecond = false;
    const second = queue.acquire().then((release) => {
      admittedSecond = true;
      return release;
    });

    await expect(queue.acquire()).rejects.toMatchObject({
      name: "AdmissionQueueError",
      kind: "full",
    });
    expect(admittedSecond).toBe(false);
    releaseFirst();
    (await second)();
    (await queue.acquire())();
    expect(jest.getTimerCount()).toBe(0);
  });

  it("expires a waiter and frees its queue capacity and abort listener", async () => {
    const queue = new AdmissionQueue({ maxPending: 1, waitMs: 20 });
    const releaseFirst = await queue.acquire();
    const controller = new AbortController();
    const removeListener = jest.spyOn(controller.signal, "removeEventListener");
    const expired = queue
      .acquire(controller.signal)
      .catch((error: unknown) => error);
    jest.advanceTimersByTime(20);

    expect(await expired).toMatchObject({ kind: "timeout" });
    expect(removeListener).toHaveBeenCalledWith("abort", expect.any(Function));
    expect(jest.getTimerCount()).toBe(0);
    const replacement = queue.acquire();
    releaseFirst();
    (await replacement)();
  });

  it("removes an aborted waiter while preserving the next caller's turn", async () => {
    const queue = new AdmissionQueue({ maxPending: 2, waitMs: 100 });
    const releaseFirst = await queue.acquire();
    const controller = new AbortController();
    const removeListener = jest.spyOn(controller.signal, "removeEventListener");
    const aborted = queue
      .acquire(controller.signal)
      .catch((error: unknown) => error);
    const next = queue.acquire();
    controller.abort();

    expect(await aborted).toBeInstanceOf(AdmissionQueueError);
    expect(await aborted).toMatchObject({ kind: "aborted" });
    expect(removeListener).toHaveBeenCalledWith("abort", expect.any(Function));
    expect(jest.getTimerCount()).toBe(1);
    releaseFirst();
    (await next)();
    expect(jest.getTimerCount()).toBe(0);
  });

  it("does not reserve a slot for an already aborted request", async () => {
    const queue = new AdmissionQueue({ maxPending: 0, waitMs: 100 });
    const controller = new AbortController();
    controller.abort();
    await expect(queue.acquire(controller.signal)).rejects.toMatchObject({
      kind: "aborted",
    });
    (await queue.acquire())();
    expect(jest.getTimerCount()).toBe(0);
  });

  it("keeps granted ownership until release, including repeated release and abort", async () => {
    const queue = new AdmissionQueue({ maxPending: 2, waitMs: 100 });
    const releaseFirst = await queue.acquire();
    const controller = new AbortController();
    const removeListener = jest.spyOn(controller.signal, "removeEventListener");
    const second = queue.acquire(controller.signal);
    releaseFirst();
    const releaseSecond = await second;
    let admittedThird = false;
    const third = queue.acquire().then((release) => {
      admittedThird = true;
      return release;
    });

    releaseFirst();
    controller.abort();
    await Promise.resolve();
    expect(admittedThird).toBe(false);
    expect(removeListener).toHaveBeenCalledWith("abort", expect.any(Function));
    releaseSecond();
    (await third)();
    releaseSecond();
    expect(jest.getTimerCount()).toBe(0);
  });

  it("rejects elapsed deadlines even before a delayed timer callback runs", async () => {
    const queue = new AdmissionQueue({ maxPending: 1, waitMs: 100 });
    const release = await queue.acquire();
    const pending = queue.acquire().catch((error: unknown) => error);
    jest.setSystemTime(Date.now() + 100);
    release();

    expect(await pending).toMatchObject({ kind: "timeout" });
    expect(jest.getTimerCount()).toBe(0);
    (await queue.acquire())();
  });

  it.each([
    { maxPending: -1, waitMs: 100 },
    { maxPending: 1.5, waitMs: 100 },
    { maxPending: 1, waitMs: 0 },
    { maxPending: 1, waitMs: Number.POSITIVE_INFINITY },
    { maxPending: 1, waitMs: 2_147_483_648 },
  ])("rejects invalid bounds: %j", (options) => {
    expect(() => new AdmissionQueue(options)).toThrow(RangeError);
  });
});

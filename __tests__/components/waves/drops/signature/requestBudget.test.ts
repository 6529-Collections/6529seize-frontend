import {
  createRequestBudget,
  RateLimitedError,
} from "@/components/waves/drops/signature/requestBudget";

const newBudget = () =>
  createRequestBudget({
    maxRequestsPerWindow: 2,
    windowMs: 1000,
    minPauseMs: 5000,
    maxPauseMs: 5 * 60_000,
    timeoutMs: 20_000,
  });

const START = Date.UTC(2027, 0, 1);

/** Calls takeSlot for each name now and records when each may start. */
const startTimes = (
  budget: ReturnType<typeof newBudget>,
  names: readonly string[],
  started: Map<string, number>
): void => {
  names.forEach((name) => {
    void budget.takeSlot().then(() => {
      started.set(name, Date.now() - START);
    });
  });
};

const rateLimited = (retryAfter: string | null) =>
  Object.assign(new Error("Too many requests"), {
    status: 429,
    // The structured API error's response headers (a Headers object).
    headers: {
      get: (name: string) =>
        name.toLowerCase() === "retry-after" ? retryAfter : null,
    },
  });

describe("the seal checks' request budget", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(START);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("starts at most two requests per window, in call order", async () => {
    const budget = newBudget();
    const started = new Map<string, number>();
    startTimes(budget, ["a", "b", "c", "d", "e"], started);
    await jest.advanceTimersByTimeAsync(0);
    expect([...started]).toEqual([
      ["a", 0],
      ["b", 0],
    ]);
    await jest.advanceTimersByTimeAsync(5000);
    expect([...started]).toEqual([
      ["a", 0],
      ["b", 0],
      ["c", 1000],
      ["d", 1000],
      ["e", 2000],
    ]);
  });

  it("reserves a waiting caller's slot, so a later caller cannot take it", async () => {
    const budget = newBudget();
    const started = new Map<string, number>();
    startTimes(budget, ["a", "b", "c", "d", "e"], started);
    // "e" holds a reservation for 2000; "f" and "g" arrive while it waits.
    await jest.advanceTimersByTimeAsync(1500);
    startTimes(budget, ["f", "g"], started);
    await jest.advanceTimersByTimeAsync(5000);
    expect(started.get("e")).toBe(2000);
    expect(started.get("f")).toBe(2000);
    expect(started.get("g")).toBe(3000);
    expect([...started.keys()]).toEqual(["a", "b", "c", "d", "e", "f", "g"]);
  });

  it("never lets two callers woken in the same tick share one slot", async () => {
    const budget = newBudget();
    const started = new Map<string, number>();
    startTimes(budget, ["a", "b", "c", "d", "e", "f"], started);
    await jest.advanceTimersByTimeAsync(10_000);
    const times = [...started.values()];
    // No window of 1000 ms holds more than two starts.
    times.forEach((time) => {
      expect(
        times.filter((other) => other >= time && other < time + 1000)
      ).toHaveLength(2);
    });
  });

  it.each([
    ["seconds", "30", 30_000],
    ["an HTTP date", new Date(START + 45_000).toUTCString(), 45_000],
    [
      "a date in the past (at least 5 seconds)",
      "Thu, 01 Jan 1970 00:00:00 GMT",
      5000,
    ],
    ["an unreadable value (at least 5 seconds)", "soon", 5000],
    ["more than 5 minutes (at most 5 minutes)", "3600", 5 * 60_000],
    ["no Retry-After (5 seconds)", null, 5000],
  ])(
    "pauses every request after a 429 for a Retry-After given as %s",
    async (_name, retryAfter, pauseMs) => {
      const budget = newBudget();
      await expect(
        budget.request(() => Promise.reject(rateLimited(retryAfter)))
      ).rejects.toBeInstanceOf(RateLimitedError);
      expect(budget.pauseRemainingMs()).toBe(pauseMs);

      const started = new Map<string, number>();
      startTimes(budget, ["next"], started);
      await jest.advanceTimersByTimeAsync(pauseMs - 1);
      expect(started.has("next")).toBe(false);
      await jest.advanceTimersByTimeAsync(1);
      expect(started.get("next")).toBe(pauseMs);
    }
  );

  it("keeps a caller that was already waiting behind a pause that starts meanwhile", async () => {
    const budget = newBudget();
    const started = new Map<string, number>();
    startTimes(budget, ["a", "b", "c"], started);
    await jest.advanceTimersByTimeAsync(0);
    // "c" waits for 1000; a 429 at 500 pauses everything until 5500.
    await jest.advanceTimersByTimeAsync(500);
    await expect(
      budget.run(() => Promise.reject(rateLimited(null)))
    ).rejects.toBeInstanceOf(RateLimitedError);
    await jest.advanceTimersByTimeAsync(4999);
    expect(started.has("c")).toBe(false);
    await jest.advanceTimersByTimeAsync(1);
    expect(started.get("c")).toBe(5500);
  });

  it("lets a slot that was given back unused go to the next caller", async () => {
    const budget = newBudget();
    const started = new Map<string, number>();
    startTimes(budget, ["a", "b"], started);
    const unused = budget.takeSlot();
    await jest.advanceTimersByTimeAsync(1000);
    (await unused)();
    startTimes(budget, ["c", "d"], started);
    await jest.advanceTimersByTimeAsync(0);
    // Without the slot given back, "d" would wait until 2000.
    expect(started.get("c")).toBe(1000);
    expect(started.get("d")).toBe(1000);
  });

  it("aborts a request that takes longer than its timeout", async () => {
    const budget = newBudget();
    const result = budget.request(
      (signal) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener("abort", () => reject(new Error("aborted")));
        })
    );
    const settled = expect(result).rejects.toThrow("aborted");
    await jest.advanceTimersByTimeAsync(20_000);
    await settled;
  });
});

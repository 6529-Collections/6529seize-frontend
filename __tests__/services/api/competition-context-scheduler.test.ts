import { createCompetitionContextScheduler } from "@/services/api/competition-context-scheduler";

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(0);
});

afterEach(() => {
  jest.useRealTimers();
});

it("spreads a chat's hundred lookups instead of issuing an API burst", async () => {
  const schedule = createCompetitionContextScheduler();
  const starts: number[] = [];
  const results = Array.from({ length: 100 }, (_, index) =>
    schedule(async () => {
      starts.push(Date.now());
      return index;
    })
  );

  expect(starts).toEqual([0]);
  await jest.advanceTimersByTimeAsync(999);
  expect(starts).toEqual([0, 250, 500, 750]);
  await jest.advanceTimersByTimeAsync(25000);
  expect(await Promise.all(results)).toEqual(
    Array.from({ length: 100 }, (_, index) => index)
  );
  expect(starts).toEqual(
    Array.from({ length: 100 }, (_, index) => index * 250)
  );
  expect(jest.getTimerCount()).toBe(0);
});

it("bounds concurrent slow requests while preserving queue order", async () => {
  const schedule = createCompetitionContextScheduler();
  const completions: Array<() => void> = [];
  const results = Array.from({ length: 3 }, () =>
    schedule(() => new Promise<void>((resolve) => completions.push(resolve)))
  );
  await jest.advanceTimersByTimeAsync(10000);
  expect(completions).toHaveLength(2);
  completions[0]!();
  await results[0];
  await jest.advanceTimersByTimeAsync(0);
  expect(completions).toHaveLength(3);
  completions[1]!();
  completions[2]!();
  await Promise.all(results);
  expect(jest.getTimerCount()).toBe(0);
});

it("removes aborted queued work without sending it or retaining a timer", async () => {
  const schedule = createCompetitionContextScheduler();
  const controller = new AbortController();
  const request = jest.fn(async () => "unneeded");
  const first = schedule(async () => "first");
  const cancelled = schedule(request, controller.signal);
  const rejection = expect(cancelled).rejects.toMatchObject({
    name: "AbortError",
  });

  controller.abort();
  await rejection;
  await first;
  await jest.advanceTimersByTimeAsync(1000);
  expect(request).not.toHaveBeenCalled();
  expect(jest.getTimerCount()).toBe(0);
});

it("rejects an already aborted lookup before dispatch", async () => {
  const schedule = createCompetitionContextScheduler();
  const controller = new AbortController();
  controller.abort();
  const request = jest.fn(async () => "unneeded");

  await expect(schedule(request, controller.signal)).rejects.toMatchObject({
    name: "AbortError",
  });
  expect(request).not.toHaveBeenCalled();
  expect(jest.getTimerCount()).toBe(0);
});

it("preserves request errors and allows the next lookup to proceed", async () => {
  const schedule = createCompetitionContextScheduler();
  const error = new Error("HTTP 429");
  const failed = schedule(() => Promise.reject(error));
  const rejection = expect(failed).rejects.toBe(error);
  const next = schedule(async () => "next");

  await rejection;
  await jest.advanceTimersByTimeAsync(250);
  await expect(next).resolves.toBe("next");
  expect(jest.getTimerCount()).toBe(0);
});

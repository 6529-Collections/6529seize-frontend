import { simulateGapSyncBurst } from "../../tests/support/gapSyncSchedule";

const seconds = (...values: number[]) => values.map((value) => value * 1_000);
const every = (from: number, to: number, step: number) => {
  const frames: number[] = [];
  for (let at = from; at <= to + 1e-9; at += step) frames.push(at);
  return seconds(...frames);
};

describe("simulateGapSyncBurst", () => {
  it("gives a back-to-back burst one check 5 s after the last frame and one read", () => {
    const frames = [0, 10, 20, 30, 40, 50, 60, 70, 80];
    expect(simulateGapSyncBurst(frames)).toEqual({
      checks: { min: 1, max: 1 },
      trailingCheckAt: { min: 5_080, max: 5_080 },
      readWindows: { min: 1, max: 1 },
    });
  });

  it("lets the 15 s max wait fire the only check of a 12 s burst", () => {
    // Every 1.5 s from 0 to 12 s: the max wait (15 s) comes before
    // last frame + 5 s (17 s), and it is the check after the last frame.
    const result = simulateGapSyncBurst(every(0, 12, 1.5));
    expect(result.checks).toEqual({ min: 1, max: 1 });
    expect(result.trailingCheckAt).toEqual({ min: 15_000, max: 15_000 });
  });

  it("opens the next window at the first frame after a check (15/19/31.1 s)", () => {
    // A max-wait check at 15 s; the next frame at 19 s opens a window whose
    // max wait is due at 34 s, after a burst that ends at 31.1 s.
    const frames = [...every(0, 12, 2), ...every(19, 31, 2), 31_100];
    const result = simulateGapSyncBurst(frames);
    expect(result.checks).toEqual({ min: 2, max: 2 });
    expect(result.trailingCheckAt).toEqual({ min: 34_000, max: 34_000 });
  });

  it("adds a check for each pause past the trailing delay", () => {
    const result = simulateGapSyncBurst(seconds(0, 0.1, 7, 7.1));
    expect(result.checks).toEqual({ min: 2, max: 2 });
    expect(result.trailingCheckAt).toEqual({ min: 12_100, max: 12_100 });
    expect(result.readWindows).toEqual({ min: 2, max: 2 });
  });

  it("allows either outcome when a frame lands near a deadline", () => {
    // The check is due at 5 s and the frame comes at 5.5 s.
    const result = simulateGapSyncBurst(seconds(0, 5.5));
    expect(result.checks).toEqual({ min: 1, max: 2 });
    expect(result.trailingCheckAt).toEqual({ min: 10_500, max: 10_500 });
  });

  it("counts read windows, ranging only near a window's end", () => {
    expect(simulateGapSyncBurst(seconds(0, 0.5, 1)).readWindows).toEqual({
      min: 1,
      max: 1,
    });
    expect(simulateGapSyncBurst(seconds(0, 4.5)).readWindows).toEqual({
      min: 2,
      max: 2,
    });
    expect(simulateGapSyncBurst(seconds(0, 3.2)).readWindows).toEqual({
      min: 1,
      max: 2,
    });
  });

  it("orders frames by time", () => {
    expect(simulateGapSyncBurst([80, 0, 40]).trailingCheckAt).toEqual({
      min: 5_080,
      max: 5_080,
    });
  });
});

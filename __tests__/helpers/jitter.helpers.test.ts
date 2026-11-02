import { applyDelayJitter, scheduleStaggered } from "@/helpers/jitter.helpers";
import { mockRandomUnit } from "./mockRandomUnit";

describe("jitter.helpers", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  describe("applyDelayJitter", () => {
    it.each([
      [0, 750],
      [0.5, 1000],
      [0.999999, 1250],
    ])(
      "scales the delay within +/-25%% (random unit %p -> %p ms)",
      (unit, expected) => {
        mockRandomUnit(unit);
        expect(applyDelayJitter(1000, 0.25)).toBe(expected);
      }
    );

    it("never leaves the [1 - ratio, 1 + ratio] band across the random range", () => {
      for (const unit of [0, 0.1, 0.25, 0.5, 0.75, 0.9, 0.999999]) {
        mockRandomUnit(unit);
        const delay = applyDelayJitter(2000, 0.25);
        expect(delay).toBeGreaterThanOrEqual(1500);
        expect(delay).toBeLessThanOrEqual(2500);
      }
    });

    it("uses the requested ratio", () => {
      mockRandomUnit(0);
      expect(applyDelayJitter(1000, 0.2)).toBe(800);
    });

    it("falls back to the undelayed value when Web Crypto is unavailable", () => {
      jest
        .spyOn(globalThis.crypto, "getRandomValues")
        .mockImplementation(() => {
          throw new Error("crypto unavailable");
        });
      expect(applyDelayJitter(1000, 0.25)).toBe(1000);
    });
  });

  describe("scheduleStaggered", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    it.each([
      [0.0004, 1],
      [0.5, 1500],
      [0.999999, 2999],
    ])(
      "runs the callback after a random delay below 3000 ms (random unit %p -> %p ms)",
      (unit, delayMs) => {
        mockRandomUnit(unit);
        const callback = jest.fn();

        scheduleStaggered(callback, 3000);

        jest.advanceTimersByTime(delayMs - 1);
        expect(callback).not.toHaveBeenCalled();
        jest.advanceTimersByTime(1);
        expect(callback).toHaveBeenCalledTimes(1);
      }
    );

    it("can run immediately when the random draw is zero", () => {
      mockRandomUnit(0);
      const callback = jest.fn();

      scheduleStaggered(callback, 3000);
      jest.advanceTimersByTime(0);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("does not run the callback once cancelled", () => {
      mockRandomUnit(0.5);
      const callback = jest.fn();

      const cancel = scheduleStaggered(callback, 3000);
      cancel();
      jest.advanceTimersByTime(3000);

      expect(callback).not.toHaveBeenCalled();
    });
  });
});

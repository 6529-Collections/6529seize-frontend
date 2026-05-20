import {
  formatSlowModeInterval,
  getSlowModeInputParts,
  getSlowModeRemainingMs,
} from "@/helpers/waves/slow-mode.helpers";

describe("slow-mode.helpers", () => {
  describe("getSlowModeInputParts", () => {
    it.each([null, undefined, 0, 999, Number.NaN])(
      "returns default input parts for %p",
      (cooldownMs) => {
        expect(getSlowModeInputParts(cooldownMs)).toEqual({
          value: 30,
          unit: "seconds",
        });
      }
    );

    it("keeps valid cooldown formatting behavior", () => {
      expect(getSlowModeInputParts(60_000)).toEqual({
        value: 1,
        unit: "minutes",
      });
      expect(getSlowModeInputParts(90_000)).toEqual({
        value: 90,
        unit: "seconds",
      });
    });
  });

  describe("formatSlowModeInterval", () => {
    it.each([null, undefined, 0, 999, Number.NaN])(
      "formats %p as off",
      (cooldownMs) => {
        expect(formatSlowModeInterval(cooldownMs)).toBe("Off");
      }
    );

    it("keeps valid interval formatting behavior", () => {
      expect(formatSlowModeInterval(1_000)).toBe("1s");
      expect(formatSlowModeInterval(60_000)).toBe("1m");
      expect(formatSlowModeInterval(3_600_000)).toBe("1h");
      expect(formatSlowModeInterval(90_000)).toBe("90s");
    });
  });

  describe("getSlowModeRemainingMs", () => {
    it.each([null, undefined, 0, Number.NaN])(
      "returns 0 for %p",
      (nextDropAllowed) => {
        expect(getSlowModeRemainingMs({ nextDropAllowed, now: 1_000 })).toBe(0);
      }
    );

    it("returns the remaining cooldown for future timestamps", () => {
      expect(
        getSlowModeRemainingMs({ nextDropAllowed: 12_000, now: 10_000 })
      ).toBe(2_000);
    });

    it("returns 0 for elapsed timestamps", () => {
      expect(
        getSlowModeRemainingMs({ nextDropAllowed: 9_000, now: 10_000 })
      ).toBe(0);
    });
  });
});

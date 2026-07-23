import {
  getTimeAgo,
  getTimeAgoShort,
  getTimeUntil,
} from "@/helpers/timeDisplayHelpers";

describe("timeDisplayHelpers", () => {
  const now = Date.UTC(2026, 6, 21, 12);

  beforeEach(() => {
    jest.spyOn(Date, "now").mockReturnValue(now);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("preserves long relative-time output", () => {
    expect(getTimeAgo(now - 2 * 60 * 60 * 1000)).toBe("2 hours ago");
    expect(getTimeAgo(now - 30 * 1000)).toBe("Just now");
  });

  it("preserves short relative-time output", () => {
    expect(getTimeAgoShort(now - 5 * 60 * 1000, now)).toBe("5m");
    expect(getTimeAgoShort(now - 3 * 24 * 60 * 60 * 1000, now, true)).toBe(
      "3d"
    );
  });

  it.each([
    ["minute", 60 * 1000, "in 1 minute ", " 1 minute ago"],
    ["minutes", 2 * 60 * 1000, "in 2 minutes ", " 2 minutes ago"],
    ["hour", 60 * 60 * 1000, "in 1 hour ", " 1 hour ago"],
    ["day", 24 * 60 * 60 * 1000, "in 1 day ", " 1 day ago"],
    ["month", 30 * 24 * 60 * 60 * 1000, "in 1 month ", " 1 month ago"],
    ["year", 360 * 24 * 60 * 60 * 1000, "in 1 year ", " 1 year ago"],
  ])(
    "preserves getTimeUntil output for %s values",
    (_unit, duration, futureOutput, pastOutput) => {
      expect(getTimeUntil(now + duration)).toBe(futureOutput);
      expect(getTimeUntil(now - duration)).toBe(pastOutput);
    }
  );

  it("returns Just now for sub-minute values", () => {
    expect(getTimeUntil(now + 30 * 1000)).toBe("Just now");
    expect(getTimeUntil(now - 30 * 1000)).toBe("Just now");
  });
});

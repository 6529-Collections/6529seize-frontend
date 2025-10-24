import { buildMultiplierCycleProgress } from "@/components/xtdh/stats-overview/data-builders";
import {
  extractCountdownLabel,
  formatLastUpdatedLabel,
  parseCountdownToDays,
  parseTimeframeToMonths,
} from "@/components/xtdh/stats-overview/utils";

describe("extractCountdownLabel", () => {
  it("returns countdown label when string contains numeric window", () => {
    expect(extractCountdownLabel("in 30 days")).toBe("30 days");
    expect(extractCountdownLabel("within 1 week")).toBe("1 week");
    expect(extractCountdownLabel("In 2 Months")).toBe("2 months");
  });

  it("returns null when string has no parseable countdown", () => {
    expect(extractCountdownLabel("soon")).toBeNull();
    expect(extractCountdownLabel("")).toBeNull();
    expect(extractCountdownLabel("on July 20")).toBeNull();
  });
});

describe("parseCountdownToDays", () => {
  it("converts supported units to day counts", () => {
    expect(parseCountdownToDays("in 12 days")).toBe(12);
    expect(parseCountdownToDays("within 2 weeks")).toBe(14);
    expect(parseCountdownToDays("In 1 month")).toBe(30);
    expect(parseCountdownToDays("within 0 days")).toBe(0);
  });

  it("returns null when countdown cannot be parsed", () => {
    expect(parseCountdownToDays("soon")).toBeNull();
    expect(parseCountdownToDays("July 20")).toBeNull();
    expect(parseCountdownToDays("")).toBeNull();
  });
});

describe("parseTimeframeToMonths", () => {
  it("parses month and year units", () => {
    expect(parseTimeframeToMonths("36 months")).toBe(36);
    expect(parseTimeframeToMonths("1 year")).toBe(12);
    expect(parseTimeframeToMonths("2 yrs")).toBe(24);
  });

  it("parses week-based estimates to fractional months", () => {
    expect(parseTimeframeToMonths("8 weeks")).toBeCloseTo(1.84, 2);
  });

  it("returns null when timeframe cannot be parsed", () => {
    expect(parseTimeframeToMonths("soon")).toBeNull();
    expect(parseTimeframeToMonths("")).toBeNull();
  });
});

describe("formatLastUpdatedLabel", () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.setSystemTime(new Date("2024-01-01T12:00:00Z"));
  });

  it("produces a relative label for recent updates", () => {
    expect(formatLastUpdatedLabel("2024-01-01T11:45:00Z")).toBe("Updated 15 min ago");
  });

  it("falls back to a calendar label for older updates", () => {
    const label = formatLastUpdatedLabel("2023-12-20T09:30:00Z");
    expect(label).toMatch(/^Updated /);
    expect(label).toContain("•");
  });

  it("returns null when the timestamp cannot be parsed", () => {
    expect(formatLastUpdatedLabel("not-a-date")).toBeNull();
    expect(formatLastUpdatedLabel(null)).toBeNull();
  });
});

describe("buildMultiplierCycleProgress", () => {
  it("returns a simulated progress snapshot from the countdown string", () => {
    const progress = buildMultiplierCycleProgress("in 30 days");

    expect(progress).not.toBeNull();
    expect(progress).toMatchObject({
      totalDays: 50,
      elapsedDays: 20,
      remainingDays: 30,
    });
    expect(progress?.percentComplete).toBeCloseTo(40, 5);
  });

  it("returns 100 percent when no days remain", () => {
    const progress = buildMultiplierCycleProgress("in 0 days");

    expect(progress).not.toBeNull();
    expect(progress?.percentComplete).toBe(100);
    expect(progress?.elapsedDays).toBe(progress?.totalDays);
  });

  it("returns null when countdown cannot be interpreted", () => {
    expect(buildMultiplierCycleProgress("July 20, 2025")).toBeNull();
    expect(buildMultiplierCycleProgress("")).toBeNull();
  });
});

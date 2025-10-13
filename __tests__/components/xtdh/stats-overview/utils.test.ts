import { buildLongTermScheduleMetrics } from "@/components/xtdh/stats-overview/data-builders";
import {
  extractCountdownLabel,
  formatLastUpdatedLabel,
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

describe("buildLongTermScheduleMetrics", () => {
  it("maps milestones to stats metrics with percentage and timeframe", () => {
    const milestones = [
      { percentage: 30, timeframe: "36 months" },
      { percentage: 100, timeframe: "120 months" },
    ] as const;

    const metrics = buildLongTermScheduleMetrics(milestones);

    expect(metrics).toHaveLength(2);
    expect(metrics[0]).toMatchObject({
      label: "Milestone 1",
      value: "+30%",
      helperText: "≈ 36 months",
    });
    expect(metrics[1]).toMatchObject({
      label: "Milestone 2",
      value: "+100%",
      helperText: "≈ 120 months",
    });
    expect(metrics[0].positionPercent).toBeCloseTo(30);
    expect(metrics[1].positionPercent).toBe(100);
  });

  it("falls back to even spacing when timeframe cannot be parsed", () => {
    const metrics = buildLongTermScheduleMetrics([
      { percentage: 10, timeframe: "soon" },
      { percentage: 20, timeframe: "TBD" },
      { percentage: 30, timeframe: "later" },
    ]);

    expect(metrics).toHaveLength(3);
    expect(metrics.map((metric) => metric.positionPercent)).toEqual([5, 50, 100]);
  });

  it("returns an empty list when no milestones are provided", () => {
    expect(buildLongTermScheduleMetrics([])).toEqual([]);
  });
});

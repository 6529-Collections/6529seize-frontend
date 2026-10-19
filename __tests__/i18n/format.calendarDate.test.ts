import { formatDate, formatUtcDate } from "@/i18n/format";
import {
  EXTREME_TIME_ZONES,
  runInTimeZone,
  TEST_TIME_ZONES,
} from "../utils/timeZoneHarness";

jest.setTimeout(60_000);

const FORMAT_MODULE = "i18n/format.ts";
const ALL_ZONES = [...TEST_TIME_ZONES, ...EXTREME_TIME_ZONES];
const SHORT_DATE = {
  day: "numeric",
  month: "short",
  year: "numeric",
} satisfies Intl.DateTimeFormatOptions;
const LONG_DATE = {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
} satisfies Intl.DateTimeFormatOptions;

describe("formatDate with date-only strings", () => {
  it.each(ALL_ZONES)(
    "renders YYYY-MM-DD as that calendar day in %s",
    (zone) => {
      expect(
        runInTimeZone<string>(zone, FORMAT_MODULE, "formatDate", [
          ["en-US", "2026-10-12"],
          ["en-US", "2026-01-01"],
          ["en-US", "2026-12-31"],
          ["en-US", "2028-02-29"],
          ["en-US", "2026-10-12", LONG_DATE],
          [
            "en-GB",
            "2026-10-12",
            { day: "numeric", month: "long", year: "numeric" },
          ],
        ])
      ).toEqual([
        "Oct 12, 2026",
        "Jan 1, 2026",
        "Dec 31, 2026",
        "Feb 29, 2028",
        "Monday, October 12, 2026",
        "12 October 2026",
      ]);
    }
  );

  it.each(ALL_ZONES)(
    "ignores a caller timeZone for a calendar date in %s",
    (zone) => {
      expect(
        runInTimeZone<string>(zone, FORMAT_MODULE, "formatDate", [
          [
            "en-US",
            "2026-10-12",
            { ...SHORT_DATE, timeZone: "Pacific/Kiritimati" },
          ],
          [
            "en-US",
            "2026-10-12",
            { ...SHORT_DATE, timeZone: "Pacific/Pago_Pago" },
          ],
        ])
      ).toEqual(["Oct 12, 2026", "Oct 12, 2026"]);
    }
  );

  it.each([
    "2026-02-30",
    "2026-13-01",
    "2026-00-10",
    "2026-04-31",
    "2027-02-29",
  ])("renders the impossible day %s as a dash", (value) => {
    expect(formatDate("en-US", value)).toBe("-");
  });

  it("does not treat other string shapes as calendar dates", () => {
    expect(formatDate("en-US", "20261012")).toBe("-");
    expect(formatDate("en-US", "not a date")).toBe("-");
    expect(formatDate("en-US", "")).toBe("-");
    expect(formatDate("en-US", null)).toBe("-");
    expect(formatDate("en-US", undefined)).toBe("-");
  });
});

describe("formatDate with instants", () => {
  const EPOCH_MS = Date.UTC(2026, 9, 12);

  it.each([
    ["UTC", "Oct 12, 2026"],
    ["America/Los_Angeles", "Oct 11, 2026"],
    ["Pacific/Auckland", "Oct 12, 2026"],
    ["Pacific/Pago_Pago", "Oct 11, 2026"],
    ["Pacific/Kiritimati", "Oct 12, 2026"],
  ])(
    "keeps formatting an instant in the runtime zone (%s)",
    (zone, expected) => {
      expect(
        runInTimeZone<string>(zone, FORMAT_MODULE, "formatDate", [
          ["en-US", "2026-10-12T00:00:00.000Z"],
          ["en-US", EPOCH_MS],
        ])
      ).toEqual([expected, expected]);
    }
  );

  it("honours an explicit timeZone for an instant", () => {
    expect(
      formatDate("en-US", "2026-10-12T00:00:00.000Z", {
        day: "numeric",
        month: "short",
        timeZone: "America/Los_Angeles",
        year: "numeric",
      })
    ).toBe("Oct 11, 2026");
  });
});

describe("formatUtcDate", () => {
  it.each(ALL_ZONES)("prints the UTC day of an instant in %s", (zone) => {
    expect(
      runInTimeZone<string>(zone, FORMAT_MODULE, "formatUtcDate", [
        ["en-US", "2026-10-12T00:30:00.000Z"],
        ["en-US", "2026-10-12T23:30:00.000Z"],
        ["en-US", Date.UTC(2026, 9, 12, 23, 59, 59)],
        ["en-US", "2026-10-12"],
        ["en-US", "2026-10-12T12:00:00Z", { month: "long", year: "numeric" }],
      ])
    ).toEqual([
      "Oct 12, 2026",
      "Oct 12, 2026",
      "Oct 12, 2026",
      "Oct 12, 2026",
      "October 2026",
    ]);
  });

  it("renders invalid values as a dash", () => {
    expect(formatUtcDate("en-US", "nope")).toBe("-");
    expect(formatUtcDate("en-US", null)).toBe("-");
  });
});

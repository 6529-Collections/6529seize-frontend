import {
  getLocalDateInputValue,
  parseLocalDateTime,
} from "@/helpers/block-finder.helpers";

function localParts(date: Date) {
  return [
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
  ];
}

// These assertions compare LOCAL components, so they hold in every time zone
// the suite runs in. Run the suite under a zone west of UTC (for example
// TZ=America/Los_Angeles on Linux or macOS) to exercise the regression where
// the previous implementation selected the day before.
describe("parseLocalDateTime", () => {
  it.each([
    ["2025-09-26", "12:00", [2025, 9, 26, 12, 0, 0]],
    ["2025-09-26", "12:34:56", [2025, 9, 26, 12, 34, 56]],
    ["2025-09-26", "00:00", [2025, 9, 26, 0, 0, 0]],
    ["2025-09-26", "00:00:01", [2025, 9, 26, 0, 0, 1]],
    ["2025-09-26", "23:59:59", [2025, 9, 26, 23, 59, 59]],
    ["2025-01-01", "00:30", [2025, 1, 1, 0, 30, 0]],
    ["2025-12-31", "23:30", [2025, 12, 31, 23, 30, 0]],
    ["2024-02-29", "08:15:30", [2024, 2, 29, 8, 15, 30]],
  ] as const)(
    "reads %s %s as local wall-clock time",
    (date, time, expected) => {
      const result = parseLocalDateTime(date, time);

      expect(result).not.toBeNull();
      expect(localParts(result!)).toEqual(expected);
    }
  );

  it("treats HH:MM as zero seconds", () => {
    expect(parseLocalDateTime("2025-09-26", "12:34")?.getSeconds()).toBe(0);
    expect(parseLocalDateTime("2025-09-26", "12:34:00")?.getTime()).toBe(
      parseLocalDateTime("2025-09-26", "12:34")?.getTime()
    );
  });

  it("matches the instant of the equivalent local Date constructor", () => {
    expect(parseLocalDateTime("2025-09-26", "12:34:56")?.getTime()).toBe(
      new Date(2025, 8, 26, 12, 34, 56).getTime()
    );
  });

  it("keeps the calendar day for a wall-clock time skipped by a DST change", () => {
    // 02:30 on 2025-03-09 does not exist in zones such as America/Los_Angeles; it
    // is a plain local time elsewhere. Either way it must resolve like Date does.
    const result = parseLocalDateTime("2025-03-09", "02:30");

    expect(result).not.toBeNull();
    expect(result?.getDate()).toBe(9);
    expect(result?.getTime()).toBe(new Date(2025, 2, 9, 2, 30).getTime());
  });

  it("never rolls the calendar day back", () => {
    const result = parseLocalDateTime("2025-09-26", "00:00");

    expect(result?.getDate()).toBe(26);
    expect(result?.getMonth()).toBe(8);
  });

  it.each([
    ["empty date", "", "12:00"],
    ["empty time", "2025-09-26", ""],
    ["both empty", "", ""],
    ["unpadded date", "2025-9-26", "12:00"],
    ["date with time part", "2025-09-26T12:00", "12:00"],
    ["slash date", "2025/09/26", "12:00"],
    ["time without minutes", "2025-09-26", "12"],
    ["unpadded time", "2025-09-26", "9:05"],
    ["time with fraction", "2025-09-26", "12:00:00.500"],
    ["time with trailing text", "2025-09-26", "12:00 PM"],
    ["hour 24", "2025-09-26", "24:00"],
    ["minute 60", "2025-09-26", "12:60"],
    ["second 60", "2025-09-26", "12:00:60"],
    ["month 13", "2025-13-01", "12:00"],
    ["month 00", "2025-00-10", "12:00"],
    ["day 00", "2025-09-00", "12:00"],
    ["day 32", "2025-09-32", "12:00"],
    ["Feb 30", "2025-02-30", "12:00"],
    ["Feb 29 outside a leap year", "2025-02-29", "12:00"],
    ["Apr 31", "2025-04-31", "12:00"],
    ["two-digit year", "0025-09-26", "12:00"],
  ])("returns null for %s", (_label, date, time) => {
    expect(parseLocalDateTime(date, time)).toBeNull();
  });
});

describe("getLocalDateInputValue", () => {
  it.each([
    [new Date(2025, 8, 26, 12, 0, 0), "2025-09-26"],
    [new Date(2025, 0, 1, 0, 0, 0), "2025-01-01"],
    [new Date(2025, 11, 31, 23, 59, 59), "2025-12-31"],
    [new Date(2024, 1, 29, 0, 30, 0), "2024-02-29"],
  ])("uses the local calendar date of %s", (date, expected) => {
    expect(getLocalDateInputValue(date)).toBe(expected);
  });

  it("round-trips with parseLocalDateTime", () => {
    const now = new Date(2025, 5, 7, 23, 45, 10);
    const value = getLocalDateInputValue(now);

    expect(localParts(parseLocalDateTime(value, "00:00")!).slice(0, 3)).toEqual(
      [2025, 6, 7]
    );
  });
});

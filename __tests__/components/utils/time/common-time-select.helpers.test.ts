import {
  getExpiryMillis,
  TimeMode,
} from "@/components/utils/time/common-time-select.helpers";

// Local-part constructors keep these assertions valid in any host time zone:
// the helper is defined in terms of the viewer's local calendar.
const local = (
  year: number,
  month: number,
  day: number,
  hour = 12,
  minute = 0,
  second = 0,
  millisecond = 0
) => new Date(year, month - 1, day, hour, minute, second, millisecond);

const addMonths = (from: Date, months: number): Date =>
  new Date(getExpiryMillis(TimeMode.MONTHS, months, from));

describe("getExpiryMillis months", () => {
  it.each([
    ["Jan 31 + 1 month in a common year", local(2027, 1, 31), 1, local(2027, 2, 28)],
    ["Jan 31 + 1 month in a leap year", local(2028, 1, 31), 1, local(2028, 2, 29)],
    ["Jan 30 + 1 month in a common year", local(2027, 1, 30), 1, local(2027, 2, 28)],
    ["Jan 29 + 1 month in a common year", local(2027, 1, 29), 1, local(2027, 2, 28)],
    ["Jan 29 + 1 month in a leap year", local(2028, 1, 29), 1, local(2028, 2, 29)],
    ["Mar 31 + 1 month into a 30-day month", local(2027, 3, 31), 1, local(2027, 4, 30)],
    ["May 31 + 1 month into a 30-day month", local(2027, 5, 31), 1, local(2027, 6, 30)],
    ["Aug 31 + 1 month into a 30-day month", local(2027, 8, 31), 1, local(2027, 9, 30)],
    ["Oct 31 + 4 months into February", local(2027, 10, 31), 4, local(2028, 2, 29)],
    ["Dec 31 + 2 months across the year", local(2026, 12, 31), 2, local(2027, 2, 28)],
    ["Jan 31 + 12 months keeps the day", local(2027, 1, 31), 12, local(2028, 1, 31)],
    ["Feb 29 + 12 months into a common year", local(2028, 2, 29), 12, local(2029, 2, 28)],
    ["Feb 29 + 48 months into a leap year", local(2028, 2, 29), 48, local(2032, 2, 29)],
    ["Mar 31 - 1 month", local(2027, 3, 31), -1, local(2027, 2, 28)],
    ["Jan 31 - 2 months across the year", local(2027, 1, 31), -2, local(2026, 11, 30)],
    ["a day inside the target month is unchanged", local(2027, 1, 15), 1, local(2027, 2, 15)],
    ["0 months is the same instant", local(2027, 1, 31), 0, local(2027, 1, 31)],
  ])("%s", (_name, from, months, expected) => {
    expect(addMonths(from, months)).toEqual(expected);
  });

  it("lands in the right month and clamps to its last day for every start date", () => {
    for (let month = 1; month <= 12; month++) {
      const daysInStartMonth = new Date(2027, month, 0).getDate();
      for (let day = 1; day <= daysInStartMonth; day++) {
        for (const months of [1, 2, 3, 5, 11, 13]) {
          const result = addMonths(local(2027, month, day), months);
          const target = new Date(2027, month - 1 + months, 1);
          const daysInTargetMonth = new Date(
            target.getFullYear(),
            target.getMonth() + 1,
            0
          ).getDate();
          expect(result.getFullYear()).toBe(target.getFullYear());
          expect(result.getMonth()).toBe(target.getMonth());
          expect(result.getDate()).toBe(Math.min(day, daysInTargetMonth));
        }
      }
    }
  });

  it("keeps the local wall-clock time while clamping the day", () => {
    const from = local(2027, 1, 31, 23, 59, 58, 123);
    const expected = local(2027, 2, 28, 23, 59, 58, 123);
    expect(addMonths(from, 1)).toEqual(expected);
  });
});

describe("getExpiryMillis minutes and hours", () => {
  // The first instant after the 2026 US spring-forward change and the last
  // before the autumn change: exact elapsed time must not depend on the zone.
  const instants = [
    Date.UTC(2026, 2, 8, 9, 30),
    Date.UTC(2026, 10, 1, 8, 30),
    Date.UTC(2026, 3, 4, 15, 30),
  ];

  it.each(instants)("adds exact milliseconds at %i", (instant) => {
    const now = new Date(instant);
    expect(getExpiryMillis(TimeMode.MINUTES, 90, now)).toBe(
      instant + 90 * 60_000
    );
    expect(getExpiryMillis(TimeMode.HOURS, 2, now)).toBe(
      instant + 2 * 3_600_000
    );
    expect(getExpiryMillis(TimeMode.HOURS, -3, now)).toBe(
      instant - 3 * 3_600_000
    );
  });
});

describe("getExpiryMillis days and weeks", () => {
  it("keeps the local wall-clock time on the target day", () => {
    expect(getExpiryMillis(TimeMode.DAYS, 3, local(2027, 1, 30))).toBe(
      local(2027, 2, 2).getTime()
    );
    expect(getExpiryMillis(TimeMode.WEEKS, 2, local(2027, 2, 20, 9, 15))).toBe(
      local(2027, 3, 6, 9, 15).getTime()
    );
  });
});

describe("getExpiryMillis zero amounts in a repeated fall-back hour", () => {
  // Both occurrences of a repeated local time in five zones. In a zone other
  // than the host these are ordinary instants; in the matching host zone the
  // second occurrence used to snap back to the first (one hour in the past).
  const instants = [
    "2026-11-01T08:30:00Z", // Los Angeles 01:30 PDT
    "2026-11-01T09:30:00Z", // Los Angeles 01:30 PST
    "2026-10-25T00:30:00Z", // London 01:30 BST
    "2026-10-25T01:30:00Z", // London 01:30 GMT
    "2026-04-04T13:30:00Z", // Auckland 02:30 NZDT
    "2026-04-04T14:30:00Z", // Auckland 02:30 NZST
    "2026-04-04T14:45:00Z", // Lord Howe 01:45 LHDT
    "2026-04-04T15:15:00Z", // Lord Howe 01:45 LHST
    "2026-11-01T04:00:00Z", // St John's 01:30 NDT
    "2026-11-01T05:00:00Z", // St John's 01:30 NST
  ].map((iso) => Date.parse(iso));

  it.each([TimeMode.MONTHS, TimeMode.DAYS, TimeMode.WEEKS])(
    "keeps the exact instant for zero %s",
    (mode) => {
      for (const instant of instants) {
        expect(getExpiryMillis(mode, 0, new Date(instant))).toBe(instant);
      }
    }
  );

  it("does not mutate the date it was given", () => {
    const now = new Date(instants[1]!);
    getExpiryMillis(TimeMode.MONTHS, 0, now);
    getExpiryMillis(TimeMode.DAYS, 0, now);
    expect(now.getTime()).toBe(instants[1]);
  });
});

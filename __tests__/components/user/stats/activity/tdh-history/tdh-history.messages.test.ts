import {
  EXTREME_TIME_ZONES,
  runInTimeZone,
  TEST_TIME_ZONES,
} from "../../../../../utils/timeZoneHarness";

jest.setTimeout(60_000);

const MESSAGES_MODULE =
  "components/user/stats/activity/tdh-history/tdh-history.messages.ts";

// The calendar day, rendered without any zone shift.
const expectedLabel = (
  locale: string,
  year: number,
  month: number,
  day: number
) =>
  new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(Date.UTC(year, month - 1, day));

describe("formatTdhHistoryDate", () => {
  it.each([...TEST_TIME_ZONES, ...EXTREME_TIME_ZONES])(
    "labels the API's YYYY-MM-DD dates with their own calendar day in %s",
    (zone) => {
      expect(
        runInTimeZone<string>(zone, MESSAGES_MODULE, "formatTdhHistoryDate", [
          ["2026-10-12"],
          ["2026-10-11", "de-DE"],
          ["2026-03-01", "en-GB"],
        ])
      ).toEqual([
        expectedLabel("en-US", 2026, 10, 12),
        expectedLabel("de-DE", 2026, 10, 11),
        expectedLabel("en-GB", 2026, 3, 1),
      ]);
    }
  );

  it("pins the default locale text", () => {
    expect(
      runInTimeZone<string>(
        "America/Los_Angeles",
        MESSAGES_MODULE,
        "formatTdhHistoryDate",
        [["2026-10-12"]]
      )
    ).toEqual(["Oct 12, 2026"]);
  });
});

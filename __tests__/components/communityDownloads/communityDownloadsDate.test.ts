import {
  EXTREME_TIME_ZONES,
  runInTimeZone,
  TEST_TIME_ZONES,
} from "../../utils/timeZoneHarness";

jest.setTimeout(60_000);

const DATE_MODULE = "components/community-downloads/communityDownloadsDate.ts";
const ALL_ZONES = [...TEST_TIME_ZONES, ...EXTREME_TIME_ZONES];

describe("formatDownloadDate", () => {
  it.each(ALL_ZONES)("renders calendar-day feeds as that day in %s", (zone) => {
    expect(
      runInTimeZone<string>(zone, DATE_MODULE, "formatDownloadDate", [
        // TDH and consolidated uploads: YYYYMMDD
        ["en-US", "20261012"],
        ["en-US", "20230101"],
        // Meme subscription uploads: YYYY-MM-DD
        ["en-US", "2026-10-12"],
        // Royalty uploads: a day stamped as UTC midnight
        ["en-US", "2026-10-11T00:00:00.000Z"],
        ["en-US", "2026-10-30T00:00:00Z"],
        // Team downloads: zone-less timestamps stay on their own day
        ["en-US", "2023-05-10 11:44:03"],
      ])
    ).toEqual([
      "Mon, Oct 12, 2026",
      "Sun, Jan 1, 2023",
      "Mon, Oct 12, 2026",
      "Sun, Oct 11, 2026",
      "Fri, Oct 30, 2026",
      "Wed, May 10, 2023",
    ]);
  });

  it.each([
    ["UTC", "Mon, Oct 12, 2026"],
    ["America/Los_Angeles", "Sun, Oct 11, 2026"],
    ["Pacific/Auckland", "Mon, Oct 12, 2026"],
  ])(
    "keeps real upload instants in the viewer's zone (%s)",
    (zone, expected) => {
      expect(
        runInTimeZone<string>(zone, DATE_MODULE, "formatDownloadDate", [
          ["en-US", "2026-10-12T02:03:14.446Z"],
        ])
      ).toEqual([expected]);
    }
  );

  it("uses the page locale", () => {
    const expectedIn = (locale: string) =>
      new Intl.DateTimeFormat(locale, {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(Date.UTC(2026, 9, 12));

    expect(
      runInTimeZone<string>(
        "America/Los_Angeles",
        DATE_MODULE,
        "formatDownloadDate",
        [
          ["en-GB", "2026-10-12"],
          ["de-DE", "20261012"],
        ]
      )
    ).toEqual([expectedIn("en-GB"), expectedIn("de-DE")]);
  });

  it("renders unparseable values as a dash", () => {
    expect(
      runInTimeZone<string>("UTC", DATE_MODULE, "formatDownloadDate", [
        ["en-US", "not-a-date"],
        ["en-US", "20261340"],
        ["en-US", ""],
      ])
    ).toEqual(["-", "-", "-"]);
  });
});

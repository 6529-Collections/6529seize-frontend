import {
  getHistoricalMintsOnCalendarDay,
  getScheduledMintOnCalendarDay,
} from "@/components/meme-calendar/meme-calendar-grid/calendarDayMints";
import { formatMintWeekdaysInZone } from "@/components/meme-calendar/meme-calendar-grid/calendarText";
import { calendarDayInZone } from "@/components/meme-calendar/meme-calendar.zone";

import {
  EXTREME_TIME_ZONES,
  runInTimeZone,
  TEST_TIME_ZONES,
} from "../../utils/timeZoneHarness";

jest.setTimeout(60_000);

const LOS_ANGELES = "America/Los_Angeles";
const AUCKLAND = "Pacific/Auckland";
const KIRITIMATI = "Pacific/Kiritimati";
const GRID_ZONES = ["UTC", LOS_ANGELES, AUCKLAND, KIRITIMATI] as const;

const day = (month: number, date: number, year = 2026): Date =>
  new Date(Date.UTC(year, month, date));
const isoDay = (value: Date): string => value.toISOString().slice(0, 10);

// Meme #440 is scheduled on Monday 5 Jan 2026 (UTC) and starts at 17:40
// Athens time, 15:40 UTC: 07:40 Jan 5 in Los Angeles, but 04:40 Jan 6 in
// Auckland (UTC+13) and 05:40 Jan 6 in Kiritimati (UTC+14).
const MINT_440_START = new Date("2026-01-05T15:40:00.000Z");

describe("calendarDayInZone", () => {
  it.each([
    ["UTC", "2026-01-05"],
    [LOS_ANGELES, "2026-01-05"],
    [AUCKLAND, "2026-01-06"],
    [KIRITIMATI, "2026-01-06"],
  ])("puts the start of Meme #440 on its %s date", (zone, expected) => {
    expect(isoDay(calendarDayInZone(MINT_440_START, zone))).toBe(expected);
  });

  it.each([
    // 18:00 on Mon 5 Jan in Los Angeles is already Tue 6 Jan in UTC.
    ["2026-01-06T02:00:00.000Z", "UTC", "2026-01-06"],
    ["2026-01-06T02:00:00.000Z", LOS_ANGELES, "2026-01-05"],
    // 01:00 on Tue 6 Jan in Auckland and Kiritimati is still Mon 5 Jan in UTC.
    ["2026-01-05T12:00:00.000Z", AUCKLAND, "2026-01-06"],
    ["2026-01-05T11:00:00.000Z", KIRITIMATI, "2026-01-06"],
    ["2026-01-05T11:00:00.000Z", "UTC", "2026-01-05"],
  ])("reads %s as the %s date", (instant, zone, expected) => {
    expect(isoDay(calendarDayInZone(new Date(instant), zone))).toBe(expected);
  });

  it("throws instead of guessing when Intl returns unreadable date parts", () => {
    const formatToParts = jest
      .spyOn(Intl.DateTimeFormat.prototype, "formatToParts")
      .mockReturnValue([]);
    try {
      expect(() => calendarDayInZone(MINT_440_START, AUCKLAND)).toThrow(
        'Unable to read the calendar date in time zone "Pacific/Auckland": Intl returned unreadable date parts'
      );
    } finally {
      formatToParts.mockRestore();
    }
  });

  it("returns 00:00 UTC of the zone's date", () => {
    expect(
      calendarDayInZone(new Date("2026-07-01T23:59:59.999Z"), AUCKLAND)
    ).toEqual(day(6, 2));
  });
});

describe("getScheduledMintOnCalendarDay", () => {
  const scheduledCellsFor = (zone: string) =>
    [4, 5, 6, 7, 8, 9].map((date) => {
      const mint = getScheduledMintOnCalendarDay(day(0, date), zone);
      return `${date}:${mint ? isoDay(mint.utcDay) : "-"}`;
    });

  it.each([
    [
      "UTC",
      ["4:-", "5:2026-01-05", "6:-", "7:2026-01-07", "8:-", "9:2026-01-09"],
    ],
    [
      LOS_ANGELES,
      ["4:-", "5:2026-01-05", "6:-", "7:2026-01-07", "8:-", "9:2026-01-09"],
    ],
    [AUCKLAND, ["4:-", "5:-", "6:2026-01-05", "7:-", "8:2026-01-07", "9:-"]],
    [KIRITIMATI, ["4:-", "5:-", "6:2026-01-05", "7:-", "8:2026-01-07", "9:-"]],
  ])("places Mon/Wed/Fri mints on their %s dates", (zone, expected) => {
    expect(scheduledCellsFor(zone)).toEqual(expected);
  });

  it.each(GRID_ZONES)(
    "keeps the mint instant and UTC schedule day in %s",
    (zone) => {
      const mintDate = zone === AUCKLAND || zone === KIRITIMATI ? 6 : 5;
      const mint = getScheduledMintOnCalendarDay(day(0, mintDate), zone);

      expect(mint?.instantUtc).toEqual(MINT_440_START);
      expect(mint?.utcDay).toEqual(day(0, 5));
    }
  );

  it("keeps the UTC schedule day of a rescheduled mint for its override note", () => {
    // Meme #415 moved to Tuesday 21 Oct 2025 (UTC); Auckland sees it on the 22nd.
    expect(
      getScheduledMintOnCalendarDay(day(9, 22, 2025), AUCKLAND)?.utcDay
    ).toEqual(day(9, 21, 2025));
    expect(getScheduledMintOnCalendarDay(day(9, 21, 2025), AUCKLAND)).toBe(
      undefined
    );
  });
});

describe("getHistoricalMintsOnCalendarDay", () => {
  const idsOn = (calendarDay: Date, zone: string) =>
    getHistoricalMintsOnCalendarDay(calendarDay, zone).map((mint) => mint.id);

  it("keeps SZN1 mints on their UTC dates in UTC mode", () => {
    expect(idsOn(day(5, 9, 2022), "UTC")).toEqual([1, 2, 3]);
    expect(idsOn(day(5, 10, 2022), "UTC")).toEqual([]);
  });

  it("moves SZN1 mints to the next date far east of UTC", () => {
    // Memes #1-#3 started 17:01-17:22 UTC on 9 Jun 2022.
    expect(idsOn(day(5, 9, 2022), KIRITIMATI)).toEqual([]);
    expect(idsOn(day(5, 10, 2022), KIRITIMATI)).toEqual([1, 2, 3]);
  });

  it("moves SZN1 mints to the previous date far west of UTC", () => {
    // Meme #40 started 11:45 UTC on 30 Nov 2022: 23:45 on the 29th at UTC-12.
    expect(idsOn(day(10, 29, 2022), "Etc/GMT+12")).toEqual([40]);
    expect(idsOn(day(10, 30, 2022), "Etc/GMT+12")).toEqual([]);
    expect(idsOn(day(10, 30, 2022), LOS_ANGELES)).toEqual([40]);
  });
});

describe("formatMintWeekdaysInZone", () => {
  const FEBRUARY = new Date("2026-02-10T12:00:00.000Z");
  const JULY = new Date("2026-07-14T12:00:00.000Z");

  it.each([
    ["UTC", "Mon, Wed, Fri"],
    [LOS_ANGELES, "Mon, Wed, Fri"],
    [AUCKLAND, "Tue, Thu, Sat"],
    [KIRITIMATI, "Tue, Thu, Sat"],
  ])("names the %s weekdays of the Mon/Wed/Fri mints", (zone, expected) => {
    expect(formatMintWeekdaysInZone("en-US", zone, FEBRUARY)).toBe(expected);
  });

  it("follows the Athens daylight-saving offset", () => {
    // 15:40 UTC in winter is 00:40 the next day in Tokyo; 14:40 UTC in
    // summer is 23:40 the same day.
    expect(formatMintWeekdaysInZone("en-US", "Asia/Tokyo", FEBRUARY)).toBe(
      "Tue, Thu, Sat"
    );
    expect(formatMintWeekdaysInZone("en-US", "Asia/Tokyo", JULY)).toBe(
      "Mon, Wed, Fri"
    );
  });

  it("uses the requested locale", () => {
    // German weekday names and list joiner ("Di, Do und Sa" in current ICU).
    expect(formatMintWeekdaysInZone("de-DE", AUCKLAND, FEBRUARY)).toMatch(
      /^Di\.?, Do\.? und Sa\.?$/
    );
  });
});

describe("getViewerTimeZone", () => {
  it.each([...TEST_TIME_ZONES, ...EXTREME_TIME_ZONES])(
    "reports the runtime zone in %s",
    (zone) => {
      const [viewerZone] = runInTimeZone<string>(
        zone,
        "components/meme-calendar/meme-calendar.zone.ts",
        "getViewerTimeZone",
        [[]]
      );

      expect(viewerZone).toBe(zone);
    }
  );
});

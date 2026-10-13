import {
  DELEGATION_EXPIRY_MIN_LEAD_MS,
  formatDelegationExpiryLocal,
  formatDelegationExpiryPreview,
  getDelegationExpiryError,
  getMinDelegationExpiryDate,
  getViewerTimeZone,
  getZonedDateEndEpochSeconds,
} from "@/components/delegation/delegation-expiry";

// These tests pass explicit IANA zones, so they hold under any process TZ.
// CI runs in UTC; also run them locally under other zones, for example
// PowerShell: $env:TZ='Pacific/Auckland'; node_modules\.bin\jest.cmd <file>
const LOS_ANGELES = "America/Los_Angeles";
const AUCKLAND = "Pacific/Auckland";
const LORD_HOWE = "Australia/Lord_Howe";
const UTC = "UTC";
const DST_ZONES = [UTC, LOS_ANGELES, AUCKLAND, LORD_HOWE] as const;
const SECOND_MS = 1000;
const DAY_MS = 86_400_000;

const isoSeconds = (iso: string) => Date.parse(iso) / SECOND_MS;
const normalizeSpaces = (value: string) => value.replace(/\s/g, " ");

function wallClock(epochSeconds: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(epochSeconds * SECOND_MS);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((entry) => entry.type === type)?.value ?? "";
  return {
    date: `${part("year")}-${part("month")}-${part("day")}`,
    time: `${part("hour")}:${part("minute")}:${part("second")}`,
  };
}

function datesOfYear(year: number): string[] {
  const dates: string[] = [];
  for (
    let ms = Date.UTC(year, 0, 1);
    ms < Date.UTC(year + 1, 0, 1);
    ms += DAY_MS
  ) {
    dates.push(new Date(ms).toISOString().slice(0, 10));
  }
  return dates;
}

function nextDate(date: string): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + DAY_MS)
    .toISOString()
    .slice(0, 10);
}

describe("getZonedDateEndEpochSeconds", () => {
  it.each([
    [UTC, "2026-10-14", "2026-10-14T23:59:59Z"],
    [LOS_ANGELES, "2026-10-14", "2026-10-15T06:59:59Z"],
    // Los Angeles: 23-hour spring-forward day and 25-hour fall-back day.
    [LOS_ANGELES, "2026-03-07", "2026-03-08T07:59:59Z"],
    [LOS_ANGELES, "2026-03-08", "2026-03-09T06:59:59Z"],
    [LOS_ANGELES, "2026-10-31", "2026-11-01T06:59:59Z"],
    [LOS_ANGELES, "2026-11-01", "2026-11-02T07:59:59Z"],
    // Auckland: daylight saving ends 5 April and starts 27 September 2026.
    [AUCKLAND, "2026-04-04", "2026-04-04T10:59:59Z"],
    [AUCKLAND, "2026-04-05", "2026-04-05T11:59:59Z"],
    [AUCKLAND, "2026-09-26", "2026-09-26T11:59:59Z"],
    [AUCKLAND, "2026-09-27", "2026-09-27T10:59:59Z"],
    // Lord Howe shifts by 30 minutes: +11 in summer, +10:30 in winter.
    [LORD_HOWE, "2026-04-04", "2026-04-04T12:59:59Z"],
    [LORD_HOWE, "2026-04-05", "2026-04-05T13:29:59Z"],
    [LORD_HOWE, "2026-10-03", "2026-10-03T13:29:59Z"],
    [LORD_HOWE, "2026-10-04", "2026-10-04T12:59:59Z"],
  ])("%s %s ends at %s", (timeZone, date, expected) => {
    expect(getZonedDateEndEpochSeconds(date, timeZone)).toBe(
      isoSeconds(expected)
    );
  });

  it.each(DST_ZONES)(
    "returns 23:59:59 on the chosen date for every day of 2026 in %s",
    (timeZone) => {
      for (const date of datesOfYear(2026)) {
        const end = getZonedDateEndEpochSeconds(date, timeZone);
        expect(end).not.toBeNull();
        const endSeconds = end ?? Number.NaN;
        expect(wallClock(endSeconds, timeZone)).toEqual({
          date,
          time: "23:59:59",
        });
        expect(wallClock(endSeconds + 1, timeZone).date).toBe(nextDate(date));
      }
    }
  );

  it("resolves a day that ends inside a repeated hour to its true last second", () => {
    // Santiago moves its clocks at local midnight, so some days repeat
    // 23:00-23:59 and others end without a 00:00 on the next day. Whatever
    // the rules, the result is the last second still dated on that day.
    const timeZone = "America/Santiago";
    for (const date of datesOfYear(2026)) {
      const end = getZonedDateEndEpochSeconds(date, timeZone) ?? Number.NaN;
      expect(wallClock(end, timeZone).date).toBe(date);
      expect(wallClock(end + 1, timeZone).date).toBe(nextDate(date));
    }
  });

  it("matches the runtime's own local calendar for the viewer zone", () => {
    // Exercises the process time zone, so different TZ values cover
    // different rules without any hard-coded offsets.
    const timeZone = getViewerTimeZone();
    for (const date of datesOfYear(2026)) {
      const end = getZonedDateEndEpochSeconds(date, timeZone) ?? Number.NaN;
      const local = new Date(end * SECOND_MS);
      const afterEnd = new Date((end + 1) * SECOND_MS);
      const [year, month, day] = date.split("-").map(Number);
      expect([
        local.getFullYear(),
        local.getMonth() + 1,
        local.getDate(),
      ]).toEqual([year, month, day]);
      expect(afterEnd.getDate()).not.toBe(local.getDate());
    }
  });

  it.each([
    "",
    "2026-02-30",
    "2026-13-01",
    "26-10-14",
    "1969-12-31",
    "+275760-09-13",
    "2026-10-14T00:00",
  ])("rejects %j", (value) => {
    expect(getZonedDateEndEpochSeconds(value, LOS_ANGELES)).toBeNull();
  });
});

describe("getMinDelegationExpiryDate", () => {
  it.each([
    // Midday in Los Angeles: the rest of today is long enough.
    [LOS_ANGELES, "2026-10-14T19:00:00Z", "2026-10-14"],
    // 22:59:00 local: today still ends 59 seconds after the one-hour lead.
    [LOS_ANGELES, "2026-10-15T05:59:00Z", "2026-10-14"],
    // 22:59:59 local: today would end exactly at the lead, so tomorrow.
    [LOS_ANGELES, "2026-10-15T05:59:59Z", "2026-10-15"],
    // Auckland's calendar is already on the next UTC day.
    [AUCKLAND, "2026-10-13T20:00:00Z", "2026-10-14"],
    [LORD_HOWE, "2026-10-04T12:00:00Z", "2026-10-05"],
    [UTC, "2026-10-14T22:59:59Z", "2026-10-15"],
  ])("in %s at %s is %s", (timeZone, nowIso, expected) => {
    expect(getMinDelegationExpiryDate(Date.parse(nowIso), timeZone)).toBe(
      expected
    );
  });

  it.each(DST_ZONES)(
    "is the earliest date the submit check accepts in %s",
    (timeZone) => {
      // Sample every 37 minutes across both 2026 clock changes per zone.
      const windows = [
        [
          Date.parse("2026-03-06T00:00:00Z"),
          Date.parse("2026-03-10T00:00:00Z"),
        ],
        [
          Date.parse("2026-04-03T00:00:00Z"),
          Date.parse("2026-04-07T00:00:00Z"),
        ],
        [
          Date.parse("2026-09-25T00:00:00Z"),
          Date.parse("2026-10-06T00:00:00Z"),
        ],
        [
          Date.parse("2026-10-30T00:00:00Z"),
          Date.parse("2026-11-03T00:00:00Z"),
        ],
      ] as const;
      for (const [start, end] of windows) {
        for (let now = start; now < end; now += 37 * 60_000) {
          const minDate = getMinDelegationExpiryDate(now, timeZone);
          const minEnd = getZonedDateEndEpochSeconds(minDate, timeZone);
          const dayBefore = new Date(
            Date.parse(`${minDate}T00:00:00Z`) - DAY_MS
          )
            .toISOString()
            .slice(0, 10);
          const dayBeforeEnd = getZonedDateEndEpochSeconds(dayBefore, timeZone);
          expect(getDelegationExpiryError("en-US", minEnd, now)).toBeNull();
          expect(getDelegationExpiryError("en-US", dayBeforeEnd, now)).toBe(
            "Choose a later expiry date. The delegation must stay active for at least 1 hour after you submit."
          );
        }
      }
    }
  );
});

describe("getDelegationExpiryError", () => {
  const now = Date.parse("2026-10-14T12:00:00Z");
  const leadBoundary = (now + DELEGATION_EXPIRY_MIN_LEAD_MS) / SECOND_MS;

  it("requires a date", () => {
    expect(getDelegationExpiryError("en-US", null, now)).toBe(
      "Missing or invalid Expiry"
    );
  });

  it("refuses an expiry in the past or within the lead time", () => {
    const tooSoon =
      "Choose a later expiry date. The delegation must stay active for at least 1 hour after you submit.";
    expect(getDelegationExpiryError("en-US", now / SECOND_MS - 60, now)).toBe(
      tooSoon
    );
    expect(getDelegationExpiryError("en-US", leadBoundary, now)).toBe(tooSoon);
  });

  it("checks only presence for render-time gating without a submit time", () => {
    expect(getDelegationExpiryError("en-US", now / SECOND_MS - 60)).toBeNull();
    expect(getDelegationExpiryError("en-US", null)).toBe(
      "Missing or invalid Expiry"
    );
  });

  it("accepts an expiry after the lead time", () => {
    expect(getDelegationExpiryError("en-US", leadBoundary + 1, now)).toBeNull();
  });
});

describe("expiry formatting", () => {
  it.each([
    [
      LOS_ANGELES,
      "2026-10-15T06:59:59Z",
      "Expires Oct 14, 2026, 11:59 PM PDT (Oct 15, 2026, 06:59 UTC)",
    ],
    [
      LORD_HOWE,
      "2026-10-04T12:59:59Z",
      "Expires Oct 4, 2026, 11:59 PM GMT+11 (Oct 4, 2026, 12:59 UTC)",
    ],
    [
      AUCKLAND,
      "2026-09-27T10:59:59Z",
      "Expires Sep 27, 2026, 11:59 PM GMT+13 (Sep 27, 2026, 10:59 UTC)",
    ],
    [
      UTC,
      "2026-10-14T23:59:59Z",
      "Expires Oct 14, 2026, 11:59 PM UTC (Oct 14, 2026, 23:59 UTC)",
    ],
  ])("previews the %s instant %s", (timeZone, iso, expected) => {
    expect(
      normalizeSpaces(
        formatDelegationExpiryPreview("en-US", isoSeconds(iso), timeZone)
      )
    ).toBe(expected);
  });

  it("formats with the viewer's locale", () => {
    expect(
      normalizeSpaces(
        formatDelegationExpiryLocal(
          "de-DE",
          isoSeconds("2026-10-15T06:59:59Z"),
          LOS_ANGELES
        )
      )
    ).toBe("14. Okt. 2026, 23:59 GMT-7");
  });
});

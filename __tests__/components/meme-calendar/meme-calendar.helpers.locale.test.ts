import {
  getNextMintStart,
  mintEndInstantUtcForMintDay,
  mintStartInstantUtcForMintDay,
  printCalendarInvites,
  wallTimeToUtcInstantInZone,
} from "@/components/meme-calendar/meme-calendar.helpers";
import { Time } from "@/helpers/time";
import { buildMemesPhases } from "@/hooks/useManifoldClaim";

jest.mock("wagmi", () => ({ useReadContract: jest.fn() }));
jest.mock("@/services/api/memes-minting-claims-api", () => ({
  getMemesMintingRoots: jest.fn(),
}));

/**
 * Mint wall-clock times are defined in Europe/Athens (EET = UTC+2 in winter,
 * EEST = UTC+3 in summer): the mint opens at 17:40 and the public phase ends
 * at 17:00 the next day. The conversion to UTC instants must not depend on the
 * browser's default locale, which controls digit shape and separators such as
 * "17.40" (fi-FI, da-DK, id-ID) or Arabic-Indic digits (ar-EG, fa-IR).
 */
const LOCALES = ["en-US", "fi-FI", "da-DK", "id-ID", "ar-EG", "fa-IR"] as const;

type DayCase = {
  readonly label: string;
  readonly day: readonly [year: number, monthIndex: number, day: number];
  /** Athens offset in force at the wall times used in this test (2 or 3). */
  readonly athensOffsetHours: 2 | 3;
};

const EEST = 3;
const EET = 2;

// EU: DST ends Sun 2026-10-25 and starts Sun 2027-03-28 (01:00 UTC both times).
// US: DST ends Sun 2026-11-01 and starts Sun 2027-03-14; Athens is unaffected.
const DAY_CASES: readonly DayCase[] = [
  {
    label: "EU autumn: Sat before",
    day: [2026, 9, 24],
    athensOffsetHours: EEST,
  },
  {
    label: "EU autumn: Sun change day",
    day: [2026, 9, 25],
    athensOffsetHours: EET,
  },
  { label: "EU autumn: Mon after", day: [2026, 9, 26], athensOffsetHours: EET },
  {
    label: "US autumn: Sat before",
    day: [2026, 9, 31],
    athensOffsetHours: EET,
  },
  { label: "US autumn: Mon after", day: [2026, 10, 2], athensOffsetHours: EET },
  {
    label: "US spring 2027: Sat before",
    day: [2027, 2, 13],
    athensOffsetHours: EET,
  },
  {
    label: "US spring 2027: Mon after",
    day: [2027, 2, 15],
    athensOffsetHours: EET,
  },
  {
    label: "EU spring 2027: Sat before",
    day: [2027, 2, 27],
    athensOffsetHours: EET,
  },
  {
    label: "EU spring 2027: Sun change day",
    day: [2027, 2, 28],
    athensOffsetHours: EEST,
  },
  {
    label: "EU spring 2027: Mon after",
    day: [2027, 2, 29],
    athensOffsetHours: EEST,
  },
  {
    label: "US spring 2026: Sat before",
    day: [2026, 2, 7],
    athensOffsetHours: EET,
  },
  {
    label: "US spring 2026: Mon after",
    day: [2026, 2, 9],
    athensOffsetHours: EET,
  },
  {
    label: "EU spring 2026: Sat before",
    day: [2026, 2, 28],
    athensOffsetHours: EET,
  },
  {
    label: "EU spring 2026: Mon after",
    day: [2026, 2, 30],
    athensOffsetHours: EEST,
  },
  { label: "mid summer", day: [2026, 6, 1], athensOffsetHours: EEST },
  { label: "mid winter", day: [2027, 0, 4], athensOffsetHours: EET },
];

// Mint window end = 17:00 Athens on the day after the mint day, so the offset
// that matters is the one in force on that following day.
const END_CASES: ReadonlyArray<{
  readonly label: string;
  readonly day: DayCase["day"];
  readonly endUtc: string;
}> = [
  {
    label: "Fri 2026-10-23 (summer)",
    day: [2026, 9, 23],
    endUtc: "2026-10-24T14:00:00.000Z",
  },
  {
    label: "Sat 2026-10-24 (DST ends overnight)",
    day: [2026, 9, 24],
    endUtc: "2026-10-25T15:00:00.000Z",
  },
  {
    label: "Sun 2026-10-25",
    day: [2026, 9, 25],
    endUtc: "2026-10-26T15:00:00.000Z",
  },
  {
    label: "Mon 2026-10-26",
    day: [2026, 9, 26],
    endUtc: "2026-10-27T15:00:00.000Z",
  },
  {
    label: "Sat 2026-10-31 (US DST ends overnight)",
    day: [2026, 9, 31],
    endUtc: "2026-11-01T15:00:00.000Z",
  },
  {
    label: "Sat 2027-03-13 (US DST starts overnight)",
    day: [2027, 2, 13],
    endUtc: "2027-03-14T15:00:00.000Z",
  },
  {
    label: "Fri 2027-03-26",
    day: [2027, 2, 26],
    endUtc: "2027-03-27T15:00:00.000Z",
  },
  {
    label: "Sat 2027-03-27 (DST starts overnight)",
    day: [2027, 2, 27],
    endUtc: "2027-03-28T14:00:00.000Z",
  },
  {
    label: "Sun 2027-03-28",
    day: [2027, 2, 28],
    endUtc: "2027-03-29T14:00:00.000Z",
  },
  {
    label: "Sat 2026-03-28 (EU DST starts overnight)",
    day: [2026, 2, 28],
    endUtc: "2026-03-29T14:00:00.000Z",
  },
];

const utcDay = ([y, m, d]: DayCase["day"]): Date => new Date(Date.UTC(y, m, d));

const utc = (
  [y, m, d]: DayCase["day"],
  hour: number,
  minute: number,
  dayOffset = 0
): string =>
  new Date(Date.UTC(y, m, d + dayOffset, hour, minute)).toISOString();

// Wall times on the days the EU clocks change (Athens: 03:00 EEST -> 02:00 EET
// on 2026-10-25, 03:00 EET -> 04:00 EEST on 2027-03-28). A repeated wall time
// resolves to the earlier instant; a skipped wall time is shifted forward.
const TRANSITION_WALL_TIMES: ReadonlyArray<{
  readonly label: string;
  readonly day: DayCase["day"];
  readonly hour: number;
  readonly minute: number;
  readonly expectedUtc: string;
}> = [
  {
    label: "2026-10-25 02:30 (before DST ends, EEST)",
    day: [2026, 9, 25],
    hour: 2,
    minute: 30,
    expectedUtc: "2026-10-24T23:30:00.000Z",
  },
  {
    label: "2026-10-25 03:30 (repeated hour, earlier instant)",
    day: [2026, 9, 25],
    hour: 3,
    minute: 30,
    expectedUtc: "2026-10-25T00:30:00.000Z",
  },
  {
    label: "2026-10-25 04:30 (after DST ends, EET)",
    day: [2026, 9, 25],
    hour: 4,
    minute: 30,
    expectedUtc: "2026-10-25T02:30:00.000Z",
  },
  {
    label: "2027-03-28 02:30 (before DST starts, EET)",
    day: [2027, 2, 28],
    hour: 2,
    minute: 30,
    expectedUtc: "2027-03-28T00:30:00.000Z",
  },
  {
    label: "2027-03-28 03:30 (skipped hour, shifted forward)",
    day: [2027, 2, 28],
    hour: 3,
    minute: 30,
    expectedUtc: "2027-03-28T01:30:00.000Z",
  },
  {
    label: "2027-03-28 04:30 (after DST starts, EEST)",
    day: [2027, 2, 28],
    hour: 4,
    minute: 30,
    expectedUtc: "2027-03-28T01:30:00.000Z",
  },
];

// Wall-clock phase boundaries used by the mint flow (see useManifoldClaim).
const PHASE_WALL_TIMES: ReadonlyArray<readonly [number, number]> = [
  [17, 40],
  [18, 20],
  [18, 30],
  [18, 50],
  [19, 0],
  [19, 20],
  [17, 0],
];

// Other zones: explicit expectations (cross-checked against a brute-force
// search of the zone's wall clock). Lord Howe changes by 30 minutes, Kolkata is
// UTC+05:30 with no DST.
const ZONE_CASES: ReadonlyArray<{
  readonly zone: string;
  readonly label: string;
  readonly day: DayCase["day"];
  readonly hour: number;
  readonly minute: number;
  readonly expectedUtc: string;
}> = [
  {
    zone: "UTC",
    label: "17:40 on 2026-10-26",
    day: [2026, 9, 26],
    hour: 17,
    minute: 40,
    expectedUtc: "2026-10-26T17:40:00.000Z",
  },
  {
    zone: "America/New_York",
    label: "12:00 in summer (EDT)",
    day: [2026, 6, 1],
    hour: 12,
    minute: 0,
    expectedUtc: "2026-07-01T16:00:00.000Z",
  },
  {
    zone: "America/New_York",
    label: "12:00 in winter (EST)",
    day: [2026, 0, 15],
    hour: 12,
    minute: 0,
    expectedUtc: "2026-01-15T17:00:00.000Z",
  },
  {
    zone: "America/New_York",
    label: "01:30 repeated on 2026-11-01 -> first (EDT)",
    day: [2026, 10, 1],
    hour: 1,
    minute: 30,
    expectedUtc: "2026-11-01T05:30:00.000Z",
  },
  {
    zone: "America/New_York",
    label: "12:00 after DST ends on 2026-11-01 (EST)",
    day: [2026, 10, 1],
    hour: 12,
    minute: 0,
    expectedUtc: "2026-11-01T17:00:00.000Z",
  },
  {
    zone: "America/New_York",
    label: "02:30 skipped on 2026-03-08 -> 03:30 EDT",
    day: [2026, 2, 8],
    hour: 2,
    minute: 30,
    expectedUtc: "2026-03-08T07:30:00.000Z",
  },
  {
    zone: "Asia/Kolkata",
    label: "17:40 in autumn (+05:30)",
    day: [2026, 9, 26],
    hour: 17,
    minute: 40,
    expectedUtc: "2026-10-26T12:10:00.000Z",
  },
  {
    zone: "Asia/Kolkata",
    label: "17:40 in summer (+05:30)",
    day: [2026, 6, 1],
    hour: 17,
    minute: 40,
    expectedUtc: "2026-07-01T12:10:00.000Z",
  },
  {
    zone: "Australia/Lord_Howe",
    label: "12:00 in southern summer (+11:00)",
    day: [2026, 0, 15],
    hour: 12,
    minute: 0,
    expectedUtc: "2026-01-15T01:00:00.000Z",
  },
  {
    zone: "Australia/Lord_Howe",
    label: "12:00 in southern winter (+10:30)",
    day: [2026, 6, 15],
    hour: 12,
    minute: 0,
    expectedUtc: "2026-07-15T01:30:00.000Z",
  },
  {
    zone: "Australia/Lord_Howe",
    label: "01:45 repeated on 2026-04-05 -> first (+11:00)",
    day: [2026, 3, 5],
    hour: 1,
    minute: 45,
    expectedUtc: "2026-04-04T14:45:00.000Z",
  },
  {
    zone: "Australia/Lord_Howe",
    label: "02:15 skipped on 2026-10-04 -> 02:45",
    day: [2026, 9, 4],
    hour: 2,
    minute: 15,
    expectedUtc: "2026-10-03T15:45:00.000Z",
  },
  {
    zone: "Pacific/Auckland",
    label: "02:30 repeated on 2026-04-05 -> first (NZDT)",
    day: [2026, 3, 5],
    hour: 2,
    minute: 30,
    expectedUtc: "2026-04-04T13:30:00.000Z",
  },
];

// DST change days (2026-2027) per zone, for the brute-force comparison.
const SWEEP_ZONE_DAYS: Record<string, ReadonlyArray<DayCase["day"]>> = {
  "Europe/Athens": [
    [2026, 2, 29],
    [2026, 9, 25],
    [2027, 2, 28],
    [2027, 9, 31],
  ],
  "America/New_York": [
    [2026, 2, 8],
    [2026, 10, 1],
    [2027, 2, 14],
    [2027, 10, 7],
  ],
  "Australia/Lord_Howe": [
    [2026, 3, 5],
    [2026, 9, 4],
    [2027, 3, 4],
    [2027, 9, 3],
  ],
  "Pacific/Auckland": [
    [2026, 3, 5],
    [2026, 8, 27],
    [2027, 3, 4],
    [2027, 8, 26],
  ],
  "Asia/Kolkata": [[2026, 9, 25]],
};

const SWEEP_WALL_TIMES: ReadonlyArray<readonly [number, number]> = [
  ...Array.from({ length: 24 }, (_, i): readonly [number, number] => [
    Math.floor(i / 4),
    (i % 4) * 15,
  ]),
  [12, 0],
  [23, 45],
];

const REAL_DATE_TIME_FORMAT = Intl.DateTimeFormat;
const LOCALE_DATE_METHODS = [
  "toLocaleString",
  "toLocaleDateString",
  "toLocaleTimeString",
] as const;
type LocaleDateMethod = (
  this: Date,
  locales?: Intl.LocalesArgument,
  options?: Intl.DateTimeFormatOptions
) => string;
const REAL_DATE_METHODS = Object.fromEntries(
  LOCALE_DATE_METHODS.map((method) => [method, Date.prototype[method]])
) as Record<(typeof LOCALE_DATE_METHODS)[number], LocaleDateMethod>;

/**
 * Makes every `undefined` locale resolve to `locale`, the way a browser whose
 * UI language is `locale` would. Node's ICU cannot switch the default locale at
 * runtime, so the lookup is wrapped instead.
 */
function forceDefaultLocale(locale: string): void {
  function ForcedDateTimeFormat(
    locales?: Intl.LocalesArgument,
    options?: Intl.DateTimeFormatOptions
  ): Intl.DateTimeFormat {
    return new REAL_DATE_TIME_FORMAT(locales ?? locale, options);
  }
  ForcedDateTimeFormat.prototype = REAL_DATE_TIME_FORMAT.prototype;
  ForcedDateTimeFormat.supportedLocalesOf =
    REAL_DATE_TIME_FORMAT.supportedLocalesOf.bind(REAL_DATE_TIME_FORMAT);
  Object.defineProperty(Intl, "DateTimeFormat", {
    value: ForcedDateTimeFormat,
    configurable: true,
    writable: true,
  });

  for (const method of LOCALE_DATE_METHODS) {
    Object.defineProperty(Date.prototype, method, {
      value: function forcedLocaleMethod(
        this: Date,
        locales?: Intl.LocalesArgument,
        options?: Intl.DateTimeFormatOptions
      ): string {
        return REAL_DATE_METHODS[method].call(this, locales ?? locale, options);
      },
      configurable: true,
      writable: true,
    });
  }
}

function restoreDefaultLocale(): void {
  Object.defineProperty(Intl, "DateTimeFormat", {
    value: REAL_DATE_TIME_FORMAT,
    configurable: true,
    writable: true,
  });
  for (const method of LOCALE_DATE_METHODS) {
    Object.defineProperty(Date.prototype, method, {
      value: REAL_DATE_METHODS[method],
      configurable: true,
      writable: true,
    });
  }
}

/** Wall clock of `zone` at an instant, as milliseconds "as if UTC". */
function createWallClockReader(
  zone: string
): (instantMillis: number) => number {
  const formatter = new REAL_DATE_TIME_FORMAT("en-US", {
    timeZone: zone,
    calendar: "gregory",
    numberingSystem: "latn",
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  });
  return (instantMillis) => {
    const parts = formatter.formatToParts(new Date(instantMillis));
    const read = (type: Intl.DateTimeFormatPartTypes): number =>
      Number(parts.find((part) => part.type === type)?.value);
    return Date.UTC(
      read("year"),
      read("month") - 1,
      read("day"),
      read("hour") % 24,
      read("minute"),
      read("second")
    );
  };
}

/**
 * Independent oracle: every instant (15-minute grid, +/-16h around the wall
 * time) at which the zone's clock shows `wallClockAsUtc`, earliest first.
 */
function bruteForceInstants(
  readWallClock: (instantMillis: number) => number,
  wallClockAsUtc: number
): number[] {
  const fifteenMinutes = 15 * 60 * 1000;
  const matches: number[] = [];
  for (
    let instant = wallClockAsUtc - 16 * 60 * 60 * 1000;
    instant <= wallClockAsUtc + 16 * 60 * 60 * 1000;
    instant += fifteenMinutes
  ) {
    if (readWallClock(instant) === wallClockAsUtc) matches.push(instant);
  }
  return matches;
}

describe("meme calendar zone conversion is independent of the browser locale", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    restoreDefaultLocale();
  });

  describe.each(LOCALES)("default locale %s", (locale) => {
    beforeEach(() => {
      forceDefaultLocale(locale);
    });

    it("really forces the default locale (harness guard)", () => {
      expect(new Intl.DateTimeFormat().resolvedOptions().locale).toBe(locale);
      expect(
        new Intl.DateTimeFormat(undefined, {
          timeZone: "UTC",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }).format(new Date(Date.UTC(2026, 9, 26, 17, 40)))
      ).toBe(
        new REAL_DATE_TIME_FORMAT(locale, {
          timeZone: "UTC",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }).format(new Date(Date.UTC(2026, 9, 26, 17, 40)))
      );
      // an explicit locale is left alone
      expect(new Intl.DateTimeFormat("en-US").resolvedOptions().locale).toBe(
        "en-US"
      );
    });

    it.each(DAY_CASES)(
      "starts the mint at 17:40 Athens on $label",
      ({ day, athensOffsetHours }) => {
        expect(mintStartInstantUtcForMintDay(utcDay(day)).toISOString()).toBe(
          utc(day, 17 - athensOffsetHours, 40)
        );
      }
    );

    it.each(END_CASES)(
      "ends the window at 17:00 Athens the day after $label",
      ({ day, endUtc }) => {
        expect(mintEndInstantUtcForMintDay(utcDay(day)).toISOString()).toBe(
          endUtc
        );
      }
    );

    it.each(DAY_CASES)(
      "maps every phase wall time to the right UTC instant on $label",
      ({ day, athensOffsetHours }) => {
        for (const [hour, minute] of PHASE_WALL_TIMES) {
          expect(
            wallTimeToUtcInstantInZone(utcDay(day), hour, minute).toISOString()
          ).toBe(utc(day, hour - athensOffsetHours, minute));
        }
      }
    );

    it("keeps the winter mint 17:40 Athens (15:40 UTC) right after EU DST ends", () => {
      expect(
        mintStartInstantUtcForMintDay(
          new Date(Date.UTC(2026, 9, 26))
        ).toISOString()
      ).toBe("2026-10-26T15:40:00.000Z");
      expect(
        mintEndInstantUtcForMintDay(
          new Date(Date.UTC(2026, 9, 26))
        ).toISOString()
      ).toBe("2026-10-27T15:00:00.000Z");
    });

    it("builds the Memes phase windows in winter and in summer", () => {
      const winter = buildMemesPhases(Time.fromString("2026-10-26T00:00:00Z"));
      expect(
        winter.map((p) => [p.id, p.start.toIsoString(), p.end.toIsoString()])
      ).toEqual([
        ["0", "2026-10-26T15:40:00.000Z", "2026-10-26T16:20:00.000Z"],
        ["1", "2026-10-26T16:30:00.000Z", "2026-10-26T16:50:00.000Z"],
        ["2", "2026-10-26T17:00:00.000Z", "2026-10-26T17:20:00.000Z"],
        ["public", "2026-10-26T17:20:00.000Z", "2026-10-27T15:00:00.000Z"],
      ]);

      const summer = buildMemesPhases(Time.fromString("2026-10-23T00:00:00Z"));
      expect(
        summer.map((p) => [p.id, p.start.toIsoString(), p.end.toIsoString()])
      ).toEqual([
        ["0", "2026-10-23T14:40:00.000Z", "2026-10-23T15:20:00.000Z"],
        ["1", "2026-10-23T15:30:00.000Z", "2026-10-23T15:50:00.000Z"],
        ["2", "2026-10-23T16:00:00.000Z", "2026-10-23T16:20:00.000Z"],
        ["public", "2026-10-23T16:20:00.000Z", "2026-10-24T14:00:00.000Z"],
      ]);
    });

    it("counts down to the right next mint instant after EU DST ends", () => {
      expect(
        getNextMintStart(new Date("2026-10-26T10:00:00Z")).toISOString()
      ).toBe("2026-10-26T15:40:00.000Z");
      // Friday 2026-10-23 mint (summer) has passed; Monday 2026-10-26 is next.
      expect(
        getNextMintStart(new Date("2026-10-23T20:00:00Z")).toISOString()
      ).toBe("2026-10-26T15:40:00.000Z");
    });

    it("writes the winter mint window into calendar invites", () => {
      const html = printCalendarInvites(
        new Date(Date.UTC(2026, 9, 26)),
        500,
        "currentColor",
        22,
        undefined,
        "en-US"
      );

      // Google Calendar link: DTSTART/DTEND as UTC
      expect(html).toContain("dates=20261026T154000Z%2F20261027T150000Z");

      const icsUrl = /href="(data:text\/calendar[^"]+)"/.exec(html)?.[1];
      expect(icsUrl).toBeDefined();
      const ics = decodeURIComponent(icsUrl!.slice(icsUrl!.indexOf(",") + 1));
      expect(ics).toContain("DTSTART:20261026T154000Z");
      expect(ics).toContain("DTEND:20261027T150000Z");
    });
  });

  describe("around the DST change days", () => {
    it.each(TRANSITION_WALL_TIMES)(
      "maps $label to the right UTC instant",
      ({ day, hour, minute, expectedUtc }) => {
        for (const locale of LOCALES) {
          forceDefaultLocale(locale);
          expect(
            wallTimeToUtcInstantInZone(utcDay(day), hour, minute).toISOString()
          ).toBe(expectedUtc);
        }
      }
    );
  });

  describe("when Intl cannot report the zone offset", () => {
    // Unreadable date parts: the conversion must fail loudly rather than guess
    // an offset (a guess is what showed winter mint times an hour early).
    beforeEach(() => {
      jest
        .spyOn(REAL_DATE_TIME_FORMAT.prototype, "formatToParts")
        .mockReturnValue([]);
    });

    it("really makes the date parts unreadable (harness guard)", () => {
      expect(
        new REAL_DATE_TIME_FORMAT("en-US").formatToParts(new Date())
      ).toEqual([]);
    });

    it("throws a descriptive error instead of guessing an offset", () => {
      expect(() =>
        wallTimeToUtcInstantInZone(new Date(Date.UTC(2026, 9, 26)), 17, 40)
      ).toThrow(
        'Unable to derive the UTC offset of time zone "Europe/Athens": Intl returned unreadable date parts'
      );
      expect(() =>
        wallTimeToUtcInstantInZone(
          new Date(Date.UTC(2026, 9, 26)),
          17,
          40,
          "America/New_York"
        )
      ).toThrow(/"America\/New_York"/);
    });

    it("surfaces the error through the mint helpers instead of returning a wrong time", () => {
      expect(() =>
        mintStartInstantUtcForMintDay(new Date(Date.UTC(2026, 9, 26)))
      ).toThrow(/Unable to derive the UTC offset/);
      expect(() =>
        buildMemesPhases(Time.fromString("2026-10-26T00:00:00Z"))
      ).toThrow(/Unable to derive the UTC offset/);
      expect(() => getNextMintStart(new Date("2026-10-26T10:00:00Z"))).toThrow(
        /Unable to derive the UTC offset/
      );
    });
  });

  it("rejects an unknown time zone", () => {
    expect(() =>
      wallTimeToUtcInstantInZone(
        new Date(Date.UTC(2026, 9, 26)),
        17,
        40,
        "Not/AZone"
      )
    ).toThrow(RangeError);
  });

  describe("other IANA zones (offsets come from Intl, not from Athens rules)", () => {
    it.each(ZONE_CASES)(
      "$zone: $label",
      ({ zone, day, hour, minute, expectedUtc }) => {
        expect(
          wallTimeToUtcInstantInZone(
            utcDay(day),
            hour,
            minute,
            zone
          ).toISOString()
        ).toBe(expectedUtc);
      }
    );

    it("uses Europe/Athens by default", () => {
      const day = utcDay([2026, 9, 26]);
      expect(wallTimeToUtcInstantInZone(day, 17, 40).toISOString()).toBe(
        wallTimeToUtcInstantInZone(day, 17, 40, "Europe/Athens").toISOString()
      );
    });

    it.each(Object.entries(SWEEP_ZONE_DAYS))(
      "matches a brute-force search around the DST changes of %s",
      (zone, days) => {
        const readWallClock = createWallClockReader(zone);
        let repeated = 0;
        let skipped = 0;

        for (const day of days) {
          for (const [hour, minute] of SWEEP_WALL_TIMES) {
            const wallClockAsUtc = Date.UTC(
              day[0],
              day[1],
              day[2],
              hour,
              minute
            );
            const matches = bruteForceInstants(readWallClock, wallClockAsUtc);
            const result = wallTimeToUtcInstantInZone(
              utcDay(day),
              hour,
              minute,
              zone
            );

            if (matches.length === 0) {
              // skipped wall time: shifted forward, never backward
              skipped++;
              const shown = readWallClock(result.getTime());
              expect(shown).toBeGreaterThan(wallClockAsUtc);
              expect(shown - wallClockAsUtc).toBeLessThanOrEqual(
                2 * 60 * 60 * 1000
              );
              continue;
            }
            if (matches.length > 1) repeated++;
            // repeated wall time: the first (earlier) occurrence
            expect(result.getTime()).toBe(matches[0]);
          }
        }

        if (zone === "Asia/Kolkata") {
          expect([repeated, skipped]).toEqual([0, 0]);
        } else {
          expect(repeated).toBeGreaterThan(0);
          expect(skipped).toBeGreaterThan(0);
        }
      }
    );
  });

  it("produces identical instants for every locale across the whole range", () => {
    const results = LOCALES.map((locale) => {
      forceDefaultLocale(locale);
      try {
        const out: string[] = [];
        for (let i = 0; i < 365 * 2; i++) {
          const day = new Date(Date.UTC(2026, 6, 1 + i));
          out.push(mintStartInstantUtcForMintDay(day).toISOString());
          out.push(mintEndInstantUtcForMintDay(day).toISOString());
        }
        return out;
      } finally {
        restoreDefaultLocale();
      }
    });

    for (const result of results.slice(1)) {
      expect(result).toEqual(results[0]);
    }
    // sanity: the reference set exercises both offsets
    const starts = new Set(
      results[0]!.filter((_, i) => i % 2 === 0).map((iso) => iso.slice(11, 16))
    );
    expect(starts).toEqual(new Set(["14:40", "15:40"]));
  });
});

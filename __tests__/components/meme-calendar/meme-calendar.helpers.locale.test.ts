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

describe("meme calendar zone conversion is independent of the browser locale", () => {
  const originalTz = process.env.TZ;

  afterEach(() => {
    restoreDefaultLocale();
    if (originalTz === undefined) {
      delete process.env.TZ;
    } else {
      process.env.TZ = originalTz;
    }
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

  it.each([
    "UTC",
    "America/Los_Angeles",
    "America/New_York",
    "Asia/Kolkata",
    "Pacific/Auckland",
  ])("does not depend on the viewer timezone (%s) under fi-FI", (tz) => {
    process.env.TZ = tz;
    forceDefaultLocale("fi-FI");

    expect(
      mintStartInstantUtcForMintDay(
        new Date(Date.UTC(2026, 9, 26))
      ).toISOString()
    ).toBe("2026-10-26T15:40:00.000Z");
    expect(
      mintStartInstantUtcForMintDay(
        new Date(Date.UTC(2026, 9, 23))
      ).toISOString()
    ).toBe("2026-10-23T14:40:00.000Z");
    expect(
      mintStartInstantUtcForMintDay(
        new Date(Date.UTC(2027, 2, 29))
      ).toISOString()
    ).toBe("2027-03-29T14:40:00.000Z");
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

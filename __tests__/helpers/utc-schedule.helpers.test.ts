import { runInTimeZone, TEST_TIME_ZONES } from "../utils/timeZoneHarness";

jest.setTimeout(60_000);

const MODULE = "helpers/utc-schedule.helpers.ts";
const OCCURRENCE_MODULE = "helpers/utc-next-occurrence.helpers.ts";
const CHECKPOINT = { hour: 16, minute: 0 };
const MWF = [1, 3, 5];

// Mondays at 10:00 UTC: summer and winter in both hemispheres.
const SUMMER_MONDAY = Date.UTC(2026, 6, 13, 10);
const WINTER_MONDAY = Date.UTC(2026, 0, 12, 10);

function localSchedule(
  zone: string,
  nowMs: number,
  weekdays: readonly number[] = MWF,
  locale = "en-US"
): string | null {
  const [formatted] = runInTimeZone<string | null>(
    zone,
    MODULE,
    "formatLocalScheduleTimes",
    [[locale, CHECKPOINT, weekdays, nowMs]]
  );
  return formatted ?? null;
}

describe("formatUtcTimeOfDay", () => {
  it.each(TEST_TIME_ZONES)("prints 16:00 UTC the same in %s", (zone) => {
    const results = runInTimeZone<string>(zone, MODULE, "formatUtcTimeOfDay", [
      ["en-US", CHECKPOINT],
      ["en-GB", CHECKPOINT],
      ["de-DE", CHECKPOINT],
      ["fr-FR", CHECKPOINT],
      ["en-US", { hour: 0, minute: 0 }],
      ["en-US", { hour: 9, minute: 5 }],
    ]);

    expect(results).toEqual([
      "16:00 UTC",
      "16:00 UTC",
      "16:00 UTC",
      "16:00 UTC",
      "00:00 UTC",
      "09:05 UTC",
    ]);
  });
});

describe("getNextUtcOccurrence", () => {
  const monday = (hour: number, minute: number, second = 0) =>
    Date.UTC(2026, 9, 12, hour, minute, second);

  it.each(TEST_TIME_ZONES)(
    "finds the next UTC weekday and time in %s",
    (zone) => {
      const results = runInTimeZone<number | null>(
        zone,
        OCCURRENCE_MODULE,
        "getNextUtcOccurrence",
        [
          // Monday 15:59:59 UTC: today's checkpoint is still ahead.
          [CHECKPOINT, 1, monday(15, 59, 59)],
          // Exactly at the checkpoint counts as the checkpoint.
          [CHECKPOINT, 1, monday(16, 0)],
          // One second later the next Monday is a week away.
          [CHECKPOINT, 1, monday(16, 0, 1)],
          [CHECKPOINT, 3, monday(16, 0, 1)],
          [CHECKPOINT, 0, monday(16, 0, 1)],
          // Not a weekday.
          [CHECKPOINT, 7, monday(16, 0, 1)],
        ]
      );

      expect(results).toEqual([
        monday(16, 0),
        monday(16, 0),
        Date.UTC(2026, 9, 19, 16),
        Date.UTC(2026, 9, 14, 16),
        Date.UTC(2026, 9, 18, 16),
        null,
      ]);
    }
  );
});

describe("formatLocalScheduleTimes", () => {
  it("adds nothing for a viewer in UTC", () => {
    expect(localSchedule("UTC", SUMMER_MONDAY)).toBeNull();
    expect(localSchedule("UTC", WINTER_MONDAY)).toBeNull();
  });

  it("still names the zone for a viewer on UTC+0 with another label", () => {
    expect(localSchedule("Europe/London", WINTER_MONDAY)).toBe(
      "Mon, Wed, Fri 16:00 GMT"
    );
    expect(localSchedule("Europe/London", SUMMER_MONDAY)).toBe(
      "Mon, Wed, Fri 17:00 GMT+1"
    );
  });

  it("follows daylight saving for a viewer in Los Angeles", () => {
    expect(localSchedule("America/Los_Angeles", SUMMER_MONDAY)).toBe(
      "Mon, Wed, Fri 09:00 PDT"
    );
    expect(localSchedule("America/Los_Angeles", WINTER_MONDAY)).toBe(
      "Mon, Wed, Fri 08:00 PST"
    );
  });

  it("moves to the next local day for a viewer in Auckland", () => {
    // 16:00 UTC is already the next morning in New Zealand, in both seasons.
    expect(localSchedule("Pacific/Auckland", SUMMER_MONDAY)).toBe(
      "Tue, Thu, Sat 04:00 GMT+12"
    );
    expect(localSchedule("Pacific/Auckland", WINTER_MONDAY)).toBe(
      "Tue, Thu, Sat 05:00 GMT+13"
    );
  });

  it("keeps the UTC weekday when only one checkpoint is asked for", () => {
    expect(localSchedule("America/Los_Angeles", SUMMER_MONDAY, [1])).toBe(
      "Mon 09:00 PDT"
    );
    expect(localSchedule("Pacific/Auckland", SUMMER_MONDAY, [1])).toBe(
      "Tue 04:00 GMT+12"
    );
  });

  it("lists each time when daylight saving changes between checkpoints", () => {
    // Friday 30 Oct 2026: US clocks go back on Sunday 1 Nov, before Monday.
    expect(
      localSchedule("America/Los_Angeles", Date.UTC(2026, 9, 30, 10))
    ).toBe("Mon 08:00 PST, Wed 08:00 PST, Fri 09:00 PDT");
  });

  it("uses the viewer's locale for weekdays", () => {
    // ICU versions differ on the abbreviation dot ("Di" or "Di.").
    expect(
      localSchedule("Pacific/Auckland", SUMMER_MONDAY, [1], "de-DE")
    ).toMatch(/^Di\.? 04:00 GMT\+12$/);
  });

  it("returns null when no weekday resolves", () => {
    expect(localSchedule("UTC", SUMMER_MONDAY, [])).toBeNull();
    expect(localSchedule("UTC", SUMMER_MONDAY, [9])).toBeNull();
  });
});

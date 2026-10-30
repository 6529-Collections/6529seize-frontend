import {
  SKIPPED_MINT_UTC_DAYS,
  EXTRA_MINT_UTC_DAYS,
} from "../../shared/memes-calendar/overrides";
import {
  dateFromMintNumber,
  getMintNumberForMintDate,
  getMintSchedule,
  mintPhaseWindowsForDay,
} from "../../shared/memes-calendar";

const wallTime = (date: Date) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Athens",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
describe("shared Memes launch calendar", () => {
  it.each([
    "2026-01-05",
    "2026-07-06",
    "2026-03-27",
    "2026-03-30",
    "2026-10-23",
    "2026-10-26",
  ])("keeps every phase on Athens time for %s", (day) => {
    const id = getMintNumberForMintDate(new Date(day + "T00:00:00Z"));
    const schedule = getMintSchedule(id);
    expect(
      schedule.phases.map((p) => [wallTime(p.start), wallTime(p.end)])
    ).toEqual([
      ["17:40", "18:20"],
      ["18:30", "18:50"],
      ["19:00", "19:20"],
      ["19:20", "17:00"],
    ]);
    expect(wallTime(schedule.previewAt)).toBe("17:15");
    expect(wallTime(schedule.postMintAt)).toBe("18:00");
    expect(schedule.version).toBe("2026-10-23.4");
    expect(schedule.timeZone).toBe("Europe/Athens");
  });
  it.each([
    ["2026-03-28", 80_400_000],
    ["2026-10-24", 87_600_000],
  ] as const)(
    "calculates next-day close independently across a clock change on %s",
    (day, expectedSpanMs) => {
      const phases = mintPhaseWindowsForDay(new Date(day + "T00:00:00Z"));
      const publicPhase = phases[3]!;
      expect(wallTime(publicPhase.end)).toBe("17:00");
      expect(publicPhase.end.getTime() - phases[0]!.start.getTime()).toBe(
        expectedSpanMs
      );
    }
  );
  it("retains the AWS-outage reschedule and exact historical mints", () => {
    expect(dateFromMintNumber(415).toISOString()).toBe(
      "2025-10-21T14:40:00.000Z"
    );
    expect(dateFromMintNumber(1).toISOString()).toBe(
      "2022-06-09T17:01:18.000Z"
    );
  });
  it.each([0, -1, 1.5, Number.NaN, 100001])(
    "rejects an invalid mint number %s",
    (id) => {
      expect(() => getMintSchedule(id)).toThrow(RangeError);
    }
  );
  it("returns fresh dates so modifying a displayed schedule cannot change later results", () => {
    const expected = getMintSchedule(564).mintEnd.toISOString();
    getMintSchedule(564).mintEnd.setUTCFullYear(2000);
    expect(getMintSchedule(564).mintEnd.toISOString()).toBe(expected);
  });
});

describe("future calendar overrides", () => {
  const day = (iso: string) => Date.parse(iso + "T00:00:00Z");
  const skipped = new Set(SKIPPED_MINT_UTC_DAYS);
  const extras = new Set(EXTRA_MINT_UTC_DAYS);
  afterEach(() => {
    SKIPPED_MINT_UTC_DAYS.clear();
    EXTRA_MINT_UTC_DAYS.clear();
    skipped.forEach((value) => SKIPPED_MINT_UTC_DAYS.add(value));
    extras.forEach((value) => EXTRA_MINT_UTC_DAYS.add(value));
  });
  it.each([
    ["weekday skip", ["2026-01-05"], [], -1],
    ["off-cadence extra", [], ["2026-01-06"], 1],
    ["regular-day extra", [], ["2026-01-05"], 0],
    ["off-cadence skip", ["2026-01-06"], [], 0],
    ["weekday skip wins", ["2026-01-05"], ["2026-01-05"], -1],
    ["off-cadence skip wins", ["2026-01-06"], ["2026-01-06"], 0],
    ["reschedule", ["2026-01-05"], ["2026-01-06"], 0],
    ["reschedule onto an eligible day", ["2026-01-05"], ["2026-01-07"], -1],
  ] as const)(
    "keeps forward and inverse numbering aligned for %s",
    (_label, removed, added, delta) => {
      const end = new Date(day("2026-01-09"));
      const original = getMintNumberForMintDate(end);
      removed.forEach((value) => SKIPPED_MINT_UTC_DAYS.add(day(value)));
      added.forEach((value) => EXTRA_MINT_UTC_DAYS.add(day(value)));
      expect(getMintNumberForMintDate(end)).toBe(original + delta);
      for (let n = original - 4; n <= original + 2; n++)
        expect(getMintNumberForMintDate(dateFromMintNumber(n))).toBe(n);
    }
  );
});

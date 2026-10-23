import {
  dateFromMintNumber,
  getMintNumberForMintDate,
  getMintSchedule,
  mintPhaseWindowsForDay,
} from "@/shared/memes-calendar";

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
    expect(schedule.version).toBe("2026-10-23.1");
    expect(schedule.timeZone).toBe("Europe/Athens");
  });
  it.each(["2026-03-28", "2026-10-24"])(
    "calculates next-day close independently across a clock change on %s",
    (day) => {
      const phases = mintPhaseWindowsForDay(new Date(day + "T00:00:00Z"));
      const publicPhase = phases[3]!;
      expect(wallTime(publicPhase.end)).toBe("17:00");
      expect(publicPhase.end.getTime() - phases[0]!.start.getTime()).not.toBe(
        84_000_000
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

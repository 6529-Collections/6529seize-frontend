import {
  getCurrentMintTimelineDetails,
  getMintNumberForMintDate,
  getMintSchedule,
  getMintTimelineDetails,
  getMintTimelineStatus,
  getNextMintTimelineDetails,
} from "../../shared/memes-calendar";
import {
  EXTRA_MINT_UTC_DAYS,
  SKIPPED_MINT_UTC_DAYS,
} from "../../shared/memes-calendar/overrides";

describe("shared calendar queries", () => {
  it.each([
    ["2026-01-02", "15"],
    ["2026-02-02", "15"],
    ["2026-03-02", "15"],
    ["2026-04-01", "14"],
    ["2026-05-01", "14"],
    ["2026-06-01", "14"],
    ["2026-07-01", "14"],
    ["2026-08-03", "14"],
    ["2026-09-02", "14"],
    ["2026-10-02", "14"],
    ["2026-11-02", "15"],
    ["2026-12-02", "15"],
    ["2026-03-27", "15"],
    ["2026-03-30", "14"],
    ["2026-10-23", "14"],
    ["2026-10-26", "15"],
    ["2027-01-01", "15"],
    ["2028-02-28", "15"],
  ])("uses Athens wall times and exact boundaries on %s", (day, hour) => {
    const start = new Date(`${day}T${hour}:40:00Z`);
    const before = new Date(start.getTime() - 1);
    const next = getNextMintTimelineDetails(before);
    expect(next.instantUtc.toISOString()).toBe(start.toISOString());
    expect(getCurrentMintTimelineDetails(before)).toBeNull();
    expect(getMintTimelineStatus(next, before)).toBe("upcoming");
    expect(getCurrentMintTimelineDetails(start)?.mintNumber).toBe(
      next.mintNumber
    );
    expect(getMintTimelineStatus(next, start)).toBe("live");
    expect(getNextMintTimelineDetails(start).mintNumber).toBe(
      next.mintNumber + 1
    );
    const closingDay = new Date(`${day}T00:00:00Z`);
    closingDay.setUTCDate(closingDay.getUTCDate() + 1);
    const close = new Date(
      `${closingDay.toISOString().slice(0, 10)}T${hour}:00:00Z`
    );
    expect(next.mintEndUtc.toISOString()).toBe(close.toISOString());
    expect(
      getCurrentMintTimelineDetails(new Date(close.getTime() - 1))?.mintNumber
    ).toBe(next.mintNumber);
    expect(getCurrentMintTimelineDetails(close)).toBeNull();
    expect(getMintTimelineStatus(next, close)).toBe("past");
  });

  it("preserves the off-cadence outage reschedule", () => {
    const next = getNextMintTimelineDetails(new Date("2025-10-20T00:00:00Z"));
    expect(next.mintNumber).toBe(415);
    expect(next.instantUtc.toISOString()).toBe("2025-10-21T14:40:00.000Z");
    expect(
      getCurrentMintTimelineDetails(new Date("2025-10-22T10:00:00Z"))
        ?.mintNumber
    ).toBe(415);
  });

  it("retains the exact first historical mint", () => {
    expect(getMintTimelineDetails(1).instantUtc.toISOString()).toBe(
      "2022-06-09T17:01:18.000Z"
    );
  });

  it("keeps next-day closing fixed across a gap with skipped mint days", () => {
    const days = ["2026-11-02", "2026-11-04"].map((day) =>
      Date.parse(`${day}T00:00:00Z`)
    );
    const skipped = new Set(SKIPPED_MINT_UTC_DAYS);
    try {
      days.forEach((day) => SKIPPED_MINT_UTC_DAYS.add(day));
      const friday = getMintNumberForMintDate(new Date("2026-10-30T00:00:00Z"));
      expect(
        getCurrentMintTimelineDetails(new Date("2026-10-31T14:59:59.999Z"))
          ?.mintNumber
      ).toBe(friday);
      expect(
        getCurrentMintTimelineDetails(new Date("2026-10-31T15:00:00Z"))
      ).toBeNull();
      expect(
        getCurrentMintTimelineDetails(new Date("2026-11-02T12:00:00Z"))
      ).toBeNull();
      expect(
        getNextMintTimelineDetails(
          new Date("2026-10-31T12:00:00Z")
        ).instantUtc.toISOString()
      ).toBe("2026-11-06T15:40:00.000Z");
    } finally {
      days.forEach((day) => {
        if (!skipped.has(day)) SKIPPED_MINT_UTC_DAYS.delete(day);
      });
    }
  });

  it("finds live mints with adjacent extra days followed by a regular day", () => {
    const days = ["2026-10-31", "2026-11-01"].map((day) =>
      Date.parse(`${day}T00:00:00Z`)
    );
    const extras = new Set(EXTRA_MINT_UTC_DAYS);
    const friday = getMintNumberForMintDate(new Date("2026-10-30T00:00:00Z"));
    try {
      days.forEach((day) => EXTRA_MINT_UTC_DAYS.add(day));
      const cases = [
        ["2026-10-31T14:59:59.999Z", 0],
        ["2026-10-31T15:00:00Z", null],
        ["2026-10-31T15:40:00Z", 1],
        ["2026-11-01T10:00:00Z", 1],
        ["2026-11-01T15:00:00Z", null],
        ["2026-11-01T15:40:00Z", 2],
        ["2026-11-02T10:00:00Z", 2],
        ["2026-11-02T15:00:00Z", null],
        ["2026-11-02T15:40:00Z", 3],
      ] as const;
      for (const [clock, offset] of cases) {
        const now = new Date(clock);
        const current = getCurrentMintTimelineDetails(now);
        if (offset === null) expect(current).toBeNull();
        else {
          expect(current?.mintNumber).toBe(friday + offset);
          expect([0, 1]).toContain(
            getMintNumberForMintDate(now) - current!.mintNumber
          );
        }
      }
    } finally {
      days.forEach((day) => {
        if (!extras.has(day)) EXTRA_MINT_UTC_DAYS.delete(day);
      });
    }
  });

  it.each([2026, 2027, 2028, 2029, 2030])(
    "keeps every mint and phase on the right Athens date throughout %i",
    (year) => {
      const format = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/Athens",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      });
      const wall = (date: Date) =>
        Object.fromEntries(
          format.formatToParts(date).map(({ type, value }) => [type, value])
        );
      const day = new Date(Date.UTC(year, 0, 1));
      let previous = 0;
      while (day.getUTCFullYear() === year) {
        if ([1, 3, 5].includes(day.getUTCDay())) {
          const number = getMintNumberForMintDate(day);
          if (previous) expect(number).toBe(previous + 1);
          previous = number;
          const schedule = getMintSchedule(number);
          expect(schedule.mintStart.toISOString().slice(0, 10)).toBe(
            day.toISOString().slice(0, 10)
          );
          const closingDay = new Date(day);
          closingDay.setUTCDate(closingDay.getUTCDate() + 1);
          expect(wall(schedule.mintEnd)).toMatchObject({
            year: String(closingDay.getUTCFullYear()),
            month: String(closingDay.getUTCMonth() + 1).padStart(2, "0"),
            day: String(closingDay.getUTCDate()).padStart(2, "0"),
            hour: "17",
            minute: "00",
          });
          ["17:40", "18:30", "19:00", "19:20"].forEach((time, index) => {
            const phase = wall(schedule.phases[index]!.start);
            expect(`${phase["hour"]}:${phase["minute"]}`).toBe(time);
            expect(phase["day"]).toBe(String(day.getUTCDate()).padStart(2, "0"));
            const end = wall(schedule.phases[index]!.end);
            expect(`${end["hour"]}:${end["minute"]}`).toBe(
              ["18:20", "18:50", "19:20", "17:00"][index]
            );
          });
          expect(wall(schedule.previewAt)).toMatchObject({
            hour: "17",
            minute: "15",
          });
          expect(wall(schedule.postMintAt)).toMatchObject({
            hour: "18",
            minute: "00",
          });
        }
        day.setUTCDate(day.getUTCDate() + 1);
      }
    }
  );

  it.each(["UTC", "America/Los_Angeles", "Asia/Tokyo"])(
    "ignores the host timezone %s",
    (zone) => {
      const old = process.env["TZ"];
      try {
        process.env["TZ"] = zone;
        const next = getNextMintTimelineDetails(
          new Date("2026-10-25T22:30:00Z")
        );
        expect(next.instantUtc.toISOString()).toBe("2026-10-26T15:40:00.000Z");
      } finally {
        if (old === undefined) delete process.env["TZ"];
        else process.env["TZ"] = old;
      }
    }
  );

  it("rejects invalid clock input", () => {
    expect(() => getNextMintTimelineDetails(new Date(Number.NaN))).toThrow(
      "Invalid calendar time"
    );
    expect(() => getCurrentMintTimelineDetails(new Date(Number.NaN))).toThrow(
      "Invalid calendar time"
    );
  });
});

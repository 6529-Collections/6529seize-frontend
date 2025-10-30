import {
  mintStartInstantUtcForMintDay,
  nextMintDateOnOrAfter,
  wallTimeToUtcInstantInZone,
} from "@/components/meme-calendar/meme-calendar.helpers";

const formatAthensTime = (date: Date): string =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Athens",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

const isoDate = (y: number, m: number, d: number): Date =>
  new Date(Date.UTC(y, m, d));

const mintEndInstantUtcForMintDay = (mintDay: Date): Date => {
  const nextDay = new Date(
    Date.UTC(
      mintDay.getUTCFullYear(),
      mintDay.getUTCMonth(),
      mintDay.getUTCDate() + 1
    )
  );
  return wallTimeToUtcInstantInZone(nextDay, 17, 0);
};

describe("meme calendar timezone handling", () => {
  it("keeps mint start anchored to 17:40 Athens time across 2024", () => {
    const months = Array.from({ length: 12 }, (_, idx) => idx);

    for (const month of months) {
      const mintDay = nextMintDateOnOrAfter(isoDate(2024, month, 1));
      const mintStart = mintStartInstantUtcForMintDay(mintDay);
      const mintEnd = mintEndInstantUtcForMintDay(mintDay);

      expect(formatAthensTime(mintStart)).toBe("17:40");
      expect(formatAthensTime(mintEnd)).toBe("17:00");
      expect(mintEnd.getTime()).toBeGreaterThan(mintStart.getTime());
    }
  });

  it("applies the spring DST shift only after the EU transition completes", () => {
    const beforeShiftMint = nextMintDateOnOrAfter(isoDate(2024, 2, 10)); // Mon, 11 Mar 2024 (still winter offset)
    expect(beforeShiftMint.toISOString()).toBe("2024-03-11T00:00:00.000Z");

    const beforeShiftStart = mintStartInstantUtcForMintDay(beforeShiftMint);
    const beforeShiftEnd = mintEndInstantUtcForMintDay(beforeShiftMint);

    expect(beforeShiftStart.toISOString()).toBe("2024-03-11T15:40:00.000Z");
    expect(beforeShiftEnd.toISOString()).toBe("2024-03-12T15:00:00.000Z");
    expect(formatAthensTime(beforeShiftStart)).toBe("17:40");
    expect(formatAthensTime(beforeShiftEnd)).toBe("17:00");

    const afterShiftMint = nextMintDateOnOrAfter(isoDate(2024, 3, 1)); // Mon, 1 Apr 2024
    expect(afterShiftMint.toISOString()).toBe("2024-04-01T00:00:00.000Z");

    const afterShiftStart = mintStartInstantUtcForMintDay(afterShiftMint);
    const afterShiftEnd = mintEndInstantUtcForMintDay(afterShiftMint);

    expect(afterShiftStart.toISOString()).toBe("2024-04-01T14:40:00.000Z");
    expect(afterShiftEnd.toISOString()).toBe("2024-04-02T14:00:00.000Z");
    expect(formatAthensTime(afterShiftStart)).toBe("17:40");
    expect(formatAthensTime(afterShiftEnd)).toBe("17:00");
  });

  it("handles the autumn DST rollback without breaking mint anchors", () => {
    const beforeRollbackMint = nextMintDateOnOrAfter(isoDate(2024, 9, 24)); // Fri, 25 Oct 2024
    expect(beforeRollbackMint.toISOString()).toBe("2024-10-25T00:00:00.000Z");

    const beforeRollbackStart = mintStartInstantUtcForMintDay(beforeRollbackMint);
    const beforeRollbackEnd = mintEndInstantUtcForMintDay(beforeRollbackMint);

    expect(beforeRollbackStart.toISOString()).toBe("2024-10-25T14:40:00.000Z");
    expect(beforeRollbackEnd.toISOString()).toBe("2024-10-26T14:00:00.000Z");
    expect(formatAthensTime(beforeRollbackStart)).toBe("17:40");
    expect(formatAthensTime(beforeRollbackEnd)).toBe("17:00");

    const afterRollbackMint = nextMintDateOnOrAfter(isoDate(2024, 9, 27)); // Mon, 28 Oct 2024
    expect(afterRollbackMint.toISOString()).toBe("2024-10-28T00:00:00.000Z");

    const afterRollbackStart = mintStartInstantUtcForMintDay(afterRollbackMint);
    const afterRollbackEnd = mintEndInstantUtcForMintDay(afterRollbackMint);

    expect(afterRollbackStart.toISOString()).toBe("2024-10-28T15:40:00.000Z");
    expect(afterRollbackEnd.toISOString()).toBe("2024-10-29T15:00:00.000Z");
    expect(formatAthensTime(afterRollbackStart)).toBe("17:40");
    expect(formatAthensTime(afterRollbackEnd)).toBe("17:00");
  });

  it("shares phase wall-clock logic via wallTimeToUtcInstantInZone", () => {
    const summerMintDay = isoDate(2024, 6, 1);
    const winterMintDay = isoDate(2024, 0, 3);

    const phaseWallTimes: Array<[number, number]> = [
      [17, 40],
      [18, 20],
      [18, 30],
      [18, 50],
      [19, 0],
      [19, 20],
    ];

    const getPhaseUtcInstants = (mintDay: Date) =>
      phaseWallTimes.map(([hour, minute]) =>
        wallTimeToUtcInstantInZone(mintDay, hour, minute)
      );

    const summerPhaseTimes = getPhaseUtcInstants(summerMintDay);
    const winterPhaseTimes = getPhaseUtcInstants(winterMintDay);

    const expectedWallTimes = phaseWallTimes.map(
      ([hour, minute]) =>
        `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
    );

    expect(summerPhaseTimes.map(formatAthensTime)).toEqual(expectedWallTimes);
    expect(winterPhaseTimes.map(formatAthensTime)).toEqual(expectedWallTimes);

    expect(summerPhaseTimes[0].toISOString()).toBe("2024-07-01T14:40:00.000Z");
    expect(winterPhaseTimes[0].toISOString()).toBe("2024-01-03T15:40:00.000Z");
  });
});

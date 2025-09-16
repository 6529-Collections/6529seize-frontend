import { Children, isValidElement } from "react";
import type { ReactElement } from "react";
import {
  formatToFullDivision,
  getCardsRemainingUntilEndOf,
  getMintNumberForMintDate,
  getNextMintNumber,
  getNextMintStart,
  getRangeDatesByZoom,
  getSeasonIndexForDate,
  isMintEligibleUtcDay,
  isMintingActive,
  mintEndInstantUtcForMintDay,
  mintStartInstantUtcForMintDay,
  nextMintDateOnOrAfter,
  printCalendarInvites,
} from "@/components/meme-calendar/meme-calendar.helpers";
import type { ZoomLevel } from "@/components/meme-calendar/meme-calendar.helpers";

const startOfUtcDay = (date: Date): Date =>
  new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );

const countMintsBetween = (start: Date, end: Date): number => {
  const cursor = startOfUtcDay(start);
  const last = startOfUtcDay(end).getTime();
  let count = 0;

  while (cursor.getTime() <= last) {
    if (isMintEligibleUtcDay(cursor)) {
      count++;
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return count;
};

describe("formatToFullDivision", () => {
  it("renders each division with a date range", () => {
    const node = formatToFullDivision(new Date(Date.UTC(2025, 9, 1)));
    expect(isValidElement(node)).toBe(true);

    const tbody = (node as ReactElement).props.children;
    expect(isValidElement(tbody)).toBe(true);

    const rows = Children.toArray((tbody as ReactElement).props.children) as ReactElement[];

    expect(rows).toHaveLength(6);

    const labels = rows.map((row) => {
      const cells = Children.toArray(row.props.children) as ReactElement[];
      const labelCell = cells[0];
      const rangeCell = cells[1];
      const labelText = Children.toArray(labelCell.props.children)
        .map((child) => String(child).trim())
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      const span = rangeCell.props.children as ReactElement;
      const rangeText = String(span.props.children);
      expect(rangeText).toContain("-");
      return labelText;
    });

    expect(labels.join(" ")).toMatch(
      /SZN\s+\d+.*Year\s+\d+.*Epoch\s+\d+.*Period\s+\d+.*Era\s+\d+.*Eon\s+\d+/
    );
  });
});

describe("printCalendarInvites", () => {
  it("sets a 14:00 UTC end time for summer mints", () => {
    const mintDay = nextMintDateOnOrAfter(new Date(Date.UTC(2024, 6, 3)));
    const mintInstant = mintStartInstantUtcForMintDay(mintDay);
    const mintNumber = getMintNumberForMintDate(mintDay);
    const html = printCalendarInvites(mintInstant, mintNumber);

    expect(html).toContain("dates=20240703T144000Z%2F20240704T140000Z");
    expect(html).toContain("DTEND%3A20240704T140000Z");
  });

  it("sets a 15:00 UTC end time for winter mints", () => {
    const mintDay = nextMintDateOnOrAfter(new Date(Date.UTC(2024, 0, 3)));
    const mintInstant = mintStartInstantUtcForMintDay(mintDay);
    const mintNumber = getMintNumberForMintDate(mintDay);
    const html = printCalendarInvites(mintInstant, mintNumber);

    expect(html).toContain("dates=20240103T154000Z%2F20240104T150000Z");
    expect(html).toContain("DTEND%3A20240104T150000Z");
  });

  it("honours the mint window for off-schedule eligible mints", () => {
    const mintDay = new Date(Date.UTC(2023, 9, 26));
    const mintInstant = mintStartInstantUtcForMintDay(mintDay);
    const mintNumber = getMintNumberForMintDate(mintDay);
    const html = printCalendarInvites(mintInstant, mintNumber);

    expect(html).toContain("dates=20231026T144000Z%2F20231027T140000Z");
    expect(html).toContain("DTEND%3A20231027T140000Z");
  });
});

describe("Eastern time transitions", () => {
  it("switches to EDT for mints after the spring shift", () => {
    const mintDay = nextMintDateOnOrAfter(new Date(Date.UTC(2024, 2, 11)));
    expect(isMintEligibleUtcDay(mintDay)).toBe(true);
    expect(mintDay.toISOString()).toBe("2024-03-11T00:00:00.000Z");

    const mintStart = mintStartInstantUtcForMintDay(mintDay);
    const mintEnd = mintEndInstantUtcForMintDay(mintDay);

    expect(mintStart.toISOString()).toBe("2024-03-11T14:40:00.000Z");
    expect(mintEnd.toISOString()).toBe("2024-03-12T14:00:00.000Z");
  });

  it("returns to EST once the fall shift completes", () => {
    const mintDay = nextMintDateOnOrAfter(new Date(Date.UTC(2024, 10, 4)));
    expect(isMintEligibleUtcDay(mintDay)).toBe(true);
    expect(mintDay.toISOString()).toBe("2024-11-04T00:00:00.000Z");

    const mintStart = mintStartInstantUtcForMintDay(mintDay);
    const mintEnd = mintEndInstantUtcForMintDay(mintDay);

    expect(mintStart.toISOString()).toBe("2024-11-04T15:40:00.000Z");
    expect(mintEnd.toISOString()).toBe("2024-11-05T15:00:00.000Z");
  });
});

describe("mint timing helpers", () => {
  const mintDay = nextMintDateOnOrAfter(new Date(Date.UTC(2024, 6, 3)));
  const mintNumber = getMintNumberForMintDate(mintDay);
  const mintStart = mintStartInstantUtcForMintDay(mintDay);
  const nextMintDay = nextMintDateOnOrAfter(
    new Date(Date.UTC(mintDay.getUTCFullYear(), mintDay.getUTCMonth(), mintDay.getUTCDate() + 1))
  );
  const nextMintStart = mintStartInstantUtcForMintDay(nextMintDay);

  const beforeMint = new Date(Date.UTC(2024, 6, 3, 12));
  const duringMint = new Date(Date.UTC(2024, 6, 3, 15));
  const afterWindow = new Date(Date.UTC(2024, 6, 4, 16));

  it("returns the next mint start time", () => {
    expect(getNextMintStart(beforeMint).getTime()).toBe(mintStart.getTime());
    expect(getNextMintStart(duringMint).getTime()).toBe(nextMintStart.getTime());
  });

  it("reports whether minting is active", () => {
    expect(isMintingActive(beforeMint)).toBe(false);
    expect(isMintingActive(duringMint)).toBe(true);
    expect(isMintingActive(new Date(Date.UTC(2024, 6, 4, 14, 30)))).toBe(false);
  });

  it("returns the current or upcoming mint number", () => {
    const nextMintNumber = getMintNumberForMintDate(nextMintDay);

    expect(getNextMintNumber(beforeMint)).toBe(mintNumber);
    expect(getNextMintNumber(duringMint)).toBe(mintNumber);
    expect(getNextMintNumber(afterWindow)).toBe(nextMintNumber);
  });
});

describe("getCardsRemainingUntilEndOf", () => {
  const future = new Date(Date.UTC(2025, 8, 20, 12));
  const futureUtc = startOfUtcDay(future);
  const searchStart = new Date(
    Date.UTC(
      futureUtc.getUTCFullYear(),
      futureUtc.getUTCMonth(),
      futureUtc.getUTCDate() + 1
    )
  );
  const firstUpcomingMint = nextMintDateOnOrAfter(searchStart);
  const zoomLevels: ZoomLevel[] = [
    "season",
    "year",
    "epoch",
    "period",
    "era",
    "eon",
  ];

  for (const zoom of zoomLevels) {
    it(`counts remaining mints for ${zoom}`, () => {
      const { end } = getRangeDatesByZoom(
        zoom,
        getSeasonIndexForDate(firstUpcomingMint)
      );
      const expected = countMintsBetween(firstUpcomingMint, end);
      expect(getCardsRemainingUntilEndOf(zoom, future)).toBe(expected);
    });
  }

  it("skips the current mint day when counting remaining cards", () => {
    const now = new Date(Date.UTC(2024, 6, 3, 12));
    const todayUtc = startOfUtcDay(now);
    const search = new Date(
      Date.UTC(
        todayUtc.getUTCFullYear(),
        todayUtc.getUTCMonth(),
        todayUtc.getUTCDate() + 1
      )
    );
    const upcomingMint = nextMintDateOnOrAfter(search);
    const { end } = getRangeDatesByZoom(
      "season",
      getSeasonIndexForDate(upcomingMint)
    );
    const expected = countMintsBetween(upcomingMint, end);
    expect(getCardsRemainingUntilEndOf("season", now)).toBe(expected);
  });
});

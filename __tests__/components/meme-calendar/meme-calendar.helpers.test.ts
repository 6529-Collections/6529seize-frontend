import {
  ZoomLevel,
  formatToFullDivision,
  getCardsRemainingUntilEndOf,
  getMintNumberForMintDate,
  getMintTimelineDetails,
  getNextMintStart,
  getRangeDatesByZoom,
  getSeasonIndexForDate,
  getUpcomingMintsForCurrentOrNextSeason,
  isMintEligibleUtcDay,
  isMintingActive,
  isMintingToday,
  mintStartInstantUtcForMintDay,
  nextMintDateOnOrAfter,
  printCalendarInvites,
} from "@/components/meme-calendar/meme-calendar.helpers";
import type { ReactElement } from "react";
import { Children, isValidElement } from "react";

const asElement = (n: unknown): ReactElement<any> => {
  if (!isValidElement(n)) {
    throw new Error("Expected a valid ReactElement");
  }
  return n as ReactElement<any>;
};

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

    const elementNode = asElement(node as unknown);
    const tbody = asElement(elementNode.props.children as unknown);
    expect(isValidElement(tbody)).toBe(true);

    const rows = Children.toArray(tbody.props.children).map(asElement);

    expect(rows).toHaveLength(6);

    const labels = rows.map((row) => {
      const cells = Children.toArray(row.props.children).map(asElement);
      const [labelCell, rangeCell] = cells;
      const labelText = Children.toArray(labelCell.props.children)
        .map((child) => String(child).trim())
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      const span = asElement(rangeCell.props.children as unknown);
      const rangeText = String(span.props.children);
      expect(rangeText).toContain("-");
      return labelText;
    });

    expect(labels.join(" ")).toMatch(
      /^SZN\s+\d+\b[^\r\n]*?Year\s+\d+\b[^\r\n]*?Epoch\s+\d+\b[^\r\n]*?Period\s+\d+\b[^\r\n]*?Era\s+\d+\b[^\r\n]*?Eon\s+\d+\b$/
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
    const mintEnd = getMintTimelineDetails(
      getMintNumberForMintDate(mintDay)
    ).mintEndUtc;

    expect(mintStart.toISOString()).toBe("2024-03-11T15:40:00.000Z");
    expect(mintEnd.toISOString()).toBe("2024-03-12T15:00:00.000Z");
  });

  it("returns to EST once the fall shift completes", () => {
    const mintDay = nextMintDateOnOrAfter(new Date(Date.UTC(2024, 10, 4)));
    expect(isMintEligibleUtcDay(mintDay)).toBe(true);
    expect(mintDay.toISOString()).toBe("2024-11-04T00:00:00.000Z");

    const mintStart = mintStartInstantUtcForMintDay(mintDay);
    const mintEnd = getMintTimelineDetails(
      getMintNumberForMintDate(mintDay)
    ).mintEndUtc;

    expect(mintStart.toISOString()).toBe("2024-11-04T15:40:00.000Z");
    expect(mintEnd.toISOString()).toBe("2024-11-05T15:00:00.000Z");
  });
});

describe("mint timing helpers", () => {
  const mintDay = nextMintDateOnOrAfter(new Date(Date.UTC(2024, 6, 3)));
  const mintNumber = getMintNumberForMintDate(mintDay);
  const mintStart = mintStartInstantUtcForMintDay(mintDay);
  const nextMintDay = nextMintDateOnOrAfter(
    new Date(
      Date.UTC(
        mintDay.getUTCFullYear(),
        mintDay.getUTCMonth(),
        mintDay.getUTCDate() + 1
      )
    )
  );
  const nextMintStart = mintStartInstantUtcForMintDay(nextMintDay);

  const beforeMint = new Date(Date.UTC(2024, 6, 3, 12));
  const duringMint = new Date(Date.UTC(2024, 6, 3, 15));
  const afterWindow = new Date(Date.UTC(2024, 6, 4, 16));

  it("returns the next mint start time", () => {
    expect(getNextMintStart(beforeMint).getTime()).toBe(mintStart.getTime());
    expect(getNextMintStart(duringMint).getTime()).toBe(
      nextMintStart.getTime()
    );
  });

  it("reports whether minting is active", () => {
    expect(isMintingActive(beforeMint)).toBe(true);
    expect(isMintingActive(duringMint)).toBe(true);
    const justBeforeEnd = new Date(afterWindow.getTime() - 1000);
    expect(isMintingActive(justBeforeEnd)).toBe(false);
    expect(isMintingActive(afterWindow)).toBe(false);
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
    "szn",
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
      "szn",
      getSeasonIndexForDate(upcomingMint)
    );
    const expected = countMintsBetween(upcomingMint, end);
    expect(getCardsRemainingUntilEndOf("szn", now)).toBe(expected);
  });
});

describe("meme-calendar helpers", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("detects minting day and returns upcoming dates", () => {
    jest.setSystemTime(new Date(Date.UTC(2023, 0, 2, 12, 0, 0)));
    expect(isMintingToday()).toBe(true);

    const { rows } = getUpcomingMintsForCurrentOrNextSeason(
      new Date(Date.UTC(2023, 0, 1))
    );
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0].utcDay.toISOString()).toBe("2023-01-02T00:00:00.000Z");
  });

  it("calculates cards remaining across the season timeline", () => {
    const earlySeason = getCardsRemainingUntilEndOf(
      "szn",
      new Date(Date.UTC(2023, 0, 2))
    );
    const lateSeason = getCardsRemainingUntilEndOf(
      "szn",
      new Date(Date.UTC(2023, 2, 31))
    );

    expect(earlySeason).toBeGreaterThan(lateSeason);

    const yearRemaining = getCardsRemainingUntilEndOf(
      "year",
      new Date(Date.UTC(2023, 0, 2))
    );
    expect(yearRemaining).toBeGreaterThanOrEqual(earlySeason);
  });
});

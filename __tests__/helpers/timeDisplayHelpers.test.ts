import {
  getTimeAgo,
  getTimeAgoShort,
  getTimeUntil,
} from "@/helpers/timeDisplayHelpers";

describe("timeDisplayHelpers", () => {
  const now = Date.UTC(2026, 6, 21, 12);

  beforeEach(() => {
    jest.spyOn(Date, "now").mockReturnValue(now);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("preserves long relative-time output", () => {
    expect(getTimeAgo(now - 2 * 60 * 60 * 1000)).toBe("2 hours ago");
    expect(getTimeAgo(now - 30 * 1000)).toBe("Just now");
  });

  it("preserves short relative-time output", () => {
    expect(getTimeAgoShort(now - 5 * 60 * 1000, now)).toBe("5m");
    expect(getTimeAgoShort(now - 3 * 24 * 60 * 60 * 1000, now, true)).toBe(
      "3d"
    );
  });

  it.each([
    ["minute", 60 * 1000, "in 1 minute ", " 1 minute ago"],
    ["minutes", 2 * 60 * 1000, "in 2 minutes ", " 2 minutes ago"],
    ["hour", 60 * 60 * 1000, "in 1 hour ", " 1 hour ago"],
    ["day", 24 * 60 * 60 * 1000, "in 1 day ", " 1 day ago"],
    ["month", 30 * 24 * 60 * 60 * 1000, "in 1 month ", " 1 month ago"],
    ["year", 360 * 24 * 60 * 60 * 1000, "in 1 year ", " 1 year ago"],
  ])(
    "preserves getTimeUntil output for %s values",
    (_unit, duration, futureOutput, pastOutput) => {
      expect(getTimeUntil(now + duration)).toBe(futureOutput);
      expect(getTimeUntil(now - duration)).toBe(pastOutput);
    }
  );

  it("returns Just now for sub-minute values", () => {
    expect(getTimeUntil(now + 30 * 1000)).toBe("Just now");
    expect(getTimeUntil(now - 30 * 1000)).toBe("Just now");
  });
});

describe("getTimeAgoShort calendar days", () => {
  const LA = "America/Los_Angeles";
  const AUCKLAND = "Pacific/Auckland";
  const at = (iso: string) => Date.parse(iso);

  it.each([
    // 30h elapsed, but the item is two calendar days back (Tue evening to Thu night).
    [
      "30h elapsed, two calendar days back",
      "2026-10-07T02:00:00Z",
      "2026-10-08T08:00:00Z",
      LA,
      "Oct 6",
    ],
    // 25h elapsed and the previous calendar day.
    [
      "25h elapsed, previous calendar day",
      "2026-10-06T05:00:00Z",
      "2026-10-07T06:00:00Z",
      LA,
      "Yesterday",
    ],
    // Spring-forward: Mar 8 has 23h, and Mar 8 00:30 PST to Mar 9 09:00 PDT is 31.5h.
    [
      "across the 23h spring-forward day",
      "2026-03-08T08:30:00Z",
      "2026-03-09T16:00:00Z",
      LA,
      "Yesterday",
    ],
    // Less than 24h elapsed stays an hours label even across the 23h day.
    [
      "23h45m across the spring-forward day",
      "2026-03-08T07:30:00Z",
      "2026-03-09T07:15:00Z",
      LA,
      "23h",
    ],
    // Fall-back: Nov 1 has 25h, so 24h30m can still be the same calendar day.
    [
      "24h30m inside the 25h fall-back day",
      "2026-11-01T07:15:00Z",
      "2026-11-02T07:45:00Z",
      LA,
      "24h",
    ],
    // Same rules in the southern hemisphere (NZ DST ends Apr 5 and starts Sep 27).
    [
      "24h30m inside the 25h Auckland day",
      "2026-04-04T11:15:00Z",
      "2026-04-05T11:45:00Z",
      AUCKLAND,
      "24h",
    ],
    [
      "23h45m across the 23h Auckland day",
      "2026-09-26T11:30:00Z",
      "2026-09-27T11:15:00Z",
      AUCKLAND,
      "23h",
    ],
    // The same two instants land on different calendar days in different zones.
    [
      "same instants in UTC",
      "2026-10-10T20:00:00Z",
      "2026-10-12T02:00:00Z",
      "UTC",
      "Oct 10",
    ],
    [
      "same instants in Los Angeles",
      "2026-10-10T20:00:00Z",
      "2026-10-12T02:00:00Z",
      LA,
      "Yesterday",
    ],
    [
      "same instants in Auckland",
      "2026-10-10T20:00:00Z",
      "2026-10-12T02:00:00Z",
      AUCKLAND,
      "Yesterday",
    ],
  ])("%s", (_name, item, reference, timeZone, expected) => {
    expect(getTimeAgoShort(at(item), at(reference), false, { timeZone })).toBe(
      expected
    );
  });

  it("keeps the same-day relative labels", () => {
    const reference = at("2026-10-12T12:00:00Z");
    const options = { timeZone: "UTC" };
    expect(
      getTimeAgoShort(reference - 2 * 3_600_000, reference, false, options)
    ).toBe("2h");
    expect(
      getTimeAgoShort(reference - 5 * 60_000, reference, false, options)
    ).toBe("5m");
    expect(getTimeAgoShort(reference - 10_000, reference, false, options)).toBe(
      "Just now"
    );
    expect(
      getTimeAgoShort(reference + 3_600_000, reference, false, options)
    ).toBe("Just now");
  });

  it("keeps elapsed-day counts in always-relative mode", () => {
    const reference = at("2026-10-12T12:00:00Z");
    expect(
      getTimeAgoShort(reference - 3 * 86_400_000, reference, true, {
        timeZone: LA,
      })
    ).toBe("3d");
  });

  it("uses the viewer's zone when none is given", () => {
    // Built from local parts, so it is one calendar day back in any host zone.
    const item = new Date(2026, 5, 10, 8, 0).getTime();
    const reference = new Date(2026, 5, 11, 9, 0).getTime();
    expect(getTimeAgoShort(item, reference)).toBe("Yesterday");
    const older = new Date(2026, 5, 8, 8, 0).getTime();
    expect(getTimeAgoShort(older, reference)).toBe("Jun 8");
  });

  it("treats the viewer's zone and the same explicit zone identically all year", () => {
    // Walks every day of 2026 (so every DST change of whatever zone runs the
    // test) and compares the two code paths for items up to three days back.
    const hostZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const dayMs = 86_400_000;
    const start = Date.UTC(2026, 0, 1, 12);
    for (let day = 0; day < 365; day++) {
      const reference = start + day * dayMs;
      for (let offset = 0; offset <= 72 * 60; offset += 90) {
        const item = reference - offset * 60_000;
        expect(getTimeAgoShort(item, reference)).toBe(
          getTimeAgoShort(item, reference, false, { timeZone: hostZone })
        );
      }
    }
  });

  it.each([
    ["en-GB", "Yesterday"],
    ["fr-FR", "Hier"],
    ["es-ES", "Ayer"],
    ["de-DE", "Gestern"],
  ] as const)("localizes the yesterday label for %s", (locale, expected) => {
    expect(
      getTimeAgoShort(
        at("2026-10-06T05:00:00Z"),
        at("2026-10-07T06:00:00Z"),
        false,
        { locale, timeZone: LA }
      )
    ).toBe(expected);
  });
});

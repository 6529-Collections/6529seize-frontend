import {
  formatShareImageDateLine,
  formatShareImagePostTime,
  getShareImageFileName,
  getShareImageTimeSpan,
} from "@/lib/share-drops-image/shareDropsImageFormat";

const FIRST = Date.parse("2026-11-09T17:04:00Z");

describe("formatShareImagePostTime", () => {
  it("defaults to UTC with the zone named", () => {
    expect(
      formatShareImagePostTime(FIRST, FIRST, { mode: "utc" }, "en-US")
    ).toBe("05:04 PM UTC");
  });

  it("uses a chosen zone, named by Intl", () => {
    expect(
      formatShareImagePostTime(
        FIRST,
        FIRST,
        { mode: "zone", timeZone: "Asia/Tokyo" },
        "en-US"
      )
    ).toBe("02:04 AM GMT+9");
  });

  it("counts time since the first post", () => {
    const option = { mode: "elapsed" } as const;
    expect(formatShareImagePostTime(FIRST, FIRST, option, "en-US")).toBe(
      "+0 min"
    );
    expect(
      formatShareImagePostTime(FIRST + 11 * 60_000, FIRST, option, "en-US")
    ).toBe("+11 min");
    expect(
      formatShareImagePostTime(FIRST + 125 * 60_000, FIRST, option, "en-US")
    ).toBe("+2 h 5 min");
    expect(
      formatShareImagePostTime(FIRST + 120 * 60_000, FIRST, option, "en-US")
    ).toBe("+2 h");
  });

  it("uses translated units", () => {
    expect(
      formatShareImagePostTime(
        FIRST + 125 * 60_000,
        FIRST,
        { mode: "elapsed" },
        "de-DE"
      )
    ).toBe("+2 Std. 5 Min.");
  });

  it("hides times", () => {
    expect(
      formatShareImagePostTime(FIRST, FIRST, { mode: "hidden" }, "en-US")
    ).toBeNull();
  });
});

describe("formatShareImageDateLine", () => {
  it("shows the UTC date and zone", () => {
    expect(
      formatShareImageDateLine(FIRST, FIRST, { mode: "utc" }, "en-US")
    ).toBe("Nov 9, 2026 · UTC");
  });

  it("names the mode for elapsed and hidden times", () => {
    expect(
      formatShareImageDateLine(FIRST, FIRST, { mode: "elapsed" }, "en-US")
    ).toBe("Nov 9, 2026 · UTC · time since first post");
    expect(
      formatShareImageDateLine(FIRST, FIRST, { mode: "hidden" }, "en-US")
    ).toBe("Nov 9, 2026 · UTC · times hidden");
  });

  it("spans days in the chosen zone", () => {
    expect(
      formatShareImageDateLine(
        FIRST,
        Date.parse("2026-11-10T01:00:00Z"),
        { mode: "utc" },
        "en-US"
      )
    ).toBe("Nov 9, 2026 – Nov 10, 2026 · UTC");
  });
});

describe("getShareImageTimeSpan", () => {
  it("uses the earliest and latest post, whatever the order", () => {
    expect(
      getShareImageTimeSpan([FIRST + 60_000, FIRST, FIRST + 30_000])
    ).toEqual({ first: FIRST, last: FIRST + 60_000 });
  });
});

describe("getShareImageFileName", () => {
  it("folds accents in the wave name", () => {
    expect(getShareImageFileName("Café Été", FIRST, false)).toBe(
      "cafe-ete-2026-11-09.png"
    );
  });

  it("uses the wave name and the UTC date", () => {
    expect(getShareImageFileName("Generative Art Salon!", FIRST, false)).toBe(
      "generative-art-salon-2026-11-09.png"
    );
  });

  it("leaves the name out for private conversations", () => {
    expect(getShareImageFileName("alice, bob", FIRST, true)).toBe(
      "6529-posts-2026-11-09.png"
    );
  });

  it("falls back when the name has no usable characters", () => {
    expect(getShareImageFileName("🌊🌊", FIRST, false)).toBe(
      "6529-posts-2026-11-09.png"
    );
  });
});

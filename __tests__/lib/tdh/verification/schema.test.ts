import {
  isDifferenceCause,
  parseVerificationDay,
  parseVerificationIndex,
} from "@/lib/tdh/verification/schema";
import { syntheticDay, syntheticIndex } from "./fixtures";
import { PUBLIC_FEED_DAYS, PUBLIC_FEED_INDEX } from "./publicFeedFixture";

describe("verification schema", () => {
  it("accepts the public feed as published", () => {
    expect(parseVerificationIndex(PUBLIC_FEED_INDEX).success).toBe(true);
    for (const day of Object.values(PUBLIC_FEED_DAYS)) {
      expect(parseVerificationDay(day).success).toBe(true);
    }
  });

  it("reads the public feed's first days: verdict OK, everything equal", () => {
    const day = PUBLIC_FEED_DAYS[20_741];
    expect(day?.verdict).toBe("OK");
    expect(day?.implementations.rust.commit).toBe(
      "e1276762ec5cf014bfb30efcb081f940d3d02154"
    );
    expect(day?.implementations.python?.commit).toBe(
      "0621ed4651e7a3be37bfa1862648d0d0291215d5"
    );
    expect(day?.implementations.rust.runtimeMs).toBe(815_909);
    expect(day?.implementations.python?.runtimeMs).toBe(12_105);
    expect(PUBLIC_FEED_DAYS[20_740]?.implementations.rust.commit).toBe(
      "2b172160e6daa50761ec054a5f53ba4c755cfbcc"
    );
    expect(day?.implementations.live?.source).toBe(
      "arweave:4mTqQxjtPpArwMw4UzLvJbzsawWoWDPN7OJrncpEuQE"
    );
    expect(day?.agreement.rustVsLive).toEqual({
      identitiesEqual: 10_282,
      identitiesTotal: 10_282,
      walletsEqual: 11_133,
      walletsTotal: 11_133,
    });
    expect(day?.implementations.rust.totalTdh).toBe(2_073_214_934);
    expect(day?.implementations.live?.totalTdh).toBe(2_073_214_934);
    expect(day?.differences).toEqual([]);
    expect(day?.differenceSummary?.byClass).toEqual({
      A: 0,
      B: 0,
      C: 0,
      D: 0,
    });
    expect(PUBLIC_FEED_DAYS[20_740]?.implementations.rust.totalTdh).toBe(
      2_070_436_337
    );
  });

  it("publishes nothing per record: the feed carries no holder, token or address", () => {
    const text = JSON.stringify([PUBLIC_FEED_INDEX, PUBLIC_FEED_DAYS]);
    expect(text).not.toMatch(/holder-\d/);
    expect(text).not.toMatch(/#\d/);
    expect(text).not.toMatch(/0x[0-9a-f]{40}(?![0-9a-f])/);
  });

  it("never reads the differences list, so no record can reach the page", () => {
    const parsed = parseVerificationDay({
      ...syntheticDay(),
      differences: [{ label: "holder-1", fields: [] }],
    });
    expect(parsed.success).toBe(true);
    expect(parsed.success && "differences" in parsed.data).toBe(false);
  });

  it("accepts the schema as first given, without the optional additions", () => {
    const index = syntheticIndex();
    const { cutover: _cutover, ...withoutCutover } = index;
    expect(parseVerificationIndex(withoutCutover).success).toBe(true);
    const { differenceSummary: _summary, ...withoutSummary } = syntheticDay();
    expect(parseVerificationDay(withoutSummary).success).toBe(true);
  });

  it("reads the feed's own generatedAt and sha256 when they are present", () => {
    const day = PUBLIC_FEED_DAYS[20_741];
    const sha = "a".repeat(64);
    const withFields = parseVerificationDay({
      ...day,
      generatedAt: "2026-10-16T00:52:11Z",
      sha256: sha,
    });
    expect(withFields.success).toBe(true);
    expect(withFields.data?.generatedAt).toBe("2026-10-16T00:52:11Z");
    expect(withFields.data?.sha256).toBe(sha);
    // Absent, they read as null; malformed, the file is refused.
    expect(parseVerificationDay(day).data?.generatedAt).toBeNull();
    expect(
      parseVerificationDay({ ...day, generatedAt: "yesterday" }).success
    ).toBe(false);
    expect(parseVerificationDay({ ...day, sha256: "xyz" }).success).toBe(false);
    const index = parseVerificationIndex({
      ...PUBLIC_FEED_INDEX,
      generatedAt: "2026-10-16T00:52:12Z",
      days: PUBLIC_FEED_INDEX.days.map((entry) => ({ ...entry, sha256: sha })),
    });
    expect(index.success).toBe(true);
    expect(index.data?.generatedAt).toBe("2026-10-16T00:52:12Z");
    expect(index.data?.days[0]?.sha256).toBe(sha);
  });

  it("ignores unknown fields", () => {
    const parsed = parseVerificationDay({
      ...syntheticDay(),
      extra: "ignored",
      generatedBy: { a: 1 },
    });
    expect(parsed.success).toBe(true);
    expect(parsed.success && "extra" in parsed.data).toBe(false);
  });

  it("allows a day without the Python run", () => {
    const day = syntheticDay();
    const parsed = parseVerificationDay({
      ...day,
      implementations: {
        rust: day.implementations.rust,
        live: day.implementations.live,
      },
      agreement: { rustVsPython: null, rustVsLive: day.agreement.rustVsLive },
    });
    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data.implementations.python).toBeNull();
  });

  it("accepts the causes the job writes and nothing that could carry free text", () => {
    // publish_feed.py's CAUSE: (DEV|BUG|SD|MS|CN|RP)-[0-9]+ joined by commas,
    // unexplained or rust-python.
    for (const cause of [
      "DEV-2",
      "BUG-15,DEV-2",
      "SD-3",
      "MS-1",
      "CN-12",
      "RP-4",
      "DEV-12345",
      "BUG-15,CN-2,DEV-2",
      "rust-python",
      "unexplained",
    ]) {
      expect(isDifferenceCause(cause)).toBe(true);
    }
    for (const cause of [
      "see 0xabc",
      "holder-1",
      "DEV-2, BUG-15",
      "DEV-2,",
      "dev-2",
      "XYZ-1",
      "DEV-",
      "DEV-2a",
      "Unexplained",
      `DEV-${"1".repeat(70)}`,
      "",
    ]) {
      expect(isDifferenceCause(cause)).toBe(false);
    }
    const day = syntheticDay();
    const summary = day.differenceSummary;
    if (!summary) {
      throw new Error("fixture has a summary");
    }
    expect(
      parseVerificationDay({
        ...day,
        differenceSummary: { ...summary, byCause: { "wallet 0xabc": 1 } },
      }).success
    ).toBe(false);
  });

  it("rejects a day whose date and cycle disagree", () => {
    expect(
      parseVerificationDay(syntheticDay({ date: "2026-10-14" })).success
    ).toBe(false);
    const index = syntheticIndex();
    const [first, second] = index.days;
    if (!first || !second) {
      throw new Error("fixture has two days");
    }
    expect(
      parseVerificationIndex({
        ...index,
        days: [{ ...first, cycleDay: 20_741 }, second],
      }).success
    ).toBe(false);
  });

  it("rejects impossible counts, fractional or unsafe values and invalid enums", () => {
    const day = syntheticDay();
    expect(
      parseVerificationDay({
        ...day,
        agreement: {
          ...day.agreement,
          rustVsLive: {
            identitiesEqual: 11,
            identitiesTotal: 10,
            walletsEqual: 1,
            walletsTotal: 1,
          },
        },
      }).success
    ).toBe(false);
    expect(
      parseVerificationDay({
        ...day,
        implementations: {
          ...day.implementations,
          rust: { ...day.implementations.rust, totalTdh: 1.5 },
        },
      }).success
    ).toBe(false);
    expect(
      parseVerificationDay({
        ...day,
        implementations: {
          ...day.implementations,
          rust: { ...day.implementations.rust, totalTdh: 2 ** 53 },
        },
      }).success
    ).toBe(false);
    expect(parseVerificationDay({ ...day, mode: "trusted" }).success).toBe(
      false
    );
    expect(
      parseVerificationDay({
        ...day,
        differenceSummary: {
          ...day.differenceSummary,
          byClass: { A: 0, B: 0, C: 0, D: -1 },
        },
      }).success
    ).toBe(false);
    expect(
      parseVerificationDay({
        ...day,
        implementations: {
          ...day.implementations,
          live: { ...day.implementations.live, source: "https://example.com" },
        },
      }).success
    ).toBe(false);
  });

  it("accepts an unknown verdict string, which the page shows as See details", () => {
    expect(
      parseVerificationDay(syntheticDay({ verdict: "UNDER_REVIEW" })).success
    ).toBe(true);
    expect(parseVerificationDay(syntheticDay({ verdict: "" })).success).toBe(
      false
    );
  });

  it("accepts every code version the job writes, and only those", () => {
    const day = syntheticDay();
    const withCommit = (commit: string) =>
      parseVerificationDay({
        ...day,
        implementations: {
          ...day.implementations,
          rust: { ...day.implementations.rust, commit },
        },
      }).success;
    for (const commit of [
      "e1276762ec5cf014bfb30efcb081f940d3d02154",
      "e127676+wip",
      "e1276762ec5cf014bfb30efcb081f940d3d02154+wip",
      "unknown",
    ]) {
      expect(withCommit(commit)).toBe(true);
    }
    for (const commit of ["main", "E127676", "e12", "e127676+dirty", ""]) {
      expect(withCommit(commit)).toBe(false);
    }
  });

  it("rejects a summary whose class or cause counts do not add up to its records", () => {
    const day = syntheticDay();
    const summary = day.differenceSummary;
    if (!summary) {
      throw new Error("fixture has a summary");
    }
    expect(
      parseVerificationDay({
        ...day,
        differenceSummary: { ...summary, byClass: { A: 0, B: 0, C: 0, D: 1 } },
      }).success
    ).toBe(false);
    expect(
      parseVerificationDay({
        ...day,
        differenceSummary: { ...summary, byCause: { unexplained: 3 } },
      }).success
    ).toBe(false);
    expect(
      parseVerificationDay({
        ...day,
        differenceSummary: {
          ...summary,
          byClass: { A: 1, B: 0, C: 0, D: 1 },
          byCause: { "BUG-15,DEV-2": 1, unexplained: 1 },
        },
      }).success
    ).toBe(true);
  });
});

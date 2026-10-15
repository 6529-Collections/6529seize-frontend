import {
  SAMPLE_VERIFICATION_DAYS,
  SAMPLE_VERIFICATION_INDEX,
} from "@/lib/tdh/verification/sampleData";
import {
  isDifferenceCause,
  parseVerificationDay,
  parseVerificationIndex,
} from "@/lib/tdh/verification/schema";
import { syntheticDay, syntheticIndex } from "./fixtures";

describe("verification schema", () => {
  it("accepts the bundled sample data", () => {
    expect(parseVerificationIndex(SAMPLE_VERIFICATION_INDEX).success).toBe(
      true
    );
    for (const day of Object.values(SAMPLE_VERIFICATION_DAYS)) {
      expect(parseVerificationDay(day).success).toBe(true);
    }
  });

  it("keeps the daily job's published feed as the sample: verdict OK, everything equal", () => {
    const day = SAMPLE_VERIFICATION_DAYS[20_741];
    expect(day?.verdict).toBe("OK");
    expect(day?.implementations.rust.commit).toBe(
      "db72daab2fc3112909ed0523637c8cf40908f141"
    );
    expect(day?.implementations.python?.commit).toBe(
      "0621ed4651e7a3be37bfa1862648d0d0291215d5"
    );
    expect(day?.implementations.rust.runtimeMs).toBe(816_881);
    expect(day?.implementations.python?.runtimeMs).toBe(37_848);
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
    expect(
      SAMPLE_VERIFICATION_DAYS[20_740]?.implementations.rust.totalTdh
    ).toBe(2_070_436_337);
  });

  it("publishes nothing per record: the sample carries no holder, token or address", () => {
    const text = JSON.stringify([
      SAMPLE_VERIFICATION_INDEX,
      SAMPLE_VERIFICATION_DAYS,
    ]);
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
    for (const cause of [
      "DEV-2",
      "BUG-15,DEV-2",
      "rust-python",
      "unexplained",
    ]) {
      expect(isDifferenceCause(cause)).toBe(true);
    }
    for (const cause of ["see 0xabc", "holder-1", "DEV-2, BUG-15", ""]) {
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
});

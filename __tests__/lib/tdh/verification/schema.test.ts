import {
  SAMPLE_VERIFICATION_DAYS,
  SAMPLE_VERIFICATION_INDEX,
} from "@/lib/tdh/verification/sampleData";
import {
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

  it("keeps the sample's real comparison figures and labels Python as copied", () => {
    const day = SAMPLE_VERIFICATION_DAYS[20_741];
    expect(day?.agreement.rustVsLive).toEqual({
      identitiesEqual: 10_280,
      identitiesTotal: 10_282,
      walletsEqual: 11_131,
      walletsTotal: 11_133,
    });
    expect(
      (day?.implementations.live?.totalTdh ?? 0) -
        (day?.implementations.rust.totalTdh ?? 0)
    ).toBe(240);
    expect(day?.implementations.python?.totalTdh).toBe(
      day?.implementations.rust.totalTdh
    );
    expect(
      day?.differences.every((difference) => difference.cause === "DEV-2")
    ).toBe(true);
  });

  it("accepts the schema as first given, without the optional additions", () => {
    const index = syntheticIndex();
    const { cutover: _cutover, ...withoutCutover } = index;
    expect(parseVerificationIndex(withoutCutover).success).toBe(true);
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

  it("rejects an address or any other identifier in a holder label", () => {
    for (const label of [
      "0x33fd426905f149f8376e227d0c9d3340aad17af1",
      "holder-1 0x33fd426905f149f8376e227d0c9d3340aad17af1",
      "someone.eth",
      "holder-",
    ]) {
      const day = syntheticDay();
      const first = day.differences[0];
      if (!first) {
        throw new Error("fixture has differences");
      }
      expect(
        parseVerificationDay({ ...day, differences: [{ ...first, label }] })
          .success
      ).toBe(false);
    }
  });

  it("rejects a cause or field name that could carry free text", () => {
    const day = syntheticDay();
    const first = day.differences[0];
    if (!first) {
      throw new Error("fixture has differences");
    }
    expect(
      parseVerificationDay({
        ...day,
        differences: [{ ...first, cause: "see 0xabc" }],
      }).success
    ).toBe(false);
    expect(
      parseVerificationDay({
        ...day,
        differences: [
          {
            ...first,
            fields: [{ name: "wallet 0xabc", rust: 1, python: 1, live: 2 }],
          },
        ],
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
        differences: [{ ...day.differences[0], class: "E" }],
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
      parseVerificationDay(syntheticDay({ verdict: "under-review" })).success
    ).toBe(true);
    expect(parseVerificationDay(syntheticDay({ verdict: "" })).success).toBe(
      false
    );
  });
});

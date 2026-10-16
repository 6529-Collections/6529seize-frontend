/**
 * @jest-environment node
 */

import {
  FIRST_TDH_FEED_CYCLE_DAY,
  TDH_DAY_NOT_FOUND_PATH,
  isImpossibleTdhVerificationDay,
  tdhDayNotFoundTarget,
} from "@/lib/proxy/tdhVerificationDay";

// 2026-10-16 12:00 UTC: the latest closed cycle is day 20,742.
const NOW = Date.UTC(2026, 9, 16, 12);
const day = (segment: string) =>
  isImpossibleTdhVerificationDay(`/network/tdh/verification/${segment}`, NOW);

describe("isImpossibleTdhVerificationDay", () => {
  it("lets published and possible days through to the page", () => {
    expect(day(String(FIRST_TDH_FEED_CYCLE_DAY))).toBe(false);
    expect(day("20741")).toBe(false);
    expect(day("20742")).toBe(false);
  });

  it("refuses segments that are no cycle day", () => {
    expect(day("abc")).toBe(true);
    expect(day("020742")).toBe(true);
    expect(day("20742.0")).toBe(true);
    expect(day("-20742")).toBe(true);
    expect(day("99999999")).toBe(true);
  });

  it("refuses days before the feed's first and after the latest closed cycle", () => {
    expect(day("20000")).toBe(true);
    expect(day("20739")).toBe(true);
    expect(day("20743")).toBe(true);
    expect(day("99999")).toBe(true);
  });

  it("leaves every other path alone", () => {
    expect(
      isImpossibleTdhVerificationDay("/network/tdh/verification", NOW)
    ).toBe(false);
    expect(
      isImpossibleTdhVerificationDay("/network/tdh/verification/", NOW)
    ).toBe(false);
    expect(
      isImpossibleTdhVerificationDay("/network/tdh/verification/20742/x", NOW)
    ).toBe(false);
    expect(isImpossibleTdhVerificationDay("/network/tdh/abc", NOW)).toBe(false);
  });
});

describe("tdhDayNotFoundTarget", () => {
  it("sends an impossible day to the not-found view with the day asked for", () => {
    const target = tdhDayNotFoundTarget(
      new URL("https://6529.io/network/tdh/verification/20739?x=1"),
      "/network/tdh/verification/20739"
    );
    expect(target.pathname).toBe(TDH_DAY_NOT_FOUND_PATH);
    expect(target.searchParams.get("day")).toBe("20739");
    expect(target.searchParams.get("x")).toBeNull();
    expect(target.origin).toBe("https://6529.io");
  });

  it("cuts a long segment to 32 characters", () => {
    const segment = "x".repeat(80);
    const target = tdhDayNotFoundTarget(
      new URL(`https://6529.io/network/tdh/verification/${segment}`),
      `/network/tdh/verification/${segment}`
    );
    expect(target.searchParams.get("day")).toHaveLength(32);
  });
});

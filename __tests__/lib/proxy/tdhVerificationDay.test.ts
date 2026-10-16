/**
 * @jest-environment node
 */

import {
  FIRST_TDH_FEED_CYCLE_DAY,
  isImpossibleTdhVerificationDay,
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

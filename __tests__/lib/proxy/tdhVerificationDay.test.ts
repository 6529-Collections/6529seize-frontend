/**
 * @jest-environment node
 */

import {
  FIRST_TDH_FEED_CYCLE_DAY,
  TDH_DAY_NOT_FOUND_PATH,
  createTdhListedDays,
  isImpossibleTdhVerificationDay,
  possibleTdhVerificationDay,
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

  it("never carries text that is not a cycle number", () => {
    for (const segment of ["x".repeat(80), "abc", "%3Cb%3E", "020742"]) {
      const target = tdhDayNotFoundTarget(
        new URL(`https://6529.io/network/tdh/verification/${segment}`),
        `/network/tdh/verification/${segment}`
      );
      expect(target.pathname).toBe(TDH_DAY_NOT_FOUND_PATH);
      expect(target.search).toBe("");
    }
  });
});

describe("possibleTdhVerificationDay", () => {
  it("names a canonical day inside the feed's range, and nothing else", () => {
    const path = (segment: string) => `/network/tdh/verification/${segment}`;
    expect(possibleTdhVerificationDay(path("20741"), NOW)).toBe(20_741);
    expect(possibleTdhVerificationDay(path("20743"), NOW)).toBeNull();
    expect(possibleTdhVerificationDay(path("20739"), NOW)).toBeNull();
    expect(possibleTdhVerificationDay(path("abc"), NOW)).toBeNull();
    expect(possibleTdhVerificationDay("/network/tdh", NOW)).toBeNull();
  });
});

describe("createTdhListedDays", () => {
  const index = (days: readonly number[]) =>
    ({
      ok: true,
      json: async () => ({ days: days.map((cycleDay) => ({ cycleDay })) }),
    }) as Response;

  it("answers 404 for a day inside the range that the index does not list", async () => {
    const fetchImpl = jest.fn(async () => index([20_740, 20_742]));
    const listed = createTdhListedDays({
      indexUrl: "https://feed.example/index.json",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(await listed.unlisted(20_741, NOW)).toBe(true);
    expect(await listed.unlisted(20_742, NOW)).toBe(false);
    expect(await listed.unlisted(20_740, NOW)).toBe(false);
    // A day the last read did not list waits a minute for the next read.
    expect(await listed.unlisted(20_741, NOW + 1_000)).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("reads the index again for a day it has not seen listed, at most once a minute", async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce(index([20_740]))
      .mockResolvedValueOnce(index([20_740, 20_741]));
    const listed = createTdhListedDays({
      indexUrl: "https://feed.example/index.json",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(await listed.unlisted(20_741, NOW)).toBe(true);
    expect(await listed.unlisted(20_741, NOW + 61_000)).toBe(false);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("leaves the day to the page when the index cannot be read", async () => {
    const failing = jest.fn(async () => {
      throw new Error("offline");
    });
    const listed = createTdhListedDays({
      indexUrl: "https://feed.example/index.json",
      fetchImpl: failing as unknown as typeof fetch,
    });
    expect(await listed.unlisted(20_741, NOW)).toBe(false);
    // A feed that is down is not asked again within the minute.
    expect(await listed.unlisted(20_741, NOW + 1_000)).toBe(false);
    expect(failing).toHaveBeenCalledTimes(1);
    const invalid = createTdhListedDays({
      indexUrl: "https://feed.example/index.json",
      fetchImpl: (async () =>
        ({
          ok: true,
          json: async () => ({ days: "none" }),
        }) as Response) as unknown as typeof fetch,
    });
    expect(await invalid.unlisted(20_741, NOW)).toBe(false);
    const unconfigured = createTdhListedDays({ indexUrl: null });
    expect(await unconfigured.unlisted(20_741, NOW)).toBe(false);
  });
});

/** @jest-environment node */
import {
  acceptsBids,
  editionPhase,
  editionTimes,
  softEndAfterBid,
} from "@/lib/stream/editionTiming";
import {
  deriveState,
  endAfterBid,
  isInAntiSnipeWindow,
  minimumBid,
  resumedEnd,
  royaltyAmount,
  splitProceeds,
} from "@/lib/stream/englishAuction";
import {
  parseEthToWei,
  weiToEthDisplay,
  weiToEthString,
} from "@/lib/stream/eth";
import { SimClock } from "@/lib/stream/mock/clock";
import { parseWorkKey, workKeyFor } from "@/lib/stream/workKey";

const eth = (text: string): bigint => parseEthToWei(text) ?? -1n;
const BIDDER = "0x00000000000000000000000000000000000000aa";

describe("1/1 English auction rules (IEnglishAuction)", () => {
  it("accepts any first bid above zero", () => {
    expect(minimumBid({ bidder: null, bid: 0n })).toBe(1n);
  });

  it("keeps a withdrawn bid's reserve for the next first bid", () => {
    expect(minimumBid({ bidder: null, bid: eth("0.3") })).toBe(eth("0.3"));
  });

  it("raises by 5% or 0.001 ETH, whichever is more", () => {
    expect(minimumBid({ bidder: BIDDER, bid: eth("1") })).toBe(eth("1.05"));
    expect(minimumBid({ bidder: BIDDER, bid: eth("0.01") })).toBe(eth("0.011"));
    expect(minimumBid({ bidder: BIDDER, bid: eth("0.02") })).toBe(eth("0.021"));
    // 5% of 1 wei rounds up to 1 wei, below the floor.
    expect(minimumBid({ bidder: BIDDER, bid: 1n })).toBe(1n + eth("0.001"));
  });

  it("moves the end to 15 minutes after a bid in the last 15 minutes", () => {
    const end = 100_000;
    expect(endAfterBid(end, end - 16 * 60)).toBe(end);
    expect(endAfterBid(end, end - 10 * 60)).toBe(end + 5 * 60);
    expect(isInAntiSnipeWindow(end, end - 15 * 60)).toBe(true);
    expect(isInAntiSnipeWindow(end, end - 15 * 60 - 1)).toBe(false);
  });

  it("resumes a paused auction for the longest of remaining time, 24 hours and the window", () => {
    expect(resumedEnd({ endTime: 1_000 + 3_600, pausedAt: 1_000 }, 5_000)).toBe(
      5_000 + 86_400
    );
    expect(
      resumedEnd({ endTime: 1_000 + 2 * 86_400, pausedAt: 1_000 }, 5_000)
    ).toBe(5_000 + 2 * 86_400);
  });

  it("derives ENDED from the clock", () => {
    const stored = {
      bidder: null,
      bid: 0n,
      endTime: 10,
      pausedAt: null,
      stored: "ACTIVE" as const,
    };
    expect(deriveState(stored, 9)).toBe("ACTIVE");
    expect(deriveState(stored, 10)).toBe("ENDED");
    expect(deriveState({ ...stored, stored: "PAUSED" }, 99)).toBe("PAUSED");
  });

  it("splits 75/25 and 90/10, and computes the 6.529% royalty", () => {
    expect(splitProceeds(eth("4.088"), 25_000)).toEqual({
      fee: eth("1.022"),
      seller: eth("3.066"),
    });
    expect(splitProceeds(eth("1"), 10_000)).toEqual({
      fee: eth("0.1"),
      seller: eth("0.9"),
    });
    expect(royaltyAmount(eth("1.2"), 6_529)).toBe(eth("0.078348"));
  });
});

describe("edition auction clocks (D140, D141)", () => {
  const terms = { offset: 900, softWindow: 300, maxExtension: 86_400 };

  it("closes 15 minutes after the 1/1's final end", () => {
    const times = editionTimes(0, 10_000, null, terms);
    expect(times.editionEnd).toBe(10_900);
    expect(times.backstop).toBe(10_900 + 86_400);
  });

  it("extends to 5 minutes after a bid in its last 5 minutes, never past the backstop", () => {
    const times = editionTimes(0, 10_000, null, terms);
    expect(softEndAfterBid(times, 10_000, terms)).toBeNull();
    expect(softEndAfterBid(times, 10_800, terms)).toBe(11_100);
    const late = editionTimes(0, 10_000, times.backstop - 60, terms);
    expect(softEndAfterBid(late, times.backstop - 30, terms)).toBe(
      times.backstop
    );
  });

  it("derives the UX state", () => {
    const times = editionTimes(0, 10_000, null, terms);
    const base = {
      status: "OPEN" as const,
      times,
      totalUnits: 5,
      settledCount: null,
      now: 5_000,
    };
    expect(editionPhase({ ...base, oneOfOneState: "ACTIVE" })).toBe("open");
    expect(editionPhase({ ...base, oneOfOneState: "ENDED", now: 10_100 })).toBe(
      "oneOfOneEnded"
    );
    expect(editionPhase({ ...base, oneOfOneState: "PAUSED" })).toBe("disputed");
    expect(editionPhase({ ...base, oneOfOneState: "CANCELLED" })).toBe("void");
    expect(
      editionPhase({ ...base, oneOfOneState: "SETTLED", now: 11_000 })
    ).toBe("closed");
    expect(
      editionPhase({
        ...base,
        totalUnits: 0,
        oneOfOneState: "SETTLED",
        now: 11_000,
      })
    ).toBe("noBids");
    expect(
      editionPhase({
        ...base,
        times: editionTimes(0, 10_000, 11_100, terms),
        oneOfOneState: "ENDED",
        now: 10_950,
      })
    ).toBe("extended");
    expect(
      editionPhase({
        ...base,
        status: "SETTLED",
        settledCount: 3,
        oneOfOneState: "SETTLED",
      })
    ).toBe("settled");
    expect(
      editionPhase({ ...base, status: "NONE", oneOfOneState: "ACTIVE" })
    ).toBe("opening");
    expect(acceptsBids("disputed")).toBe(true);
    expect(acceptsBids("closed")).toBe(false);
  });
});

describe("ETH text", () => {
  it("round-trips wei without floating point", () => {
    expect(weiToEthString(eth("4.088"))).toBe("4.088");
    expect(weiToEthString(1n)).toBe("0.000000000000000001");
    expect(weiToEthString(eth("953"))).toBe("953");
    expect(weiToEthString(eth("0.123456"), 3)).toBe("0.123");
    expect(weiToEthString(eth("0.1235"), 3)).toBe("0.124");
    expect(weiToEthString(eth("0.9999"), 2)).toBe("1");
    expect(parseEthToWei("1.")).toBeNull();
    expect(parseEthToWei("abc")).toBeNull();
  });

  it("shows prices to four significant figures", () => {
    expect(weiToEthDisplay(eth("0.000123456"))).toBe("0.0001235");
    expect(weiToEthDisplay(eth("0.0511"))).toBe("0.0511");
    expect(weiToEthDisplay(eth("1.23456"))).toBe("1.2346");
  });
});

describe("work keys", () => {
  const stream = "0x00000000000000000000000000000000000000f1";
  it("uses bare token IDs for 6529 Stream and contract keys otherwise", () => {
    expect(workKeyFor(stream, 12, stream)).toBe("12");
    expect(
      workKeyFor("0x00000000000000000000000000000000000000AB", 3, stream)
    ).toBe("0x00000000000000000000000000000000000000ab-3");
    expect(parseWorkKey("12")).toEqual({ kind: "stream", tokenId: 12 });
    expect(
      parseWorkKey("0x00000000000000000000000000000000000000ab-3")
    ).toEqual({
      kind: "contract",
      contract: "0x00000000000000000000000000000000000000ab",
      tokenId: 3,
    });
    expect(parseWorkKey("0")).toBeNull();
    // IDs past Number.MAX_SAFE_INTEGER would round to another token.
    expect(parseWorkKey("9007199254740993")).toBeNull();
    expect(
      parseWorkKey(
        "0x00000000000000000000000000000000000000ab-9007199254740993"
      )
    ).toBeNull();
    expect(parseWorkKey("../etc")).toBeNull();
  });
});

describe("the simulated clock", () => {
  it("runs at a chosen speed, pauses and only moves forward", () => {
    let wall = 0;
    const clock = new SimClock(1_000, () => wall);
    wall = 10_000;
    expect(clock.now()).toBe(1_010);
    clock.setSpeed(60);
    wall = 11_000;
    expect(clock.now()).toBe(1_070);
    clock.setPaused(true);
    wall = 99_000;
    expect(clock.now()).toBe(1_070);
    clock.advance(30);
    expect(clock.now()).toBe(1_100);
    expect(() => clock.advance(-1)).toThrow(RangeError);
    clock.reset();
    expect(clock.now()).toBe(1_000);
  });
});

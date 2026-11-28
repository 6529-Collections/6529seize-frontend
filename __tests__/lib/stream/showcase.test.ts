import type { Address } from "viem";

import type { SaleSummary } from "@/lib/stream/reads";
import { arrangeShelves, isTestWork, pickFeatured } from "@/lib/stream/showcase";
import { AUCTION_STATE } from "@/lib/stream/state";

const NOBODY = "0x0000000000000000000000000000000000000000" as Address;
const BIDDER = "0x625a35f700000000000000000000000000001ea2" as Address;
const NOW = 1_000_000;

function sale(id: number, state: number, endTime: number, bid = 0n): SaleSummary {
  return {
    saleId: BigInt(id),
    token: "0xdbc691bb75C5477d2cdCF2c441219D31b32A8dd9",
    tokenId: BigInt(id),
    curated: true,
    state,
    endTime: BigInt(endTime),
    bid,
    bidder: bid > 0n ? BIDDER : NOBODY,
    firstStartTx: "0x00",
    startedAt: 0n,
    edition: null,
  };
}

describe("isTestWork", () => {
  it("hides works without art and operator test names", () => {
    expect(isTestWork({ name: "Meridian", hasArt: true })).toBe(false);
    expect(isTestWork({ name: "Meridian", hasArt: false })).toBe(true);
    expect(isTestWork({ name: "r1 flows #3", hasArt: true })).toBe(true);
    expect(isTestWork({ name: "Copy Test", hasArt: true })).toBe(true);
    expect(isTestWork({ name: "Testament", hasArt: true })).toBe(false);
    expect(isTestWork({ name: null, hasArt: true })).toBe(false);
  });
});

describe("arrangeShelves", () => {
  it("sorts by interest: live by end, sold newest, ended sales to finish last", () => {
    const shelves = arrangeShelves(
      [
        sale(1, AUCTION_STATE.SETTLED, NOW - 500, 5n),
        sale(2, AUCTION_STATE.ACTIVE, NOW + 900),
        sale(3, AUCTION_STATE.ACTIVE, NOW + 100, 7n),
        sale(4, AUCTION_STATE.ACTIVE, NOW - 10, 7n),
        sale(5, AUCTION_STATE.SETTLED, NOW - 100, 9n),
        sale(6, AUCTION_STATE.SETTLED, NOW - 50),
        sale(7, AUCTION_STATE.ENDED, NOW - 20),
      ],
      NOW
    );
    expect(shelves.live.map((s) => Number(s.saleId))).toEqual([3, 2]);
    expect(shelves.sold.map((s) => Number(s.saleId))).toEqual([5, 1]);
    expect(shelves.unsold.map((s) => Number(s.saleId))).toEqual([6]);
    expect(shelves.finish.map((s) => Number(s.saleId))).toEqual([7, 4]);
  });
});

describe("pickFeatured", () => {
  it("takes the live sale with the highest bid", () => {
    const pick = pickFeatured(
      [sale(1, AUCTION_STATE.ACTIVE, NOW + 50, 2n), sale(2, AUCTION_STATE.ACTIVE, NOW + 900, 8n), sale(3, AUCTION_STATE.SETTLED, NOW - 1, 99n)],
      NOW
    );
    expect(pick?.saleId).toBe(2n);
  });

  it("falls back to the latest sold work, then nothing", () => {
    expect(pickFeatured([sale(1, AUCTION_STATE.SETTLED, NOW - 900, 2n), sale(2, AUCTION_STATE.SETTLED, NOW - 9, 3n)], NOW)?.saleId).toBe(2n);
    expect(pickFeatured([sale(1, AUCTION_STATE.SETTLED, NOW - 9)], NOW)).toBeNull();
  });
});

/** @jest-environment node */
import vectors from "./fixtures/d138-reference-vectors.json";

import {
  bruteClear,
  clear,
  sweepCutoff,
  unitsWon,
} from "@/lib/stream/clearing";
import {
  addBid,
  allocation,
  clearBook,
  cloneBook,
  createBook,
  findBid,
  lowestStepFullyIn,
  lowestWinningStep,
  moveBid,
  raiseToGetIn,
  whatIfBid,
} from "@/lib/stream/editionBook";
import { parseEthToWei } from "@/lib/stream/eth";
import {
  E192_MANTISSAS,
  ladderPrices,
  nearestStep,
  stepPrice,
} from "@/lib/stream/ladder";

/**
 * Parity with the D138 reference model (`model/ref.py`). The fixture holds the
 * model's own outputs: its E192 table, the 336-step ladder, 400 random books
 * cleared by the model (checked there against brute force), and 160 FIFO books
 * replayed from bids and raises.
 */

const eth = (text: string): bigint => {
  const wei = parseEthToWei(text);
  if (wei === null) {
    throw new Error(text);
  }
  return wei;
};

describe("price ladder", () => {
  it("embeds the model's E192 mantissa table", () => {
    expect(E192_MANTISSAS).toEqual(vectors.table192);
  });

  it("prices all 336 default steps exactly as the model", () => {
    expect(ladderPrices().map(String)).toEqual(vectors.ladder48);
    expect(stepPrice(0)).toBe(eth("0.0001"));
    expect(stepPrice(130)).toBe(eth("0.0511"));
    expect(stepPrice(335)).toBe(eth("953"));
  });

  it.each(Object.entries(vectors.ladders))(
    "prices the %s-per-decade ladder as the model",
    (density, expected) => {
      const perDecade = Number(density);
      const sampled = expected.map((_, index) =>
        String(stepPrice(index * 7, { base: 10n ** 14n, perDecade }))
      );
      expect(sampled).toEqual(expected);
    }
  );

  it("snaps typed prices to the nearest step", () => {
    expect(nearestStep(eth("0.05"))).toBe(130);
    expect(nearestStep(eth("0.0464"))).toBe(128);
    expect(nearestStep(0n)).toBe(0);
    expect(nearestStep(eth("100000"))).toBe(335);
  });

  it("refuses densities governance cannot set", () => {
    expect(() => stepPrice(1, { base: 1n, perDecade: 50 })).toThrow(RangeError);
  });
});

describe("uniform-price clearing (D138)", () => {
  it.each(vectors.clearing.map((vector, index) => [index, vector] as const))(
    "matches the model on random book %i",
    (_, vector) => {
      const prices = vector.totals.map((__, step) =>
        stepPrice(step, { base: 10n ** 14n, perDecade: vector.perDecade })
      );
      const result = clear(
        vector.totals,
        prices,
        vector.cap,
        vector.marginBps * 10
      );
      expect({
        k: result.count,
        step: result.step,
        rationed: result.rationed,
        cutStepUnits: result.cutStepUnits,
      }).toEqual({
        k: vector.k,
        step: vector.step,
        rationed: vector.rationed,
        cutStepUnits: vector.cutStepUnits,
      });
      const brute = bruteClear(
        vector.totals,
        prices,
        vector.cap,
        vector.marginBps * 10
      );
      expect(brute.count).toBe(vector.k);
      expect(brute.price === null ? null : String(brute.price)).toBe(
        vector.price
      );
    }
  );

  it("never splits a step without a cap", () => {
    for (const vector of vectors.clearing.filter((item) => item.cap === 0)) {
      const prices = vector.totals.map((_, step) =>
        stepPrice(step, { base: 10n ** 14n, perDecade: vector.perDecade })
      );
      expect(
        clear(vector.totals, prices, 0, vector.marginBps * 10).rationed
      ).toBe(false);
    }
  });

  it("returns nothing for an empty book", () => {
    expect(clear([0, 0, 0], ladderPrices().slice(0, 3)).count).toBe(0);
    expect(clear([], []).step).toBeNull();
  });
});

describe("the owner's worked example (PLAN Appendix C)", () => {
  const prices = ladderPrices();
  const trace = (): number[] => {
    const totals = new Array<number>(336).fill(0);
    totals[192] = 1;
    totals[158] = 9;
    totals[144] = 20;
    totals[130] = 50;
    totals[96] = 200;
    return totals;
  };

  it("clears 80 editions at 0.0511 ETH, 4.088 ETH raised", () => {
    const result = clear(trace(), prices);
    expect(result.count).toBe(80);
    expect(result.step).toBe(130);
    expect(BigInt(result.count) * stepPrice(130)).toBe(eth("4.088"));
  });

  it("one more unit at 0.0464 lowers everyone's price: 81 at 0.0464", () => {
    const totals = trace();
    totals[128] = 1;
    const result = clear(totals, prices);
    expect(stepPrice(128)).toBe(eth("0.0464"));
    expect([result.count, result.step]).toEqual([81, 128]);
  });

  it("0.0464 is the lowest bid of one that gets in", () => {
    const book = createBook(336, 0);
    for (const [step, qty] of [
      [192, 1],
      [158, 9],
      [144, 20],
      [130, 50],
      [96, 200],
    ]) {
      addBid(book, {
        bidder: "0x0000000000000000000000000000000000000001",
        step: step ?? 0,
        qty: qty ?? 0,
        at: 0,
      });
    }
    expect(lowestWinningStep(book, 1, prices, 10_000)).toBe(128);
    expect(whatIfBid(book, 127, 1, prices, 10_000).won).toBe(0);
  });

  it("matches the model's unsnapped example at margins 0, 10% and 30%", () => {
    // ref.py: prices in milli-ETH [10, 50, 100, 200, 1000], totals [200, 50, 20, 9, 1].
    const milli = [10n, 50n, 100n, 200n, 1_000n];
    const totals = [200, 50, 20, 9, 1];
    expect(
      [0, 10_000, 30_000].map((margin) => clear(totals, milli, 0, margin))
    ).toMatchObject([
      {
        count: 80,
        step: 1,
        rationed: false,
        cutStepUnits: 50,
        bestRevenue: 4_000n,
      },
      {
        count: 80,
        step: 1,
        rationed: false,
        cutStepUnits: 50,
        bestRevenue: 4_000n,
      },
      {
        count: 280,
        step: 0,
        rationed: false,
        cutStepUnits: 200,
        bestRevenue: 4_000n,
      },
    ]);
    // The candidate list: 1 × 1.00, 10 × 0.2, 30 × 0.1, 80 × 0.05, 280 × 0.01 (milli-ETH).
    const result = clear(totals, milli);
    expect(result.candidates.map((row) => [row.count, row.revenue])).toEqual([
      [1, 1_000n],
      [10, 2_000n],
      [30, 3_000n],
      [80, 4_000n],
      [280, 2_800n],
    ]);
    expect([result.chosen, result.best]).toEqual([3, 3]);
  });

  it("with a cap of 60, fills step 130 in queue order and sweeps the raise hole", () => {
    const book = createBook(336, 60);
    const who = (n: number) =>
      `0x${String(n).padStart(40, "0")}` as `0x${string}`;
    addBid(book, { bidder: who(9), step: 192, qty: 1, at: 0 });
    addBid(book, { bidder: who(9), step: 158, qty: 9, at: 0 });
    addBid(book, { bidder: who(9), step: 144, qty: 5, at: 0 });
    addBid(book, { bidder: who(9), step: 96, qty: 200, at: 0 });
    const b1 = addBid(book, { bidder: who(1), step: 130, qty: 20, at: 0 });
    const b2 = addBid(book, { bidder: who(2), step: 130, qty: 15, at: 0 });
    const b3 = addBid(book, { bidder: who(3), step: 130, qty: 10, at: 0 });
    const b4 = addBid(book, { bidder: who(4), step: 130, qty: 20, at: 0 });
    moveBid(book, b2, 144);
    const result = clearBook(book, prices, 10_000);
    expect([result.count, result.step, result.rationed]).toEqual([
      60,
      130,
      true,
    ]);
    expect(result.cutStepUnits).toBe(30);
    expect(result.cutoff).toBe(45);
    const won = allocation(book, result);
    expect([
      won.get(b1.id),
      won.get(b2.id),
      won.get(b3.id),
      won.get(b4.id),
    ]).toEqual([20, 15, 10, 0]);
    // B2 wins 15 at 0.0511 of its 1.5 ETH escrow: 0.7335 ETH comes back.
    expect(15n * stepPrice(144) - 15n * stepPrice(130)).toBe(eth("0.7335"));
    // Without the sweep, B3 would get nothing and 10 editions would be lost.
    expect(unitsWon(b3, result, result.cutStepUnits)).toBe(0);
  });
});

describe("FIFO at the cut step (owner decision 1)", () => {
  it.each(vectors.fifo.map((vector, index) => [index, vector] as const))(
    "replays model book %i: positions, sweep and units won",
    (_, vector) => {
      const prices = ladderPrices({
        base: 10n ** 14n,
        perDecade: 48,
        steps: vector.steps,
      });
      const book = createBook(vector.steps, vector.cap);
      const bidder = "0x00000000000000000000000000000000000000aa" as const;
      for (const op of vector.ops) {
        if (op.op === "bid") {
          addBid(book, { bidder, step: op.step, qty: op.qty ?? 0, at: 0 });
        } else {
          const target = book.bids[op.bid ?? -1];
          if (target) {
            moveBid(book, target, op.step);
          }
        }
      }
      expect(book.bids.map((bid) => bid.pos)).toEqual(vector.positions);
      const result = clearBook(book, prices, 10_000);
      expect([
        result.count,
        result.step,
        result.rationed,
        result.cutStepUnits,
      ]).toEqual([vector.k, vector.step, vector.rationed, vector.cutStepUnits]);
      expect(result.cutoff).toBe(vector.cutoff);
      const won = allocation(book, result);
      expect(book.bids.map((bid) => won.get(bid.id))).toEqual(vector.won);
      expect(vector.won.reduce((sum, value) => sum + value, 0)).toBe(vector.k);
    }
  );

  it("sweeps departures in position order, whatever order they were logged", () => {
    expect(
      sweepCutoff(30, [
        { pos: 40, qty: 5 },
        { pos: 20, qty: 15 },
      ])
    ).toBe(50);
    expect(sweepCutoff(10, [{ pos: 12, qty: 5 }])).toBe(10);
  });
});

describe("what-if reads", () => {
  it("finds the lowest step a raise wins at, by binary search, matching a linear scan", () => {
    const prices = ladderPrices();
    const book = createBook(336, 0);
    const bidder = "0x00000000000000000000000000000000000000bb" as const;
    addBid(book, { bidder, step: 140, qty: 10, at: 0 });
    addBid(book, { bidder, step: 100, qty: 300, at: 0 });
    const low = addBid(book, { bidder, step: 60, qty: 2, at: 0 });
    const found = raiseToGetIn(book, low, prices, 10_000);
    let linear: number | null = null;
    for (let step = low.step + 1; step < 336 && linear === null; step += 1) {
      const copy = cloneBook(book);
      const moved = findBid(copy, low.id);
      if (moved) {
        moveBid(copy, moved, step);
        if (
          (allocation(copy, clearBook(copy, prices, 10_000)).get(low.id) ??
            0) >= low.qty
        ) {
          linear = step;
        }
      }
    }
    expect(found).toBe(linear);
  });

  it("counts editions a new bid would push out", () => {
    const prices = ladderPrices();
    const book = createBook(336, 5);
    const bidder = "0x00000000000000000000000000000000000000cc" as const;
    addBid(book, { bidder, step: 100, qty: 5, at: 0 });
    const result = whatIfBid(book, 110, 3, prices, 10_000);
    expect(result.won).toBe(3);
    expect(result.pushedOut).toBe(3);
  });
});

describe("binary searches match a linear scan", () => {
  /** A small deterministic PRNG for reproducible random books. */
  function prng(seed: number): () => number {
    let state = seed >>> 0;
    return () => {
      state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
      return state / 4_294_967_296;
    };
  }

  it("for the lowest step that gets a new bid fully in, with and without a cap", () => {
    const random = prng(7);
    const steps = 40;
    const prices = ladderPrices({ base: 10n ** 14n, perDecade: 48, steps });
    const bidder = "0x00000000000000000000000000000000000000dd" as const;
    for (let trial = 0; trial < 60; trial += 1) {
      const cap = trial % 2 === 0 ? 0 : 1 + Math.floor(random() * 30);
      const book = createBook(steps, cap);
      const count = 1 + Math.floor(random() * 12);
      for (let index = 0; index < count; index += 1) {
        addBid(book, {
          bidder,
          step: Math.floor(random() * steps),
          qty: 1 + Math.floor(random() * 8),
          at: 0,
        });
      }
      const qty = 1 + Math.floor(random() * 5);
      let linear: number | null = null;
      for (let step = 0; step < steps && linear === null; step += 1) {
        if (whatIfBid(book, step, qty, prices, 10_000).won >= qty) {
          linear = step;
        }
      }
      expect(lowestStepFullyIn(book, qty, prices, 10_000)).toBe(linear);
      let anyWin: number | null = null;
      for (let step = 0; step < steps && anyWin === null; step += 1) {
        if (whatIfBid(book, step, qty, prices, 10_000).won > 0) {
          anyWin = step;
        }
      }
      expect(lowestWinningStep(book, qty, prices, 10_000)).toBe(anyWin);
    }
  });
});

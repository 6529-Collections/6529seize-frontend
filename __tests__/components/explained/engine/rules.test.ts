/** @jest-environment node */
import {
  DEAD,
  REGISTRY_V14,
  TdhInputInvalid,
  ZERO,
  computeCycle,
  fork,
  type CycleInput,
  type DelegationEvent,
  type Registry,
  type Transfer,
} from "@/components/explained/engine/tdh";

/**
 * Each rule of P26 §3 to §8 on a small input of its own: what the rule does
 * on a valid input, and the inputs it gives no result for. The conformance
 * vectors check the same rules (`vectors.test.ts`); these cases are written
 * here so that CI runs every rule even without the private vector files.
 */
const R: Registry = fork(REGISTRY_V14, { season_starts: [1] });
const T = 1_791_676_799;
const DAY = 86_400;
const A = "0x00000000000000000000000000000000000000a1";
const B = "0x00000000000000000000000000000000000000b2";
const C = "0x00000000000000000000000000000000000000c3";
const W = "0x00000000000000000000000000000000000000ee";

let tx = 0;
function t(over: Partial<Transfer> & Pick<Transfer, "from" | "to">): Transfer {
  tx += 1;
  return {
    block: 1_000 + tx,
    txIndex: 0,
    logIndex: 0,
    batchPos: 0,
    timestamp: T - 10 * DAY,
    tx: `0x${tx.toString(16).padStart(64, "0")}`,
    contract: R.memes,
    token: 1,
    amount: 1,
    ...over,
  };
}
/** Several transfers of one transaction: same block, txIndex, hash and time. */
function inOneTransaction(parts: readonly Partial<Transfer>[]): Transfer[] {
  const first = t({ from: ZERO, to: A });
  return parts.map((p, i) => ({ ...first, logIndex: i, ...p }));
}
function link(from: string, to: string, block: number): DelegationEvent {
  return {
    block,
    txIndex: 0,
    logIndex: 0,
    kind: "REGISTER",
    from,
    to,
    collection: R.memes,
  };
}
function cycle(input: Omit<CycleInput, "block" | "timestamp">, r = R) {
  return computeCycle({ block: 5_000, timestamp: T, ...input }, r);
}
function refused(
  input: Omit<CycleInput, "block" | "timestamp">,
  rule: RegExp,
  r = R
) {
  expect(() => cycle(input, r)).toThrow(TdhInputInvalid);
  expect(() => cycle(input, r)).toThrow(rule);
}

describe("holdings (P26 §7.1)", () => {
  it("removes the copy received last first", () => {
    const res = cycle({
      transfers: [
        t({ from: ZERO, to: A, amount: 2, timestamp: T - 30 * DAY }),
        t({ from: ZERO, to: A, timestamp: T - 20 * DAY }),
        t({ from: A, to: B }),
      ],
    });
    expect(res.wallets[A]).toMatchObject({ balance: 2, raw: 60 });
    expect(res.wallets[B]).toMatchObject({ balance: 1, raw: 10 });
  });

  it("keeps a copy's age inside an identity, for all history", () => {
    const res = cycle({
      transfers: [
        t({ from: ZERO, to: B, timestamp: T - 200 * DAY }),
        t({ from: B, to: A, timestamp: T - 50 * DAY }),
      ],
      delegationEvents: [link(A, B, 4_000), link(B, A, 4_001)],
    });
    expect(res.wallets[A]).toMatchObject({ balance: 1, raw: 200 });
    expect(res.identities[`${A}-${B}`]).toMatchObject({
      raw: 200,
      wallets: [A, B],
    });
  });

  it("nets a transaction: a pass-through acts as A to C, and a round trip moves nothing", () => {
    const res = cycle({
      transfers: [
        t({ from: ZERO, to: A, amount: 2, timestamp: T - 100 * DAY }),
        ...inOneTransaction([
          { from: A, to: W, amount: 2 },
          { from: W, to: A, amount: 1 },
          { from: W, to: C, amount: 1 },
        ]),
      ],
      delegationEvents: [link(A, C, 4_000), link(C, A, 4_001)],
    });
    // C's copy keeps its 100 days: A and C are one identity.
    expect(res.wallets[C]).toMatchObject({ balance: 1, raw: 100 });
    expect(res.wallets[A]).toMatchObject({ balance: 1, raw: 100 });
    expect(res.wallets[W]).toBeUndefined();
  });

  it("counts a mint burned in its own transaction toward the edition, and credits no one", () => {
    const res = cycle({
      transfers: [
        t({ from: ZERO, to: A, timestamp: T - 100 * DAY }),
        ...inOneTransaction([
          { from: ZERO, to: B, amount: 3 },
          { from: B, to: ZERO, amount: 3 },
        ]),
      ],
    });
    expect(res.edition["1"]).toBe(4);
    expect(res.wallets[B]).toBeUndefined();
    expect(res.wallets[ZERO]).toBeUndefined();
  });

  it("credits sinks, never debits them, and keeps the FirstGM burn from ZERO", () => {
    const burnTx = R.firstgm_burn_tx;
    const res = cycle({
      transfers: [
        t({ from: ZERO, to: A, amount: 3, timestamp: T - 100 * DAY }),
        t({ from: A, to: DEAD }),
        t({ from: A, to: ZERO, tx: burnTx }),
        t({ from: DEAD, to: B }),
      ],
    });
    expect(res.wallets[DEAD]).toMatchObject({ balance: 1 });
    expect(res.wallets[ZERO]).toBeUndefined();
    expect(res.wallets[B]).toMatchObject({ balance: 1, raw: 10 });
    expect(res.totals.final - res.totals.finalExcludingSinks).toBe(
      res.identities[DEAD]?.final
    );
  });

  it.each([
    ["sending more than held", [t({ from: A, to: B })], /holds 0/],
    [
      "an underflow before netting",
      inOneTransaction([
        { from: ZERO, to: A, amount: 1 },
        { from: A, to: B, amount: 2 },
        { from: B, to: A, amount: 1 },
      ]),
      /holds/,
    ],
    [
      "a net movement of 2^64",
      inOneTransaction([
        { from: DEAD, to: A, amount: 2n ** 64n - 1n },
        { from: DEAD, to: A, amount: 2n ** 64n - 1n },
      ]),
      /net movement/,
    ],
  ])("refuses %s", (_label, transfers, rule) => {
    refused({ transfers }, rule);
  });
});

describe("inputs with no result (P26 §3, §4.2, §5.2, §8.7, §13)", () => {
  const mint = () => t({ from: ZERO, to: A });

  it("refuses transfers that no one log or transaction can give", () => {
    const one = mint();
    refused({ transfers: [one, { ...one }] }, /canonical key/);
    refused({ transfers: [one, { ...one, batchPos: 1, to: B }] }, /no one log/);
    refused(
      { transfers: [one, { ...one, logIndex: 1, tx: `0x${"f".repeat(64)}` }] },
      /hash/
    );
    refused(
      { transfers: [one, { ...one, logIndex: 1, timestamp: 1 }] },
      /timestamp/
    );
    refused(
      {
        transfers: [
          { ...one, txIndex: 1 },
          { ...one, logIndex: 1, txIndex: 0 },
        ],
      },
      /smaller txIndex/
    );
  });

  it("refuses times after the cutoff and positions given twice", () => {
    refused(
      { transfers: [t({ from: ZERO, to: A, timestamp: T + 1 })] },
      /after T/
    );
    refused(
      { delegationEvents: [{ ...link(A, B, 4_000), timestamp: T + 1 }] },
      /after T/
    );
    refused(
      { delegationEvents: [link(A, B, 4_000), link(B, A, 4_000)] },
      /another log|one position/
    );
    const one = mint();
    refused(
      {
        transfers: [one],
        delegationEvents: [
          { ...link(A, B, 0), block: one.block, logIndex: one.logIndex },
        ],
      },
      /another log/
    );
  });

  it("refuses values outside their types", () => {
    refused(
      { transfers: [{ ...mint(), token: "1" as never }] },
      /not an integer/
    );
    refused({ transfers: [{ ...mint(), amount: 2n ** 256n }] }, /uint256/);
    refused({ transfers: [{ ...mint(), amount: 2n ** 64n }] }, /2\^64/);
    refused({ transfers: [{ ...mint(), from: "0x12" }] }, /20 bytes/);
    refused({ transfers: [{ ...mint(), contract: W }] }, /not The Memes/);
    refused({ transfers: [mint()], claimMax: { "1": 2 ** 32 } }, /uint32/);
    refused(
      { transfers: [mint()], claimMax: { "01": 310 } },
      /canonical decimal/
    );
    // After B a transfer is not an input, but its types still count.
    refused(
      { transfers: [{ ...mint(), block: 9_999, amount: 2n ** 256n }] },
      /uint256/
    );
    expect(
      cycle({ transfers: [{ ...mint(), block: 9_999, amount: 2n ** 200n }] }).H
    ).toBe(0);
  });

  it("refuses a held copy of a Meme whose edition is 0", () => {
    refused(
      {
        transfers: [
          t({ from: ZERO, to: A, amount: 0, timestamp: T - 20 * DAY }),
          t({ from: DEAD, to: B }),
        ],
      },
      /effective edition is 0/
    );
  });

  it("refuses results outside the tdh-v1.4 range", () => {
    refused(
      {
        transfers: inOneTransaction([
          { from: ZERO, to: A, amount: 2n ** 53n },
          { from: A, to: ZERO, amount: 2n ** 53n },
        ]),
      },
      /RATE input/
    );
    refused(
      {
        transfers: [
          t({
            from: DEAD,
            to: A,
            amount: 2n ** 64n - 1n,
            timestamp: T - 3_600,
          }),
          t({
            from: DEAD,
            to: A,
            amount: 2n ** 64n - 1n,
            timestamp: T - 3_600,
          }),
          t({ from: ZERO, to: B }),
        ],
      },
      /2\^64 or more/
    );
    // With whole "days" of one second, a copy held 10^8 seconds at a rate of
    // 10^6 a copy has a base of 10^14, and base * beta passes 2^53.
    refused(
      {
        transfers: [
          t({ from: ZERO, to: B, token: 2, amount: 1_000_000 }),
          t({ from: ZERO, to: A, timestamp: T - 100_000_000 }),
        ],
      },
      /base \* beta/,
      fork(R, { day_s: 1 })
    );
  });
});

describe("editions, rates and boosts (P26 §5, §8)", () => {
  it("floors an edition below 300 at its claim, capped at 310, and not from 300 on", () => {
    const res = cycle({
      transfers: [
        t({ from: ZERO, to: A, amount: 149, timestamp: T - 20 * DAY }),
        t({
          from: ZERO,
          to: A,
          amount: 300,
          token: 2,
          timestamp: T - 20 * DAY,
        }),
      ],
      claimMax: { "1": 332, "2": 333 },
    });
    expect(res.edition).toEqual({ "1": 310, "2": 300 });
  });

  it("counts a card a day after its first mint, and NextGen at once", () => {
    const res = cycle({
      transfers: [
        t({ from: ZERO, to: A, timestamp: T - DAY }),
        t({ from: ZERO, to: A, token: 2, timestamp: T - DAY + 1 }),
        t({
          from: ZERO,
          to: A,
          contract: R.gradients,
          token: 7,
          timestamp: T - DAY + 1,
        }),
        t({
          from: ZERO,
          to: A,
          contract: R.nextgen,
          token: 10_000_000_001,
          timestamp: T - 60,
        }),
        t({
          from: ZERO,
          to: A,
          contract: R.nextgen,
          token: 20_000_000_000,
          timestamp: T - 60,
        }),
        t({
          from: ZERO,
          to: A,
          contract: R.nextgen,
          token: 20_000_000_001,
          timestamp: T - 60,
        }),
      ],
    });
    expect(res.eligibleMemes).toEqual(["1"]);
    expect(res.rates).toEqual({
      [`${R.memes}#1`]: 100,
      [`${R.nextgen}#10000000001`]: 100,
      [`${R.nextgen}#20000000000`]: 50,
      [`${R.nextgen}#20000000001`]: 50,
    });
  });

  it("pays a boost from a full set split across an identity, not its wallets", () => {
    const res = cycle({
      transfers: [
        t({ from: ZERO, to: A, amount: 2, timestamp: T - 20 * DAY }),
        t({ from: ZERO, to: A, token: 2, timestamp: T - 20 * DAY }),
        t({ from: ZERO, to: B, token: 2, timestamp: T - 20 * DAY }),
      ],
      delegationEvents: [link(A, B, 4_000), link(B, A, 4_001)],
    });
    // A alone holds one set; with B's copy the identity holds two: 1.05.
    expect(res.wallets[A]?.boostCents).toBe(100);
    expect(res.identities[`${A}-${B}`]).toMatchObject({
      boostCents: 105,
      balance: 4,
    });
    expect(res.identities[`${A}-${B}`]?.boost.sets).toBe(2);
  });

  it("ignores delegation events that are not consolidations, and never consolidates a sink", () => {
    const res = cycle({
      transfers: [t({ from: ZERO, to: A })],
      delegationEvents: [
        { ...link(A, B, 4_000), useCase: 1 },
        { ...link(B, A, 4_001), useCase: 1 },
        { ...link(A, C, 4_002), collection: W },
        { ...link(C, A, 4_003), collection: W },
        link(A, DEAD, 4_004),
        link(DEAD, A, 4_005),
      ],
    });
    expect(res.clusters.clusters).toEqual([]);
    expect(Object.keys(res.identities)).toEqual([A]);
  });
});

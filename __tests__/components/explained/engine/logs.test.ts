/** @jest-environment node */
import { keccak256, stringToBytes } from "viem";

import {
  REGISTRY_V14,
  TdhInputInvalid,
  ZERO,
  computeCycle,
  fork,
  type CycleInput,
  type DelegationEvent,
  type RawLog,
  type Registry,
  type Transfer,
} from "@/components/explained/engine/tdh";

/**
 * P26 §3.1, §3.2, §4.2 and §6.1 on raw `eth_getLogs` entries, each rule on
 * an input of its own, so CI runs them without the private vector files
 * (`vectors.test.ts` runs the specification's own: 13, 25-27, 42, 52,
 * 61-64, 67, 69, 72, 82, 98, 105 and 106). The logs are built here with the
 * canonical ABI encoding; topics are the keccak-256 of the signatures.
 */
const R: Registry = fork(REGISTRY_V14, { season_starts: [1] });
const B = 5_000;
const T = 1_791_676_799;
const A = "0x00000000000000000000000000000000000000a1";
const C = "0x00000000000000000000000000000000000000c3";
const D = "0x00000000000000000000000000000000000000d4";
const OPERATOR = "0x00000000000000000000000000000000000000ee";
const OTHER = "0x00000000000000000000000000000000000000ff";

const topic = (signature: string): string =>
  keccak256(stringToBytes(signature));
const SINGLE = topic("TransferSingle(address,address,address,uint256,uint256)");
const BATCH = topic(
  "TransferBatch(address,address,address,uint256[],uint256[])"
);
const ERC721 = topic("Transfer(address,address,uint256)");
const REGISTER = topic(
  "RegisterDelegation(address,address,address,uint256,bool,uint256)"
);
const REGISTER_SUB = topic(
  "RegisterDelegationUsingSubDelegation(address,address,address,address,uint256,bool,uint256)"
);
const REVOKE = topic("RevokeDelegation(address,address,address,uint256)");

/** One 32-byte word, as hex without `0x`. */
function word(value: bigint | number | string): string {
  const hex =
    typeof value === "string" ? value.slice(2) : BigInt(value).toString(16);
  return hex.padStart(64, "0");
}
const asTopic = (value: bigint | number | string): string => `0x${word(value)}`;
const data = (...words: (bigint | number | string)[]): string =>
  `0x${words.map(word).join("")}`;

/** Ten minutes a block, so a log at block 1001 is about 28 days old at T. */
const stampOf = (block: number): number => T - (B - block) * 600;

interface At {
  readonly block: number;
  readonly txIndex?: number;
  readonly logIndex?: number;
}
function log(
  address: string,
  topics: readonly string[],
  hex: string,
  at: At
): RawLog {
  return {
    address,
    topics,
    data: hex,
    blockNumber: `0x${at.block.toString(16)}`,
    transactionIndex: `0x${(at.txIndex ?? 0).toString(16)}`,
    logIndex: `0x${(at.logIndex ?? 0).toString(16)}`,
    transactionHash: asTopic(at.block * 1_000 + (at.txIndex ?? 0)),
  };
}
const single = (from: string, to: string, id: number, n: number, at: At) =>
  log(
    R.memes,
    [SINGLE, asTopic(OPERATOR), asTopic(from), asTopic(to)],
    data(id, n),
    at
  );
const batch = (
  from: string,
  to: string,
  ids: readonly number[],
  values: readonly number[],
  at: At
) =>
  log(
    R.memes,
    [BATCH, asTopic(OPERATOR), asTopic(from), asTopic(to)],
    data(
      0x40,
      0x60 + 32 * ids.length,
      ids.length,
      ...ids,
      values.length,
      ...values
    ),
    at
  );
const erc721 = (from: string, to: string, id: number, at: At) =>
  log(R.gradients, [ERC721, asTopic(from), asTopic(to), asTopic(id)], "0x", at);
const register = (from: string, to: string, at: At, useCase = 999) =>
  log(
    R.delegation,
    [REGISTER, asTopic(from), asTopic(R.memes), asTopic(to)],
    data(useCase, 1, 0),
    at
  );

/** The header timestamps of the blocks the logs name. */
function headers(logs: readonly RawLog[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const l of logs) {
    const block = Number(BigInt(l.blockNumber));
    out[String(block)] = stampOf(block);
  }
  return out;
}
function fromLogs(
  logs: readonly RawLog[],
  rest: Omit<CycleInput, "block" | "timestamp" | "logs"> = {},
  stamps: Record<string, number> = headers(logs)
) {
  return computeCycle(
    {
      block: B,
      timestamp: T,
      logs: { entries: logs, headerTimestamps: stamps },
      ...rest,
    },
    R
  );
}
function refused(
  logs: readonly RawLog[],
  rule: RegExp,
  rest: Omit<CycleInput, "block" | "timestamp" | "logs"> = {},
  stamps?: Record<string, number>
) {
  expect(() => fromLogs(logs, rest, stamps)).toThrow(TdhInputInvalid);
  expect(() => fromLogs(logs, rest, stamps)).toThrow(rule);
}

describe("raw logs give the same cycle as decoded inputs (P26 §3.1)", () => {
  // Mints of Memes 1 and 2 to A, a batch to C, a Gradient to A, a sale, and
  // A and D linked both ways.
  const logs = [
    single(ZERO, A, 1, 3, { block: 1001 }),
    batch(ZERO, C, [2, 2, 1], [1, 2, 1], {
      block: 1002,
      txIndex: 1,
      logIndex: 4,
    }),
    erc721(ZERO, A, 7, { block: 1003 }),
    single(A, C, 1, 1, { block: 1004, txIndex: 2, logIndex: 1 }),
    register(A, D, { block: 1005 }),
    register(D, A, { block: 1006 }),
  ];
  const t = (
    at: At,
    batchPos: number,
    contract: string,
    token: number,
    from: string,
    to: string,
    amount: number
  ): Transfer => ({
    block: at.block,
    txIndex: at.txIndex ?? 0,
    logIndex: at.logIndex ?? 0,
    batchPos,
    timestamp: stampOf(at.block),
    tx: asTopic(at.block * 1_000 + (at.txIndex ?? 0)),
    contract,
    token,
    from,
    to,
    amount,
  });
  const decoded: CycleInput = {
    block: B,
    timestamp: T,
    transfers: [
      t({ block: 1001 }, 0, R.memes, 1, ZERO, A, 3),
      t({ block: 1002, txIndex: 1, logIndex: 4 }, 0, R.memes, 2, ZERO, C, 1),
      t({ block: 1002, txIndex: 1, logIndex: 4 }, 1, R.memes, 2, ZERO, C, 2),
      t({ block: 1002, txIndex: 1, logIndex: 4 }, 2, R.memes, 1, ZERO, C, 1),
      t({ block: 1003 }, 0, R.gradients, 7, ZERO, A, 1),
      t({ block: 1004, txIndex: 2, logIndex: 1 }, 0, R.memes, 1, A, C, 1),
    ],
    delegationEvents: [A, D].map(
      (from, i): DelegationEvent => ({
        block: 1005 + i,
        txIndex: 0,
        logIndex: 0,
        kind: "REGISTER",
        from,
        to: from === A ? D : A,
        collection: R.memes,
        timestamp: stampOf(1005 + i),
      })
    ),
  };

  it("decodes TransferSingle, TransferBatch (a repeated id kept) and ERC-721, and the delegation events", () => {
    const raw = fromLogs(logs);
    expect(raw).toEqual(computeCycle(decoded, R));
    expect(raw.clusters.clusters).toEqual([[A, D]]);
    expect(raw.identities[`${A}-${D}`]?.memes["1"]?.balance).toBe(2);
    expect(raw.wallets[C]?.memes["2"]?.balance).toBe(3);
    expect(raw.wallets[A]?.gradients["7"]?.balance).toBe(1);
  });

  it("takes some logs raw and others decoded, as one input", () => {
    const mixed = fromLogs(logs.slice(0, 3), {
      transfers: (decoded.transfers ?? []).slice(5),
      delegationEvents: decoded.delegationEvents ?? [],
    });
    expect(mixed).toEqual(computeCycle(decoded, R));
  });

  it("refuses a log given raw and decoded, even as one more element of its batch (vectors 63, 72)", () => {
    const again = (decoded.transfers ?? [])[1] as Transfer;
    refused(logs, /raw or decoded, never both/, {
      transfers: [{ ...again, batchPos: 9 }],
    });
    refused(logs, /raw or decoded, never both/, {
      delegationEvents: [
        {
          ...((decoded.delegationEvents ?? [])[0] as DelegationEvent),
          block: 1001,
        },
      ],
    });
  });
});

describe("which logs are inputs (P26 §3.1)", () => {
  const mint = single(ZERO, A, 1, 1, { block: 1001 });

  it("reads only the collections' and the delegation contract's logs in blocks <= B, not removed ones", () => {
    const res = fromLogs([
      mint,
      { ...single(ZERO, A, 1, 5, { block: 1002 }), removed: true },
      { ...single(ZERO, A, 1, 7, { block: 1003 }), address: OTHER },
      single(ZERO, A, 1, 9, { block: B + 1 }),
    ]);
    expect(res.wallets[A]?.balance).toBe(1);
  });

  it("reads every log's types, selected or not (vector 69)", () => {
    refused(
      [mint, { ...mint, removed: "false" as unknown as boolean }],
      /removed is not a boolean/
    );
    refused(
      [
        mint,
        {
          ...single(ZERO, A, 1, 1, { block: B + 1 }),
          logIndex: `0x1${"0".repeat(16)}`,
        },
      ],
      /uint64/
    );
    refused([{ ...mint, topics: [SINGLE, "0x01"] }], /32 bytes of hex/);
    refused([{ ...mint, data: "0x0" }], /not hex bytes/);
    refused([{ ...mint, blockNumber: "0x" }], /not a hex quantity/, {}, {});
  });

  it("refuses a log given twice and two logs at one position (vector 52)", () => {
    refused([mint, mint], /a log given twice/);
    refused([mint, { ...mint, transactionIndex: "0x1" }], /two logs/);
  });

  it("refuses a larger logIndex with a smaller txIndex, an ignored log included (vector 64)", () => {
    const approval = log(
      R.memes,
      [topic("ApprovalForAll(address,address,bool)"), asTopic(A), asTopic(C)],
      data(1),
      {
        block: 1001,
        txIndex: 0,
        logIndex: 5,
      }
    );
    refused(
      [{ ...mint, transactionIndex: "0x1" }, approval],
      /smaller txIndex/
    );
    // An ignored log is an input: nothing decoded may take its position (vector 63).
    refused([approval], /raw or decoded, never both/, {
      transfers: [
        {
          block: 1001,
          txIndex: 0,
          logIndex: 5,
          batchPos: 0,
          timestamp: stampOf(1001),
          tx: asTopic(1),
          contract: R.memes,
          token: 1,
          from: ZERO,
          to: A,
          amount: 1,
        },
      ],
    });
  });

  it("needs each selected log's header, increasing with B stamped T (P26 §4.2, vectors 61, 62)", () => {
    refused([mint], /no header timestamp for block 1001/, {}, {});
    refused([mint], /do not increase/, {}, { "1001": T });
    refused([single(ZERO, A, 1, 1, { block: B })], /not T/, {}, { [B]: T - 1 });
    refused([mint], /canonical decimal/, {}, { "01001": stampOf(1001) });
    const atB = fromLogs(
      [
        single(ZERO, A, 1, 2, { block: 1001 }),
        single(A, C, 1, 1, { block: B }),
      ],
      {},
      { "1001": stampOf(1001), [B]: T }
    );
    expect(atB.wallets[C]?.memes["1"]).toMatchObject({ balance: 1, raw: 0 });
  });
});

describe("the ABI decoding of transfer logs (P26 §3.2)", () => {
  const at = { block: 1001 };

  it("refuses an address word with high bytes, the operator's included", () => {
    const bad = single(ZERO, A, 1, 1, at);
    refused(
      [
        {
          ...bad,
          topics: [
            SINGLE,
            asTopic(OPERATOR),
            asTopic(`0x01${word(A).slice(2)}`),
            asTopic(A),
          ],
        },
      ],
      /non-zero high bytes/
    );
    refused(
      [
        {
          ...bad,
          topics: [
            SINGLE,
            asTopic(`0x01${word(A).slice(2)}`),
            asTopic(ZERO),
            asTopic(A),
          ],
        },
      ],
      /non-zero high bytes/
    );
  });

  it("refuses data that is not the canonical encoding", () => {
    refused(
      [{ ...single(ZERO, A, 1, 1, at), data: data(1, 1, 0) }],
      /not id \|\| value/
    );
    refused(
      [{ ...single(ZERO, A, 1, 1, at), data: `${data(1, 1)}00` }],
      /whole number of words/
    );
    const twoArrays = batch(ZERO, A, [1, 2], [1, 1], at);
    refused(
      [{ ...twoArrays, data: data(0x40, 0xa0, 2, 1, 2, 1, 1) }],
      /canonical encoding/
    );
    refused(
      [{ ...twoArrays, data: data(0x40, 0xa0, 2, 1, 2, 3, 1, 1) }],
      /canonical encoding/
    );
    refused(
      [{ ...twoArrays, data: data(0x40, 0xc0, 2, 1, 2, 2, 1, 1) }],
      /canonical encoding/
    );
    refused(
      [{ ...erc721(ZERO, A, 7, at), data: data(0) }],
      /ERC-721 Transfer with data/
    );
  });

  it("refuses an amount of 2^64 or more, and reads a token id of any uint256", () => {
    refused(
      [{ ...single(ZERO, A, 1, 0, at), data: data(1, 2n ** 64n) }],
      /2\^64 or more/
    );
    const big = 2n ** 255n;
    const res = fromLogs([
      log(
        R.nextgen,
        [ERC721, asTopic(ZERO), asTopic(A), asTopic(big)],
        "0x",
        at
      ),
    ]);
    expect(Object.keys(res.wallets[A]?.nextgen ?? {})).toEqual([
      big.toString(),
    ]);
  });

  it("ignores another event or topic count of a collection, as a log that gives nothing", () => {
    const res = fromLogs([
      single(ZERO, A, 1, 1, at),
      {
        ...single(ZERO, A, 1, 5, { block: 1002 }),
        topics: [SINGLE, asTopic(OPERATOR), asTopic(ZERO)],
      },
      {
        ...erc721(ZERO, A, 7, { block: 1003 }),
        topics: [SINGLE, asTopic(ZERO), asTopic(A), asTopic(7)],
      },
    ]);
    expect(res.wallets[A]?.balance).toBe(1);
  });
});

describe("the delegation events (P26 §6.1, §6.2)", () => {
  it("decodes the sub-delegation forms and revocations, each with its block's time", () => {
    const viaSub = (from: string, to: string, block: number) =>
      log(
        R.delegation,
        [REGISTER_SUB, asTopic(from), asTopic(R.memes), asTopic(to)],
        data(OPERATOR, 999, 1, 0),
        { block }
      );
    const res = fromLogs([viaSub(A, C, 1001), viaSub(C, A, 1002)]);
    expect(res.clusters.clusters).toEqual([[A, C]]);
    const revoked = fromLogs([
      viaSub(A, C, 1001),
      viaSub(C, A, 1002),
      log(
        R.delegation,
        [REVOKE, asTopic(A), asTopic(R.memes), asTopic(C)],
        data(999),
        { block: 1003 }
      ),
    ]);
    expect(revoked.clusters.clusters).toEqual([]);
  });

  it("keeps only consolidations: another use case or collection is no link", () => {
    const res = fromLogs([
      register(A, C, { block: 1001 }),
      register(C, A, { block: 1002 }, 1),
    ]);
    expect(res.clusters.clusters).toEqual([]);
  });

  it("refuses a malformed delegation event", () => {
    refused(
      [{ ...register(A, C, { block: 1001 }), data: data(999, 2, 0) }],
      /allTokens is not a bool/
    );
    refused(
      [{ ...register(A, C, { block: 1001 }), data: data(999, 1) }],
      /2 data words/
    );
    refused(
      [
        log(
          R.delegation,
          [REGISTER_SUB, asTopic(A), asTopic(R.memes), asTopic(C)],
          data(`0x01${word(OPERATOR).slice(2)}`, 999, 1, 0),
          { block: 1001 }
        ),
      ],
      /non-zero high bytes/
    );
  });

  it("times a registration by its block's header, so the four-wallet gate reads it (D136)", () => {
    // A, B and C linked long before activation; D links with each, D last
    // in one block. Fresh headers make D a hub and the group four.
    const gate = Number(R.consolidation_gate_activation_s);
    const W = "0x00000000000000000000000000000000000000b2";
    const old: DelegationEvent[] = [
      [A, W],
      [W, A],
      [A, C],
      [C, A],
      [W, C],
      [C, W],
    ].map(([from, to], i) => ({
      block: 100 + i,
      txIndex: 0,
      logIndex: 0,
      kind: "REGISTER",
      from: from as string,
      to: to as string,
      collection: R.memes,
      timestamp: gate - 200 * 86_400,
    }));
    const dLinks = [
      register(A, D, { block: 8001 }),
      register(W, D, { block: 8002 }),
      register(C, D, { block: 8003 }),
      register(D, A, { block: 8004, logIndex: 0 }),
      register(D, W, { block: 8004, logIndex: 1 }),
      register(D, C, { block: 8004, logIndex: 2 }),
    ];
    const groupsWith = (first: number) =>
      computeCycle(
        {
          block: 9_000,
          timestamp: gate + 3 * 86_400,
          delegationEvents: old,
          logs: {
            entries: dLinks,
            headerTimestamps: {
              "8001": first,
              "8002": first + 12,
              "8003": first + 24,
              "8004": first + 36,
            },
          },
        },
        R
      ).clusters.clusters.map((g) => g.length);
    expect(groupsWith(gate)).toEqual([4]);
    expect(groupsWith(gate - 40)).toEqual([3]);
  });
});

/**
 * Shared vectors for 6529 Desktop provenance publisher calls (part of
 * `buildWalletTransactionVectors`): open a release, publish records, seal
 * it, on each pinned registry. Values are placeholders.
 */

import {
  type AbiFunction,
  encodeFunctionData,
  type Hex,
  parseAbiItem,
} from "viem";
import type { Case, VectorExpectation } from "./vectors";

const SEPOLIA = 11_155_111;
const REGISTRIES: readonly (readonly [string, string])[] = [
  ["test registry", "0x0e289576c7565d29018134517309668946ffc912"],
  ["Museum registry", "0xee91c45a1893fbb45ce8eea170ef05d8d85bb850"],
];
const UNPINNED = "0x4444444444444444444444444444444444444444";

const HASH_REF = "(uint16 algorithm,bytes32 digest,bytes32 canonicalizationId)";
const fn = (signature: string) =>
  parseAbiItem(`function ${signature}`) as AbiFunction;
const ABI = {
  openRelease: fn(
    `openRelease((bytes manifestCid,${HASH_REF} manifestHash,bytes rootCid,bytes32 arweaveId,bytes20 sourceCommit,string label) header)`
  ),
  publish: fn(
    `publish(uint32 releaseId,(bytes32 subjectId,bytes32 recordType,bytes32 schemaId,${HASH_REF} contentHash,uint64 effectiveAt,bytes cid,bytes32 arweaveId,string label,uint32 expectedVersion)[] records)`
  ),
  sealRelease: fn("sealRelease(uint32 releaseId,uint32 expectedRecordCount)"),
  registerRecordType: fn("registerRecordType(string literal)"),
} as const;

const encode = (name: keyof typeof ABI, args: readonly unknown[]): Hex =>
  encodeFunctionData({ abi: [ABI[name]], functionName: ABI[name].name, args });

const word = (byte: string) => `0x${byte.repeat(32)}` as Hex;
const ZERO_WORD = word("00");
/** A binary CIDv1 (raw, sha2-256): 36 bytes. */
const CID = `0x01551220${"ab".repeat(32)}` as Hex;
const bytesOf = (n: number) => `0x${"cd".repeat(n)}` as Hex;

interface HashRef {
  readonly algorithm: number;
  readonly digest: Hex;
  readonly canonicalizationId: Hex;
}
const hashRef = (overrides: Partial<HashRef> = {}): HashRef => ({
  algorithm: 2,
  digest: word("11"),
  canonicalizationId: word("22"),
  ...overrides,
});

const header = (overrides: Record<string, unknown> = {}) => ({
  manifestCid: CID,
  manifestHash: hashRef(),
  rootCid: "0x" as Hex,
  arweaveId: ZERO_WORD,
  sourceCommit: `0x${"5e".repeat(20)}` as Hex,
  label: "Catalog release 3",
  ...overrides,
});

const record = (overrides: Record<string, unknown> = {}) => ({
  subjectId: word("a1"),
  recordType: word("b2"),
  schemaId: word("c3"),
  contentHash: hashRef(),
  effectiveAt: 1_795_000_000n,
  cid: CID,
  arweaveId: ZERO_WORD,
  label: "",
  expectedVersion: 0,
  ...overrides,
});

/** A record of the largest valid size: 64-byte CID, 128-byte label. */
const largestRecord = (index: number) =>
  record({
    subjectId: word((index + 16).toString(16).padStart(2, "0")),
    cid: bytesOf(64),
    label: "L".repeat(128),
  });
/** A record of the smallest size: no CID (Arweave only), no label. */
const smallestRecord = (index: number) =>
  record({
    subjectId: word((index + 16).toString(16).padStart(2, "0")),
    cid: "0x",
    arweaveId: word("ee"),
  });

const ok = (ruleId: string): VectorExpectation => ({
  ok: true,
  ruleId,
  risk: "normal",
});
const RULE: VectorExpectation = { ok: false, problem: "transaction-rule" };
const UNKNOWN: VectorExpectation = {
  ok: false,
  problem: "unknown-transaction",
};

/** Dirties the byte after a `bytes20` in its word: non-canonical. */
function dirtySourceCommit(data: Hex): Hex {
  const sourceCommit = "5e".repeat(20);
  const at = data.indexOf(sourceCommit) + sourceCommit.length;
  return `${data.slice(0, at)}ff${data.slice(at + 2)}` as Hex;
}

const range = (n: number) => Array.from({ length: n }, (_, i) => i);

function registryCases(label: string, registry: string): Case[] {
  const c = (
    name: string,
    data: Hex,
    expect: VectorExpectation,
    chainId = SEPOLIA
  ): Case => ({
    name: `${label}: ${name}`,
    chainId,
    to: registry,
    data,
    expect,
  });
  const open = (overrides: Record<string, unknown> = {}) =>
    encode("openRelease", [header(overrides)]);
  const publish = (records: readonly unknown[], releaseId = 3) =>
    encode("publish", [releaseId, records]);
  const one = (overrides: Record<string, unknown>) =>
    publish([record(overrides)]);
  const seal = (releaseId: number, count: number) =>
    encode("sealRelease", [releaseId, count]);
  const openId = "provenance.openRelease";
  const publishId = "provenance.publish";
  const sealId = "provenance.sealRelease";
  return [
    c(`${openId} accepts`, open(), ok(openId)),
    c(
      `${openId} accepts an Arweave-only release with a root CID`,
      open({ manifestCid: "0x", arweaveId: word("ee"), rootCid: CID }),
      ok(openId)
    ),
    c(`${openId} refuses unreadable label`, open({ label: "a​b" }), RULE),
    c(
      `${openId} refuses a label over 128 bytes`,
      open({ label: "L".repeat(129) }),
      RULE
    ),
    c(
      `${openId} refuses a CID over 64 bytes`,
      open({ manifestCid: bytesOf(65) }),
      RULE
    ),
    c(
      `${openId} refuses a root CID over 64 bytes`,
      open({ rootCid: bytesOf(65) }),
      RULE
    ),
    c(
      `${openId} refuses an unknown hash algorithm`,
      open({ manifestHash: hashRef({ algorithm: 3 }) }),
      RULE
    ),
    c(
      `${openId} refuses a zero digest`,
      open({ manifestHash: hashRef({ digest: ZERO_WORD }) }),
      RULE
    ),
    c(`${openId} refuses dirty padding`, dirtySourceCommit(open()), RULE),
    c(`${openId} refuses trailing bytes`, `${open()}00` as Hex, RULE),
    c(`${openId} refuses mainnet`, open(), UNKNOWN, 1),
    { ...c(`${openId} refuses value`, open(), RULE), value: 1n },
    c(`${publishId} accepts`, publish([record()]), ok(publishId)),
    c(
      `${publishId} accepts 15 records of the largest size`,
      publish(range(15).map(largestRecord)),
      ok(publishId)
    ),
    c(
      `${publishId} accepts 20 records of the smallest size`,
      publish(range(20).map(smallestRecord)),
      ok(publishId)
    ),
    c(
      `${publishId} accepts a later version`,
      one({ expectedVersion: 4, label: "Revision 5" }),
      ok(publishId)
    ),
    c(
      `${publishId} refuses 21 records`,
      publish(range(21).map(smallestRecord)),
      RULE
    ),
    c(`${publishId} refuses no records`, publish([]), RULE),
    c(`${publishId} refuses release 0`, publish([record()], 0), RULE),
    c(
      `${publishId} refuses a zero subject`,
      one({ subjectId: ZERO_WORD }),
      RULE
    ),
    c(
      `${publishId} refuses a zero record type`,
      one({ recordType: ZERO_WORD }),
      RULE
    ),
    c(`${publishId} refuses a zero schema`, one({ schemaId: ZERO_WORD }), RULE),
    c(`${publishId} refuses no effective time`, one({ effectiveAt: 0n }), RULE),
    c(
      `${publishId} refuses a CID over 64 bytes`,
      one({ cid: bytesOf(65) }),
      RULE
    ),
    c(
      `${publishId} refuses a label over 128 bytes`,
      one({ label: "L".repeat(129) }),
      RULE
    ),
    c(`${publishId} refuses unreadable label`, one({ label: "a​b" }), RULE),
    c(
      `${publishId} refuses an unknown hash algorithm`,
      one({ contentHash: hashRef({ algorithm: 0 }) }),
      RULE
    ),
    c(
      `${publishId} refuses a zero digest`,
      one({ contentHash: hashRef({ digest: ZERO_WORD }) }),
      RULE
    ),
    c(
      `${publishId} refuses a bad record among good ones`,
      publish([record(), record({ subjectId: ZERO_WORD })]),
      RULE
    ),
    c(
      `${publishId} refuses trailing bytes`,
      `${publish([record()])}00` as Hex,
      RULE
    ),
    c(`${sealId} accepts`, seal(3, 42), ok(sealId)),
    c(`${sealId} accepts an empty release`, seal(3, 0), ok(sealId)),
    c(`${sealId} refuses release 0`, seal(0, 42), RULE),
    c(`${sealId} refuses trailing bytes`, `${seal(3, 42)}00` as Hex, RULE),
    c(
      "refuses a governance call as a transaction",
      encode("registerRecordType", ["PUBLIC_DOCUMENT"]),
      UNKNOWN
    ),
  ];
}

export function provenanceCases(): Case[] {
  return [
    ...REGISTRIES.flatMap(([label, registry]) =>
      registryCases(label, registry)
    ),
    {
      name: "provenance.publish refuses an unpinned registry",
      chainId: SEPOLIA,
      to: UNPINNED,
      data: encode("publish", [3, [record()]]),
      expect: UNKNOWN,
    },
  ];
}

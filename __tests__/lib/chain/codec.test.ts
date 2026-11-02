/**
 * @jest-environment node
 */
import { createHash } from "node:crypto";

import { hashTypedData, keccak256, stringToBytes, type Hex, type TypedDataDefinition } from "viem";

import { decodeCe, encodeCe, hexBytes, sortSetEntries, toHex } from "@/lib/chain/codec/ce";
import { encodeType, typeHash } from "@/lib/chain/codec/eip712";
import {
  checkHeaderRules,
  checkSignatureList,
  decodeSignedTx,
  encodeSignedTx,
  encodeTxHeaderCe,
  encodeUnsignedTx,
  primaryStruct,
  txDigests,
  txHeader,
  type TxHeader,
  type TxSignature,
} from "@/lib/chain/codec/envelope";
import { ChainCodecError, ChainResultCode, classifyResultCode } from "@/lib/chain/codec/errors";
import {
  addressKeyId,
  decisionId,
  derivedId,
  networkId,
  objectId,
  ObjectKind,
  publicKeyId,
  repCategoryId,
  tag,
} from "@/lib/chain/codec/ids";
import { EXAMPLE_DEVNET } from "@/lib/chain/codec/network";
import {
  CAPABILITY_GRANT,
  COMPETITION_CREATE,
  IDENTITY_CREATE,
  OPERATIONS,
  RATING_SET,
  SUBMISSION_CREATE,
  VOTE_SET,
  WAVE_CREATE,
  type CapabilityGrantBody,
  type CompetitionCreateBody,
  type IdentityCreateBody,
  type OperationSchema,
  type RatingSetBody,
  type SubmissionCreateBody,
  type VoteSetBody,
  type WaveCreateBody,
} from "@/lib/chain/codec/ops";
import { ASSET_6529_ID, checkBodyRules, isHandle, isPhase1Cid, isRepCategoryName } from "@/lib/chain/codec/rules";
import type { CeType, StructType } from "@/lib/chain/codec/schema";
import {
  bool,
  bytes32,
  i64,
  list,
  optional,
  set,
  string,
  struct,
  u16,
  u32,
  u64,
  u8,
} from "@/lib/chain/codec/schema";

import {
  DAY_MS,
  DERIVED,
  E1,
  E2,
  E3,
  E4,
  EXPIRES_AT_MS,
  NETWORK,
  NOT_BEFORE_MS,
  P28_VOTE_SET,
  P40_TYPES,
  SESSION_PUB,
  TAGS,
  WALLET_WORD,
  type WorkedExample,
} from "./fixtures/design-vectors";

const ZERO32: Hex = `0x${"00".repeat(32)}`;
const kc = (text: string): Hex => keccak256(stringToBytes(text));
const cidRaw = (text: string): Hex =>
  `0x01551220${createHash("sha256").update(text).digest("hex")}`;

function codeOf(run: () => unknown): number | null {
  try {
    run();
    return null;
  } catch (error) {
    if (error instanceof ChainCodecError) {
      return error.code;
    }
    throw error;
  }
}

// ------------------------------------------------- P40 §13 inputs

const e1Header = txHeader({
  keyType: 1,
  keyId: WALLET_WORD,
  notBefore: NOT_BEFORE_MS,
  expiresAt: EXPIRES_AT_MS,
  maxWork: 60_000n,
});
const e1Body: IdentityCreateBody = {
  legacyId: `0x${"00".repeat(16)}`,
  handle: "example1",
  profileDocCid: cidRaw("example profile document"),
};

const principal = E1.principalId;
const sessionKeyId = publicKeyId(2, SESSION_PUB);

const e2Header = txHeader({
  principal,
  keyType: 1,
  keyId: WALLET_WORD,
  notBefore: NOT_BEFORE_MS,
  expiresAt: EXPIRES_AT_MS,
  maxWork: 60_000n,
});
const e2Body: CapabilityGrantBody = {
  granteeKind: 1,
  grantee: sessionKeyId,
  granteeKeyType: 2,
  granteePublicKey: SESSION_PUB,
  ops: [0x0604, 0x0606, 0x0701],
  flags: 0,
  scopes: [],
  budgets: [{ kind: 4, assetId: ZERO32, limit: 5_000_000n }],
  notBefore: 0n,
  expiresAt: NOT_BEFORE_MS + 30n * DAY_MS,
  acceptMode: 1,
};

const grantId = E2.grantId;
const competitionId = derivedId(kc("example wave"), 0n, ObjectKind.COMPETITION);

const e3Header = txHeader({
  principal,
  keyType: 2,
  keyId: sessionKeyId,
  authRef: grantId,
  notBefore: NOT_BEFORE_MS,
  expiresAt: EXPIRES_AT_MS,
  maxWork: 3_000_000n,
});
const e3Body: VoteSetBody = {
  competitionId,
  expectedConfigVersion: 1,
  entryId: kc("example entry"),
  amount: 250n,
  priorVoteVersion: 0n,
  budgetScope: 1,
};

const e4Header = txHeader({
  principal,
  keyType: 2,
  keyId: sessionKeyId,
  authRef: grantId,
  nonceLane: 1,
  notBefore: NOT_BEFORE_MS,
  expiresAt: EXPIRES_AT_MS,
  maxWork: 200_000n,
});
const e4Body: RatingSetBody = {
  matter: 1,
  targetKind: 1,
  target: kc("example target principal"),
  category: repCategoryId("Example Category"),
  categoryName: "Example Category",
  value: 500n,
  priorVersion: 0n,
};

interface Case {
  readonly vector: WorkedExample;
  readonly op: OperationSchema;
  readonly header: TxHeader;
  readonly body: unknown;
}

const WORKED: readonly Case[] = [
  { vector: E1, op: IDENTITY_CREATE, header: e1Header, body: e1Body },
  { vector: E2, op: CAPABILITY_GRANT, header: e2Header, body: e2Body },
  { vector: E3, op: VOTE_SET, header: e3Header, body: e3Body },
  { vector: E4, op: RATING_SET, header: e4Header, body: e4Body },
];

// ------------------------------------------------- bodies without vectors

const groupNone = { groupId: ZERO32, version: 0 };

const waveBody: WaveCreateBody = {
  waveType: 1,
  controller: ZERO32,
  readGroup: groupNone,
  postGroup: { groupId: kc("example group"), version: 3 },
  adminGroup: groupNone,
  metadataCid: cidRaw("example wave document"),
};

const submissionBody: SubmissionCreateBody = {
  competitionId,
  expectedConfigVersion: 1,
  manifestHash: kc("example manifest"),
  contentCid: cidRaw("example package"),
};

const MAX_VOTE_ABS = 2n ** 53n - 1n;

/** Main Stage's live template as P40 §8.7 describes it. */
const competitionBody: CompetitionCreateBody = {
  waveId: kc("example wave"),
  expectedVersion: 1,
  submitGroup: groupNone,
  voteGroup: groupNone,
  metadataCid: "0x",
  competition: {
    kind: 1,
    creditSource: 1,
    creditParam: ZERO32,
    creditor: ZERO32,
    creditScope: 1,
    creditMode: 1,
    minVote: -MAX_VOTE_ABS,
    maxVote: MAX_VOTE_ABS,
    perEntryCap: 0n,
    participationStart: 0n,
    participationEnd: 0n,
    votingStart: 0n,
    votingEnd: 0n,
    firstDecision: DERIVED.decisionTimeMs,
    gaps: [2n * DAY_MS, 2n * DAY_MS, 3n * DAY_MS],
    rolling: true,
    scheduleEnd: 0n,
    timeLock: DAY_MS,
    winnersPerDecision: 1,
    maxEntriesPerAuthor: 3,
    outcomeTemplateHash: ZERO32,
  },
};

const ALL_BODIES: readonly (readonly [OperationSchema, unknown])[] = [
  [IDENTITY_CREATE, e1Body],
  [CAPABILITY_GRANT, e2Body],
  [WAVE_CREATE, waveBody],
  [SUBMISSION_CREATE, submissionBody],
  [VOTE_SET, e3Body],
  [COMPETITION_CREATE, competitionBody],
  [RATING_SET, e4Body],
];

// ------------------------------------------------- viem cross-check

function viemTypeName(type: CeType): string {
  switch (type.kind) {
    case "uint":
    case "int":
      return `${type.kind}${type.bits}`;
    case "bytesN":
      return `bytes${type.size}`;
    case "list":
    case "set":
      return `${viemTypeName(type.item)}[]`;
    case "optional":
      return viemTypeName(type.inner);
    case "struct":
      return type.name;
    default:
      return type.kind;
  }
}

function collectViemTypes(
  type: StructType,
  out: Record<string, { name: string; type: string }[]>
): void {
  out[type.name] = type.fields.map(([name, fieldType]) => ({ name, type: viemTypeName(fieldType) }));
  for (const [, fieldType] of type.fields) {
    let inner: CeType = fieldType;
    while (inner.kind === "list" || inner.kind === "set" || inner.kind === "optional") {
      inner = inner.kind === "optional" ? inner.inner : inner.item;
    }
    if (inner.kind === "struct" && !(inner.name in out)) {
      collectViemTypes(inner, out);
    }
  }
}

function viemTxId(op: OperationSchema, header: TxHeader, body: unknown): Hex {
  const types: Record<string, { name: string; type: string }[]> = {};
  collectViemTypes(primaryStruct(op), types);
  const definition = {
    domain: { name: "6529 Network", version: "1", salt: EXAMPLE_DEVNET.networkId },
    types,
    primaryType: op.primaryType,
    message: { header, body },
  } as unknown as TypedDataDefinition;
  return hashTypedData(definition);
}

// ================================================================= tests

describe("network, domain and tags (P28 appendix A, P40 §2.2)", () => {
  it("derives NETWORK_ID and the transaction domain separator", () => {
    expect(kc(NETWORK.chainId)).not.toBe(NETWORK.genesis);
    expect(kc("example genesis commitment")).toBe(NETWORK.genesis);
    expect(networkId(NETWORK.chainId, NETWORK.genesis)).toBe(NETWORK.networkId);
    expect(EXAMPLE_DEVNET.networkId).toBe(NETWORK.networkId);
    const digests = txDigests(EXAMPLE_DEVNET.networkId, e1Header, IDENTITY_CREATE, e1Body);
    expect(digests.domainSeparator).toBe(NETWORK.domainSeparator);
  });

  it.each(TAGS)("TAG(%s)", (name, expected) => {
    expect(tag(name)).toBe(expected);
  });
});

describe("P28 §7.10 illustrative VoteSet", () => {
  const p28Body = struct("VoteSetBody", [
    ["decisionId", bytes32],
    ["subjectId", bytes32],
    ["amount", i64],
    ["priorBallotVersion", u64],
  ]);
  const p28Op: OperationSchema = {
    opType: 0x0606,
    opVersion: 1,
    name: "VOTE_SET",
    primaryType: "VoteSet",
    body: p28Body,
  };
  const header = txHeader({
    ...P28_VOTE_SET.header,
    principal: kc(P28_VOTE_SET.header.principalPreimage),
  });
  const body = {
    decisionId: kc(P28_VOTE_SET.body.decisionIdPreimage),
    subjectId: kc(P28_VOTE_SET.body.subjectIdPreimage),
    amount: P28_VOTE_SET.body.amount,
    priorBallotVersion: P28_VOTE_SET.body.priorBallotVersion,
  };

  it("encodes the 15 header fields in 141 bytes", () => {
    const ce = encodeTxHeaderCe(header);
    expect(ce).toHaveLength(141);
    expect(toHex(ce)).toBe(`0x${P28_VOTE_SET.headerCe}`);
  });

  it("matches the published type string and four hashes", () => {
    expect(encodeType(primaryStruct(p28Op))).toBe(P28_VOTE_SET.encodeType);
    const digests = txDigests(EXAMPLE_DEVNET.networkId, header, p28Op, body);
    expect(digests.domainSeparator).toBe(P28_VOTE_SET.domain);
    expect(digests.headerHash).toBe(P28_VOTE_SET.headerHash);
    expect(digests.payloadHash).toBe(P28_VOTE_SET.payloadHash);
    expect(digests.txId).toBe(P28_VOTE_SET.txId);
  });
});

describe("P40 §3.2 type strings and type hashes", () => {
  it.each(OPERATIONS.map((op) => [op.primaryType, op] as const))("%s", (name, op) => {
    const expected = P40_TYPES[name];
    expect(expected).toBeDefined();
    expect(encodeType(op.body)).toBe(expected?.bodyType);
    expect(typeHash(primaryStruct(op))).toBe(expected?.typeHash);
  });
});

describe("P40 §13 worked examples", () => {
  it("derives the example identifiers", () => {
    expect(addressKeyId(`0x${"11".repeat(20)}`)).toBe(WALLET_WORD);
    expect(sessionKeyId).toBe(E2.sessionKeyId);
    expect(objectId(E1.txId, 0, ObjectKind.PRINCIPAL)).toBe(E1.principalId);
    expect(objectId(E2.txId, 0, ObjectKind.CAPABILITY)).toBe(E2.grantId);
    expect(kc("example wave")).toBe(E3.waveId);
    expect(competitionId).toBe(E3.competitionId);
    expect(repCategoryId("Example Category")).toBe(E4.categoryId);
    expect(decisionId(competitionId, DERIVED.decisionTimeMs)).toBe(DERIVED.decisionId);
    expect(ASSET_6529_ID).toBe(DERIVED.asset6529);
  });

  it.each(WORKED.map((c) => [c.vector.label, c] as const))("%s", (_label, c) => {
    const digests = txDigests(EXAMPLE_DEVNET.networkId, c.header, c.op, c.body as never);
    expect(digests.typeHash).toBe(c.vector.typeHash);
    expect(digests.headerHash).toBe(c.vector.headerHash);
    expect(digests.payloadHash).toBe(c.vector.payloadHash);
    expect(digests.txId).toBe(c.vector.txId);
    expect(encodeTxHeaderCe(c.header)).toHaveLength(c.vector.ceHeaderLength);
    expect(toHex(encodeCe(c.op.body, c.body as never))).toBe(c.vector.ceBody);
    const unsigned = encodeUnsignedTx({
      networkId: EXAMPLE_DEVNET.networkId,
      header: c.header,
      op: c.op,
      body: c.body as never,
    });
    expect(toHex(unsigned)).toBe(c.vector.unsigned);
    expect(viemTxId(c.op, c.header, c.body)).toBe(c.vector.txId);
  });

  it.each(WORKED.map((c) => [c.vector.label, c] as const))(
    "%s decodes back to the same transaction",
    (_label, c) => {
      const signature: TxSignature =
        c.header.keyType === 1
          ? { role: 0, keyType: 1, sig: `0x${"11".repeat(64)}1b`, proof: "0x" }
          : { role: 0, keyType: 2, sig: `0x${"22".repeat(64)}`, proof: "0x" };
      const wire = encodeSignedTx({
        networkId: EXAMPLE_DEVNET.networkId,
        header: c.header,
        op: c.op,
        body: c.body as never,
        signatures: [signature],
      });
      expect(toHex(wire).startsWith(c.vector.unsigned)).toBe(true);
      const decoded = decodeSignedTx(wire, { expectedNetworkId: EXAMPLE_DEVNET.networkId });
      expect(decoded.txId).toBe(c.vector.txId);
      expect(decoded.tx.op).toBe(c.op);
      expect(decoded.tx.header).toEqual(c.header);
      expect(decoded.tx.body).toEqual(c.body);
      expect(decoded.tx.signatures).toEqual([signature]);
    }
  );
});

describe("bodies without published digests", () => {
  const header = e3Header;

  it.each(ALL_BODIES.map(([op, body]) => [op.primaryType, op, body] as const))(
    "%s round-trips and agrees with viem's EIP-712",
    (_name, op, body) => {
      const encoded = encodeCe(op.body, body as never);
      expect(decodeCe(op.body, encoded)).toEqual(body);
      const ours = txDigests(EXAMPLE_DEVNET.networkId, header, op, body as never).txId;
      expect(ours).toBe(viemTxId(op, header, body));
    }
  );
});

describe("CE grammar (P28 §2.6)", () => {
  const optionalWord = optional(bytes32);
  const namesSet = set(u16, 4);

  it("encodes absent optionals as 0x00 and refuses a present zero", () => {
    expect(toHex(encodeCe(optionalWord, ZERO32))).toBe("0x00");
    expect(codeOf(() => decodeCe(optionalWord, hexBytes(`0x01${"00".repeat(32)}`)))).toBe(
      ChainResultCode.MALFORMED
    );
    expect(codeOf(() => decodeCe(optionalWord, hexBytes("0x02")))).toBe(ChainResultCode.MALFORMED);
  });

  it("refuses trailing bytes and truncated input", () => {
    expect(codeOf(() => decodeCe(u32, hexBytes("0x0000000100")))).toBe(
      ChainResultCode.TRAILING_BYTES
    );
    expect(codeOf(() => decodeCe(u32, hexBytes("0x000001")))).toBe(ChainResultCode.MALFORMED);
  });

  it("refuses unsorted or duplicate set entries on both sides", () => {
    expect(codeOf(() => encodeCe(namesSet, [2, 1]))).toBe(ChainResultCode.UNSORTED_SET);
    expect(codeOf(() => decodeCe(namesSet, hexBytes("0x0000000200010001")))).toBe(
      ChainResultCode.UNSORTED_SET
    );
    expect(sortSetEntries(u16, [0x0701, 0x0604, 0x0606])).toEqual([0x0604, 0x0606, 0x0701]);
  });

  it("enforces schema maxima", () => {
    expect(codeOf(() => encodeCe(list(u8, 2), [1, 2, 3]))).toBe(ChainResultCode.FIELD_BOUND);
    expect(codeOf(() => decodeCe(list(u8, 2), hexBytes("0x00000003010203")))).toBe(
      ChainResultCode.FIELD_BOUND
    );
    expect(codeOf(() => encodeCe(string(3), "abcd"))).toBe(ChainResultCode.FIELD_BOUND);
    expect(codeOf(() => encodeCe(u8, 256))).toBe(ChainResultCode.FIELD_BOUND);
  });

  it("checks text (P28 §2.5)", () => {
    const text = string(16);
    expect(codeOf(() => decodeCe(text, hexBytes("0x00000002c328")))).toBe(ChainResultCode.BAD_TEXT);
    expect(codeOf(() => decodeCe(text, hexBytes("0x00000003efbbbf")))).toBe(ChainResultCode.BAD_TEXT);
    expect(codeOf(() => encodeCe(text, "a\u0000b"))).toBe(ChainResultCode.BAD_TEXT);
    expect(codeOf(() => encodeCe(text, "﷐"))).toBe(ChainResultCode.BAD_TEXT);
    expect(codeOf(() => encodeCe(text, "\uD800"))).toBe(ChainResultCode.BAD_TEXT);
    expect(decodeCe(text, encodeCe(text, "héllo"))).toBe("héllo");
  });

  it("encodes signed integers as two's complement", () => {
    expect(toHex(encodeCe(i64, -1234n))).toBe("0xfffffffffffffb2e");
    expect(decodeCe(i64, hexBytes("0xfffffffffffffb2e"))).toBe(-1234n);
    expect(decodeCe(bool, hexBytes("0x01"))).toBe(true);
    expect(codeOf(() => decodeCe(bool, hexBytes("0x02")))).toBe(ChainResultCode.MALFORMED);
  });
});

describe("SignedTx admission checks", () => {
  const signedE3 = (): Uint8Array =>
    encodeSignedTx({
      networkId: EXAMPLE_DEVNET.networkId,
      header: e3Header,
      op: VOTE_SET,
      body: e3Body,
      signatures: [{ role: 0, keyType: 2, sig: `0x${"22".repeat(64)}`, proof: "0x" }],
    });

  it("refuses the wrong network, schema and operation", () => {
    const wire = signedE3();
    expect(codeOf(() => decodeSignedTx(wire, { expectedNetworkId: kc("other") }))).toBe(
      ChainResultCode.WRONG_NETWORK
    );
    const wrongSchema = wire.slice();
    wrongSchema[1] = 0x02;
    expect(codeOf(() => decodeSignedTx(wrongSchema))).toBe(ChainResultCode.UNKNOWN_SCHEMA);
    const opOffset = 2 + 2 + 32 + 173;
    const unknownOp = wire.slice();
    unknownOp[opOffset] = 0x07;
    unknownOp[opOffset + 1] = 0x7f;
    expect(codeOf(() => decodeSignedTx(unknownOp))).toBe(ChainResultCode.UNKNOWN_OP);
    const newVersion = wire.slice();
    newVersion[opOffset + 3] = 0x02;
    expect(codeOf(() => decodeSignedTx(newVersion))).toBe(ChainResultCode.UNKNOWN_VERSION);
  });

  it("names the failing body field in the detail (P40 §2.6)", () => {
    const wire = signedE3();
    const truncated = wire.slice(0, 2 + 2 + 32 + 173 + 4 + 40);
    try {
      decodeSignedTx(truncated);
      throw new Error("expected a failure");
    } catch (error) {
      expect(error).toBeInstanceOf(ChainCodecError);
      const failure = error as ChainCodecError;
      expect(failure.code).toBe(ChainResultCode.MALFORMED);
      expect(failure.detail >>> 16).toBe(3);
    }
  });

  it("applies the header rules of P40 §2.1", () => {
    expect(checkHeaderRules(e1Header, IDENTITY_CREATE.opType)).toBeNull();
    expect(checkHeaderRules(e3Header, VOTE_SET.opType)).toBeNull();
    expect(checkHeaderRules(e1Header, VOTE_SET.opType)?.code).toBe(ChainResultCode.PRE_IDENTITY_OP);
    expect(checkHeaderRules({ ...e3Header, authRef: ZERO32 }, VOTE_SET.opType)?.code).toBe(
      ChainResultCode.KEY_TYPE_NOT_ALLOWED
    );
    expect(checkHeaderRules({ ...e3Header, keyType: 5 }, VOTE_SET.opType)?.code).toBe(
      ChainResultCode.KEY_TYPE_NOT_ALLOWED
    );
    expect(checkHeaderRules({ ...e3Header, nonceLane: 16 }, VOTE_SET.opType)?.detail).toBe(
      (0x106 << 16) >>> 0
    );
    expect(
      checkHeaderRules({ ...e3Header, expiresAt: e3Header.notBefore + DAY_MS + 1n }, VOTE_SET.opType)
        ?.code
    ).toBe(ChainResultCode.VALIDITY_TOO_LONG);
    expect(checkHeaderRules({ ...e3Header, feeMode: 1 }, VOTE_SET.opType)?.code).toBe(
      ChainResultCode.HEADER_RULE
    );
    expect(checkHeaderRules({ ...e1Header, feeMode: 3 }, IDENTITY_CREATE.opType)?.code).toBe(
      ChainResultCode.FEE_MODE_NOT_ALLOWED
    );
    expect(checkHeaderRules({ ...e3Header, ethRefNumber: 1n }, VOTE_SET.opType)?.code).toBe(
      ChainResultCode.HEADER_RULE
    );
  });

  it("applies the signature-list rules", () => {
    const good: TxSignature = { role: 0, keyType: 1, sig: `0x${"11".repeat(64)}1b`, proof: "0x" };
    expect(checkSignatureList(e1Header, [good])).toBeNull();
    expect(checkSignatureList(e1Header, [])?.code).toBe(ChainResultCode.SIGNATURE_LIST);
    expect(checkSignatureList(e1Header, [{ ...good, sig: `0x${"11".repeat(64)}` }])?.code).toBe(
      ChainResultCode.SIGNATURE_LIST
    );
    expect(checkSignatureList(e1Header, [{ ...good, sig: `0x${"11".repeat(64)}1d` }])?.code).toBe(
      ChainResultCode.NONCANONICAL_SIGNATURE
    );
    const highS = `0x${"11".repeat(32)}${"ff".repeat(32)}1b` as Hex;
    expect(checkSignatureList(e1Header, [{ ...good, sig: highS }])?.code).toBe(
      ChainResultCode.NONCANONICAL_SIGNATURE
    );
    expect(checkSignatureList(e1Header, [good, { ...good, role: 1 }])?.code).toBe(
      ChainResultCode.SIGNATURE_LIST
    );
  });
});

describe("P40 schema rules", () => {
  const ctx = { principal, headerNotBefore: NOT_BEFORE_MS };

  it.each(ALL_BODIES.map(([op, body]) => [op.primaryType, op, body] as const))(
    "accepts the %s example",
    (_name, op, body) => {
      expect(checkBodyRules(op, body, ctx)).toBeNull();
    }
  );

  it("checks closed alphabets and CIDs (P40 §5.2-§5.3)", () => {
    expect(isHandle("example1")).toBe(true);
    expect(isHandle("Ex")).toBe(false);
    expect(isRepCategoryName("Example Category")).toBe(true);
    expect(isRepCategoryName("two  spaces")).toBe(false);
    expect(isRepCategoryName(" lead")).toBe(false);
    expect(isRepCategoryName("trail ")).toBe(false);
    expect(isPhase1Cid(e1Body.profileDocCid)).toBe(true);
    expect(isPhase1Cid(`0x0155122000`)).toBe(false);
  });

  it("refuses bodies a node would refuse", () => {
    const vote = (patch: Partial<VoteSetBody>) => checkBodyRules(VOTE_SET, { ...e3Body, ...patch }, ctx);
    expect(vote({ budgetScope: 3 })?.code).toBe(ChainResultCode.BAD_ENUM);
    expect(vote({ amount: MAX_VOTE_ABS + 1n })?.code).toBe(ChainResultCode.FIELD_BOUND);
    expect(vote({ expectedConfigVersion: 0 })?.detail).toBe((2 << 16) >>> 0);

    const grant = (patch: Partial<CapabilityGrantBody>) =>
      checkBodyRules(CAPABILITY_GRANT, { ...e2Body, ...patch }, ctx);
    expect(grant({ ops: [0x0101] })?.code).toBe(ChainResultCode.FIELD_RULE);
    expect(grant({ ops: [0x0c01] })?.code).toBe(ChainResultCode.BAD_ENUM);
    expect(grant({ grantee: kc("not the key") })?.code).toBe(ChainResultCode.FIELD_RULE);
    expect(grant({ acceptMode: 2 })?.code).toBe(ChainResultCode.BAD_ENUM);
    expect(grant({ expiresAt: NOT_BEFORE_MS + 366n * DAY_MS })?.code).toBe(
      ChainResultCode.FIELD_BOUND
    );

    const rating = (patch: Partial<RatingSetBody>) =>
      checkBodyRules(RATING_SET, { ...e4Body, ...patch }, ctx);
    expect(rating({ target: principal })?.code).toBe(ChainResultCode.FIELD_RULE);
    expect(rating({ categoryName: "Other Category" })?.code).toBe(ChainResultCode.FIELD_RULE);
    expect(rating({ matter: 2 })?.code).toBe(ChainResultCode.FIELD_RULE);

    const competition = (patch: Partial<CompetitionCreateBody["competition"]>) =>
      checkBodyRules(
        COMPETITION_CREATE,
        { ...competitionBody, competition: { ...competitionBody.competition, ...patch } },
        ctx
      );
    expect(competition({ kind: 2 })?.detail).toBe(((6 << 16) | 1) >>> 0);
    expect(competition({ gaps: [] })?.code).toBe(ChainResultCode.FIELD_RULE);
    expect(competition({ winnersPerDecision: 17 })?.code).toBe(ChainResultCode.FIELD_BOUND);

    expect(checkBodyRules(SUBMISSION_CREATE, { ...submissionBody, contentCid: "0x" }, ctx)?.code).toBe(
      ChainResultCode.BAD_CID
    );
    expect(
      checkBodyRules(WAVE_CREATE, { ...waveBody, readGroup: { groupId: ZERO32, version: 1 } }, ctx)
        ?.code
    ).toBe(ChainResultCode.FIELD_RULE);
    expect(checkBodyRules(IDENTITY_CREATE, { ...e1Body, handle: "Bad Handle" }, ctx)?.code).toBe(
      ChainResultCode.BAD_TEXT
    );
  });

  it("classifies result codes by P40 §4.1 range", () => {
    expect(classifyResultCode(0)).toBe("ok");
    expect(classifyResultCode(0x0301)).toBe("inadmissible");
    expect(classifyResultCode(0x0383)).toBe("mempool-policy");
    expect(classifyResultCode(0x2603)).toBe("failed");
    expect(classifyResultCode(0xf001)).toBe("system-fault");
  });
});

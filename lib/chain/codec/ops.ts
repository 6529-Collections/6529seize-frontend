/**
 * P40 Phase 1 operation bodies: the seven this client writes first.
 *
 * Source: `design/phase1-operation-schemas.md` (P40, a proposal, updated
 * 2026-10-30): §3.2 operation codes, §5.1 shared structs, §6.1
 * IDENTITY_CREATE, §6.6 CAPABILITY_GRANT, §7.5 WAVE_CREATE, §8.4
 * SUBMISSION_CREATE, §8.6 VOTE_SET, §8.7 COMPETITION_CREATE, §9.1
 * RATING_SET. Field order, CE types and limits are copied from the design
 * and its generator `design/evidence/operation-vectors.py`.
 *
 * Every body is versioned: opVersion 1 uses `<Name>` / `<Name>Body`, and a
 * layout change is a new opVersion with a renamed type (P40 §3.7 rules 1-2).
 * The other 24 envelope operations of P40 §3.2 are named in `OpType` but
 * have no schema here yet.
 */
import type { StructType, ValueOf } from "./schema";
import {
  bool,
  bytes,
  bytes16,
  bytes32,
  cidBytes,
  i64,
  list,
  optional,
  set,
  string,
  struct,
  u128,
  u16,
  u32,
  u64,
  u8,
} from "./schema";

/** P40 §3.2: every Phase 1 operation code, `(module << 8) | index`. */
export const OpType = {
  IDENTITY_CREATE: 0x0101,
  PROFILE_REPLACE: 0x0102,
  HANDLE_CLAIM: 0x0103,
  ACCOUNT_CONTROL_CHANGE: 0x0104,
  NONCE_SKIP: 0x0201,
  CAPABILITY_GRANT: 0x0301,
  CAPABILITY_ACCEPT: 0x0302,
  CAPABILITY_REVOKE: 0x0303,
  GROUP_CREATE: 0x0401,
  GROUP_REPLACE: 0x0402,
  ROLE_GRANT: 0x0403,
  ROLE_REVOKE: 0x0404,
  WAVE_CREATE: 0x0501,
  WAVE_POLICY_REPLACE: 0x0502,
  WAVE_CLOSE: 0x0503,
  MODERATION_DECIDE: 0x0504,
  WAVE_PAUSE_SET: 0x0601,
  WAVE_PAUSE_REMOVE: 0x0602,
  DECISION_OPEN: 0x0603,
  SUBMISSION_CREATE: 0x0604,
  SUBMISSION_WITHDRAW: 0x0605,
  VOTE_SET: 0x0606,
  COMPETITION_CREATE: 0x0610,
  COMPETITION_ARCHIVE: 0x0611,
  RATING_SET: 0x0701,
  BALANCE_TRANSFER: 0x0901,
  FEE_SPONSOR_SET: 0x0a01,
  FEE_SPONSOR_REVOKE: 0x0a02,
  VALIDATOR_ENROLL: 0x0c01,
  VALIDATOR_CONFIGURE: 0x0c02,
  VALIDATOR_EXIT: 0x0c03,
  MISBEHAVIOR_SUBMIT: 0x0c04,
  PROTOCOL_UPGRADE_SCHEDULE: 0x0e01,
  PROTOCOL_UPGRADE_CANCEL: 0x0e02,
} as const;

export type OpTypeName = keyof typeof OpType;

/** P40 §3.3: the discussion right a KEY grant may list (never a transaction). */
export const DISCUSS_PSEUDO_OP = 0x05f0;

// ---------------------------------------------------------------- P40 §5.1

export const GROUP_REF = struct("GroupRef", [
  ["groupId", bytes32],
  ["version", u32],
]);

export const SCOPE = struct("Scope", [
  ["objectKind", u16],
  ["objectId", bytes32],
]);

export const BUDGET_LIMIT = struct("BudgetLimit", [
  ["kind", u8],
  ["assetId", bytes32],
  ["limit", u128],
]);

export const COMPETITION_CONFIG = struct("CompetitionConfig", [
  ["kind", u8],
  ["creditSource", u8],
  ["creditParam", bytes32],
  ["creditor", optional(bytes32)],
  ["creditScope", u8],
  ["creditMode", u8],
  ["minVote", i64],
  ["maxVote", i64],
  ["perEntryCap", u64],
  ["participationStart", u64],
  ["participationEnd", u64],
  ["votingStart", u64],
  ["votingEnd", u64],
  ["firstDecision", u64],
  ["gaps", list(u64, 16)],
  ["rolling", bool],
  ["scheduleEnd", u64],
  ["timeLock", u64],
  ["winnersPerDecision", u8],
  ["maxEntriesPerAuthor", u8],
  ["outcomeTemplateHash", bytes32],
]);

// ------------------------------------------------------------- the bodies

/** P40 §6.1, opVersion 1. */
export const IDENTITY_CREATE_BODY = struct("IdentityCreateBody", [
  ["legacyId", optional(bytes16)],
  ["handle", string(15)],
  ["profileDocCid", cidBytes],
]);

/** P40 §6.6, opVersion 1. */
export const CAPABILITY_GRANT_BODY = struct("CapabilityGrantBody", [
  ["granteeKind", u8],
  ["grantee", bytes32],
  ["granteeKeyType", u8],
  ["granteePublicKey", bytes(128)],
  ["ops", set(u16, 32)],
  ["flags", u16],
  ["scopes", set(SCOPE, 8)],
  ["budgets", set(BUDGET_LIMIT, 4)],
  ["notBefore", u64],
  ["expiresAt", u64],
  ["acceptMode", u8],
]);

/** P40 §7.5, opVersion 1 (D143: a wave is a chat hub). */
export const WAVE_CREATE_BODY = struct("WaveCreateBody", [
  ["waveType", u8],
  ["controller", optional(bytes32)],
  ["readGroup", GROUP_REF],
  ["postGroup", GROUP_REF],
  ["adminGroup", GROUP_REF],
  ["metadataCid", cidBytes],
]);

/** P40 §8.4, opVersion 1. */
export const SUBMISSION_CREATE_BODY = struct("SubmissionCreateBody", [
  ["competitionId", bytes32],
  ["expectedConfigVersion", u32],
  ["manifestHash", bytes32],
  ["contentCid", cidBytes],
]);

/** P40 §8.6, opVersion 1. */
export const VOTE_SET_BODY = struct("VoteSetBody", [
  ["competitionId", bytes32],
  ["expectedConfigVersion", u32],
  ["entryId", bytes32],
  ["amount", i64],
  ["priorVoteVersion", u64],
  ["budgetScope", u8],
]);

/** P40 §8.7, opVersion 1. */
export const COMPETITION_CREATE_BODY = struct("CompetitionCreateBody", [
  ["waveId", bytes32],
  ["expectedVersion", u32],
  ["submitGroup", GROUP_REF],
  ["voteGroup", GROUP_REF],
  ["metadataCid", cidBytes],
  ["competition", COMPETITION_CONFIG],
]);

/** P40 §9.1, opVersion 1. */
export const RATING_SET_BODY = struct("RatingSetBody", [
  ["matter", u8],
  ["targetKind", u8],
  ["target", bytes32],
  ["category", bytes32],
  ["categoryName", string(100)],
  ["value", i64],
  ["priorVersion", u64],
]);

export type GroupRef = ValueOf<typeof GROUP_REF>;
export type Scope = ValueOf<typeof SCOPE>;
export type BudgetLimit = ValueOf<typeof BUDGET_LIMIT>;
export type CompetitionConfig = ValueOf<typeof COMPETITION_CONFIG>;
export type IdentityCreateBody = ValueOf<typeof IDENTITY_CREATE_BODY>;
export type CapabilityGrantBody = ValueOf<typeof CAPABILITY_GRANT_BODY>;
export type WaveCreateBody = ValueOf<typeof WAVE_CREATE_BODY>;
export type SubmissionCreateBody = ValueOf<typeof SUBMISSION_CREATE_BODY>;
export type VoteSetBody = ValueOf<typeof VOTE_SET_BODY>;
export type CompetitionCreateBody = ValueOf<typeof COMPETITION_CREATE_BODY>;
export type RatingSetBody = ValueOf<typeof RATING_SET_BODY>;

/** One envelope operation at one opVersion. */
export interface OperationSchema<B extends StructType = StructType> {
  readonly opType: number;
  readonly opVersion: number;
  readonly name: OpTypeName;
  /** EIP-712 primary type, `<Name>(TxHeader header,<Name>Body body)`. */
  readonly primaryType: string;
  readonly body: B;
}

function operation<const B extends StructType>(
  name: OpTypeName,
  primaryType: string,
  body: B
): OperationSchema<B> {
  return { opType: OpType[name], opVersion: 1, name, primaryType, body };
}

export const IDENTITY_CREATE = operation("IDENTITY_CREATE", "IdentityCreate", IDENTITY_CREATE_BODY);
export const CAPABILITY_GRANT = operation(
  "CAPABILITY_GRANT",
  "CapabilityGrant",
  CAPABILITY_GRANT_BODY
);
export const WAVE_CREATE = operation("WAVE_CREATE", "WaveCreate", WAVE_CREATE_BODY);
export const SUBMISSION_CREATE = operation(
  "SUBMISSION_CREATE",
  "SubmissionCreate",
  SUBMISSION_CREATE_BODY
);
export const VOTE_SET = operation("VOTE_SET", "VoteSet", VOTE_SET_BODY);
export const COMPETITION_CREATE = operation(
  "COMPETITION_CREATE",
  "CompetitionCreate",
  COMPETITION_CREATE_BODY
);
export const RATING_SET = operation("RATING_SET", "RatingSet", RATING_SET_BODY);

/** The operations this client can encode and decode, by (opType, opVersion). */
export const OPERATIONS: readonly OperationSchema[] = [
  IDENTITY_CREATE,
  CAPABILITY_GRANT,
  WAVE_CREATE,
  SUBMISSION_CREATE,
  VOTE_SET,
  COMPETITION_CREATE,
  RATING_SET,
];

export function findOperation(opType: number, opVersion: number): OperationSchema | null {
  return (
    OPERATIONS.find(
      (op) => op.opType === opType && op.opVersion === opVersion
    ) ?? null
  );
}

export function isKnownOpType(opType: number): boolean {
  return Object.values(OpType).some((code) => code === opType);
}

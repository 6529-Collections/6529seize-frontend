/**
 * P40 schema rules for the seven bodies in `ops.ts`.
 *
 * Schema rules read only the bytes, the envelope and the signed rule
 * version's Params; a failure is inadmissible and free (P40 §1.3). A client
 * checks them before asking a wallet to sign, so a user never signs a
 * transaction every node refuses. Handler checks, which read state, are
 * not here.
 *
 * Sources: P40 §5.1-§5.3 and §5.7, and the field tables of §6.1, §6.6,
 * §7.5, §8.4, §8.6, §8.7 and §9.1. Codes: 0x0109 bounds, 0x010A undefined
 * or reserved enumeration values, 0x010B text, 0x010D cross-field rules,
 * 0x0111 CIDs (P40 §4.2). Where a table names no code, the closest of
 * those is used and noted.
 */
import type { Hex } from "viem";

import { hexBytes, isZeroValue } from "./ce";
import { ChainCodecError, ChainResultCode, resultDetail } from "./errors";
import { derivedId, ObjectKind, publicKeyId, repCategoryId } from "./ids";
import {
  DISCUSS_PSEUDO_OP,
  OpType,
  type BudgetLimit,
  type CapabilityGrantBody,
  type CompetitionConfig,
  type CompetitionCreateBody,
  type GroupRef,
  type IdentityCreateBody,
  type OperationSchema,
  type RatingSetBody,
  type Scope,
  type SubmissionCreateBody,
  type VoteSetBody,
  type WaveCreateBody,
} from "./ops";
import { bytes16, bytes32 } from "./schema";

/** P40 §5.7 Params used by these rules ([E] values may change). */
export const PHASE1_PARAMS = {
  MAX_VOTE_ABS: 2n ** 53n - 1n,
  MAX_SESSION_LIFETIME_MS: 365n * 86_400_000n,
  MIN_GAP_MS: 3_600_000n,
  MAX_GAP_MS: 31_536_000_000n,
  MAX_TIME_LOCK_MS: 2_592_000_000n,
  MAX_ENTRIES_PER_AUTHOR: 64,
} as const;

/** P31 0x0902 as P40 §3.5 states it: $6529 is `DerivedId(0, 0, 0x0902)`. */
export const ASSET_6529_ID: Hex = derivedId(`0x${"00".repeat(32)}`, 0n, ObjectKind.ASSET);

export interface BodyRuleContext {
  /** The envelope principal p. */
  readonly principal: Hex;
  /** The envelope's notBefore, for grants whose own notBefore is 0. */
  readonly headerNotBefore: bigint;
}

type Check = () => ChainCodecError | null;

const ENVELOPE_OPS: ReadonlySet<number> = new Set(
  Object.values(OpType).filter(
    (code) =>
      code !== OpType.VALIDATOR_ENROLL &&
      code !== OpType.VALIDATOR_CONFIGURE &&
      code !== OpType.VALIDATOR_EXIT
  )
);

const OBJECT_KINDS: ReadonlySet<number> = new Set(Object.values(ObjectKind));

function firstFailure(checks: readonly Check[]): ChainCodecError | null {
  for (const check of checks) {
    const problem = check();
    if (problem !== null) {
      return problem;
    }
  }
  return null;
}

function failure(code: number, reason: string, field: number, item = 0): ChainCodecError {
  return new ChainCodecError(code, reason, ["body"], resultDetail(field, item));
}

const isZero32 = (value: Hex): boolean => isZeroValue(bytes32, value);
const absBig = (value: bigint): bigint => (value < 0n ? -value : value);

/** P40 §5.3: 3-15 bytes of `[a-z0-9_]`, already lowercased. */
export function isHandle(value: string): boolean {
  return /^[a-z0-9_]{3,15}$/.test(value);
}

function isCategoryChar(char: string): boolean {
  return /^[A-Za-z0-9&'.\-_]$/.test(char);
}

/**
 * P40 §5.3: 1-100 bytes of ASCII letters, digits, space and `& ' . - _`;
 * starts with a letter or digit; no leading, trailing or doubled space.
 */
export function isRepCategoryName(value: string): boolean {
  if (value.length < 1 || value.length > 100 || !/^[A-Za-z0-9]/.test(value)) {
    return false;
  }
  if (value.endsWith(" ") || value.includes("  ")) {
    return false;
  }
  return [...value].every((char) => char === " " || isCategoryChar(char));
}

/**
 * P40 §5.2: a binary CIDv1, a one- or two-byte codec varint, then the
 * sha2-256 multihash 0x12 0x20 and its 32 bytes (36 or 37 bytes in all).
 */
export function isPhase1Cid(value: Hex): boolean {
  const raw = hexBytes(value);
  if ((raw.length !== 36 && raw.length !== 37) || raw[0] !== 0x01) {
    return false;
  }
  if (raw[raw.length - 34] !== 0x12 || raw[raw.length - 33] !== 0x20) {
    return false;
  }
  const first = raw[1] ?? 0;
  if (raw.length === 36) {
    return (first & 0x80) === 0;
  }
  return (first & 0x80) !== 0 && ((raw[2] ?? 0) & 0x80) === 0;
}

function cidCheck(value: Hex, field: number, required: boolean): Check {
  return () => {
    if (value === "0x") {
      return required ? failure(ChainResultCode.BAD_CID, "a CID is required", field) : null;
    }
    return isPhase1Cid(value) ? null : failure(ChainResultCode.BAD_CID, "not a Phase 1 CID", field);
  };
}

function groupRefCheck(ref: GroupRef, field: number): Check {
  return () =>
    isZero32(ref.groupId) && ref.version !== 0
      ? failure(ChainResultCode.FIELD_RULE, "no group means version 0", field)
      : null;
}

function atLeastOne(value: number, field: number): Check {
  return () =>
    value >= 1 ? null : failure(ChainResultCode.FIELD_BOUND, "must be at least 1", field);
}

function voteAbs(value: bigint, field: number, item = 0): Check {
  return () =>
    absBig(value) <= PHASE1_PARAMS.MAX_VOTE_ABS
      ? null
      : failure(ChainResultCode.FIELD_BOUND, "above MAX_VOTE_ABS", field, item);
}

function oneOf(value: number, allowed: readonly number[], field: number, item = 0): Check {
  return () =>
    allowed.includes(value)
      ? null
      : failure(ChainResultCode.BAD_ENUM, "undefined or reserved value", field, item);
}

// ------------------------------------------------------------ §6.1

function identityCreateRules(body: IdentityCreateBody): ChainCodecError | null {
  return firstFailure([
    () =>
      body.handle !== "" && !isHandle(body.handle)
        ? failure(ChainResultCode.BAD_TEXT, "handle alphabet", 2)
        : null,
    () =>
      !isZeroValue(bytes16, body.legacyId) && body.handle !== ""
        ? failure(ChainResultCode.FIELD_RULE, "adoption claims the reserved handle", 2)
        : null,
    cidCheck(body.profileDocCid, 3, false),
  ]);
}

// ------------------------------------------------------------ §6.6

const KEY_GRANTEE = 1;
const PRINCIPAL_GRANTEE = 2;
const PROXY_USE_FLAG = 1;
const FORBIDDEN_GRANT_OPS: ReadonlySet<number> = new Set([
  OpType.IDENTITY_CREATE,
  OpType.ACCOUNT_CONTROL_CHANGE,
  OpType.CAPABILITY_GRANT,
  OpType.NONCE_SKIP,
]);

function granteeKeyChecks(body: CapabilityGrantBody, ctx: BodyRuleContext): Check[] {
  const isKey = body.granteeKind === KEY_GRANTEE;
  return [
    oneOf(body.granteeKind, [KEY_GRANTEE, PRINCIPAL_GRANTEE], 1),
    () =>
      !isKey && body.grantee.toLowerCase() === ctx.principal.toLowerCase()
        ? failure(ChainResultCode.FIELD_RULE, "a proxy grant names another principal", 2)
        : null,
    isKey ? oneOf(body.granteeKeyType, [1, 2], 3) : oneOf(body.granteeKeyType, [0], 3),
    () => granteePublicKeyRule(body),
  ];
}

function granteePublicKeyRule(body: CapabilityGrantBody): ChainCodecError | null {
  const keyBytes = (body.granteePublicKey.length - 2) / 2;
  if (body.granteeKind !== KEY_GRANTEE || body.granteeKeyType === 1) {
    const addressOk =
      body.granteeKind !== KEY_GRANTEE || /^0x0{24}[0-9a-f]{40}$/i.test(body.grantee);
    return keyBytes === 0 && addressOk
      ? null
      : failure(ChainResultCode.FIELD_RULE, "no public key; a key grantee is an address word", 4);
  }
  if (keyBytes !== 32) {
    return failure(ChainResultCode.FIELD_RULE, "an Ed25519 key is 32 bytes", 4);
  }
  return publicKeyId(2, body.granteePublicKey) === body.grantee.toLowerCase()
    ? null
    : failure(ChainResultCode.FIELD_RULE, "grantee must be the key's keyId", 2);
}

function grantOpsChecks(body: CapabilityGrantBody): Check[] {
  const hasAssetBudget = body.budgets.some((b) => b.kind === 3);
  return [
    () =>
      body.ops.length >= 1 ? null : failure(ChainResultCode.FIELD_BOUND, "at least one op", 5),
    ...body.ops.map((op, index): Check => () => {
      if (op === DISCUSS_PSEUDO_OP) {
        return body.granteeKind === KEY_GRANTEE
          ? null
          : failure(ChainResultCode.FIELD_RULE, "DISCUSS is for KEY grants", 5, index + 1);
      }
      if (!ENVELOPE_OPS.has(op)) {
        return failure(ChainResultCode.BAD_ENUM, "not an envelope operation", 5, index + 1);
      }
      if (FORBIDDEN_GRANT_OPS.has(op)) {
        return failure(ChainResultCode.FIELD_RULE, "wallet-only operation", 5, index + 1);
      }
      return op === OpType.BALANCE_TRANSFER && !hasAssetBudget
        ? failure(ChainResultCode.FIELD_RULE, "BALANCE_TRANSFER needs an ASSET budget", 5, index + 1)
        : null;
    }),
  ];
}

function scopeCheck(scope: Scope, index: number): Check {
  return () => {
    if (!OBJECT_KINDS.has(scope.objectKind)) {
      return failure(ChainResultCode.BAD_ENUM, "unknown object kind", 7, index + 1);
    }
    return isZero32(scope.objectId)
      ? failure(ChainResultCode.FIELD_RULE, "scope objectId is non-zero", 7, index + 1)
      : null;
  };
}

function budgetAssetOk(budget: BudgetLimit): boolean {
  const asset = budget.assetId.toLowerCase();
  if (budget.kind === 1 || budget.kind === 2) {
    return isZero32(budget.assetId);
  }
  if (budget.kind === 3) {
    return asset === ASSET_6529_ID;
  }
  return isZero32(budget.assetId) || asset === ASSET_6529_ID;
}

function budgetChecks(budgets: readonly BudgetLimit[]): Check[] {
  return budgets.map((budget, index): Check => () => {
    // FEE_CYCLE (kind 5) is reserved until a rule version enables it.
    if (budget.kind < 1 || budget.kind > 4) {
      return failure(ChainResultCode.BAD_ENUM, "budget kind 1-4", 8, index + 1);
    }
    if (budget.limit <= 0n || !budgetAssetOk(budget)) {
      return failure(ChainResultCode.FIELD_RULE, "budget asset or limit", 8, index + 1);
    }
    const duplicate = budgets.some(
      (other, j) =>
        j !== index &&
        other.kind === budget.kind &&
        other.assetId.toLowerCase() === budget.assetId.toLowerCase()
    );
    return duplicate
      ? failure(ChainResultCode.FIELD_RULE, "(kind, assetId) must be unique", 8, index + 1)
      : null;
  });
}

function grantWindowChecks(body: CapabilityGrantBody, ctx: BodyRuleContext): Check[] {
  const isKey = body.granteeKind === KEY_GRANTEE;
  const start = body.notBefore === 0n ? ctx.headerNotBefore : body.notBefore;
  return [
    () =>
      // Bits 1-2 wait on WM1 (keyType-6 grantees); other bits are zero.
      (body.flags & ~PROXY_USE_FLAG) !== 0 || (!isKey && body.flags !== 0)
        ? failure(ChainResultCode.BAD_ENUM, "undefined or reserved flag", 6)
        : null,
    () =>
      body.expiresAt > body.notBefore
        ? null
        : failure(ChainResultCode.FIELD_RULE, "expiresAt after notBefore", 10),
    () =>
      isKey && body.expiresAt - start > PHASE1_PARAMS.MAX_SESSION_LIFETIME_MS
        ? failure(ChainResultCode.FIELD_BOUND, "above MAX_SESSION_LIFETIME", 10)
        : null,
    oneOf(body.acceptMode, isKey ? [1] : [1, 2], 11),
  ];
}

function capabilityGrantRules(
  body: CapabilityGrantBody,
  ctx: BodyRuleContext
): ChainCodecError | null {
  return firstFailure([
    ...granteeKeyChecks(body, ctx),
    ...grantOpsChecks(body),
    ...body.scopes.map(scopeCheck),
    ...budgetChecks(body.budgets),
    ...grantWindowChecks(body, ctx),
  ]);
}

// ------------------------------------------------------------ §7.5, §8.4, §8.6

function waveCreateRules(body: WaveCreateBody): ChainCodecError | null {
  return firstFailure([
    oneOf(body.waveType, [1], 1),
    groupRefCheck(body.readGroup, 3),
    groupRefCheck(body.postGroup, 4),
    groupRefCheck(body.adminGroup, 5),
    cidCheck(body.metadataCid, 6, false),
  ]);
}

function submissionCreateRules(body: SubmissionCreateBody): ChainCodecError | null {
  return firstFailure([
    atLeastOne(body.expectedConfigVersion, 2),
    () =>
      isZero32(body.manifestHash)
        ? failure(ChainResultCode.FIELD_RULE, "manifestHash is a non-zero commitment", 3)
        : null,
    cidCheck(body.contentCid, 4, true),
  ]);
}

function voteSetRules(body: VoteSetBody): ChainCodecError | null {
  return firstFailure([
    atLeastOne(body.expectedConfigVersion, 2),
    voteAbs(body.amount, 4),
    oneOf(body.budgetScope, [1, 2], 6),
  ]);
}

// ------------------------------------------------------------ §8.7

const CONFIG_FIELD = 6;

function configFailure(code: number, reason: string, configField: number): ChainCodecError {
  return failure(code, reason, CONFIG_FIELD, configField);
}

function periodCheck(start: bigint, end: bigint, configField: number): Check {
  return () =>
    end !== 0n && end < start
      ? configFailure(ChainResultCode.FIELD_RULE, "end 0 or at least start", configField)
      : null;
}

function configCreditChecks(c: CompetitionConfig): Check[] {
  const isRep = c.creditSource === 4;
  return [
    oneOf(c.kind, [1], CONFIG_FIELD, 1),
    oneOf(c.creditSource, [1, 4], CONFIG_FIELD, 2),
    () =>
      isRep === isZero32(c.creditParam)
        ? configFailure(ChainResultCode.FIELD_RULE, "TDH: zero; REP: a categoryId", 3)
        : null,
    () =>
      !isRep && !isZero32(c.creditor)
        ? configFailure(ChainResultCode.FIELD_RULE, "creditor is REP only", 4)
        : null,
    oneOf(c.creditScope, [1, 2], CONFIG_FIELD, 5),
    oneOf(c.creditMode, [1], CONFIG_FIELD, 6),
  ];
}

function configVoteChecks(c: CompetitionConfig): Check[] {
  const max = PHASE1_PARAMS.MAX_VOTE_ABS;
  return [
    () =>
      c.minVote < -max || c.minVote > 0n
        ? configFailure(ChainResultCode.FIELD_BOUND, "-MAX_VOTE_ABS <= minVote <= 0", 7)
        : null,
    () =>
      c.maxVote <= 0n || c.maxVote > max
        ? configFailure(ChainResultCode.FIELD_BOUND, "0 < maxVote <= MAX_VOTE_ABS", 8)
        : null,
    () =>
      c.perEntryCap > max
        ? configFailure(ChainResultCode.FIELD_BOUND, "perEntryCap <= MAX_VOTE_ABS", 9)
        : null,
  ];
}

function configScheduleChecks(c: CompetitionConfig): Check[] {
  const { MIN_GAP_MS, MAX_GAP_MS, MAX_TIME_LOCK_MS, MAX_ENTRIES_PER_AUTHOR } = PHASE1_PARAMS;
  return [
    periodCheck(c.participationStart, c.participationEnd, 11),
    periodCheck(c.votingStart, c.votingEnd, 13),
    () =>
      c.firstDecision > 0n
        ? null
        : configFailure(ChainResultCode.FIELD_BOUND, "firstDecision > 0", 14),
    () =>
      c.gaps.some((gap) => gap < MIN_GAP_MS || gap > MAX_GAP_MS)
        ? configFailure(ChainResultCode.FIELD_BOUND, "each gap within MIN_GAP..MAX_GAP", 15)
        : null,
    () =>
      c.rolling && c.gaps.length === 0
        ? configFailure(ChainResultCode.FIELD_RULE, "a rolling series needs a gap", 15)
        : null,
    () =>
      c.scheduleEnd !== 0n && c.scheduleEnd <= c.firstDecision
        ? configFailure(ChainResultCode.FIELD_RULE, "scheduleEnd after firstDecision", 17)
        : null,
    () =>
      c.timeLock > MAX_TIME_LOCK_MS
        ? configFailure(ChainResultCode.FIELD_BOUND, "timeLock above MAX_TIME_LOCK", 18)
        : null,
    () =>
      c.winnersPerDecision < 1 || c.winnersPerDecision > 16
        ? configFailure(ChainResultCode.FIELD_BOUND, "1 to 16 winners", 19)
        : null,
    () =>
      c.maxEntriesPerAuthor < 1 || c.maxEntriesPerAuthor > MAX_ENTRIES_PER_AUTHOR
        ? configFailure(ChainResultCode.FIELD_BOUND, "maxEntriesPerAuthor bound", 20)
        : null,
  ];
}

function competitionCreateRules(body: CompetitionCreateBody): ChainCodecError | null {
  return firstFailure([
    atLeastOne(body.expectedVersion, 2),
    groupRefCheck(body.submitGroup, 3),
    groupRefCheck(body.voteGroup, 4),
    cidCheck(body.metadataCid, 5, false),
    ...configCreditChecks(body.competition),
    ...configVoteChecks(body.competition),
    ...configScheduleChecks(body.competition),
  ]);
}

// ------------------------------------------------------------ §9.1

function ratingCategoryRule(body: RatingSetBody): ChainCodecError | null {
  if (body.matter === 2) {
    return isZero32(body.category) && body.categoryName === ""
      ? null
      : failure(ChainResultCode.FIELD_RULE, "NIC has no category", 4);
  }
  if (isZero32(body.category)) {
    return failure(ChainResultCode.FIELD_RULE, "REP names a categoryId", 4);
  }
  if (body.categoryName === "") {
    return null;
  }
  if (!isRepCategoryName(body.categoryName)) {
    return failure(ChainResultCode.BAD_TEXT, "category name alphabet", 5);
  }
  return repCategoryId(body.categoryName) === body.category.toLowerCase()
    ? null
    : failure(ChainResultCode.FIELD_RULE, "categoryName must hash to category", 5);
}

function ratingSetRules(body: RatingSetBody, ctx: BodyRuleContext): ChainCodecError | null {
  return firstFailure([
    oneOf(body.matter, [1, 2], 1),
    oneOf(body.targetKind, [1, 2], 2),
    () =>
      body.targetKind === 2 && body.matter !== 1
        ? failure(ChainResultCode.FIELD_RULE, "WAVE targets take REP only", 2)
        : null,
    () =>
      isZero32(body.target) ||
      (body.targetKind === 1 && body.target.toLowerCase() === ctx.principal.toLowerCase())
        ? failure(ChainResultCode.FIELD_RULE, "target is non-zero and not p", 3)
        : null,
    () => ratingCategoryRule(body),
    voteAbs(body.value, 6),
  ]);
}

/**
 * The first P40 schema rule `body` breaks, or null. The body must already
 * have the operation's CE shape (it came from the codec or type-checked).
 */
export function checkBodyRules(
  op: OperationSchema,
  body: unknown,
  ctx: BodyRuleContext
): ChainCodecError | null {
  switch (op.opType) {
    case OpType.IDENTITY_CREATE:
      return identityCreateRules(body as IdentityCreateBody);
    case OpType.CAPABILITY_GRANT:
      return capabilityGrantRules(body as CapabilityGrantBody, ctx);
    case OpType.WAVE_CREATE:
      return waveCreateRules(body as WaveCreateBody);
    case OpType.SUBMISSION_CREATE:
      return submissionCreateRules(body as SubmissionCreateBody);
    case OpType.VOTE_SET:
      return voteSetRules(body as VoteSetBody);
    case OpType.COMPETITION_CREATE:
      return competitionCreateRules(body as CompetitionCreateBody);
    case OpType.RATING_SET:
      return ratingSetRules(body as RatingSetBody, ctx);
    default:
      return new ChainCodecError(ChainResultCode.UNKNOWN_OP, "no schema rules for this operation");
  }
}

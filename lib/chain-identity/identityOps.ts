import type { Hex } from "viem";
import { objectId, ObjectKind, repCategoryId } from "@/lib/chain/codec/ids";
import { isHandle, isRepCategoryName } from "@/lib/chain/codec/rules";
import type { ChainDraftRequest } from "./gateway";
import { addressWord } from "./state";

/**
 * The 6529 Network operations this site writes, as `/v1/draft` requests,
 * with the EIP-712 primary type each draft must carry. Field names and
 * codes follow P40 and P61 1.14 (INTERFACES section 3).
 */

/** Who signs: a wallet (keyType 1) or this browser's session key (keyType 2). */
export type ChainActor =
  | { readonly kind: "wallet"; readonly address: Hex }
  | { readonly kind: "session"; readonly keyId: Hex; readonly grantId: Hex };

interface ChainOperationRequest {
  readonly request: ChainDraftRequest;
  readonly primaryType: string;
}

export const OP_PROFILE_REPLACE = 0x0102;
export const OP_RATING_SET = 0x0701;
/** Rule version 7 lets a session key sign votes and poll ballots too. */
export const OP_VOTE_SET = 0x0606;
export const OP_POLL_BALLOT_SET = 0x0608;
/** What a session key signs while the chain runs rule version 6. */
export const IDENTITY_SESSION_OPS: readonly number[] = [
  OP_PROFILE_REPLACE,
  OP_RATING_SET,
];
const GRANTEE_KEY = 1;
const KEY_TYPE_SESSION = 2;
const ACCEPT_NONE = 1;
const BUDGET_REP = 1;
const BUDGET_NIC = 2;
const BUDGET_FEE = 4;
const RECIPIENT_PRINCIPAL = 1;
/** RATING_SET's bound on a rater's spent budget (2^59). */
const RATING_BUDGET = (1n << 59n).toString();
const ZERO_WORD: Hex = `0x${"00".repeat(32)}`;

/** RATING_SET's matter codes. */
export const RATING_MATTER = { REP: 1, NIC: 2 } as const;
export type RatingMatter = keyof typeof RATING_MATTER;

const signerFields = (
  actor: ChainActor
): Pick<ChainDraftRequest, "signer" | "keyType" | "keyId" | "authRef"> =>
  actor.kind === "wallet"
    ? { keyType: 1, signer: actor.address.toLowerCase() as Hex }
    : { keyType: 2, keyId: actor.keyId, authRef: actor.grantId };

const operation = (
  opType: string,
  primaryType: string,
  principal: Hex | null,
  actor: ChainActor,
  body: Readonly<Record<string, unknown>>
): ChainOperationRequest => ({
  primaryType,
  request: {
    opType,
    principal: principal === null ? null : (principal.toLowerCase() as Hex),
    ...signerFields(actor),
    body,
  },
});

const wallet = (address: Hex): ChainActor => ({ kind: "wallet", address });

/** A handle as the chain takes it, or null when it can't be one. */
export function normalizeHandle(raw: string): string | null {
  const handle = raw.trim().toLowerCase();
  return isHandle(handle) ? handle : null;
}

/** IDENTITY_CREATE: the wallet becomes an identity's first wallet. */
export const identityCreate = (
  signer: Hex,
  handle: string,
  profileDocCid: Hex | null
): ChainOperationRequest =>
  operation("IDENTITY_CREATE", "IdentityCreate", null, wallet(signer), {
    legacyId: null,
    handle,
    profileDocCid: profileDocCid ?? "0x",
  });

/** The id IDENTITY_CREATE gives the new identity: `ObjectId(txId, 0, PRINCIPAL)`. */
export const createdPrincipalId = (txId: Hex): Hex =>
  objectId(txId, 0, ObjectKind.PRINCIPAL);

/** PROFILE_REPLACE: point the identity at a new profile document. */
export const profileReplace = (
  principal: Hex,
  actor: ChainActor,
  expectedVersion: number,
  docCid: Hex
): ChainOperationRequest =>
  operation("PROFILE_REPLACE", "ProfileReplace", principal, actor, {
    expectedVersion,
    docCid,
  });

/** HANDLE_CLAIM: take a free handle, releasing the current one. */
export const handleClaim = (
  principal: Hex,
  signer: Hex,
  handle: string,
  expectedCurrent: string
): ChainOperationRequest =>
  operation("HANDLE_CLAIM", "HandleClaim", principal, wallet(signer), {
    handle,
    expectedCurrent,
  });

/** RATING_SET: an absolute REP or NIC rating of another identity. */
export function ratingSet(
  principal: Hex,
  actor: ChainActor,
  input: {
    readonly matter: RatingMatter;
    readonly target: Hex;
    readonly category: string | null;
    readonly value: bigint;
    readonly priorVersion: number;
  }
): ChainOperationRequest {
  const category = input.matter === "REP" ? input.category : null;
  if (
    input.matter === "REP" &&
    (category === null || !isRepCategoryName(category))
  ) {
    throw new RangeError("not a REP category the 6529 Network takes");
  }
  return operation("RATING_SET", "RatingSet", principal, actor, {
    matter: RATING_MATTER[input.matter],
    targetKind: 1,
    target: input.target.toLowerCase(),
    category: category === null ? ZERO_WORD : repCategoryId(category),
    categoryName: category ?? "",
    value: input.value.toString(),
    priorVersion: input.priorVersion.toString(),
  });
}

/**
 * CAPABILITY_GRANT for this browser's session key: PROFILE_REPLACE and
 * RATING_SET (and, once the chain runs them, VOTE_SET and POLL_BALLOT_SET),
 * REP and NIC budgets up to RATING_SET's own bound, a fee budget in the
 * network's currency, active at once until `expiresAtMs`.
 */
export const sessionKeyGrant = (
  principal: Hex,
  signer: Hex,
  input: {
    readonly keyId: Hex;
    readonly publicKeyHex: Hex;
    readonly currencyAsset: Hex;
    readonly feeBudget: bigint;
    readonly expiresAtMs: number;
    /** The operations the key may sign; the identity ones by default. */
    readonly ops?: readonly number[] | undefined;
  }
): ChainOperationRequest =>
  operation("CAPABILITY_GRANT", "CapabilityGrant", principal, wallet(signer), {
    granteeKind: GRANTEE_KEY,
    grantee: input.keyId,
    granteeKeyType: KEY_TYPE_SESSION,
    granteePublicKey: input.publicKeyHex,
    ops: [...(input.ops ?? IDENTITY_SESSION_OPS)],
    flags: 0,
    scopes: [],
    budgets: [
      { kind: BUDGET_REP, assetId: ZERO_WORD, limit: RATING_BUDGET },
      { kind: BUDGET_NIC, assetId: ZERO_WORD, limit: RATING_BUDGET },
      {
        kind: BUDGET_FEE,
        assetId: input.currencyAsset,
        limit: input.feeBudget.toString(),
      },
    ],
    notBefore: "0",
    expiresAt: String(input.expiresAtMs),
    acceptMode: ACCEPT_NONE,
  });

/** The id a CAPABILITY_GRANT gives its grant: `ObjectId(txId, 0, CAPABILITY)`. */
export const createdGrantId = (txId: Hex): Hex =>
  objectId(txId, 0, ObjectKind.CAPABILITY);

/** CAPABILITY_REVOKE: end a grant now. */
export const capabilityRevoke = (
  principal: Hex,
  signer: Hex,
  grantId: Hex,
  expectedVersion: number
): ChainOperationRequest =>
  operation(
    "CAPABILITY_REVOKE",
    "CapabilityRevoke",
    principal,
    wallet(signer),
    { grantId, expectedVersion, p2pSeqCutoff: null }
  );

/** IDENTITY_JOIN: `joining` joins; it signs too, as the second signature. */
export const identityJoin = (
  principal: Hex,
  signer: Hex,
  joining: Hex
): ChainOperationRequest =>
  operation("IDENTITY_JOIN", "IdentityJoin", principal, wallet(signer), {
    wallet: joining.toLowerCase(),
  });

/** IDENTITY_REMOVE: a bound wallet removes any wallet of its identity. */
export const identityRemove = (
  principal: Hex,
  signer: Hex,
  removing: Hex
): ChainOperationRequest =>
  operation("IDENTITY_REMOVE", "IdentityRemove", principal, wallet(signer), {
    wallet: removing.toLowerCase(),
  });

interface ChainDelegation {
  readonly collection: Hex;
  readonly delegate: Hex;
  readonly useCase: number;
  /** Null: every token. */
  readonly tokenId: bigint | null;
}

const delegationKey = (delegation: ChainDelegation) => ({
  collection: delegation.collection.toLowerCase(),
  delegate: delegation.delegate.toLowerCase(),
  useCase: delegation.useCase,
  allTokens: delegation.tokenId === null ? 1 : 0,
  tokenId:
    delegation.tokenId === null
      ? ZERO_WORD
      : `0x${delegation.tokenId.toString(16).padStart(64, "0")}`,
});

/**
 * DELEGATION_SET: the identity's record (principal p, covering every wallet
 * bound to it) or the wallet's own (principal zero), as NFTDelegation's.
 */
export const delegationSet = (
  principal: Hex | null,
  signer: Hex,
  delegation: ChainDelegation,
  expirySeconds: bigint
): ChainOperationRequest =>
  operation("DELEGATION_SET", "DelegationSet", principal, wallet(signer), {
    ...delegationKey(delegation),
    expiry: expirySeconds.toString(),
  });

export const DELEGATION_SCOPE = { IDENTITY: 1, WALLET: 2 } as const;
type DelegationScope = (typeof DELEGATION_SCOPE)[keyof typeof DELEGATION_SCOPE];

/** DELEGATION_REVOKE: delete a record by its key. */
export const delegationRevoke = (
  principal: Hex | null,
  signer: Hex,
  record: ChainDelegation & {
    readonly scope: DelegationScope;
    readonly holder: Hex;
  }
): ChainOperationRequest =>
  operation(
    "DELEGATION_REVOKE",
    "DelegationRevoke",
    principal,
    wallet(signer),
    {
      scope: record.scope,
      holder:
        record.scope === DELEGATION_SCOPE.WALLET
          ? addressWord(record.holder)
          : record.holder.toLowerCase(),
      ...delegationKey(record),
    }
  );

/** BALANCE_TRANSFER from the wallet's own account to its identity. */
export const fundIdentity = (
  signer: Hex,
  principal: Hex,
  currencyAsset: Hex,
  amount: bigint
): ChainOperationRequest =>
  operation("BALANCE_TRANSFER", "BalanceTransfer", null, wallet(signer), {
    assetId: currencyAsset,
    amount: amount.toString(),
    recipientKind: RECIPIENT_PRINCIPAL,
    recipient: principal.toLowerCase(),
    memo: null,
  });

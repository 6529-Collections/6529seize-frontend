import type { Hex } from "viem";
import { chainGateway } from "./gateway";
import {
  capabilityRevoke,
  createdGrantId,
  IDENTITY_SESSION_OPS,
  OP_POLL_BALLOT_SET,
  OP_VOTE_SET,
  sessionKeyGrant,
} from "./identityOps";
import {
  createSessionKeyPair,
  sessionKeyStore,
  type StoredSessionKey,
} from "./sessionKey";
import { readGrant } from "./state";

/**
 * "Enable chain actions on this browser": one CAPABILITY_GRANT, signed by
 * the identity's wallet, lets a key held only by this browser sign profile
 * changes and REP and NIC ratings, so each rating needs no wallet prompt.
 * Once the chain runs votes and poll ballots (rule version 7), the grant
 * lists them too.
 */

/** How long a browser's key lasts, in days. */
export const SESSION_LIFETIME_DAYS = 30;
const SESSION_LIFETIME_MS = SESSION_LIFETIME_DAYS * 24 * 60 * 60 * 1000;
/** The fee budget covers about this many of the grant's own worst-case fee. */
const FEE_BUDGET_OPERATIONS = 400n;
/** A key this close to its end is replaced rather than used. */
const RENEW_MARGIN_MS = 10 * 60 * 1000;

export interface SessionPlan {
  readonly feeBudget: bigint;
  readonly expiresAtMs: number;
  readonly currencyAsset: Hex;
  /** The operations the grant lists, ascending. */
  readonly ops: readonly number[];
  /** The new key; nothing keeps it until the grant is final. */
  readonly pair: Awaited<ReturnType<typeof createSessionKeyPair>>;
}

/** Votes and poll ballots join the grant once the chain runs them. */
const SESSION_WAVE_OPS: readonly number[] = [OP_VOTE_SET, OP_POLL_BALLOT_SET];

/** The operations a new grant lists, given the ones the chain runs. */
export function sessionOpsFor(running: readonly number[]): readonly number[] {
  const ops = new Set(IDENTITY_SESSION_OPS);
  for (const op of SESSION_WAVE_OPS) {
    if (running.includes(op)) {
      ops.add(op);
    }
  }
  return [...ops].sort((a, b) => a - b);
}

/** Whether the key's grant lets it sign `opType`. */
export const sessionKeyCanSign = (
  record: StoredSessionKey,
  opType: number
): boolean => (record.ops ?? IDENTITY_SESSION_OPS).includes(opType);

/** Sizes the fee budget from the network's current fees. Signs nothing. */
export async function planSession(
  principalId: Hex,
  wallet: Hex,
  nowMs: number,
  signal?: AbortSignal
): Promise<SessionPlan> {
  const { currencyAsset, ops: running } = await chainGateway.getOps(signal);
  const ops = sessionOpsFor(running?.map((op) => op.opType) ?? []);
  const pair = await createSessionKeyPair();
  const expiresAtMs = nowMs + SESSION_LIFETIME_MS;
  const probe = sessionKeyGrant(principalId, wallet, {
    keyId: pair.keyId,
    publicKeyHex: pair.publicKeyHex,
    currencyAsset,
    feeBudget: 1n,
    expiresAtMs,
    ops,
  });
  const draft = await chainGateway.draft(probe.request, signal);
  const perOperation = BigInt(draft.fee.maxFee);
  return {
    feeBudget: (perOperation > 0n ? perOperation : 1n) * FEE_BUDGET_OPERATIONS,
    expiresAtMs,
    currencyAsset,
    ops,
    pair,
  };
}

/** The grant for the plan's key, as a `/v1/draft` request. */
export const sessionGrantOperation = (
  principalId: Hex,
  wallet: Hex,
  plan: SessionPlan
) =>
  sessionKeyGrant(principalId, wallet, {
    keyId: plan.pair.keyId,
    publicKeyHex: plan.pair.publicKeyHex,
    currencyAsset: plan.currencyAsset,
    feeBudget: plan.feeBudget,
    expiresAtMs: plan.expiresAtMs,
    ops: plan.ops,
  });

/** Keeps the key in this browser once its grant is final. */
export async function keepSessionKey(
  principalId: Hex,
  plan: SessionPlan,
  grantTxId: Hex
): Promise<void> {
  const record: StoredSessionKey = {
    principalId: principalId.toLowerCase() as Hex,
    keyId: plan.pair.keyId,
    publicKeyHex: plan.pair.publicKeyHex,
    keyPair: plan.pair.keyPair,
    grantId: createdGrantId(grantTxId),
    expiresAtMs: plan.expiresAtMs,
    ops: plan.ops,
  };
  await sessionKeyStore.write(record);
}

/** This browser's usable session key for the identity, or null. */
export async function usableSessionKey(
  principalId: Hex,
  nowMs: number = Date.now()
): Promise<StoredSessionKey | null> {
  try {
    const record = await sessionKeyStore.read(principalId);
    return record && record.expiresAtMs - RENEW_MARGIN_MS > nowMs
      ? record
      : null;
  } catch {
    return null;
  }
}

/**
 * The revoke for the key's grant when it is still active on the chain, or
 * null when there is nothing left to end there.
 */
export async function sessionRevokeOperation(
  principalId: Hex,
  wallet: Hex,
  record: StoredSessionKey,
  signal?: AbortSignal
) {
  const grant = await readGrant(record.grantId, Date.now(), signal);
  return grant?.active
    ? capabilityRevoke(principalId, wallet, record.grantId, grant.version)
    : null;
}

/** Forgets this browser's key for the identity. */
export const forgetSessionKey = (principalId: Hex): Promise<void> =>
  sessionKeyStore.remove(principalId);

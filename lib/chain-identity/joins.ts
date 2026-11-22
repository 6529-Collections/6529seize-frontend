import type { Hex } from "viem";
import type { ChainDraft, ChainWalletMembership } from "./gateway";
import { identityJoin } from "./identityOps";
import { ChainOperationError, draftOperation, verifyDraft } from "./operation";
import type { RelayOperation } from "./relay";

/**
 * IDENTITY_JOIN with two wallets: the identity's wallet signs first (role 0),
 * the joining wallet second (role 4), each in its own browser if need be.
 */

export const ROLE_SIGNER = 0;
export const ROLE_JOINER = 4;

/**
 * How long the joining wallet has to sign. The chain takes a transaction
 * whose window (expiresAt less notBefore) is at most a day, and the gateway
 * starts the window a minute early, so the window asked for stays well
 * below a day.
 */
export const JOIN_VALID_MS = 23 * 60 * 60 * 1000;

/**
 * Held joins sign with nonceLane 1, so the identity's wallet can make other
 * changes (nonceLane 0) while the joining wallet hasn't signed yet. One held
 * join per wallet at a time: a second one would take the same nonce.
 */
const JOIN_NONCE_LANE = 1;

const OP_IDENTITY_JOIN = 0x010f;

const same = (a: string | null | undefined, b: string | null | undefined) =>
  !!a && !!b && a.toLowerCase() === b.toLowerCase();

const mismatch = () =>
  new ChainOperationError(
    "draft_mismatch",
    "This request doesn't match a wallet join. Nothing was signed."
  );

function assertJoinSigners(
  signers: readonly { readonly role: number; readonly signer: Hex | null }[],
  identityWallet: Hex,
  joiningWallet: Hex
): void {
  const byRole = new Map(signers.map((entry) => [entry.role, entry.signer]));
  if (
    signers.length !== 2 ||
    !same(byRole.get(ROLE_SIGNER), identityWallet) ||
    !same(byRole.get(ROLE_JOINER), joiningWallet)
  ) {
    throw mismatch();
  }
}

/** Drafts and checks the join the identity's wallet signs first. */
export async function draftJoin(
  principalId: Hex,
  identityWallet: Hex,
  joiningWallet: Hex
): Promise<ChainDraft> {
  const operation = identityJoin(principalId, identityWallet, joiningWallet);
  const draft = await draftOperation(
    {
      ...operation.request,
      validForMs: JOIN_VALID_MS,
      nonceLane: JOIN_NONCE_LANE,
    },
    operation.primaryType
  );
  assertJoinSigners(draft.signatures, identityWallet, joiningWallet);
  return draft;
}

const integerText = (value: unknown): string =>
  typeof value === "string" ||
  typeof value === "number" ||
  typeof value === "bigint"
    ? String(value)
    : "";

const isJoin = (opType: string | number): boolean =>
  opType === "IDENTITY_JOIN" || Number(opType) === OP_IDENTITY_JOIN;

/** The identity's wallet that signed a held join first. */
export const joinRequester = (op: RelayOperation): Hex | null =>
  op.signers.find((entry) => entry.role === ROLE_SIGNER)?.signer ?? null;

/**
 * A join the relay holds for `joiningWallet`, checked before that wallet
 * signs: it is IDENTITY_JOIN for this wallet, into the identity it names,
 * started by one wallet, and its txId is the digest of what will be signed.
 * Returned as a draft the wallet signer takes.
 */
export function heldJoinDraft(
  op: RelayOperation,
  joiningWallet: Hex
): ChainDraft {
  const requester = joinRequester(op);
  if (!isJoin(op.op_type) || op.principal === null || requester === null) {
    throw mismatch();
  }
  assertJoinSigners(op.signers, requester, joiningWallet);
  const header = (op.typed_data.message["header"] ?? {}) as Readonly<
    Record<string, unknown>
  >;
  // The signed header carries the fee the person is shown.
  const fee = {
    maxFee: integerText(header["maxFee"]),
    maxWork: integerText(header["maxWork"]),
    worst: integerText(header["maxFee"]),
    sizeBytes: 0,
  };
  const draft: ChainDraft = {
    txId: op.tx_id,
    opType: OP_IDENTITY_JOIN,
    opName: "IDENTITY_JOIN",
    opVersion: 1,
    typedData: op.typed_data,
    unsigned: op.unsigned,
    envelope: { networkId: op.typed_data.domain.salt, header },
    signatures: op.signers.map((entry) => ({
      role: entry.role,
      keyType: entry.key_type,
      signer: entry.signer,
    })),
    fee,
  };
  const operation = identityJoin(op.principal, requester, joiningWallet);
  verifyDraft(
    draft,
    { ...operation.request, nonceLane: Number(header["nonceLane"] ?? 0) },
    operation.primaryType
  );
  return draft;
}

/** Whether a wallet can join an identity now, by the chain's rules. */
export type JoinReadiness =
  | { readonly kind: "free" }
  | { readonly kind: "bound"; readonly principalId: Hex }
  | {
      readonly kind: "waiting";
      readonly leftMs: number;
      readonly untilMs: number;
    };

/**
 * A wallet can join an identity when it belongs to none and, if it left
 * another identity, `rejoinWaitMs` has passed since (both from the chain's
 * answers). It can rejoin the identity it left at any time. `joining` is the
 * identity it would join; null for creating one, where the wait always holds.
 */
export function joinReadiness(
  membership: ChainWalletMembership,
  rejoinWaitMs: number | null | undefined,
  nowMs: number,
  joining: Hex | null
): JoinReadiness {
  if (membership.principalId) {
    return { kind: "bound", principalId: membership.principalId };
  }
  const left = membership.leftAt;
  if (
    left &&
    typeof left.leftMs === "number" &&
    typeof rejoinWaitMs === "number" &&
    left.leftMs + rejoinWaitMs > nowMs &&
    (joining === null || left.from.toLowerCase() !== joining.toLowerCase())
  ) {
    return {
      kind: "waiting",
      leftMs: left.leftMs,
      untilMs: left.leftMs + rejoinWaitMs,
    };
  }
  return { kind: "free" };
}

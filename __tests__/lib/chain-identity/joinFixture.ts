import type { Hex } from "viem";
import { digestOf } from "@/lib/chain-identity/operation";
import type { ChainDraft } from "@/lib/chain-identity/gateway";
import type { RelayOperation } from "@/lib/chain-identity/relay";

export const JOIN_NETWORK: Hex = `0x${"ab".repeat(32)}`;
export const JOIN_PRINCIPAL: Hex = `0x${"0a".repeat(32)}`;
export const IDENTITY_WALLET: Hex =
  "0x00000000000000000000000000000000000000aa";
export const JOINING_WALLET: Hex = "0x00000000000000000000000000000000000000bb";
/** A day from when the tests start, on a whole second. */
export const JOIN_EXPIRES_AT =
  Math.floor(Date.now() / 1000) * 1000 + 24 * 60 * 60 * 1000;

const word = (address: Hex): Hex => `0x${"00".repeat(12)}${address.slice(2)}`;

/**
 * An IDENTITY_JOIN draft as the gateway answers it: the identity's wallet
 * signs as role 0, the joining wallet as role 4, with nonceLane 1.
 */
export function joinDraft(
  options: { readonly joining?: Hex; readonly nonceLane?: number } = {}
): ChainDraft {
  const joining = options.joining ?? JOINING_WALLET;
  const header = {
    ruleVersion: 6,
    principal: JOIN_PRINCIPAL,
    keyType: 1,
    keyId: word(IDENTITY_WALLET),
    authRef: `0x${"00".repeat(32)}`,
    nonceLane: options.nonceLane ?? 1,
    nonce: "0",
    notBefore: "1764000000000",
    expiresAt: String(JOIN_EXPIRES_AT),
    ethRefNumber: "0",
    ethRefHash: `0x${"00".repeat(32)}`,
    feeMode: 3,
    sponsorRef: `0x${"00".repeat(32)}`,
    maxFee: "3000000000000000",
    maxWork: "200000",
    tipPerRU: "0",
  };
  const typedData = {
    domain: { name: "6529 Network", version: "1", salt: JOIN_NETWORK },
    primaryType: "IdentityJoin",
    types: {},
    message: { header, body: { wallet: joining } },
  };
  return {
    txId: digestOf(typedData),
    opType: 0x010f,
    opName: "IDENTITY_JOIN",
    opVersion: 1,
    typedData,
    unsigned: "0x4001",
    envelope: { networkId: JOIN_NETWORK, header },
    signatures: [
      { role: 0, keyType: 1, signer: IDENTITY_WALLET },
      { role: 4, keyType: 1, signer: joining },
    ],
    fee: {
      maxWork: "200000",
      worst: "1000000000000000",
      maxFee: "3000000000000000",
      sizeBytes: 300,
    },
  };
}

/** The same join as 6529.io's relay holds it, the identity's wallet signed. */
export function heldJoin(draft: ChainDraft = joinDraft()): RelayOperation {
  return {
    tx_id: draft.txId,
    op_type: "IDENTITY_JOIN",
    principal: JOIN_PRINCIPAL,
    unsigned: draft.unsigned,
    typed_data: draft.typedData,
    created_by: IDENTITY_WALLET,
    expires_at: JOIN_EXPIRES_AT,
    status: "PENDING",
    last_error: null,
    signers: draft.signatures.map((entry) => ({
      role: entry.role,
      key_type: entry.keyType,
      signer: entry.signer as Hex,
      signed: entry.role === 0,
    })),
  };
}

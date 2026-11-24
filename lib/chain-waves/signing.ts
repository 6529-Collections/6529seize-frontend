import type { Hex } from "viem";
import type { Config } from "wagmi";
import { chainGateway, type ChainIdentity } from "@/lib/chain-identity/gateway";
import type { ChainActor } from "@/lib/chain-identity/identityOps";
import {
  ChainOperationError,
  runOperation,
  type ChainSigner,
  type ChainWait,
} from "@/lib/chain-identity/operation";
import {
  sessionKeyCanSign,
  usableSessionKey,
} from "@/lib/chain-identity/session";
import { sessionSigner, walletSigner } from "@/lib/chain-identity/signers";
import type { ChainOperationRequest } from "./ops";

/** Who signs a write: the actor the draft names and the signer it uses. */
export interface ChainSigning {
  readonly actor: ChainActor;
  readonly signer: ChainSigner;
}

/** The identity a wallet is bound to, or a message saying it has none. */
export async function identityOfWallet(
  wallet: Hex,
  signal?: AbortSignal
): Promise<ChainIdentity> {
  const identity = await chainGateway.getIdentityByWallet(wallet, signal);
  if (!identity) {
    throw new ChainOperationError(
      "rejected",
      "This wallet has no identity on the 6529 Network yet."
    );
  }
  return identity;
}

/**
 * The connected wallet signs (every rule version 7 write but votes, ballots
 * and REP). Entries and their withdrawal use it.
 * @api
 */
export const walletSigning = (config: Config, wallet: Hex): ChainSigning => ({
  actor: { kind: "wallet", address: wallet },
  signer: walletSigner(config, wallet),
});

/** This browser's session key when its grant covers `opType`, else the wallet. */
export async function sessionOrWalletSigning(
  config: Config,
  wallet: Hex,
  principalId: Hex,
  opType: number
): Promise<ChainSigning> {
  const key = await usableSessionKey(principalId);
  if (key && sessionKeyCanSign(key, opType)) {
    return {
      actor: { kind: "session", keyId: key.keyId, grantId: key.grantId },
      signer: sessionSigner(key),
    };
  }
  return walletSigning(config, wallet);
}

/**
 * Drafts, checks, signs and sends one write, and waits as `until` says:
 * "included" for votes, ballots and ratings, which a later write replaces;
 * "final" for everything a later write builds on. Returns the draft, whose
 * txId names the objects the write creates.
 */
export async function runChainWrite(
  build: (actor: ChainActor) => ChainOperationRequest,
  signing: ChainSigning,
  until: ChainWait,
  signal?: AbortSignal
) {
  const operation = build(signing.actor);
  const { draft } = await runOperation(
    operation.request,
    operation.primaryType,
    signing.signer,
    signal,
    until
  );
  return draft;
}

import type { Hex } from "viem";
import type { Config } from "wagmi";
import { chainGateway, type ChainIdentity } from "@/lib/chain-identity/gateway";
import type { ChainActor } from "@/lib/chain-identity/identityOps";
import {
  ChainOperationError,
  draftOperation,
  runOperation,
  submitAndAwait,
  type ChainSigner,
  type ChainWait,
} from "@/lib/chain-identity/operation";
import {
  sessionKeyCanSign,
  usableSessionKey,
} from "@/lib/chain-identity/session";
import { withinSessionFeeCap } from "@/lib/chain-identity/sessionFeeCap";
import { sessionSigner, walletSigner } from "@/lib/chain-identity/signers";
import type { ChainOperationRequest } from "./ops";

/** Who signs a write: the actor the draft names and the signer it uses. */
export interface ChainSigning {
  readonly actor: ChainActor;
  readonly signer: ChainSigner;
  /**
   * When this browser's session key signs: the wallet, which signs instead
   * when the fee is above the key's cap (`sessionFeeCap`).
   */
  readonly walletInstead?: ChainSigning | undefined;
}

/** A wallet bound to no identity on the 6529 Network: nothing was signed. */
class NoChainIdentityError extends ChainOperationError {
  constructor() {
    super("rejected", "This wallet has no identity on the 6529 Network yet.");
  }
}

/** The identity a wallet is bound to, or a message saying it has none. */
export async function identityOfWallet(
  wallet: Hex,
  signal?: AbortSignal
): Promise<ChainIdentity> {
  const identity = await chainGateway.getIdentityByWallet(wallet, signal);
  if (!identity) {
    throw new NoChainIdentityError();
  }
  return identity;
}

/** Whether a write stopped because the wallet has no identity yet. */
export const isNoChainIdentity = (error: unknown): boolean =>
  error instanceof NoChainIdentityError;

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
      walletInstead: walletSigning(config, wallet),
    };
  }
  return walletSigning(config, wallet);
}

/**
 * Drafts, checks, signs and sends one write, and waits as `until` says:
 * "included" for votes, ballots and ratings, which a later write replaces;
 * "final" for everything a later write builds on. Returns the draft, whose
 * txId names the objects the write creates. The session key signs only a
 * fee within its cap; above it the wallet signs a draft of its own, and
 * `onWalletFee` hears that draft's fee just before the wallet is asked.
 */
export async function runChainWrite(
  build: (actor: ChainActor) => ChainOperationRequest,
  signing: ChainSigning,
  until: ChainWait,
  signal?: AbortSignal,
  onWalletFee?: (maxFee: bigint) => void
) {
  const wallet = signing.walletInstead;
  if (wallet === undefined) {
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
  const operation = build(signing.actor);
  const keyDraft = await draftOperation(
    operation.request,
    operation.primaryType,
    signal
  );
  if (withinSessionFeeCap(keyDraft)) {
    const sig = await signing.signer.sign(keyDraft);
    await submitAndAwait(
      keyDraft,
      [{ role: 0, keyType: signing.signer.keyType, sig }],
      signal,
      until
    );
    return keyDraft;
  }
  const saysFee: ChainSigner = {
    keyType: wallet.signer.keyType,
    sign: (draft) => {
      onWalletFee?.(BigInt(draft.fee.maxFee));
      return wallet.signer.sign(draft);
    },
  };
  return runChainWrite(build, { ...wallet, signer: saysFee }, until, signal);
}

import type { Hex } from "viem";
import type { Config } from "wagmi";
import { repCategoryId } from "@/lib/chain/codec/ids";
import { chainGateway, type ChainIdentity } from "./gateway";
import {
  RATING_MATTER,
  ratingSet,
  type ChainActor,
  type RatingMatter,
} from "./identityOps";
import {
  ChainOperationError,
  draftOperation,
  submitAndAwait,
} from "./operation";
import { usableSessionKey } from "./session";
import { readIdentityBalance, readRaterSpent, readRating } from "./state";
import { sessionSigner, walletSigner } from "./signers";

/** A 6529.io profile as the chain finds it: by handle, else by its wallets. */
export interface ChainRatingTarget {
  readonly handle?: string | null | undefined;
  readonly wallets?: readonly string[] | undefined;
}

const ZERO_WORD: Hex = `0x${"00".repeat(32)}`;

const isAddress = (value: string): value is Hex =>
  /^0x[0-9a-fA-F]{40}$/.test(value);

const abs = (value: bigint): bigint => (value < 0n ? -value : value);

/**
 * The identity a profile is on the chain: the one holding its handle, as
 * long as it also holds one of the profile's wallets (a handle 6529.io shows
 * may have moved to someone else since), else the identity of its wallets.
 */
async function findChainIdentity(
  target: ChainRatingTarget,
  signal?: AbortSignal
): Promise<ChainIdentity | null> {
  const wallets = (target.wallets ?? [])
    .filter(isAddress)
    .map((wallet) => wallet.toLowerCase());
  if (target.handle) {
    const byHandle = await chainGateway.getIdentityByHandle(
      target.handle,
      signal
    );
    if (
      byHandle &&
      (wallets.length === 0 ||
        (byHandle.wallets ?? []).some((wallet) =>
          wallets.includes(wallet.toLowerCase())
        ))
    ) {
      return byHandle;
    }
  }
  for (const wallet of wallets) {
    const byWallet = await chainGateway.getIdentityByWallet(
      wallet as Hex,
      signal
    );
    if (byWallet) {
      return byWallet;
    }
  }
  return null;
}

/** A rater's room to rate one identity in one matter and category. */
interface ChainRatingAllowance {
  readonly rater: Hex;
  readonly target: Hex;
  /** The rater's TDH: the most it can give in this matter. Null: unknown. */
  readonly cap: bigint | null;
  /** What the rater has given in this matter, all targets together. */
  readonly spent: bigint;
  /** What the rater can still give: the cap less what it has given. */
  readonly available: bigint | null;
  /** The rater's current rating of the target here; 0 for none. */
  readonly current: bigint;
  /** The current rating's version, for RATING_SET's priorVersion. */
  readonly version: number;
}

const decimal = (value: string | undefined): bigint | null =>
  value !== undefined && /^\d+$/.test(value) ? BigInt(value) : null;

const notRated = (message: string, resultName: string) =>
  new ChainOperationError("rejected", message, resultName);

/**
 * Reads, at the head, how much the connected wallet's identity can give
 * `target`: its TDH (the identity's `level.tdh`), what it has given in the
 * matter (`RaterBudget.spent`) and its current rating there.
 */
export async function readRatingAllowance(
  raterWallet: Hex,
  input: {
    readonly matter: RatingMatter;
    readonly target: ChainRatingTarget;
    readonly category: string | null;
  },
  signal?: AbortSignal
): Promise<ChainRatingAllowance> {
  const [rater, target] = await Promise.all([
    chainGateway.getIdentityByWallet(raterWallet, signal),
    findChainIdentity(input.target, signal),
  ]);
  if (!rater) {
    throw notRated(
      "This wallet has no identity on the 6529 Network yet. Create one on your identity page.",
      "NO_RATER_IDENTITY"
    );
  }
  if (!target) {
    throw notRated(
      "This profile has no identity on the 6529 Network yet, so it can't be rated there.",
      "NO_TARGET_IDENTITY"
    );
  }
  const matter = RATING_MATTER[input.matter];
  const category =
    input.matter === "REP" && input.category !== null
      ? repCategoryId(input.category)
      : ZERO_WORD;
  const [spent, rating] = await Promise.all([
    readRaterSpent(rater.principalId, matter, signal),
    readRating(rater.principalId, matter, target.principalId, category, signal),
  ]);
  const cap = decimal(rater.level?.tdh);
  return {
    rater: rater.principalId,
    target: target.principalId,
    cap,
    spent,
    available: cap === null ? null : cap > spent ? cap - spent : 0n,
    current: rating?.value ?? 0n,
    version: rating?.updatedHeight ?? 0,
  };
}

/**
 * Whether the chain takes `value` as the new rating: what the rater gives
 * after the change stays within its TDH, or the change lowers what it gives.
 */
export function withinAllowance(
  allowance: ChainRatingAllowance,
  value: bigint
): boolean {
  if (allowance.cap === null) {
    return true;
  }
  const after = allowance.spent - abs(allowance.current) + abs(value);
  return after <= allowance.cap || after <= allowance.spent;
}

/**
 * Sets the connected wallet's identity's REP or NIC rating of `target` to
 * `value`. This browser's session key signs when it has one for the
 * identity; otherwise the wallet signs. Refuses before anything is signed
 * when the rating is the rater's own or goes past its TDH.
 */
export async function writeChainRating(
  config: Config,
  raterWallet: Hex,
  input: {
    readonly matter: RatingMatter;
    readonly target: ChainRatingTarget;
    readonly category: string | null;
    readonly value: bigint;
  },
  signal?: AbortSignal
): Promise<void> {
  const allowance = await readRatingAllowance(raterWallet, input, signal);
  if (allowance.rater.toLowerCase() === allowance.target.toLowerCase()) {
    throw notRated("You can't rate your own identity.", "SELF_RATING");
  }
  if (!withinAllowance(allowance, input.value)) {
    throw notRated(
      `That is more ${input.matter} than your TDH lets you give.`,
      "OVER_RATING_BUDGET"
    );
  }
  const key = await usableSessionKey(allowance.rater);
  const actor: ChainActor = key
    ? { kind: "session", keyId: key.keyId, grantId: key.grantId }
    : { kind: "wallet", address: raterWallet };
  const operation = ratingSet(allowance.rater, actor, {
    matter: input.matter,
    target: allowance.target,
    category: input.category,
    value: input.value,
    priorVersion: allowance.version,
  });
  const signer = key ? sessionSigner(key) : walletSigner(config, raterWallet);
  const draft = await draftOperation(
    operation.request,
    operation.primaryType,
    signal
  );
  // The identity pays the rating's fee: say so before any wallet prompt
  // when its balance can't cover the most the fee can be.
  const { currencyAsset } = await chainGateway.getOps(signal);
  const balance = await readIdentityBalance(
    allowance.rater,
    currencyAsset,
    signal
  );
  if (balance < BigInt(draft.fee.maxFee)) {
    throw notRated(
      "Your identity doesn't have enough $fake6529 for this rating's fee.",
      "IDENTITY_FEE_SHORT"
    );
  }
  const sig = await signer.sign(draft);
  await submitAndAwait(
    draft,
    [{ role: 0, keyType: signer.keyType, sig }],
    signal
  );
}

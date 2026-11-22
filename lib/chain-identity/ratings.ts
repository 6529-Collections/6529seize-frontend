import type { Hex } from "viem";
import type { Config } from "wagmi";
import { chainGateway, type ChainIdentity } from "./gateway";
import { ratingSet, type ChainActor, type RatingMatter } from "./identityOps";
import { ChainOperationError, runOperation } from "./operation";
import { usableSessionKey } from "./session";
import { sessionSigner, walletSigner } from "./signers";

/** A 6529.io profile as the chain finds it: by handle, else by its wallets. */
interface ChainRatingTarget {
  readonly handle?: string | null | undefined;
  readonly wallets?: readonly string[] | undefined;
}

const isAddress = (value: string): value is Hex =>
  /^0x[0-9a-fA-F]{40}$/.test(value);

async function findChainIdentity(
  target: ChainRatingTarget,
  signal?: AbortSignal
): Promise<ChainIdentity | null> {
  if (target.handle) {
    const byHandle = await chainGateway.getIdentityByHandle(
      target.handle,
      signal
    );
    if (byHandle) {
      return byHandle;
    }
  }
  for (const wallet of target.wallets ?? []) {
    if (!isAddress(wallet)) {
      continue;
    }
    const byWallet = await chainGateway.getIdentityByWallet(wallet, signal);
    if (byWallet) {
      return byWallet;
    }
  }
  return null;
}

/** The current rating's version (the height that set it), 0 for none. */
async function priorVersion(
  rater: Hex,
  matter: RatingMatter,
  target: Hex,
  category: string | null,
  signal?: AbortSignal
): Promise<number> {
  const rows = await chainGateway.getRatingsByRater(
    rater,
    matter === "REP" ? "rep" : "nic",
    signal
  );
  const wanted = category?.toLowerCase() ?? null;
  const row = rows.find(
    (item) =>
      item.target.toLowerCase() === target.toLowerCase() &&
      (matter === "NIC" || item.category.name?.toLowerCase() === wanted)
  );
  return row?.updatedHeight ?? 0;
}

/**
 * Sets the connected wallet's identity's REP or NIC rating of `target` to
 * `value`. This browser's session key signs when it has one for the
 * identity; otherwise the wallet signs.
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
  const rater = await chainGateway.getIdentityByWallet(raterWallet, signal);
  if (!rater) {
    throw new ChainOperationError(
      "rejected",
      "This wallet has no identity on the 6529 Network yet."
    );
  }
  const target = await findChainIdentity(input.target, signal);
  if (!target) {
    throw new ChainOperationError(
      "rejected",
      "This profile has no identity on the 6529 Network yet."
    );
  }
  const version = await priorVersion(
    rater.principalId,
    input.matter,
    target.principalId,
    input.category,
    signal
  );
  const key = await usableSessionKey(rater.principalId);
  const actor: ChainActor = key
    ? { kind: "session", keyId: key.keyId, grantId: key.grantId }
    : { kind: "wallet", address: raterWallet };
  const operation = ratingSet(rater.principalId, actor, {
    matter: input.matter,
    target: target.principalId,
    category: input.category,
    value: input.value,
    priorVersion: version,
  });
  await runOperation(
    operation.request,
    operation.primaryType,
    key ? sessionSigner(key) : walletSigner(config, raterWallet),
    signal
  );
}

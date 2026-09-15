import {
  GRADIENT_CONTRACT,
  MEMELAB_CONTRACT,
  MEMES_CONTRACT,
  NEXTGEN_CONTRACT,
} from "@/constants/constants";
import type { ApiCollectAnalysis } from "@/generated/models/ApiCollectAnalysis";
import type { ConfirmedMarketPurchase } from "./market-activity-store";

const INTERVAL_MS = 30_000;
const WINDOW_MS = 10 * 60_000;
const STANDARD_HOLDINGS_CONTRACTS = new Set(
  [MEMES_CONTRACT, GRADIENT_CONTRACT, MEMELAB_CONTRACT].map((contract) =>
    contract.toLowerCase()
  )
);

function positiveBlock(value: number | null | undefined): value is number {
  return (
    value !== null &&
    value !== undefined &&
    Number.isSafeInteger(value) &&
    value > 0
  );
}

/** Positive index evidence only; a polling window ending is not proof of catch-up. */
export function collectOwnershipCoversPurchase(
  profileId: string | null | undefined,
  analysis:
    | Pick<ApiCollectAnalysis, "account" | "holdings_snapshot">
    | undefined,
  purchase: ConfirmedMarketPurchase
): boolean {
  if (
    !profileId ||
    purchase.profileId !== profileId ||
    analysis?.account.profile_id !== profileId ||
    !positiveBlock(purchase.blockNumber)
  )
    return false;
  const contract = /^1:(0x[\da-f]{40}):\d+$/i
    .exec(purchase.assetKey)?.[1]
    ?.toLowerCase();
  if (!contract) return false;
  let indexedBlock: number | null | undefined;
  if (contract === NEXTGEN_CONTRACT.toLowerCase())
    indexedBlock = analysis.holdings_snapshot.nextgen_block_number;
  else if (STANDARD_HOLDINGS_CONTRACTS.has(contract))
    indexedBlock = analysis.holdings_snapshot.block_number;
  return positiveBlock(indexedBlock) && indexedBlock >= purchase.blockNumber;
}

/** A receipt requests fresh indexed ownership; it never adds a holding itself. */
export function collectOwnerRefreshInterval({
  assetKey,
  profileId,
  purchases,
  analysis,
  now = Date.now(),
}: {
  readonly assetKey: string;
  readonly profileId: string | null | undefined;
  readonly purchases: readonly ConfirmedMarketPurchase[];
  readonly analysis:
    | Pick<ApiCollectAnalysis, "account" | "holdings_snapshot">
    | undefined;
  readonly now?: number;
}): number | false {
  const contract = /^1:(0x[\da-f]{40}):\d+$/i
    .exec(assetKey)?.[1]
    ?.toLowerCase();
  const nextgen = contract === NEXTGEN_CONTRACT.toLowerCase();
  if (
    !profileId ||
    !contract ||
    (!nextgen && !STANDARD_HOLDINGS_CONTRACTS.has(contract))
  )
    return false;
  const recent = purchases.filter((purchase) => {
    const age = now - purchase.confirmedAt;
    return (
      purchase.profileId === profileId &&
      purchase.assetKey.toLowerCase() === assetKey.toLowerCase() &&
      Number.isFinite(purchase.confirmedAt) &&
      purchase.confirmedAt > 0 &&
      Number.isFinite(age) &&
      age >= 0 &&
      age <= WINDOW_MS - INTERVAL_MS
    );
  });
  if (recent.length === 0) return false;
  return recent.some(
    (purchase) => !collectOwnershipCoversPurchase(profileId, analysis, purchase)
  )
    ? INTERVAL_MS
    : false;
}

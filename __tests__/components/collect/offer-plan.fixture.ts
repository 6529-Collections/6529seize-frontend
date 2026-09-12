import { ApiCollectFamily } from "@/generated/models/ApiCollectFamily";
import type { ApiCollectAsset } from "@/generated/models/ApiCollectAsset";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type {
  OfferPlanAnalysisView,
  OfferPlanPrice,
} from "@/components/collect/collect-offer-plan.types";

export const OFFER_PAYER = "0x1111111111111111111111111111111111111111";
export const OFFER_PROFILE = {
  id: "profile",
  primary_wallet: OFFER_PAYER,
  wallets: [{ wallet: OFFER_PAYER, display: "payer.eth", tdh: 0 }],
} as ApiIdentity;
export function offerAsset(id: number): ApiCollectAsset {
  const contract = "0x33fd426905f149f8376e227d0c9d3340aad17af1";
  return {
    asset_key: `1:${contract}:${id}`,
    chain_id: 1,
    contract,
    token_id: String(id),
    name: `Artwork ${id}`,
    family: ApiCollectFamily.Memes,
    image_url: null,
    artist_ids: [],
    season: 1,
    traits: [],
    hodl_rate: 1,
    tdh_eligible: true,
  };
}
export function offerPrice(
  id: number,
  unitAmountWei: string | null = "100000000000000000"
): OfferPlanPrice {
  return {
    assetKey: offerAsset(id).asset_key,
    asset: offerAsset(id),
    quantity: "1",
    status: unitAmountWei === null ? "UNAVAILABLE" : "PRICED",
    unitAmountWei,
    selected: unitAmountWei !== null,
    reasons: unitAmountWei === null ? ["NO_APPLICABLE_BID"] : ["MATCH_BID"],
    references: [],
  };
}
export function offerAnalysis(
  prices = [offerPrice(1), offerPrice(2)]
): OfferPlanAnalysisView {
  return {
    id: "analysis",
    policy: "test-v1",
    policyDescription: "A fixed conservative opening policy.",
    createdAt: new Date().toISOString(),
    validUntil: new Date(Date.now() + 60000).toISOString(),
    prices,
    trackedLiabilityWei: "100000000000000000",
    balanceWei: "2000000000000000000",
    availableWei: "1900000000000000000",
    unallocatedWei: "0",
  };
}

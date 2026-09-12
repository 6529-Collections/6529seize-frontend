import type { ApiCollectAsset } from "@/generated/models/ApiCollectAsset";
import type { ApiCollectPlanLeg } from "@/generated/models/ApiCollectPlanLeg";

/** Editable display state. Signing continues through the existing exact-NFT offer flow. */
export type OfferPriceMethod =
  | "manual"
  | "match_bid"
  | "improve_bid"
  | "discount_ask"
  | "goal";

/** Presets affect editable proposals; purchase/offer commitments remain owned by the workspace. */
export interface OfferPlanAcquisitionProps {
  readonly initialMethod?: OfferPriceMethod | undefined;
  readonly strategySessionKey?: string | undefined;
  readonly blended?: boolean | undefined;
  readonly buyOptions?: readonly ApiCollectPlanLeg[] | undefined;
  readonly buyObservedAt?: string | undefined;
  readonly buyLockedAssetKeys?: readonly string[] | undefined;
  readonly onReviewBuys?:
    | ((legs: readonly ApiCollectPlanLeg[]) => void)
    | undefined;
}

export interface CollectOfferSelection {
  readonly asset?: ApiCollectAsset | undefined;
  readonly assetKey?: string | undefined;
  readonly quantity: string;
}

export interface OfferPlanRow {
  readonly asset: ApiCollectAsset | undefined;
  readonly assetKey: string;
  readonly quantity: string;
  readonly selected: boolean;
  readonly unitPriceEth: string;
  readonly expiryHours: string;
  readonly expiryDateTime?: string;
  readonly pinned: boolean;
}

export interface OfferPlanReview {
  readonly asset: ApiCollectAsset;
  readonly quantity: string;
  readonly unitPriceEth: string;
  readonly expiryHours: string;
  readonly expiryDateTime?: string;
  readonly maximumOfferAmountWei?: string | undefined;
}

export interface PublishedOfferCommitment {
  readonly assetKey: string;
  readonly amountWei: string;
}

/** An unresolved operation remains committed until authoritative status resolves it. */
export interface PendingOfferCommitment extends PublishedOfferCommitment {
  readonly operationId: string;
}

export interface OfferPricingControls {
  readonly blendTier?: "conservative" | "base" | "aggressive";
  readonly method: OfferPriceMethod;
  readonly percent: string;
  readonly budgetEth: string;
  readonly expiryHours: string;
  readonly expiryDateTime?: string;
}

export interface OfferPlanAnalysisInput {
  readonly profileId: string;
  readonly wallet: string;
  readonly rows: readonly OfferPlanRow[];
  readonly controls: OfferPricingControls;
  readonly committedAmountWei: string;
}

/** Display projection of the generated analysis contract, not an API request. */
export interface OfferPlanPrice {
  readonly assetKey: string;
  readonly asset?: ApiCollectAsset | undefined;
  readonly quantity: string;
  readonly status:
    | "PRICED"
    | "UNAVAILABLE"
    | "EXCLUDED_BUDGET"
    | "PIN_CONFLICT";
  readonly unitAmountWei: string | null;
  readonly selected: boolean;
  readonly reasons: readonly string[];
  readonly references: readonly {
    readonly kind: "bid" | "ask";
    readonly amountWei: string;
    readonly currency: "ETH" | "WETH";
    readonly observedAt: string;
  }[];
}

export interface OfferPlanAnalysisView {
  readonly id: string;
  readonly policy: string;
  readonly policyDescription: string;
  readonly createdAt: string;
  readonly validUntil: string;
  readonly prices: readonly OfferPlanPrice[];
  readonly trackedLiabilityWei: string;
  readonly balanceWei: string;
  readonly availableWei: string;
  readonly unallocatedWei: string;
}

import type { ReactNode } from "react";
import type { CollectPurchaseAmounts } from "./collect-review-amounts";

/** Display models only. API adapters must use the generated marketplace contract. */
export type CollectCollection = "all" | "memes" | "gradients" | "pebbles";
export type CollectIntent =
  | "explore"
  | "lowest"
  | "specific"
  | "season"
  | "full_set"
  | "artist"
  | "pebbles_set"
  | "tdh";
export type CollectTradeAction = "buy" | "offer" | "list" | "accept" | "cancel";

export interface CollectProfileView {
  readonly id: string;
  readonly displayName: string;
}

export interface CollectActionView {
  readonly action: CollectTradeAction;
  readonly disabledReason?: string | undefined;
}

export interface CollectArtworkView {
  readonly id: string;
  readonly title: string;
  readonly artist: string;
  readonly tokenLabel: string;
  readonly href: string;
  readonly media: ReactNode;
  readonly ownedLabel: string | null;
  readonly priceLabel: string | null;
  readonly priceDescription?: string | undefined;
  readonly sourceLabel?: string | undefined;
  readonly actions: readonly CollectActionView[];
}

export type CollectCatalogView =
  | { readonly status: "loading" }
  | { readonly status: "error"; readonly message: string }
  | {
      readonly status: "ready";
      readonly items: readonly CollectArtworkView[];
      readonly hasMore: boolean;
      readonly loadingMore?: boolean | undefined;
    };

export interface CollectRequirementView {
  readonly id: string;
  readonly label: string;
  readonly detail: string;
  readonly status: "owned" | "selected" | "missing" | "unavailable";
  readonly media?: ReactNode;
  readonly availabilityLabel?: string;
  readonly priceLabel?: string;
  readonly purchaseLabel?: string;
}

export type CollectPlanScenario = "available" | "budget";
export type CollectAcquisitionStrategy =
  | "buy"
  | "match_bid"
  | "improve_bid"
  | "discount_ask"
  | "blended";

export interface CollectPlanView {
  readonly id: string;
  readonly revision: string;
  readonly title: string;
  readonly profile: CollectProfileView;
  readonly coverageLabel: string;
  readonly snapshotLabel: string;
  readonly requirements: readonly CollectRequirementView[];
  readonly totalLabel: string | null;
  readonly blockers: readonly string[];
  readonly assumptions: readonly string[];
  readonly reviewDisabledReason?: string | undefined;
  readonly purchaseTotalLabel?: string;
  readonly gasReserveLabel?: string;
  readonly outcomeLabel?: string;
  readonly scenarios?: readonly {
    id: CollectPlanScenario;
    label: string;
    priceLabel: string;
    detail: string;
  }[];
  readonly scenario?: CollectPlanScenario;
}

export interface CollectGoalOption {
  readonly id: string;
  readonly label: string;
}

export interface CollectGoalDraft {
  readonly intent: CollectIntent;
  readonly definitionId: string;
  readonly targetCount: string;
  readonly budgetEth: string;
  readonly horizonDays: string;
  readonly includeCollaborations: boolean;
}

export interface CollectTradeDraft {
  readonly acknowledgeExternalRecipient?: boolean;
  readonly quantity: string;
  readonly unitPriceEth: string;
  readonly expiryHours: string;
  readonly recipient: string;
}

export type CollectTradeStage =
  | "review"
  | "preparing"
  | "approval"
  | "signature"
  | "publishing"
  | "submitted"
  | "awaiting_signatures"
  | "reconciling"
  | "confirmed"
  | "live"
  | "partial"
  | "failed"
  | "expired";

export interface CollectReviewFact {
  readonly label: string;
  readonly value: string;
}

export interface CollectPurchaseReviewView {
  readonly amounts: CollectPurchaseAmounts;
  readonly currency: "ETH" | "WETH";
  readonly artworkLabel: string;
  readonly quantity: string;
  readonly payerAddress: string;
  readonly payerName?: string | undefined;
  readonly recipientAddress: string;
  readonly recipientName?: string | undefined;
  readonly recipientInProfile: boolean;
  readonly netWei: string;
  readonly fees: readonly {
    readonly amountWei: string;
    readonly recipient: string;
  }[];
  readonly approvalFeeCaps: readonly {
    readonly label: string;
    readonly amountWei: string | null;
  }[];
  readonly contractFacts: readonly CollectReviewFact[];
}

export interface CollectTradeReview {
  readonly id: string;
  readonly revision: string;
  readonly action: CollectTradeAction;
  readonly title: string;
  readonly media?: ReactNode;
  readonly purchase?: CollectPurchaseReviewView | undefined;
  readonly facts: readonly CollectReviewFact[];
  readonly technicalFacts: readonly CollectReviewFact[];
  readonly totalLabel: string;
  readonly totalDescription: string;
  readonly warnings: readonly string[];
  readonly expiresAt: number | null;
  readonly disabledReason?: string | undefined;
}

export interface CollectOrderView {
  readonly id: string;
  readonly title: string;
  readonly tokenLabel: string;
  readonly media?: ReactNode;
  readonly action: CollectTradeAction;
  readonly statusLabel: string;
  readonly detail: string;
  readonly amountLabel: string;
  readonly makerLabel: string;
  readonly updatedLabel: string;
  readonly cancellable: boolean;
  readonly cancelDisabledReason?: string | undefined;
}

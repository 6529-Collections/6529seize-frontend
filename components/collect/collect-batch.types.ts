import type { CollectSelectedListing } from "./collect-selection.helpers";

export interface CollectBatchAllocation {
  readonly recipient: string;
  readonly quantity: string;
  readonly acknowledgeExternalRecipient: boolean;
}

export interface CollectBatchDraftItem extends CollectSelectedListing {
  readonly allocations: readonly CollectBatchAllocation[];
}

/** Explicit delivery intent; exact pricing and execution are validated separately. */
export interface CollectBatchDraft {
  readonly items: readonly CollectBatchDraftItem[];
}

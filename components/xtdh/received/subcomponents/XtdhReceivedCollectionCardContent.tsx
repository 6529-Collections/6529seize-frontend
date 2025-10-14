'use client';

import type { XtdhReceivedCollectionSummary } from "@/types/xtdh";

import { XTDH_RECEIVED_COLLECTION_EMPTY_MESSAGE } from "./XtdhReceivedCollectionCard.constants";
import { XtdhReceivedEmptyState } from "./XtdhReceivedEmptyState";
import { XtdhReceivedNftCard } from "./XtdhReceivedNftCard";
import { useXtdhReceivedCollectionTokens } from "../hooks/useXtdhReceivedCollectionTokens";

export interface XtdhReceivedCollectionCardContentProps {
  readonly collection: XtdhReceivedCollectionSummary;
}

/**
 * Handles the expanded body of the collection card with token-level details.
 */
export function XtdhReceivedCollectionCardContent({
  collection,
}: XtdhReceivedCollectionCardContentProps) {
  const tokens = useXtdhReceivedCollectionTokens(collection);

  return (
    <div className="tw-border-t tw-border-iron-850 tw-px-4 tw-py-4 tw-space-y-3">
      {tokens.length === 0 ? (
        <XtdhReceivedEmptyState message={XTDH_RECEIVED_COLLECTION_EMPTY_MESSAGE} />
      ) : (
        tokens.map((nft) => (
          <XtdhReceivedNftCard
            key={nft.tokenId}
            nft={nft}
            showCollectionName={false}
          />
        ))
      )}
    </div>
  );
}

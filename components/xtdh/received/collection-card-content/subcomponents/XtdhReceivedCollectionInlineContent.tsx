'use client';

import type { XtdhReceivedNft } from "@/types/xtdh";

import { XTDH_RECEIVED_COLLECTION_EMPTY_MESSAGE } from "../../subcomponents/XtdhReceivedCollectionCard.constants";
import { XtdhReceivedEmptyState } from "../../subcomponents/XtdhReceivedEmptyState";
import { XtdhReceivedCollectionTokenDetailsDrawer } from "./XtdhReceivedCollectionTokenDetailsDrawer";
import { XtdhReceivedCollectionTokensTable } from "./XtdhReceivedCollectionTokensTable";

export interface XtdhReceivedCollectionInlineContentProps {
  readonly tokens: readonly XtdhReceivedNft[];
  readonly activeToken: XtdhReceivedNft | null;
  readonly activeTokenId: string | null;
  readonly detailsRegionId: string;
  readonly onSelectToken: (tokenId: string) => void;
  readonly onCloseDetails: () => void;
}

export function XtdhReceivedCollectionInlineContent({
  tokens,
  activeToken,
  activeTokenId,
  detailsRegionId,
  onSelectToken,
  onCloseDetails,
}: XtdhReceivedCollectionInlineContentProps) {
  if (tokens.length === 0) {
    return (
      <div className="tw-border-t tw-border-iron-850 tw-bg-iron-975/30 tw-px-4 tw-py-6">
        <XtdhReceivedEmptyState message={XTDH_RECEIVED_COLLECTION_EMPTY_MESSAGE} />
      </div>
    );
  }

  return (
    <>
      <div className="tw-flex tw-flex-col tw-gap-6 tw-border-t tw-border-iron-850 tw-bg-iron-975/20 tw-px-4 tw-pb-5 tw-pt-4">
        <XtdhReceivedCollectionTokensTable
          tokens={tokens}
          activeTokenId={activeTokenId}
          onSelectToken={onSelectToken}
          detailsRegionId={detailsRegionId}
        />
      </div>
      {activeToken && (
        <XtdhReceivedCollectionTokenDetailsDrawer
          token={activeToken}
          detailsRegionId={detailsRegionId}
          onClose={onCloseDetails}
        />
      )}
    </>
  );
}

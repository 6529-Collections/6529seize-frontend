'use client';

import type { XtdhReceivedNft } from "@/types/xtdh";

import { XTDH_RECEIVED_COLLECTION_EMPTY_MESSAGE } from "../../subcomponents/XtdhReceivedCollectionCard.constants";
import { XtdhReceivedEmptyState } from "../../subcomponents/XtdhReceivedEmptyState";
import { XtdhReceivedCollectionTokenDetails } from "./XtdhReceivedCollectionTokenDetails";
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
    <div className="tw-grid tw-gap-6 tw-border-t tw-border-iron-850 tw-bg-iron-975/20 tw-px-4 tw-pb-5 tw-pt-4 xl:tw-grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
      <XtdhReceivedCollectionTokensTable
        tokens={tokens}
        activeTokenId={activeTokenId}
        onSelectToken={onSelectToken}
        detailsRegionId={detailsRegionId}
      />
      <div className="tw-hidden xl:tw-block">
        {activeToken ? (
          <XtdhReceivedCollectionTokenDetails
            token={activeToken}
            detailsRegionId={detailsRegionId}
            onClose={onCloseDetails}
          />
        ) : (
          <div className="tw-flex tw-h-full tw-items-center tw-justify-center tw-rounded-xl tw-border tw-border-dashed tw-border-iron-850/70 tw-bg-iron-950/40 tw-p-6">
            <span className="tw-text-sm tw-text-iron-300">
              Select a token to review grantors.
            </span>
          </div>
        )}
      </div>
      <div className="tw-block xl:tw-hidden">
        {activeToken && (
          <XtdhReceivedCollectionTokenDetails
            token={activeToken}
            detailsRegionId={detailsRegionId}
            onClose={onCloseDetails}
          />
        )}
      </div>
    </div>
  );
}

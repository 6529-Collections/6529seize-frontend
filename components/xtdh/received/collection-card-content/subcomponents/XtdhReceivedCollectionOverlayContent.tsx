'use client';

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

import type { XtdhReceivedNft } from "@/types/xtdh";

import { useXtdhReceivedBodyScrollLock } from "../hooks/useXtdhReceivedBodyScrollLock";
import { XTDH_RECEIVED_COLLECTION_EMPTY_MESSAGE } from "../../subcomponents/XtdhReceivedCollectionCard.constants";
import { XtdhReceivedEmptyState } from "../../subcomponents/XtdhReceivedEmptyState";
import { XtdhReceivedCollectionTokenDetails } from "./XtdhReceivedCollectionTokenDetails";
import { XtdhReceivedCollectionTokensTable } from "./XtdhReceivedCollectionTokensTable";

export interface XtdhReceivedCollectionOverlayContentProps {
  readonly collectionName: string;
  readonly tokens: readonly XtdhReceivedNft[];
  readonly activeToken: XtdhReceivedNft | null;
  readonly activeTokenId: string | null;
  readonly detailsRegionId: string;
  readonly onSelectToken: (tokenId: string) => void;
  readonly onClose: () => void;
  readonly onCloseDetails: () => void;
}

export function XtdhReceivedCollectionOverlayContent({
  collectionName,
  tokens,
  activeToken,
  activeTokenId,
  detailsRegionId,
  onSelectToken,
  onClose,
  onCloseDetails,
}: XtdhReceivedCollectionOverlayContentProps) {
  useXtdhReceivedBodyScrollLock(true);

  const emptyState = (
    <div className="tw-flex tw-h-full tw-items-center tw-justify-center tw-px-6">
      <XtdhReceivedEmptyState message={XTDH_RECEIVED_COLLECTION_EMPTY_MESSAGE} />
    </div>
  );

  return (
    <div className="tw-fixed tw-inset-0 tw-z-50 tw-flex tw-flex-col tw-bg-iron-1000/90 tw-backdrop-blur-sm">
      <div className="tw-flex tw-items-center tw-justify-between tw-border-b tw-border-iron-900/80 tw-bg-iron-950 tw-px-4 tw-py-3">
        <div className="tw-flex tw-flex-col tw-gap-1">
          <span className="tw-text-sm tw-font-semibold tw-text-iron-50">
            {collectionName}
          </span>
          <span className="tw-text-xxs tw-uppercase tw-text-iron-400">
            Tokens receiving xTDH
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="tw-inline-flex tw-h-9 tw-w-9 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-iron-800 tw-text-iron-300 tw-transition tw-duration-150 tw-ease-out hover:tw-text-iron-100 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950"
          aria-label="Close collection details"
        >
          <FontAwesomeIcon icon={faXmark} className="tw-h-4 tw-w-4" />
        </button>
      </div>
      <div className="tw-flex-1 tw-overflow-y-auto tw-px-4 tw-py-5 tw-scrollbar-thin tw-scrollbar-thumb-iron-800">
        {tokens.length === 0 ? (
          emptyState
        ) : (
          <div className="tw-flex tw-flex-col tw-gap-5">
            <XtdhReceivedCollectionTokensTable
              tokens={tokens}
              activeTokenId={activeTokenId}
              onSelectToken={onSelectToken}
              detailsRegionId={detailsRegionId}
            />
            {activeToken && (
              <XtdhReceivedCollectionTokenDetails
                token={activeToken}
                detailsRegionId={detailsRegionId}
                onClose={onCloseDetails}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import type { XtdhReceivedCollectionSummary, XtdhReceivedNft } from "@/types/xtdh";
import { formatXtdhRate, formatXtdhTotal } from "../utils";
import { XtdhReceivedGranterAvatarGroup } from "./XtdhReceivedGranterAvatarGroup";
import { XtdhReceivedNftCard } from "./XtdhReceivedNftCard";
import { XtdhReceivedEmptyState } from "./XtdhReceivedEmptyState";

export interface XtdhReceivedCollectionCardProps {
  readonly collection: XtdhReceivedCollectionSummary;
  readonly expanded: boolean;
  readonly onToggle: () => void;
}

export function XtdhReceivedCollectionCard({
  collection,
  expanded,
  onToggle,
}: XtdhReceivedCollectionCardProps) {
  return (
    <div
      className="tw-rounded-2xl tw-border tw-border-iron-800 tw-bg-iron-950 tw-p-4"
      role="listitem"
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-label={`Toggle ${collection.collectionName} collection`}
        className="tw-w-full tw-rounded-xl tw-border tw-border-iron-800 tw-bg-iron-900 tw-p-4 tw-text-left tw-transition tw-duration-300 tw-ease-out hover:tw-border-iron-600"
      >
        <div className="tw-flex tw-flex-col md:tw-flex-row md:tw-items-center md:tw-justify-between tw-gap-4">
          <div className="tw-flex tw-items-center tw-gap-3">
            <img
              src={collection.collectionImage}
              alt={`${collection.collectionName} artwork`}
              className="tw-h-14 tw-w-14 tw-rounded-xl tw-object-cover tw-border tw-border-iron-700"
              loading="lazy"
            />
            <div className="tw-flex tw-flex-col tw-gap-1">
              <span className="tw-text-base tw-font-semibold tw-text-iron-50">
                {collection.collectionName}
              </span>
              <span className="tw-text-xs tw-text-iron-300">
                {collection.tokenCount.toLocaleString()} tokens receiving xTDH
              </span>
            </div>
          </div>
          <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-4">
            <div className="tw-flex tw-flex-col tw-gap-1">
              <span className="tw-text-[11px] tw-font-semibold tw-uppercase tw-text-iron-400">
                Total xTDH Rate
              </span>
              <span className="tw-text-sm tw-font-semibold tw-text-iron-100">
                {formatXtdhRate(collection.totalXtdhRate)}
              </span>
            </div>
            <div className="tw-flex tw-flex-col tw-gap-1">
              <span className="tw-text-[11px] tw-font-semibold tw-uppercase tw-text-iron-400">
                Total Received
              </span>
              <span className="tw-text-sm tw-font-semibold tw-text-iron-100">
                {formatXtdhTotal(collection.totalXtdhReceived)}
              </span>
            </div>
            <XtdhReceivedGranterAvatarGroup
              granters={collection.granters}
            />
            <span
              className="tw-ml-auto tw-inline-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-iron-700 tw-bg-iron-850 tw-text-sm tw-text-iron-200"
              aria-hidden
            >
              {expanded ? "−" : "+"}
            </span>
          </div>
        </div>
      </button>
      {expanded && (
        <div className="tw-mt-4 tw-space-y-3">
          {collection.tokens.length === 0 ? (
            <XtdhReceivedEmptyState message="No tokens found in this collection." />
          ) : (
            collection.tokens.map((token) => {
              const nftForCard: XtdhReceivedNft = {
                ...token,
                collectionId: collection.collectionId,
                collectionName: collection.collectionName,
                collectionImage: collection.collectionImage,
              };

              return (
                <XtdhReceivedNftCard
                  key={token.tokenId}
                  nft={nftForCard}
                  showCollectionName={false}
                />
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

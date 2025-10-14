'use client';

import clsx from "clsx";

import type { XtdhReceivedCollectionSummary, XtdhReceivedNft } from "@/types/xtdh";

import { XTDH_RECEIVED_COLLECTION_EMPTY_MESSAGE } from "../../subcomponents/XtdhReceivedCollectionCard.constants";
import { XtdhReceivedEmptyState } from "../../subcomponents/XtdhReceivedEmptyState";
import type {
  XtdhReceivedTokenSortDirection,
  XtdhReceivedTokenSortKey,
} from "../hooks/useXtdhReceivedTokenSorting";
import { XtdhReceivedCollectionTokenDetailsDrawer } from "./XtdhReceivedCollectionTokenDetailsDrawer";
import { XtdhReceivedCollectionTokensTable } from "./XtdhReceivedCollectionTokensTable";

export interface XtdhReceivedCollectionInlineContentProps {
  readonly collection: XtdhReceivedCollectionSummary;
  readonly tokens: readonly XtdhReceivedNft[];
  readonly activeToken: XtdhReceivedNft | null;
  readonly activeTokenId: string | null;
  readonly detailsRegionId: string;
  readonly onSelectToken: (tokenId: string) => void;
  readonly onCloseDetails: () => void;
  readonly sortKey: XtdhReceivedTokenSortKey;
  readonly sortDirection: XtdhReceivedTokenSortDirection;
  readonly onRequestSort: (key: XtdhReceivedTokenSortKey) => void;
  readonly onCollapse: () => void;
}

export function XtdhReceivedCollectionInlineContent({
  collection,
  tokens,
  activeToken,
  activeTokenId,
  detailsRegionId,
  onSelectToken,
  onCloseDetails,
  sortKey,
  sortDirection,
  onRequestSort,
  onCollapse,
}: XtdhReceivedCollectionInlineContentProps) {
  const activeCount = tokens.length;
  const totalTokens = collection.tokenCount;
  const ratioActive =
    typeof totalTokens === "number" && totalTokens > 0
      ? `${activeCount.toLocaleString()}/${totalTokens.toLocaleString()} active`
      : null;

  return (
    <>
      <div
        className={clsx(
          "tw-relative tw-border-t tw-border-iron-900/70 tw-bg-iron-975/25",
          "tw-motion-safe:tw-transition tw-motion-safe:tw-duration-200 tw-motion-safe:tw-ease-out",
        )}
      >
        <span
          aria-hidden="true"
          className="tw-absolute tw-left-0 tw-top-0 tw-h-full tw-w-[3px] tw-bg-primary-500/70"
        />
        <XtdhReceivedCollectionTokensTable
          tone="inline"
          headerLabel={`TOKENS (${activeCount.toLocaleString()} active)`}
          headerCaption={ratioActive ?? undefined}
          tokens={tokens}
          activeTokenId={activeTokenId}
          onSelectToken={onSelectToken}
          detailsRegionId={detailsRegionId}
          emptyState={
            <div className="tw-flex tw-h-48 tw-items-center tw-justify-center">
              <XtdhReceivedEmptyState
                message={XTDH_RECEIVED_COLLECTION_EMPTY_MESSAGE}
              />
            </div>
          }
          sortKey={sortKey}
          sortDirection={sortDirection}
          onRequestSort={onRequestSort}
          onCollapse={onCollapse}
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

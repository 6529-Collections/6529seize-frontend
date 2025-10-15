'use client';

import { createPortal } from "react-dom";

import type { XtdhReceivedCollectionSummary } from "@/types/xtdh";

import { useXtdhReceivedCollectionTokens } from "../hooks/useXtdhReceivedCollectionTokens";
import { useXtdhReceivedTokenSorting } from "./hooks/useXtdhReceivedTokenSorting";
import { XtdhReceivedCollectionInlineContent } from "./subcomponents/XtdhReceivedCollectionInlineContent";
import { XtdhReceivedCollectionOverlayContent } from "./subcomponents/XtdhReceivedCollectionOverlayContent";
import { useXtdhReceivedActiveToken } from "./hooks/useXtdhReceivedActiveToken";
import { useXtdhReceivedClientReady } from "./hooks/useXtdhReceivedClientReady";
import { useXtdhReceivedIsMobile } from "./hooks/useXtdhReceivedBreakpoint";

export interface XtdhReceivedCollectionCardContentProps {
  readonly collection: XtdhReceivedCollectionSummary;
  readonly onClose: () => void;
}

export function XtdhReceivedCollectionCardContent({
  collection,
  onClose,
}: XtdhReceivedCollectionCardContentProps) {
  const tokens = useXtdhReceivedCollectionTokens(collection);
  const { sortedTokens, sortKey, sortDirection, requestSort } =
    useXtdhReceivedTokenSorting(tokens);
  const { activeToken, activeTokenId, selectToken, clearSelection } =
    useXtdhReceivedActiveToken(sortedTokens);
  const isMobile = useXtdhReceivedIsMobile();
  const clientReady = useXtdhReceivedClientReady();

  const detailsRegionId = `collection-${collection.collectionId}-token-details`;

  if (isMobile) {
    if (!clientReady || typeof document === "undefined") {
      return null;
    }

    return createPortal(
      <XtdhReceivedCollectionOverlayContent
        collectionName={collection.collectionName}
        collection={collection}
        tokens={sortedTokens}
        activeToken={activeToken}
        activeTokenId={activeTokenId}
        onSelectToken={selectToken}
        detailsRegionId={detailsRegionId}
        onClose={onClose}
        onCloseDetails={clearSelection}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onRequestSort={requestSort}
      />,
      document.body,
    );
  }

  return (
    <XtdhReceivedCollectionInlineContent
      collection={collection}
      tokens={sortedTokens}
      activeToken={activeToken}
      activeTokenId={activeTokenId}
      onSelectToken={selectToken}
      detailsRegionId={detailsRegionId}
      onCloseDetails={clearSelection}
      sortKey={sortKey}
      sortDirection={sortDirection}
      onRequestSort={requestSort}
    />
  );
}

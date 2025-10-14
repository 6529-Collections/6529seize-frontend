'use client';

import { createPortal } from "react-dom";

import type { XtdhReceivedCollectionSummary } from "@/types/xtdh";

import { useXtdhReceivedCollectionTokens } from "../hooks/useXtdhReceivedCollectionTokens";
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
  const { activeToken, activeTokenId, selectToken, clearSelection } =
    useXtdhReceivedActiveToken(tokens);
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
        tokens={tokens}
        activeToken={activeToken}
        activeTokenId={activeTokenId}
        onSelectToken={selectToken}
        detailsRegionId={detailsRegionId}
        onClose={onClose}
        onCloseDetails={clearSelection}
      />,
      document.body,
    );
  }

  return (
    <XtdhReceivedCollectionInlineContent
      tokens={tokens}
      activeToken={activeToken}
      activeTokenId={activeTokenId}
      onSelectToken={selectToken}
      detailsRegionId={detailsRegionId}
      onCloseDetails={clearSelection}
    />
  );
}

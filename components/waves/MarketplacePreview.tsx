"use client";

import type { ReactElement } from "react";

import { useInView } from "@/hooks/useInView";
import MarketplaceFoundationMintPreview from "./marketplace/MarketplaceFoundationMintPreview";
import MarketplaceManifoldListingPreview from "./marketplace/MarketplaceManifoldListingPreview";
import MarketplaceOpenseaAssetPreview from "./marketplace/MarketplaceOpenseaAssetPreview";
import MarketplaceOpenseaItemPreview from "./marketplace/MarketplaceOpenseaItemPreview";
import MarketplacePreviewPlaceholder from "./marketplace/MarketplacePreviewPlaceholder";
import MarketplaceSuperrareArtworkPreview from "./marketplace/MarketplaceSuperrareArtworkPreview";
import MarketplaceTransientMintPreview from "./marketplace/MarketplaceTransientMintPreview";
import MarketplaceTransientNftPreview from "./marketplace/MarketplaceTransientNftPreview";
import MarketplaceUnavailableCard from "./marketplace/MarketplaceUnavailableCard";
import { getMarketplaceUrlKind } from "./marketplace/urlKind";

const MARKETPLACE_PREVIEW_IN_VIEW_OPTIONS: IntersectionObserverInit = {
  rootMargin: "500px 0px",
  threshold: 0,
};

interface MarketplacePreviewProps {
  readonly href: string;
  readonly compact?: boolean | undefined;
}

export default function MarketplacePreview({
  href,
  compact = false,
}: MarketplacePreviewProps) {
  const [containerRef, isVisible] = useInView<HTMLDivElement>(
    MARKETPLACE_PREVIEW_IN_VIEW_OPTIONS
  );
  const kind = getMarketplaceUrlKind(href);

  let content: ReactElement;

  if (isVisible) {
    switch (kind) {
      case "manifold.listing":
        content = (
          <MarketplaceManifoldListingPreview href={href} compact={compact} />
        );
        break;
      case "superrare.artwork":
        content = (
          <MarketplaceSuperrareArtworkPreview href={href} compact={compact} />
        );
        break;
      case "foundation.mint":
        content = (
          <MarketplaceFoundationMintPreview href={href} compact={compact} />
        );
        break;
      case "opensea.item":
        content = (
          <MarketplaceOpenseaItemPreview href={href} compact={compact} />
        );
        break;
      case "opensea.asset":
        content = (
          <MarketplaceOpenseaAssetPreview href={href} compact={compact} />
        );
        break;
      case "transient.nft":
        content = (
          <MarketplaceTransientNftPreview href={href} compact={compact} />
        );
        break;
      case "transient.mint":
        content = (
          <MarketplaceTransientMintPreview href={href} compact={compact} />
        );
        break;
      case null:
        content = <MarketplaceUnavailableCard href={href} compact={compact} />;
        break;
    }
  } else {
    content = <MarketplacePreviewPlaceholder href={href} compact={compact} />;
  }

  return <div ref={containerRef}>{content}</div>;
}

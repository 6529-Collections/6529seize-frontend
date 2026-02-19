"use client";

import MarketplaceItemPreviewCard from "../MarketplaceItemPreviewCard";
import MarketplacePreviewPlaceholder from "./MarketplacePreviewPlaceholder";
import MarketplaceUnavailableCard from "./MarketplaceUnavailableCard";
import type { MarketplaceTypePreviewProps } from "./common";
import { useMarketplacePreviewState } from "./useMarketplacePreviewState";

export default function MarketplaceManifoldListingPreview({
  href,
  compact = false,
}: MarketplaceTypePreviewProps) {
  const state = useMarketplacePreviewState({ href });

  if (state.href !== href || state.type === "loading") {
    return <MarketplacePreviewPlaceholder href={href} compact={compact} />;
  }

  if (state.type === "error") {
    return <MarketplaceUnavailableCard href={href} compact={compact} />;
  }

  const media = state.resolvedMedia;

  if (media) {
    return (
      <MarketplaceItemPreviewCard
        href={href}
        mediaUrl={media.url}
        mediaMimeType={media.mimeType}
        price={state.resolvedPrice}
        compact={compact}
        hideActions={compact}
      />
    );
  }

  return <MarketplaceUnavailableCard href={href} compact={compact} />;
}

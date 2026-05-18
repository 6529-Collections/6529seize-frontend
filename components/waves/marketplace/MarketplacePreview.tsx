"use client";

import MarketplaceItemPreviewCard from "../MarketplaceItemPreviewCard";
import MarketplacePreviewPlaceholder from "./MarketplacePreviewPlaceholder";
import MarketplaceUnavailableCard from "./MarketplaceUnavailableCard";
import type {
  MarketplacePreviewMode,
  MarketplaceTypePreviewProps,
} from "./common";
import { useMarketplacePreviewState } from "./useMarketplacePreviewState";

interface MarketplacePreviewProps extends MarketplaceTypePreviewProps {
  readonly mode?: MarketplacePreviewMode | undefined;
}

export default function MarketplacePreview({
  href,
  compact = false,
  mode,
}: MarketplacePreviewProps) {
  const state = useMarketplacePreviewState({ href, mode });

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
        priceCurrency={state.resolvedPriceCurrency}
        title={state.resolvedTitle}
        dataHealth={state.resolvedDataHealth}
        compact={compact}
        hideActions={compact}
      />
    );
  }

  return <MarketplaceUnavailableCard href={href} compact={compact} />;
}

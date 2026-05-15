"use client";

import type { MarketplaceTypePreviewProps } from "./common";
import MarketplacePreview from "./MarketplacePreview";

export default function MarketplaceManifoldListingPreview({
  href,
  compact = false,
}: MarketplaceTypePreviewProps) {
  return <MarketplacePreview href={href} compact={compact} />;
}

"use client";

import OpenGraphPreview from "./OpenGraphPreview";
import MarketplaceFoundationMintPreview from "./marketplace/MarketplaceFoundationMintPreview";
import MarketplaceManifoldListingPreview from "./marketplace/MarketplaceManifoldListingPreview";
import MarketplaceOpenseaAssetPreview from "./marketplace/MarketplaceOpenseaAssetPreview";
import MarketplaceOpenseaItemPreview from "./marketplace/MarketplaceOpenseaItemPreview";
import MarketplaceSuperrareArtworkPreview from "./marketplace/MarketplaceSuperrareArtworkPreview";
import MarketplaceTransientMintPreview from "./marketplace/MarketplaceTransientMintPreview";
import MarketplaceTransientNftPreview from "./marketplace/MarketplaceTransientNftPreview";
import { getMarketplaceUrlKind } from "./marketplace/urlKind";

interface MarketplacePreviewProps {
  readonly href: string;
  readonly imageOnly?: boolean | undefined;
}

export default function MarketplacePreview({
  href,
  imageOnly = false,
}: MarketplacePreviewProps) {
  const kind = getMarketplaceUrlKind(href);

  switch (kind) {
    case "manifold.listing":
      return (
        <MarketplaceManifoldListingPreview href={href} imageOnly={imageOnly} />
      );
    case "superrare.artwork":
      return (
        <MarketplaceSuperrareArtworkPreview href={href} imageOnly={imageOnly} />
      );
    case "foundation.mint":
      return (
        <MarketplaceFoundationMintPreview href={href} imageOnly={imageOnly} />
      );
    case "opensea.item":
      return (
        <MarketplaceOpenseaItemPreview href={href} imageOnly={imageOnly} />
      );
    case "opensea.asset":
      return (
        <MarketplaceOpenseaAssetPreview href={href} imageOnly={imageOnly} />
      );
    case "transient.nft":
      return (
        <MarketplaceTransientNftPreview href={href} imageOnly={imageOnly} />
      );
    case "transient.mint":
      return (
        <MarketplaceTransientMintPreview href={href} imageOnly={imageOnly} />
      );
    case null:
      return (
        <OpenGraphPreview
          href={href}
          preview={undefined}
          imageOnly={imageOnly}
          hideActions={imageOnly}
        />
      );
  }
}


import { removeBaseEndpoint } from "@/helpers/Helpers";

import { getMarketplaceUrlKind } from "./urlKind";

import type {
  MarketplaceBrand,
  ResolvedPreviewHref,
} from "./MarketplaceItemPreviewCard.types";
import type { MouseEvent } from "react";

interface BuildMarketplaceCtaLabelParams {
  readonly normalizedPrice: string;
  readonly marketplaceBrand: MarketplaceBrand | null;
}

export const resolvePreviewHref = (href: string): ResolvedPreviewHref => {
  const relative = removeBaseEndpoint(href);
  if (typeof relative === "string" && relative.startsWith("/")) {
    return { href: relative };
  }

  return {
    href,
    target: "_blank",
    rel: "noopener noreferrer",
  };
};

export const stopPropagation = (event: MouseEvent<HTMLElement>) => {
  event.stopPropagation();
  event.preventDefault();
};

export const getMarketplaceBrand = (href: string): MarketplaceBrand | null => {
  const kind = getMarketplaceUrlKind(href);

  switch (kind) {
    case "manifold.listing":
      return { displayName: "Manifold", logoSrc: "/manifold.png" };
    case "superrare.artwork":
      return { displayName: "SuperRare", logoSrc: "/superrare-icon.png" };
    case "foundation.mint":
      return { displayName: "Foundation", logoSrc: "/foundation.png" };
    case "opensea.item":
    case "opensea.asset":
      return { displayName: "OpenSea", logoSrc: "/opensea.png" };
    case "transient.nft":
    case "transient.mint":
      return { displayName: "Transient", logoSrc: "/transient.png" };
    case null:
      return null;
  }
};

export const buildMarketplaceCtaLabel = ({
  normalizedPrice,
  marketplaceBrand,
}: BuildMarketplaceCtaLabelParams): string => {
  const hasPrice = normalizedPrice.length > 0;

  if (hasPrice) {
    if (marketplaceBrand) {
      return `Open on ${marketplaceBrand.displayName} - ${normalizedPrice}`;
    }

    return `Open listing - ${normalizedPrice}`;
  }

  if (marketplaceBrand) {
    return `Open on ${marketplaceBrand.displayName}`;
  }

  return "Open listing";
};

import MarketplacePreview from "@/components/waves/MarketplacePreview";
import { isNftMarketplaceLink } from "@/components/waves/marketplace/urlKind";

import type { LinkHandler } from "../linkTypes";

export const createNftMarketplacesHandler = (options?: {
  readonly marketplaceImageOnly?: boolean;
}): LinkHandler => ({
  match: isNftMarketplaceLink,
  render: (href) => (
    <MarketplacePreview href={href} imageOnly={options?.marketplaceImageOnly} />
  ),
  display: "block",
});

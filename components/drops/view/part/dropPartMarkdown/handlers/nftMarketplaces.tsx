import MarketplacePreview from "@/components/waves/MarketplacePreview";
import { isNftMarketplaceLink } from "@/components/waves/marketplace/urlKind";

import type { LinkHandler } from "../linkTypes";

export const createNftMarketplacesHandler = (options?: {
  readonly marketplaceCompact?: boolean;
}): LinkHandler => ({
  match: isNftMarketplaceLink,
  render: (href) => (
    <MarketplacePreview href={href} compact={options?.marketplaceCompact} />
  ),
  display: "block",
});

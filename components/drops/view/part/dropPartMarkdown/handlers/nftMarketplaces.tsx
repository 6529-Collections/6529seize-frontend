import { isNftMarketplaceLink } from "@/components/waves/marketplace/urlKind";
import MarketplacePreview from "@/components/waves/MarketplacePreview";

import type { LinkHandler } from "../linkTypes";

export const createNftMarketplacesHandler = (): LinkHandler => ({
  match: isNftMarketplaceLink,
  render: (href) => <MarketplacePreview href={href} />,
  display: "block",
});

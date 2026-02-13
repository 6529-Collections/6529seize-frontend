import MarketplacePreview from "@/components/waves/MarketplacePreview";
import { matchesDomainOrSubdomain } from "@/lib/url/domains";

import type { LinkHandler } from "../linkTypes";

const MANIFOLD_LISTING_PATH_PATTERN = /^\/@[^/]+\/id\/[^/?#]+\/?$/i;
const SUPER_RARE_ARTWORK_PATH_PATTERN =
  /^\/artwork\/[^/]+\/0x[a-f0-9]{40}\/[^/?#]+\/?$/i;
const SUPER_RARE_ARTWORK_V2_PATH_PATTERN = /^\/artwork-v2\/[^/?#]+\/?$/i;
const FOUNDATION_MINT_PATH_PATTERN =
  /^\/mint\/[^/]+\/0x[a-f0-9]{40}\/[^/?#]+\/?$/i;
const OPENSEA_ITEM_PATH_PATTERN =
  /^\/item\/[^/]+\/0x[a-f0-9]{40}\/[^/?#]+\/?$/i;
const OPENSEA_ASSET_PATH_PATTERN =
  /^\/assets\/[^/]+\/0x[a-f0-9]{40}\/[^/?#]+\/?$/i;
const TRANSIENT_NFT_PATH_PATTERN =
  /^\/nfts\/[^/]+\/0x[a-f0-9]{40}\/[^/?#]+\/?$/i;

const isSuperRareArtworkPath = (pathname: string): boolean =>
  SUPER_RARE_ARTWORK_PATH_PATTERN.test(pathname) ||
  SUPER_RARE_ARTWORK_V2_PATH_PATTERN.test(pathname);

const isFoundationMintPath = (pathname: string): boolean =>
  FOUNDATION_MINT_PATH_PATTERN.test(pathname);

const isOpenSeaItemPath = (pathname: string): boolean =>
  OPENSEA_ITEM_PATH_PATTERN.test(pathname) ||
  OPENSEA_ASSET_PATH_PATTERN.test(pathname);

const isTransientItemPath = (pathname: string): boolean =>
  TRANSIENT_NFT_PATH_PATTERN.test(pathname);

const isManifoldListingPath = (pathname: string): boolean =>
  MANIFOLD_LISTING_PATH_PATTERN.test(pathname);

const isNftMarketplaceLink = (href: string): boolean => {
  try {
    const url = new URL(href);
    const hostname = url.hostname.toLowerCase();
    const pathname = url.pathname;

    if (matchesDomainOrSubdomain(hostname, "manifold.xyz")) {
      return isManifoldListingPath(pathname);
    }

    if (matchesDomainOrSubdomain(hostname, "superrare.com")) {
      return isSuperRareArtworkPath(pathname);
    }

    if (matchesDomainOrSubdomain(hostname, "foundation.app")) {
      return isFoundationMintPath(pathname);
    }

    if (matchesDomainOrSubdomain(hostname, "opensea.io")) {
      return isOpenSeaItemPath(pathname);
    }

    if (matchesDomainOrSubdomain(hostname, "transient.xyz")) {
      return isTransientItemPath(pathname);
    }

    return false;
  } catch {
    return false;
  }
};

export const createNftMarketplacesHandler = (options?: {
  readonly marketplaceImageOnly?: boolean;
}): LinkHandler => ({
  match: isNftMarketplaceLink,
  render: (href) => (
    <MarketplacePreview href={href} imageOnly={options?.marketplaceImageOnly} />
  ),
  display: "block",
});

import MarketplacePreview from "@/components/waves/MarketplacePreview";

import type { LinkHandler } from "../linkTypes";

const MANIFOLD_LISTING_PATH_PATTERN = /^\/@[^/]+\/id\/[^/?#]+\/?$/i;
const SUPER_RARE_ARTWORK_PATH_PATTERN =
  /^\/artwork\/eth\/0x[a-f0-9]{40}\/[^/?#]+\/?$/i;
const FOUNDATION_MINT_PATH_PATTERN =
  /^\/mint\/eth\/0x[a-f0-9]{40}\/[^/?#]+\/?$/i;
const OPENSEA_ITEM_PATH_PATTERN =
  /^\/item\/ethereum\/0x[a-f0-9]{40}\/[^/?#]+\/?$/i;
const OPENSEA_ASSET_PATH_PATTERN =
  /^\/assets\/ethereum\/0x[a-f0-9]{40}\/[^/?#]+\/?$/i;
const TRANSIENT_NFT_PATH_PATTERN =
  /^\/nfts\/ethereum\/0x[a-f0-9]{40}\/[^/?#]+\/?$/i;
const TRANSIENT_MINT_PATH_PATTERN = /^\/mint\/[^/?#]+\/?$/i;

const MANIFOLD_HOST = "manifold.xyz";
const SUPER_RARE_HOST = "superrare.com";
const FOUNDATION_HOST = "foundation.app";
const OPENSEA_HOST = "opensea.io";
const TRANSIENT_HOST = "transient.xyz";

const isApexOrWwwHost = (hostname: string, domain: string): boolean =>
  hostname === domain || hostname === `www.${domain}`;

const isSuperRareArtworkPath = (pathname: string): boolean =>
  SUPER_RARE_ARTWORK_PATH_PATTERN.test(pathname);

const isFoundationMintPath = (pathname: string): boolean =>
  FOUNDATION_MINT_PATH_PATTERN.test(pathname);

const isOpenSeaItemPath = (pathname: string): boolean =>
  OPENSEA_ITEM_PATH_PATTERN.test(pathname) ||
  OPENSEA_ASSET_PATH_PATTERN.test(pathname);

const isTransientPath = (pathname: string): boolean =>
  TRANSIENT_NFT_PATH_PATTERN.test(pathname) ||
  TRANSIENT_MINT_PATH_PATTERN.test(pathname);

const isManifoldListingPath = (pathname: string): boolean =>
  MANIFOLD_LISTING_PATH_PATTERN.test(pathname);

const isNftMarketplaceLink = (href: string): boolean => {
  try {
    const url = new URL(href);
    if (url.protocol !== "https:") {
      return false;
    }

    const hostname = url.hostname.toLowerCase();
    const pathname = url.pathname;

    if (isApexOrWwwHost(hostname, MANIFOLD_HOST)) {
      return isManifoldListingPath(pathname);
    }

    if (isApexOrWwwHost(hostname, SUPER_RARE_HOST)) {
      return isSuperRareArtworkPath(pathname);
    }

    if (isApexOrWwwHost(hostname, FOUNDATION_HOST)) {
      return isFoundationMintPath(pathname);
    }

    if (isApexOrWwwHost(hostname, OPENSEA_HOST)) {
      return isOpenSeaItemPath(pathname);
    }

    if (isApexOrWwwHost(hostname, TRANSIENT_HOST)) {
      return isTransientPath(pathname);
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

type MarketplaceUrlKind =
  | "manifold.listing"
  | "superrare.artwork"
  | "foundation.mint"
  | "gammaio.collection"
  | "gammaio.collection-token"
  | "gammaio.inscription"
  | "gammaio.ordinal"
  | "gammaio.ordinal-inscription"
  | "gammaio.ordinal-collection-inscription"
  | "gammaio.stacks-nft"
  | "opensea.item"
  | "opensea.asset"
  | "transient.nft"
  | "transient.mint";

const MANIFOLD_LISTING_PATH_PATTERN = /^\/@[^/]+\/id\/[^/?#]+\/?$/i;
const SUPER_RARE_ARTWORK_PATH_PATTERN =
  /^\/artwork\/eth\/0x[a-f0-9]{40}\/[^/?#]+\/?$/i;
const FOUNDATION_MINT_PATH_PATTERN =
  /^\/mint\/eth\/0x[a-f0-9]{40}\/[^/?#]+\/?$/i;
const GAMMAIO_ORDINAL_PATH_PATTERN = /^\/ordinals\/[^/?#]+\/?$/i;
const GAMMAIO_INSCRIPTION_PATH_PATTERN = /^\/inscriptions\/[^/?#]+\/?$/i;
const GAMMAIO_ORDINAL_INSCRIPTION_PATH_PATTERN =
  /^\/ordinals\/inscriptions\/[^/?#]+\/?$/i;
const GAMMAIO_ORDINAL_COLLECTION_INSCRIPTION_PATH_PATTERN =
  /^\/ordinals\/collections\/[^/?#]+\/inscriptions\/[^/?#]+\/?$/i;
const GAMMAIO_COLLECTION_PATH_PATTERN =
  /^\/collections\/[^/?#]+\/[^/?#]+\/?$/i;
const GAMMAIO_COLLECTION_TOKEN_PATH_PATTERN =
  /^\/collections\/[^/?#]+\/tokens\/[^/?#]+\/?$/i;
const GAMMAIO_STACKS_NFT_PATH_PATTERN = /^\/stacks\/nfts\/[^/?#]+\/?$/i;
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
const GAMMAIO_HOST = "gamma.io";
const OPENSEA_HOST = "opensea.io";
const TRANSIENT_HOST = "transient.xyz";

const isApexOrWwwHost = (hostname: string, domain: string): boolean =>
  hostname === domain || hostname === `www.${domain}`;

type HostPathMatcher = {
  pattern: RegExp;
  kind: MarketplaceUrlKind;
};

type MarketplaceHostMatcher = {
  domain: string;
  matchers: readonly HostPathMatcher[];
};

const MARKETPLACE_HOST_MATCHERS: readonly MarketplaceHostMatcher[] = [
  {
    domain: MANIFOLD_HOST,
    matchers: [
      { pattern: MANIFOLD_LISTING_PATH_PATTERN, kind: "manifold.listing" },
    ],
  },
  {
    domain: SUPER_RARE_HOST,
    matchers: [
      { pattern: SUPER_RARE_ARTWORK_PATH_PATTERN, kind: "superrare.artwork" },
    ],
  },
  {
    domain: FOUNDATION_HOST,
    matchers: [
      { pattern: FOUNDATION_MINT_PATH_PATTERN, kind: "foundation.mint" },
    ],
  },
  {
    domain: GAMMAIO_HOST,
    matchers: [
      { pattern: GAMMAIO_ORDINAL_PATH_PATTERN, kind: "gammaio.ordinal" },
      {
        pattern: GAMMAIO_INSCRIPTION_PATH_PATTERN,
        kind: "gammaio.inscription",
      },
      {
        pattern: GAMMAIO_ORDINAL_INSCRIPTION_PATH_PATTERN,
        kind: "gammaio.ordinal-inscription",
      },
      {
        pattern: GAMMAIO_ORDINAL_COLLECTION_INSCRIPTION_PATH_PATTERN,
        kind: "gammaio.ordinal-collection-inscription",
      },
      {
        pattern: GAMMAIO_COLLECTION_TOKEN_PATH_PATTERN,
        kind: "gammaio.collection-token",
      },
      { pattern: GAMMAIO_COLLECTION_PATH_PATTERN, kind: "gammaio.collection" },
      { pattern: GAMMAIO_STACKS_NFT_PATH_PATTERN, kind: "gammaio.stacks-nft" },
    ],
  },
  {
    domain: OPENSEA_HOST,
    matchers: [
      { pattern: OPENSEA_ITEM_PATH_PATTERN, kind: "opensea.item" },
      { pattern: OPENSEA_ASSET_PATH_PATTERN, kind: "opensea.asset" },
    ],
  },
  {
    domain: TRANSIENT_HOST,
    matchers: [
      { pattern: TRANSIENT_NFT_PATH_PATTERN, kind: "transient.nft" },
      { pattern: TRANSIENT_MINT_PATH_PATTERN, kind: "transient.mint" },
    ],
  },
];

const parseHttpsUrl = (href: string): URL | null => {
  try {
    const parsed = new URL(href);
    if (parsed.protocol !== "https:") {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

const getMarketplaceKindForHostAndPath = (
  hostname: string,
  pathname: string
): MarketplaceUrlKind | null => {
  for (const { domain, matchers } of MARKETPLACE_HOST_MATCHERS) {
    if (!isApexOrWwwHost(hostname, domain)) {
      continue;
    }

    for (const { pattern, kind } of matchers) {
      if (pattern.test(pathname)) {
        return kind;
      }
    }

    return null;
  }

  return null;
};

export const getMarketplaceUrlKind = (
  href: string
): MarketplaceUrlKind | null => {
  const url = parseHttpsUrl(href);
  if (!url) {
    return null;
  }

  const hostname = url.hostname.toLowerCase();
  const pathname = url.pathname;

  return getMarketplaceKindForHostAndPath(hostname, pathname);
};

export const isNftMarketplaceLink = (href: string): boolean =>
  getMarketplaceUrlKind(href) !== null;

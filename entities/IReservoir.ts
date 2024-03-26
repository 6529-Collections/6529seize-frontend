
export interface ReservoirTokensResponse {
  tokens: ReservoirTokensResponseTokenElement[];
  continuation: string | null;
}

export interface ReservoirTokensResponseTokenElement {
  token: ReservoirTokensResponseTokenToken;
  market: ReservoirTokensResponseMarket;
  updatedAt: string;
}

export interface ReservoirTokensResponseMarket {
  floorAsk: ReservoirTokensResponseFloorAsk;
}

export interface ReservoirTokensResponseFloorAsk {
  id: null | string;
  price: ReservoirTokensResponsePrice | null;
  maker: null | string;
  validFrom: number | null;
  validUntil: number | null;
  source: ReservoirTokensResponseSource | null;
}

export interface ReservoirTokensResponsePrice {
  currency: ReservoirTokensResponseCurrency;
  amount: ReservoirTokensResponseAmount;
}

export interface ReservoirTokensResponseAmount {
  raw: string;
  decimal: number;
  usd: number;
  native: number;
}

export interface ReservoirTokensResponseCurrency {
  contract: string;
  name: string;
  symbol: string;
  decimals: number;
}

export interface ReservoirTokensResponseSource {
  id: string;
  domain: string;
  name: string;
  icon: string;
  url: string;
}

export interface ReservoirTokensResponseTokenToken {
  chainId: number;
  contract: string;
  tokenId: string;
  name: string;
  description: string;
  image: string;
  imageSmall: string;
  imageLarge: string;
  metadata: ReservoirTokensResponseMetadata;
  media: null;
  kind: string;
  isFlagged: boolean;
  isSpam: boolean;
  isNsfw: boolean;
  metadataDisabled: boolean;
  lastFlagUpdate: string;
  lastFlagChange: string;
  supply: string;
  remainingSupply: string;
  decimals: null;
  rarity: number;
  rarityRank: number;
  collection: ReservoirTokensResponseCollection;
  owner: string;
  mintStages: any[];
}

export interface ReservoirTokensResponseCollection {
  id: string;
  name: string;
  image: string;
  slug: string;
  symbol: string;
  creator: string;
  tokenCount: number;
  metadataDisabled: boolean;
  floorAskPrice: ReservoirTokensResponsePrice;
}

export interface ReservoirTokensResponseMetadata {
  imageOriginal: string;
  imageMimeType: string;
  tokenURI: string;
}

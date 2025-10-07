export interface XtdhStatsResponse {
  readonly baseTdhRate: number;
  readonly multiplier: number;
  readonly xtdhRateGranted: number;
  readonly xtdhRateReceived: number;
  readonly totalXtdhReceived: number;
}

export interface XtdhStatsError {
  readonly error: string;
  readonly message: string;
  readonly statusCode: number;
}

export interface XtdhReceivedError {
  readonly error: string;
  readonly message: string;
  readonly statusCode: number;
}

export interface XtdhGranterPreview {
  readonly profileId: string;
  readonly displayName: string;
  readonly profileImage: string;
}

export interface XtdhGranter extends XtdhGranterPreview {
  readonly xtdhRateGranted: number;
}

export interface XtdhReceivedToken {
  readonly tokenId: string;
  readonly tokenName: string;
  readonly tokenImage: string;
  readonly xtdhRate: number;
  readonly totalXtdhReceived: number;
  readonly granterCount: number;
  readonly granterPreviews: XtdhGranterPreview[];
  readonly granters: XtdhGranter[];
}

export interface XtdhReceivedCollectionSummary {
  readonly collectionId: string;
  readonly collectionName: string;
  readonly collectionImage: string;
  readonly tokenCount: number;
  readonly totalXtdhRate: number;
  readonly totalXtdhReceived: number;
  readonly granterCount: number;
  readonly granterPreviews: XtdhGranterPreview[];
  readonly tokens: XtdhReceivedToken[];
}

export interface XtdhReceivedCollectionOption {
  readonly collectionId: string;
  readonly collectionName: string;
  readonly tokenCount: number;
}

export interface XtdhReceivedCollectionsResponse {
  readonly collections: XtdhReceivedCollectionSummary[];
  readonly totalCount: number;
  readonly page: number;
  readonly pageSize: number;
  readonly availableCollections: XtdhReceivedCollectionOption[];
}

export interface XtdhReceivedNft extends XtdhReceivedToken {
  readonly collectionId: string;
  readonly collectionName: string;
  readonly collectionImage?: string;
}

export interface XtdhReceivedNftsResponse {
  readonly nfts: XtdhReceivedNft[];
  readonly totalCount: number;
  readonly page: number;
  readonly pageSize: number;
  readonly availableCollections: XtdhReceivedCollectionOption[];
}

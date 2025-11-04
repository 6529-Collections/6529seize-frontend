export interface XtdhReceivedError {
  readonly error: string;
  readonly message: string;
  readonly statusCode: number;
}

export interface XtdhGranter {
  readonly profileId: string;
  readonly displayName: string;
  readonly profileImage: string;
  readonly xtdhRateGranted: number;
}

export interface XtdhReceivedToken {
  readonly tokenId: string;
  readonly tokenName: string;
  readonly tokenImage: string;
  readonly xtdhRate: number;
  readonly totalXtdhReceived: number;
  readonly granters: XtdhGranter[];
  readonly collectionSlug?: string;
  readonly blockchain?: string;
  readonly contractAddress?: string;
  readonly tokenStandard?: "ERC721" | "ERC1155";
  readonly totalXtdhAllocated?: number;
  readonly grantorCount?: number;
  readonly holderSummaries?: XtdhAllocationHolderSummary[];
  readonly lastAllocatedAt?: string;
}

export interface XtdhReceivedCollectionSummary {
  readonly collectionId: string;
  readonly collectionName: string;
  readonly collectionImage: string;
  readonly collectionSlug?: string;
  readonly description?: string;
  readonly creatorProfileId?: string;
  readonly creatorName?: string;
  readonly creatorAvatar?: string;
  readonly blockchain?: string;
  readonly contractAddress?: string;
  readonly tokenStandard?: "ERC721" | "ERC1155";
  readonly tokenCount: number;
  readonly receivingTokenCount?: number;
  readonly totalXtdhRate: number;
  readonly totalXtdhReceived: number;
  readonly totalXtdhAllocated?: number;
  readonly grantorCount?: number;
  readonly grantCount?: number;
  readonly topGrantors?: XtdhGranter[];
  readonly holderSummaries?: XtdhAllocationHolderSummary[];
  readonly lastAllocatedAt?: string;
  readonly lastUpdatedAt?: string;
  readonly firstAllocatedAt?: string;
  readonly firstAllocationDaysAgo?: number;
  readonly rateChange7d?: number;
  readonly isGrantedByUser?: boolean;
  readonly isReceivedByUser?: boolean;
  readonly granters: XtdhGranter[];
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

export interface XtdhAllocationHolderSummary {
  readonly profileId: string;
  readonly displayName: string;
  readonly profileImage: string;
  readonly tokenCount: number;
  readonly xtdhEarned: number;
  readonly lastEarnedAt: string;
}

export interface XtdhOverviewStats {
  readonly network: {
    readonly totalDailyCapacity: number;
    readonly totalAllocated: number;
    readonly totalAvailable: number;
    readonly baseTdhRate: number;
    readonly activeAllocations: number;
    readonly grantors: number;
    readonly collections: number;
    readonly tokens: number;
    readonly totalXtdh: number;
  };
  readonly multiplier: {
    readonly current: number;
    readonly nextValue: number;
    readonly nextIncreaseDate: string;
    readonly milestones: readonly XtdhMultiplierMilestone[];
  };
  readonly lastUpdatedAt: string;
}

export interface XtdhMultiplierMilestone {
  readonly percentage: number;
  readonly timeframe: string;
}

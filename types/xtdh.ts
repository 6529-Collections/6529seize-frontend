export const XTDH_NETWORKS = ["ethereum", "polygon"] as const;

export type XtdhNetwork = (typeof XTDH_NETWORKS)[number];

export function isXtdhNetwork(value: string): value is XtdhNetwork {
  return XTDH_NETWORKS.some((network) => network === value);
}

export interface XtdhStatsResponse {
  readonly baseTdhRate: number;
  readonly multiplier: number;
  readonly dailyCapacity: number;
  readonly xtdhRateGranted: number;
  readonly xtdhRateAutoAccruing: number;
  readonly xtdhRateReceived: number;
  readonly totalXtdhReceived: number;
  readonly totalXtdhGranted: number;
  readonly allocationsCount: number;
  readonly collectionsAllocatedCount: number;
  readonly tokensAllocatedCount: number;
}

export interface XtdhError {
  readonly error: string;
  readonly message: string;
  readonly statusCode: number;
}

export type XtdhStatsError = XtdhError;
export type XtdhReceivedError = XtdhError;

export interface XtdhAllocationHolderSummary {
  readonly profileId: string;
  readonly displayName: string;
  readonly profileImage: string;
  readonly tokenCount: number;
  readonly xtdhEarned: number;
  readonly lastEarnedAt: string;
}

export interface XtdhGranter {
  readonly profileId: string;
  readonly displayName: string;
  readonly profileImage: string;
  readonly xtdhRateGranted: number;
}

export interface XtdhReceivedCollectionOption {
  readonly collectionId: string;
  readonly collectionName: string;
  readonly tokenCount: number;
}

export interface XtdhReceivedCollectionTokenSummary {
  readonly tokenId: string;
  readonly tokenName: string;
  readonly tokenImage: string;
  readonly xtdhRate: number;
  readonly totalXtdhReceived: number;
  readonly totalXtdhAllocated: number;
  readonly grantorCount: number;
  readonly granters: readonly XtdhGranter[];
  readonly holderSummaries: readonly XtdhAllocationHolderSummary[];
  readonly lastAllocatedAt: string;
}

export interface XtdhReceivedCollectionSummary {
  readonly collectionId: string;
  readonly collectionName: string;
  readonly collectionImage: string;
  readonly collectionSlug: string;
  readonly creatorProfileId: string;
  readonly creatorName: string;
  readonly creatorAvatar: string;
  readonly description: string;
  readonly blockchain: XtdhNetwork;
  readonly contractAddress: string;
  readonly tokenStandard: string;
  readonly tokenCount: number;
  readonly receivingTokenCount: number;
  readonly totalXtdhRate: number;
  readonly totalXtdhReceived: number;
  readonly totalXtdhAllocated: number;
  readonly grantorCount: number;
  readonly grantCount: number;
  readonly topGrantors: readonly XtdhGranter[];
  readonly granters: readonly XtdhGranter[];
  readonly holderSummaries: readonly XtdhAllocationHolderSummary[];
  readonly lastAllocatedAt: string;
  readonly lastUpdatedAt: string;
  readonly firstAllocatedAt: string;
  readonly firstAllocationDaysAgo: number;
  readonly rateChange7d: number;
  readonly isGrantedByUser: boolean;
  readonly isReceivedByUser: boolean;
  readonly tokens: readonly XtdhReceivedCollectionTokenSummary[];
}

export interface XtdhReceivedCollectionsResponse {
  readonly collections: readonly XtdhReceivedCollectionSummary[];
  readonly totalCount: number;
  readonly page: number;
  readonly pageSize: number;
  readonly availableCollections: readonly XtdhReceivedCollectionOption[];
}

export interface XtdhReceivedNft {
  readonly tokenId: string;
  readonly tokenName: string;
  readonly tokenImage: string;
  readonly xtdhRate: number;
  readonly totalXtdhReceived: number;
  readonly granters: readonly XtdhGranter[];
  readonly collectionId: string;
  readonly collectionName: string;
  readonly collectionImage: string;
  readonly collectionSlug: string;
  readonly blockchain: XtdhNetwork;
  readonly contractAddress: string;
  readonly tokenStandard: string;
  readonly totalXtdhAllocated: number;
  readonly grantorCount: number;
  readonly holderSummaries: readonly XtdhAllocationHolderSummary[];
  readonly lastAllocatedAt: string;
}

export interface XtdhReceivedNftsResponse {
  readonly nfts: readonly XtdhReceivedNft[];
  readonly totalCount: number;
  readonly page: number;
  readonly pageSize: number;
  readonly availableCollections: readonly XtdhReceivedCollectionOption[];
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
    readonly milestones: ReadonlyArray<{
      readonly percentage: number;
      readonly timeframe: string;
    }>;
  };
  readonly lastUpdatedAt: string;
}

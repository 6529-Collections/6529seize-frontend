export interface CompoundLinkGroup {
  readonly marketUrl?: string;
  readonly etherscan?: string;
}

export interface CompoundMarketV2Metrics {
  readonly supplyApy: string;
  readonly borrowApy: string;
  readonly utilization: string;
  readonly tvlUnderlying: string;
  readonly tvlUsd?: string;
  readonly collateralFactor: string;
  readonly reserveFactor: string;
  readonly exchangeRate: string;
}

export interface CompoundMarketV3Metrics {
  readonly supplyApy: string;
  readonly borrowApy: string;
  readonly utilization: string;
  readonly totalSupplyBase: string;
  readonly totalBorrowBase: string;
  readonly tvlUsd?: string;
}

export interface CompoundMarketV2Response {
  readonly type: "compound.market";
  readonly version: "v2";
  readonly chainId: number;
  readonly market: {
    readonly cToken: string;
    readonly symbol: string;
    readonly underlying: {
      readonly address: string;
      readonly symbol: string;
      readonly decimals: number;
    };
  };
  readonly metrics: CompoundMarketV2Metrics;
  readonly links: CompoundLinkGroup;
}

export interface CompoundCollateralConfig {
  readonly address: string;
  readonly symbol: string;
  readonly decimals: number;
  readonly collateralFactor: string;
}

export interface CompoundMarketV3Response {
  readonly type: "compound.market";
  readonly version: "v3";
  readonly chainId: number;
  readonly market: {
    readonly comet: string;
    readonly base: {
      readonly address: string;
      readonly symbol: string;
      readonly decimals: number;
    };
    readonly collaterals: readonly CompoundCollateralConfig[];
  };
  readonly metrics: CompoundMarketV3Metrics;
  readonly links: CompoundLinkGroup;
}

export interface CompoundAccountV2Position {
  readonly cToken: string;
  readonly symbol: string;
  readonly supplyUnderlying: string;
  readonly borrowUnderlying: string;
  readonly supplyApy: string;
  readonly borrowApy: string;
  readonly collateralFactor: string;
  readonly usdPrice?: string;
}

export interface CompoundAccountV3CollateralPosition {
  readonly asset: string;
  readonly amount: string;
  readonly usdPrice?: string;
  readonly collateralFactor: string;
}

export interface CompoundAccountV3Position {
  readonly comet: string;
  readonly baseSymbol: string;
  readonly supplyBase: string;
  readonly borrowBase: string;
  readonly collateral: readonly CompoundAccountV3CollateralPosition[];
  readonly supplyApy: string;
  readonly borrowApy: string;
}

export interface CompoundAccountResponse {
  readonly type: "compound.account";
  readonly chainId: number;
  readonly address: string;
  readonly positions: {
    readonly v2: readonly CompoundAccountV2Position[];
    readonly v3: readonly CompoundAccountV3Position[];
  };
  readonly risk?: {
    readonly liquidityUsd?: string;
    readonly shortfallUsd?: string;
    readonly healthLabel?: string;
  };
  readonly rewards?: {
    readonly v2CompAccrued?: string;
    readonly v3Claimable?: string;
  };
  readonly links?: CompoundLinkGroup;
}

export interface CompoundTxSummary {
  readonly version?: "v2" | "v3";
  readonly action?: string;
  readonly market?: {
    readonly address: string;
    readonly symbol: string;
  };
  readonly amount?: string;
  readonly token?: string;
  readonly from?: string;
  readonly to?: string;
}

export interface CompoundTxResponse {
  readonly type: "compound.tx";
  readonly chainId: number;
  readonly hash: string;
  readonly status: "success" | "reverted" | "pending";
  readonly blockNumber?: number;
  readonly summary?: CompoundTxSummary;
  readonly links?: CompoundLinkGroup;
}

export type CompoundMarketResponse =
  | CompoundMarketV2Response
  | CompoundMarketV3Response;

export type CompoundResponse =
  | CompoundMarketResponse
  | CompoundAccountResponse
  | CompoundTxResponse;

export function isCompoundResponse(value: unknown): value is CompoundResponse {
  if (!value || typeof value !== "object") {
    return false;
  }
  const record = value as Record<string, unknown>;
  if (typeof record.type !== "string") {
    return false;
  }
  return record.type.startsWith("compound.");
}

export function isCompoundMarket(
  value: CompoundResponse
): value is CompoundMarketResponse {
  return value.type === "compound.market";
}

export function isCompoundAccount(
  value: CompoundResponse
): value is CompoundAccountResponse {
  return value.type === "compound.account";
}

export function isCompoundTx(
  value: CompoundResponse
): value is CompoundTxResponse {
  return value.type === "compound.tx";
}

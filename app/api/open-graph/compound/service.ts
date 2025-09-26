import { matchesDomainOrSubdomain } from "@/lib/url/domains";
import type { LinkPreviewResponse } from "@/services/api/link-preview-api";
import {
  decodeEventLog,
  erc20Abi,
  formatUnits,
  getAddress,
  isAddress,
  isHex,
  zeroAddress,
  type Address,
  type Hash,
} from "viem";

import {
  cTokenAbi,
  cometAbi,
  comptrollerAbi,
  priceFeedAbi,
  priceOracleAbi,
} from "./abis";
import { publicClient } from "./client";
import {
  compoundRegistry,
  v2MarketsByAddress,
  v2MarketsByPath,
  v3MarketsByAddress,
  v3MarketsByPath,
  type CompoundV2MarketConfig,
  type CompoundV3MarketConfig,
} from "./registry";

const BLOCKS_PER_YEAR = 2_365_200;
const SECONDS_PER_YEAR = 31_536_000;

const V2_MARKET_TTL_MS = 90_000;
const V3_MARKET_TTL_MS = 90_000;
const ACCOUNT_TTL_MS = 45_000;
const TX_TTL_SUCCESS_MS = 24 * 60 * 60 * 1000;
const TX_TTL_PENDING_MS = 30_000;

const BIGINT_ZERO = BigInt(0);
const BIGINT_ONE = BigInt(1);
const BIGINT_TEN = BigInt(10);

function pow10BigInt(exponent: number): bigint {
  let result = BIGINT_ONE;
  for (let index = 0; index < exponent; index += 1) {
    result *= BIGINT_TEN;
  }
  return result;
}

const MANTISSA_1E18 = pow10BigInt(18);

export type PreviewPlan = {
  readonly cacheKey: string;
  readonly execute: () => Promise<{ data: LinkPreviewResponse; ttl: number }>;
};

type CompoundTarget =
  | { kind: "market"; version: "v2"; market: CompoundV2MarketConfig }
  | { kind: "market"; version: "v3"; market: CompoundV3MarketConfig }
  | { kind: "account"; address: Address }
  | { kind: "tx"; hash: Hash };

const TX_HASH_LENGTH = 66;

function isPossibleTxHash(value: string): value is Hash {
  return value.startsWith("0x") && value.length === TX_HASH_LENGTH && isHex(value);
}

function normalizeAddress(value: string): Address | null {
  if (!isAddress(value)) {
    return null;
  }
  return getAddress(value);
}

function formatMantissa(value: bigint, precision = 6): string {
  const asNumber = Number(value) / Number(MANTISSA_1E18);
  return formatNumber(asNumber, precision);
}

function formatNumber(value: number, precision = 6): string {
  if (!Number.isFinite(value)) {
    return "0";
  }
  const fixed = value.toFixed(precision);
  return trimTrailingZeros(fixed);
}

export function trimTrailingZeros(value: string): string {
  if (!value.includes(".")) {
    return value;
  }
  const decimalIndex = value.indexOf(".");
  let end = value.length - 1;

  while (end > decimalIndex && value[end] === "0") {
    end -= 1;
  }

  if (end === decimalIndex) {
    return value.slice(0, decimalIndex);
  }

  return value.slice(0, end + 1);
}

function formatUnitsWithPrecision(
  value: bigint,
  decimals: number,
  precision = 6
): string {
  const formatted = formatUnits(value, decimals);
  if (formatted.includes(".")) {
    const [intPart, fracPart] = formatted.split(".");
    const trimmed = `${intPart}.${fracPart.slice(0, precision)}`;
    return trimTrailingZeros(trimmed);
  }
  return formatted;
}

function calculateApyFromRatePerBlock(ratePerBlock: bigint): string {
  if (ratePerBlock === BIGINT_ZERO) {
    return "0";
  }
  const rate = Number(ratePerBlock) / Number(MANTISSA_1E18);
  const apy = Math.pow(1 + rate, BLOCKS_PER_YEAR) - 1;
  return formatNumber(apy, 6);
}

function calculateApyFromRatePerSecond(rate: bigint): string {
  if (rate === BIGINT_ZERO) {
    return "0";
  }
  const perSecond = Number(rate) / Number(MANTISSA_1E18);
  const apy = Math.pow(1 + perSecond, SECONDS_PER_YEAR) - 1;
  return formatNumber(apy, 6);
}

function calculateUtilization(numerator: bigint, denominator: bigint): string {
  if (denominator === BIGINT_ZERO) {
    return "0";
  }
  const ratio = Number(numerator) / Number(denominator);
  return formatNumber(ratio, 6);
}

function getExchangeRateScale(
  underlyingDecimals: number,
  cTokenDecimals: number
): number {
  return 18 + underlyingDecimals - cTokenDecimals;
}

type V2MarketState = {
  readonly config: CompoundV2MarketConfig;
  readonly cTokenDecimals: number;
  readonly exchangeRateStored: bigint;
  readonly supplyRatePerBlock: bigint;
  readonly borrowRatePerBlock: bigint;
  readonly totalBorrows: bigint;
  readonly totalReserves: bigint;
  readonly totalSupply: bigint;
  readonly cash: bigint;
  readonly reserveFactorMantissa: bigint;
  readonly collateralFactorMantissa: bigint;
  readonly underlyingPrice: bigint | null;
  readonly metrics: {
    readonly supplyApy: string;
    readonly borrowApy: string;
    readonly utilization: string;
    readonly tvlUnderlying: string;
    readonly tvlUsd?: string;
    readonly collateralFactor: string;
    readonly reserveFactor: string;
    readonly exchangeRate: string;
  };
};

type V3CollateralInfo = {
  readonly asset: Address;
  readonly symbol: string;
  readonly decimals: number;
  readonly scale: bigint;
  readonly collateralFactor: string;
  readonly priceFeed: Address | null;
  readonly usdPrice?: string;
};

type V3MarketState = {
  readonly config: CompoundV3MarketConfig;
  readonly decimals: number;
  readonly supplyRate: bigint;
  readonly borrowRate: bigint;
  readonly utilization: bigint;
  readonly totalSupplyBase: bigint;
  readonly totalBorrowBase: bigint;
  readonly basePrice: bigint | null;
  readonly basePriceDecimals: number | null;
  readonly collaterals: readonly V3CollateralInfo[];
  readonly metrics: {
    readonly supplyApy: string;
    readonly borrowApy: string;
    readonly utilization: string;
    readonly totalSupplyBase: string;
    readonly totalBorrowBase: string;
    readonly tvlUsd?: string;
  };
};

async function fetchV2MarketState(
  market: CompoundV2MarketConfig
): Promise<V2MarketState> {
  const cToken = market.address as Address;
  const marketResults = await publicClient.multicall({
    allowFailure: false,
    contracts: [
      { address: cToken, abi: cTokenAbi, functionName: "decimals" },
      { address: cToken, abi: cTokenAbi, functionName: "exchangeRateStored" },
      { address: cToken, abi: cTokenAbi, functionName: "totalBorrows" },
      { address: cToken, abi: cTokenAbi, functionName: "totalReserves" },
      { address: cToken, abi: cTokenAbi, functionName: "totalSupply" },
      { address: cToken, abi: cTokenAbi, functionName: "cash" },
      { address: cToken, abi: cTokenAbi, functionName: "reserveFactorMantissa" },
      { address: cToken, abi: cTokenAbi, functionName: "supplyRatePerBlock" },
      { address: cToken, abi: cTokenAbi, functionName: "borrowRatePerBlock" },
    ],
  });

  const cTokenDecimalsRaw = marketResults[0] as number;
  const exchangeRateStored = marketResults[1] ;
  const totalBorrows = marketResults[2] ;
  const totalReserves = marketResults[3] ;
  const totalSupply = marketResults[4] ;
  const cash = marketResults[5] ;
  const reserveFactorMantissa = marketResults[6] ;
  const supplyRatePerBlock = marketResults[7] ;
  const borrowRatePerBlock = marketResults[8] ;

  const [_, collateralFactorMantissa] = await publicClient.readContract({
    address: compoundRegistry.comptroller as Address,
    abi: comptrollerAbi,
    functionName: "markets",
    args: [cToken],
  });

  let underlyingPrice: bigint | null = null;
  try {
    const oracleAddress = await publicClient.readContract({
      address: compoundRegistry.comptroller as Address,
      abi: comptrollerAbi,
      functionName: "oracle",
    });
    if (oracleAddress && oracleAddress !== zeroAddress) {
      underlyingPrice = await publicClient.readContract({
        address: oracleAddress,
        abi: priceOracleAbi,
        functionName: "getUnderlyingPrice",
        args: [cToken],
      });
    }
  } catch {
    underlyingPrice = null;
  }

  const cTokenDecimals = Number(cTokenDecimalsRaw ?? 0);
  const underlyingDecimals = market.underlying.decimals;
  const exchangeRateScale = getExchangeRateScale(underlyingDecimals, cTokenDecimals);
  const tvlUnderlying = (cash ?? BIGINT_ZERO) + (totalBorrows ?? BIGINT_ZERO) - (totalReserves ?? BIGINT_ZERO);

  const supplyApy = calculateApyFromRatePerBlock(supplyRatePerBlock);
  const borrowApy = calculateApyFromRatePerBlock(borrowRatePerBlock);
  const utilization = calculateUtilization(
    totalBorrows ?? BIGINT_ZERO,
    tvlUnderlying
  );
  const collateralFactor = formatMantissa(collateralFactorMantissa);
  const reserveFactor = formatMantissa(reserveFactorMantissa);
  const exchangeRate = formatUnitsWithPrecision(
    exchangeRateStored ?? BIGINT_ZERO,
    exchangeRateScale,
    10
  );
  const tvlUnderlyingDisplay = formatUnitsWithPrecision(
    tvlUnderlying,
    underlyingDecimals,
    6
  );

  let tvlUsd: string | undefined;

  if (underlyingPrice && underlyingPrice > BIGINT_ZERO) {
    const tvlUsdScaled =
      (tvlUnderlying * underlyingPrice) / pow10BigInt(18);
    tvlUsd = formatUnitsWithPrecision(tvlUsdScaled, 18, 2);
  }

  return {
    config: market,
    cTokenDecimals,
    exchangeRateStored: exchangeRateStored ?? BIGINT_ZERO,
    supplyRatePerBlock: supplyRatePerBlock ?? BIGINT_ZERO,
    borrowRatePerBlock: borrowRatePerBlock ?? BIGINT_ZERO,
    totalBorrows: totalBorrows ?? BIGINT_ZERO,
    totalReserves: totalReserves ?? BIGINT_ZERO,
    totalSupply: totalSupply ?? BIGINT_ZERO,
    cash: cash ?? BIGINT_ZERO,
    reserveFactorMantissa: reserveFactorMantissa ?? BIGINT_ZERO,
    collateralFactorMantissa: collateralFactorMantissa ,
    underlyingPrice: underlyingPrice ?? null,
    metrics: {
      supplyApy,
      borrowApy,
      utilization,
      tvlUnderlying: tvlUnderlyingDisplay,
      tvlUsd,
      collateralFactor,
      reserveFactor,
      exchangeRate,
    },
  };
}

async function fetchV3MarketState(
  market: CompoundV3MarketConfig
): Promise<V3MarketState> {
  const comet = market.address as Address;
  const marketCoreResults = await publicClient.multicall({
    allowFailure: false,
    contracts: [
      { address: comet, abi: cometAbi, functionName: "decimals" },
      { address: comet, abi: cometAbi, functionName: "totalsBasic" },
      { address: comet, abi: cometAbi, functionName: "getUtilization" },
      { address: comet, abi: cometAbi, functionName: "numAssets" },
      { address: comet, abi: cometAbi, functionName: "priceFeed" },
    ],
  });

  const decimalsRaw = marketCoreResults[0] as number;
  const totalsBasic = marketCoreResults[1] as unknown;
  const utilizationRaw = marketCoreResults[2] ;
  const numAssetsRaw = marketCoreResults[3] as number;
  const priceFeedAddress = marketCoreResults[4] as Address;

  const utilizationValue = utilizationRaw ?? BIGINT_ZERO;

  const [supplyRate, borrowRate] = await publicClient.multicall({
    allowFailure: false,
    contracts: [
      {
        address: comet,
        abi: cometAbi,
        functionName: "getSupplyRate",
        args: [utilizationValue],
      },
      {
        address: comet,
        abi: cometAbi,
        functionName: "getBorrowRate",
        args: [utilizationValue],
      },
    ],
  });

  const decimals = Number(decimalsRaw ?? 0);
  const {
    totalSupplyBase,
    totalBorrowBase,
  } = totalsBasic as {
    totalSupplyBase: bigint;
    totalBorrowBase: bigint;
  };

  const numAssets = Number(numAssetsRaw ?? 0);
  const collaterals: V3CollateralInfo[] = [];
  const collateralCalls = Array.from({ length: numAssets }, (_, index) => ({
    address: comet,
    abi: cometAbi,
    functionName: "getAssetInfo",
    args: [BigInt(index)],
  } as const));

  if (collateralCalls.length > 0) {
    const collateralResults = await publicClient.multicall({
      allowFailure: false,
      contracts: collateralCalls,
    });

    for (const result of collateralResults) {
      const info = result as unknown as {
        offset: bigint;
        asset: Address;
        priceFeed: Address;
        scale: bigint;
        borrowCollateralFactor: bigint;
      };

      const assetAddress = info.asset;
      try {
        const symbolAndDecimals = await publicClient.multicall({
          allowFailure: false,
          contracts: [
            { address: assetAddress, abi: erc20Abi, functionName: "symbol" },
            { address: assetAddress, abi: erc20Abi, functionName: "decimals" },
          ],
        });

        const symbolResult = symbolAndDecimals[0];
        const decimalsResult = symbolAndDecimals[1];

        let usdPrice: string | undefined;

        if (priceFeedAddress && priceFeedAddress !== zeroAddress) {
          try {
            const priceResults = await publicClient.multicall({
              allowFailure: false,
              contracts: [
                {
                  address: priceFeedAddress as Address,
                  abi: priceFeedAbi,
                  functionName: "getPrice",
                  args: [assetAddress],
                },
                {
                  address: priceFeedAddress as Address,
                  abi: priceFeedAbi,
                  functionName: "decimals",
                },
              ],
            });

            const priceValue = priceResults[0] ;
            const priceDecimals = Number(priceResults[1] ?? 8);
            if (priceValue && priceValue > BIGINT_ZERO) {
              usdPrice = formatUnitsWithPrecision(priceValue, priceDecimals, 6);
            }
          } catch {
            usdPrice = undefined;
          }
        }

        collaterals.push({
          asset: assetAddress,
          symbol: String(symbolResult),
          decimals: Number(decimalsResult ?? 18),
          scale: info.scale,
          collateralFactor: formatMantissa(info.borrowCollateralFactor),
          priceFeed: info.priceFeed,
          usdPrice,
        });
      } catch {
        collaterals.push({
          asset: assetAddress,
          symbol: assetAddress,
          decimals: 18,
          scale: info.scale,
          collateralFactor: formatMantissa(info.borrowCollateralFactor),
          priceFeed: info.priceFeed,
        });
      }
    }
  }

  let basePrice: bigint | null = null;
  let basePriceDecimals: number | null = null;

  if (priceFeedAddress && priceFeedAddress !== zeroAddress) {
    try {
      const basePriceResults = await publicClient.multicall({
        allowFailure: false,
        contracts: [
          {
            address: priceFeedAddress as Address,
            abi: priceFeedAbi,
            functionName: "getPrice",
            args: [market.base.address as Address],
          },
          {
            address: priceFeedAddress as Address,
            abi: priceFeedAbi,
            functionName: "decimals",
          },
        ],
      });
      basePrice = basePriceResults[0] ;
      basePriceDecimals = Number(basePriceResults[1] ?? 8);
    } catch {
      basePrice = null;
      basePriceDecimals = null;
    }
  }

  const supplyApy = calculateApyFromRatePerSecond(supplyRate );
  const borrowApy = calculateApyFromRatePerSecond(borrowRate );
  const utilization = formatMantissa(utilizationValue);
  const totalSupplyBaseDisplay = formatUnitsWithPrecision(
    totalSupplyBase,
    market.base.decimals,
    6
  );
  const totalBorrowBaseDisplay = formatUnitsWithPrecision(
    totalBorrowBase,
    market.base.decimals,
    6
  );
  let tvlUsd: string | undefined;

  if (basePrice && basePrice > BIGINT_ZERO && basePriceDecimals !== null) {
    const tvlUsdScaled =
      (totalSupplyBase * basePrice) / pow10BigInt(basePriceDecimals);
    tvlUsd = formatUnitsWithPrecision(tvlUsdScaled, market.base.decimals, 2);
  }

  return {
    config: market,
    decimals,
    supplyRate: supplyRate ,
    borrowRate: borrowRate ,
    utilization: utilizationRaw ,
    totalSupplyBase,
    totalBorrowBase,
    basePrice,
    basePriceDecimals,
    collaterals,
    metrics: {
      supplyApy,
      borrowApy,
      utilization,
      totalSupplyBase: totalSupplyBaseDisplay,
      totalBorrowBase: totalBorrowBaseDisplay,
      tvlUsd,
    },
  };
}

function buildV2MarketResponse(state: V2MarketState): LinkPreviewResponse {
  const { config, metrics } = state;
  return {
    type: "compound.market",
    version: "v2",
    chainId: 1,
    market: {
      cToken: getAddress(config.address),
      symbol: config.symbol,
      underlying: {
        address: getAddress(config.underlying.address),
        symbol: config.underlying.symbol,
        decimals: config.underlying.decimals,
      },
    },
    metrics,
    links: {
      marketUrl: config.marketUrl,
      etherscan: `https://etherscan.io/address/${getAddress(config.address)}`,
    },
  } as LinkPreviewResponse;
}

function buildV3MarketResponse(state: V3MarketState): LinkPreviewResponse {
  const { config, metrics } = state;
  return {
    type: "compound.market",
    version: "v3",
    chainId: 1,
    market: {
      comet: getAddress(config.address),
      base: {
        address: getAddress(config.base.address),
        symbol: config.base.symbol,
        decimals: config.base.decimals,
      },
      collaterals: state.collaterals.map((collateral) => ({
        address: getAddress(collateral.asset),
        symbol: collateral.symbol,
        decimals: collateral.decimals,
        collateralFactor: collateral.collateralFactor,
      })),
    },
    metrics,
    links: {
      marketUrl: config.marketUrl,
      etherscan: `https://etherscan.io/address/${getAddress(config.address)}`,
    },
  } as LinkPreviewResponse;
}

async function fetchV2Account(address: Address): Promise<LinkPreviewResponse> {
  const markets = Array.from(v2MarketsByAddress.values());
  const states = await Promise.all(markets.map((market) => fetchV2MarketState(market)));

  const positionsRaw = await Promise.all(
    states.map(async (state) => {
      const cToken = state.config.address as Address;
      const [balanceResult, borrowResult] = await publicClient.multicall({
        allowFailure: false,
        contracts: [
          { address: cToken, abi: cTokenAbi, functionName: "balanceOf", args: [address] },
          {
            address: cToken,
            abi: cTokenAbi,
            functionName: "borrowBalanceStored",
            args: [address],
          },
        ],
      });

      const balance = balanceResult ;
      const borrowBalance = borrowResult ;
      const exchangeRateScale = getExchangeRateScale(
        state.config.underlying.decimals,
        state.cTokenDecimals
      );

      const supplyUnderlyingRaw =
        (balance * state.exchangeRateStored) /
        pow10BigInt(exchangeRateScale);
      const supplyDisplay = formatUnitsWithPrecision(
        supplyUnderlyingRaw,
        state.config.underlying.decimals,
        6
      );
      const borrowDisplay = formatUnitsWithPrecision(
        borrowBalance,
        state.config.underlying.decimals,
        6
      );

      const priceDecimals = Math.max(0, 36 - state.config.underlying.decimals);
      const usdPrice = state.underlyingPrice
        ? formatUnitsWithPrecision(state.underlyingPrice, priceDecimals, 6)
        : undefined;

      return {
        cToken: getAddress(state.config.address),
        symbol: state.config.symbol,
        supplyUnderlying: supplyDisplay,
        borrowUnderlying: borrowDisplay,
        supplyApy: state.metrics.supplyApy,
        borrowApy: state.metrics.borrowApy,
        collateralFactor: state.metrics.collateralFactor,
        usdPrice: usdPrice ?? undefined,
        hasPosition: supplyUnderlyingRaw > BIGINT_ZERO || borrowBalance > BIGINT_ZERO,
      };
    })
  );

  const positions = positionsRaw
    .filter((position) => position.hasPosition)
    .map(({ hasPosition: _ignored, ...rest }) => rest);

  const [liquidityRaw, shortfallRaw] = await publicClient.readContract({
    address: compoundRegistry.comptroller as Address,
    abi: comptrollerAbi,
    functionName: "getAccountLiquidity",
    args: [address],
  });

  const liquidityUsd = formatUnitsWithPrecision(liquidityRaw , 18, 2);
  const shortfallUsd = formatUnitsWithPrecision(shortfallRaw , 18, 2);
  const liquidityValue = liquidityRaw ;
  const shortfallValue = shortfallRaw ;

  let healthLabel = "safe";
  if (shortfallValue > BIGINT_ZERO) {
    healthLabel = "liquidation";
  } else if (liquidityValue < BigInt(500) * MANTISSA_1E18) {
    healthLabel = "warning";
  }

  let compAccrued: bigint | null = null;
  try {
    compAccrued = await publicClient.readContract({
      address: compoundRegistry.comptroller as Address,
      abi: comptrollerAbi,
      functionName: "compAccrued",
      args: [address],
    });
  } catch {
    compAccrued = null;
  }

  const rewards = {
    v2CompAccrued: compAccrued
      ? formatUnitsWithPrecision(compAccrued, 18, 6)
      : "0",
  };

  return {
    type: "compound.account",
    chainId: 1,
    address: getAddress(address),
    positions: {
      v2: positions,
      v3: [],
    },
    risk: {
      liquidityUsd,
      shortfallUsd,
      healthLabel,
    },
    rewards,
    links: {
      etherscan: `https://etherscan.io/address/${getAddress(address)}`,
    },
  } as LinkPreviewResponse;
}

async function fetchV3Account(address: Address): Promise<{
  readonly v3Positions: any[];
  readonly v3Rewards?: string;
}> {
  const markets = Array.from(v3MarketsByAddress.values());
  const states = await Promise.all(markets.map((market) => fetchV3MarketState(market)));

  const v3Positions = await Promise.all(
    states.map(async (state) => {
      const comet = state.config.address as Address;
      const [balanceResult, borrowResult] = await publicClient.multicall({
        allowFailure: false,
        contracts: [
          { address: comet, abi: cometAbi, functionName: "balanceOf", args: [address] },
          { address: comet, abi: cometAbi, functionName: "borrowBalanceOf", args: [address] },
        ],
      });

      const baseSupplyRaw = balanceResult ;
      const baseSupply = formatUnitsWithPrecision(
        baseSupplyRaw,
        state.config.base.decimals,
        6
      );
      let baseBorrow = "0";
      let baseBorrowRaw = BIGINT_ZERO;
      try {
        baseBorrowRaw = borrowResult ;
        baseBorrow = formatUnitsWithPrecision(
          baseBorrowRaw,
          state.config.base.decimals,
          6
        );
      } catch {
        baseBorrow = "0";
        baseBorrowRaw = BIGINT_ZERO;
      }

      const collateralEntriesRaw = await Promise.all(
        state.collaterals.map(async (collateral) => {
          let balance = BIGINT_ZERO;
          try {
            balance = await publicClient.readContract({
              address: comet,
              abi: cometAbi,
              functionName: "collateralBalanceOf",
              args: [address, collateral.asset],
            });
          } catch {
            balance = BIGINT_ZERO;
          }

          return {
            asset: collateral.symbol,
            amountRaw: balance,
            decimals: collateral.decimals,
            usdPrice: collateral.usdPrice,
            collateralFactor: collateral.collateralFactor,
          };
        })
      );

      const collateralEntries = collateralEntriesRaw
        .filter((entry) => entry.amountRaw > BIGINT_ZERO)
        .map((entry) => ({
          asset: entry.asset,
          amount: formatUnitsWithPrecision(entry.amountRaw, entry.decimals, 6),
          usdPrice: entry.usdPrice,
          collateralFactor: entry.collateralFactor,
        }));

      const hasPosition =
        baseSupplyRaw > BIGINT_ZERO || baseBorrowRaw > BIGINT_ZERO || collateralEntries.length > 0;

      return {
        comet: getAddress(state.config.address),
        baseSymbol: state.config.base.symbol,
        supplyBase: baseSupply,
        borrowBase: baseBorrow,
        collateral: collateralEntries,
        supplyApy: state.metrics.supplyApy,
        borrowApy: state.metrics.borrowApy,
        hasPosition,
      };
    })
  );

  return {
    v3Positions: v3Positions
      .filter((position) => position.hasPosition)
      .map(({ hasPosition, ...rest }) => rest),
  };
}

async function fetchCompoundAccount(address: Address): Promise<LinkPreviewResponse> {
  const [v2Response, v3Response] = await Promise.all([
    fetchV2Account(address),
    fetchV3Account(address),
  ]);

  const combined = v2Response as any;
  combined.positions.v3 = v3Response.v3Positions;
  if (!combined.rewards) {
    combined.rewards = {};
  }
  combined.rewards.v3Claimable = v3Response.v3Rewards ?? "0";
  return combined;
}

function decodeV2Event(log: { address: Address; data: `0x${string}`; topics: readonly `0x${string}`[] }) {
  try {
    const topics =
      (log.topics.length === 0
        ? []
        : ([...log.topics] as [`0x${string}`, ...`0x${string}`[]])) as
      [] | [`0x${string}`, ...`0x${string}`[]];
    return decodeEventLog({
      abi: cTokenAbi,
      data: log.data,
      topics,
    });
  } catch {
    return null;
  }
}

function decodeV3Event(log: { address: Address; data: `0x${string}`; topics: readonly `0x${string}`[] }) {
  try {
    const topics =
      (log.topics.length === 0
        ? []
        : ([...log.topics] as [`0x${string}`, ...`0x${string}`[]])) as
      [] | [`0x${string}`, ...`0x${string}`[]];
    return decodeEventLog({
      abi: cometAbi,
      data: log.data,
      topics,
    });
  } catch {
    return null;
  }
}

async function decodeCompoundTx(hash: Hash): Promise<LinkPreviewResponse> {
  const transaction = await publicClient.getTransaction({ hash });
  const { receipt, status, blockNumber } = await getTransactionReceiptDetails(hash);
  const participants = extractTransactionParticipants(transaction);
  const summary = buildCompoundSummaryFromLogs(receipt?.logs ?? [], participants);

  return {
    type: "compound.tx",
    chainId: 1,
    hash,
    status,
    blockNumber: blockNumber ?? undefined,
    summary: summary ?? undefined,
    links: {
      etherscan: `https://etherscan.io/tx/${hash}`,
    },
  } as LinkPreviewResponse;
}

type PublicClientReceipt = Awaited<ReturnType<typeof publicClient.getTransactionReceipt>>;

type ReceiptDetails = {
  readonly receipt: PublicClientReceipt | null;
  readonly status: "success" | "reverted" | "pending";
  readonly blockNumber: number | null;
};

type CompoundTransactionSummary = {
  readonly version: "v2" | "v3";
  readonly action: CompoundSummaryAction;
  readonly market: {
    readonly address: Address;
    readonly symbol: string;
  };
  readonly amount: string;
  readonly token: string;
  readonly from?: Address;
  readonly to?: Address;
};

type CompoundSummaryAction =
  | "supply"
  | "redeem"
  | "borrow"
  | "repay"
  | "liquidate"
  | "withdraw";

type TxParticipants = {
  readonly from?: Address;
  readonly to?: Address;
};

async function getTransactionReceiptDetails(hash: Hash): Promise<ReceiptDetails> {
  try {
    const receipt = await publicClient.getTransactionReceipt({ hash });
    return {
      receipt,
      status: receipt.status,
      blockNumber: Number(receipt.blockNumber ?? BIGINT_ZERO),
    };
  } catch {
    return {
      receipt: null,
      status: "pending",
      blockNumber: null,
    };
  }
}

function extractTransactionParticipants(transaction: {
  readonly from?: string | null;
  readonly to?: string | null;
}): TxParticipants {
  return {
    from: transaction.from ? getAddress(transaction.from) : undefined,
    to: transaction.to ? getAddress(transaction.to) : undefined,
  };
}

function buildCompoundSummaryFromLogs(
  logs: readonly {
    readonly address: Address;
    readonly data: `0x${string}`;
    readonly topics: readonly `0x${string}`[];
  }[],
  participants: TxParticipants
): CompoundTransactionSummary | null {
  for (const log of logs) {
    const summary = buildV2Summary(log, participants) ?? buildV3Summary(log, participants);
    if (summary) {
      return summary;
    }
  }
  return null;
}

const V2_EVENT_SUMMARIES = {
  Mint: { action: "supply", amountKey: "mintAmount" },
  Redeem: { action: "redeem", amountKey: "redeemAmount" },
  Borrow: { action: "borrow", amountKey: "borrowAmount" },
  RepayBorrow: { action: "repay", amountKey: "repayAmount" },
  LiquidateBorrow: { action: "liquidate", amountKey: "repayAmount" },
} as const;

type V2EventName = keyof typeof V2_EVENT_SUMMARIES;

const V3_EVENT_SUMMARIES = {
  Supply: { action: "supply", amountKey: "amount" },
  Withdraw: { action: "withdraw", amountKey: "amount" },
  AbsorbCollateral: { action: "liquidate", amountKey: "collateralAbsorbed" },
} as const;

type V3EventName = keyof typeof V3_EVENT_SUMMARIES;

function buildV2Summary(
  log: {
    readonly address: Address;
    readonly data: `0x${string}`;
    readonly topics: readonly `0x${string}`[];
  },
  participants: TxParticipants
): CompoundTransactionSummary | null {
  const address = getAddress(log.address);
  const lower = address.toLowerCase() as Address;
  if (!v2MarketsByAddress.has(lower)) {
    return null;
  }
  const decoded = decodeV2Event(log);
  if (!decoded) {
    return null;
  }
  const market = v2MarketsByAddress.get(lower)!;
  const eventName = decoded.eventName as V2EventName;
  const config = V2_EVENT_SUMMARIES[eventName];
  if (!config) {
    return null;
  }
  const amountRaw = decoded.args[
    config.amountKey as keyof typeof decoded.args
  ] as bigint;
  const amount = formatUnitsWithPrecision(amountRaw, market.underlying.decimals, 6);
  return createCompoundSummary({
    version: "v2",
    action: config.action,
    marketSymbol: market.symbol,
    marketAddress: address,
    amount,
    token: market.underlying.symbol,
    participants,
  });
}

function buildV3Summary(
  log: {
    readonly address: Address;
    readonly data: `0x${string}`;
    readonly topics: readonly `0x${string}`[];
  },
  participants: TxParticipants
): CompoundTransactionSummary | null {
  const address = getAddress(log.address);
  const lower = address.toLowerCase() as Address;
  if (!v3MarketsByAddress.has(lower)) {
    return null;
  }
  const decoded = decodeV3Event(log);
  if (!decoded) {
    return null;
  }
  const market = v3MarketsByAddress.get(lower)!;
  const eventName = decoded.eventName as V3EventName;
  const config = V3_EVENT_SUMMARIES[eventName];
  if (!config) {
    return null;
  }
  const amountRaw = decoded.args[
    config.amountKey as keyof typeof decoded.args
  ] as bigint;
  const amount = formatUnitsWithPrecision(amountRaw, market.base.decimals, 6);
  return createCompoundSummary({
    version: "v3",
    action: config.action,
    marketSymbol: `${market.base.symbol}(Comet)`,
    marketAddress: address,
    amount,
    token: market.base.symbol,
    participants,
  });
}

function createCompoundSummary(options: {
  readonly version: "v2" | "v3";
  readonly action: CompoundSummaryAction;
  readonly marketSymbol: string;
  readonly marketAddress: Address;
  readonly amount: string;
  readonly token: string;
  readonly participants: TxParticipants;
}): CompoundTransactionSummary {
  const { marketSymbol, marketAddress, participants, ...rest } = options;
  return {
    ...rest,
    market: {
      address: marketAddress,
      symbol: marketSymbol,
    },
    from: participants.from,
    to: participants.to,
  };
}

function detectAppCompoundAccount(url: URL, pathname: string): CompoundTarget | null {
  if (!pathname.startsWith("/account")) {
    return null;
  }

  const addressParam = url.searchParams.get("address");
  const normalized = addressParam ? normalizeAddress(addressParam) : null;

  if (!normalized) {
    return null;
  }

  return { kind: "account", address: normalized };
}

function detectAppCompoundMarket(pathname: string): CompoundTarget | null {
  const v2 = v2MarketsByPath.get(pathname);
  if (v2) {
    return { kind: "market", version: "v2", market: v2 };
  }

  const v3 = v3MarketsByPath.get(pathname);
  if (v3) {
    return { kind: "market", version: "v3", market: v3 };
  }

  return null;
}

function detectAppCompoundTarget(url: URL, pathname: string): CompoundTarget | null {
  const account = detectAppCompoundAccount(url, pathname);
  if (account) {
    return account;
  }

  return detectAppCompoundMarket(pathname);
}

function detectEtherscanTx(pathname: string): CompoundTarget | null {
  if (!pathname.startsWith("/tx/")) {
    return null;
  }

  const hash = pathname.split("/")[2];
  if (!hash || !isPossibleTxHash(hash)) {
    return null;
  }

  return { kind: "tx", hash: hash as Address };
}

function detectEtherscanMarket(pathname: string): CompoundTarget | null {
  if (!pathname.startsWith("/address/")) {
    return null;
  }

  const raw = pathname.split("/")[2];
  const normalized = raw ? normalizeAddress(raw) : null;
  if (!normalized) {
    return null;
  }

  const lower = normalized.toLowerCase() as Address;
  const v2 = v2MarketsByAddress.get(lower);
  if (v2) {
    return { kind: "market", version: "v2", market: v2 };
  }

  const v3 = v3MarketsByAddress.get(lower);
  if (v3) {
    return { kind: "market", version: "v3", market: v3 };
  }

  return null;
}

function detectEtherscanCompoundTarget(pathname: string): CompoundTarget | null {
  const txTarget = detectEtherscanTx(pathname);
  if (txTarget) {
    return txTarget;
  }

  return detectEtherscanMarket(pathname);
}

function detectCompoundTarget(url: URL): CompoundTarget | null {
  const hostname = url.hostname.toLowerCase();
  const pathname = url.pathname.replace(/\/+$/, "").toLowerCase() || "/";

  if (matchesDomainOrSubdomain(hostname, "app.compound.finance")) {
    return detectAppCompoundTarget(url, pathname);
  }

  if (matchesDomainOrSubdomain(hostname, "etherscan.io")) {
    return detectEtherscanCompoundTarget(pathname);
  }

  return null;
}

export function createCompoundPlan(url: URL): PreviewPlan | null {
  const target = detectCompoundTarget(url);
  if (!target) {
    return null;
  }

  if (target.kind === "market" && target.version === "v2") {
    return {
      cacheKey: `compound:market:v2:${target.market.address.toLowerCase()}`,
      execute: async () => {
        const state = await fetchV2MarketState(target.market);
        return { data: buildV2MarketResponse(state), ttl: V2_MARKET_TTL_MS };
      },
    };
  }

  if (target.kind === "market" && target.version === "v3") {
    return {
      cacheKey: `compound:market:v3:${target.market.address.toLowerCase()}`,
      execute: async () => {
        const state = await fetchV3MarketState(target.market);
        return { data: buildV3MarketResponse(state), ttl: V3_MARKET_TTL_MS };
      },
    };
  }

  if (target.kind === "account") {
    return {
      cacheKey: `compound:account:${target.address.toLowerCase()}`,
      execute: async () => {
        const data = await fetchCompoundAccount(target.address);
        return { data, ttl: ACCOUNT_TTL_MS };
      },
    };
  }

  if (target.kind === "tx") {
    return {
      cacheKey: `compound:tx:${target.hash.toLowerCase()}`,
      execute: async () => {
        const data = await decodeCompoundTx(target.hash);
        const ttl = data.status === "pending" ? TX_TTL_PENDING_MS : TX_TTL_SUCCESS_MS;
        return { data, ttl };
      },
    };
  }

  return null;
}

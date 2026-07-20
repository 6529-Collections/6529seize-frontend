import type { LinkPreviewResponse } from "@/services/api/link-preview-api";
import {
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
  type CompoundV2MarketConfig,
  type CompoundV3MarketConfig,
} from "./registry";

const BLOCKS_PER_YEAR = 2_365_200;
const SECONDS_PER_YEAR = 31_536_000;

export const BIGINT_ZERO = BigInt(0);
const BIGINT_ONE = BigInt(1);
const BIGINT_TEN = BigInt(10);

function pow10BigInt(exponent: number): bigint {
  let result = BIGINT_ONE;
  for (let index = 0; index < exponent; index += 1) {
    result *= BIGINT_TEN;
  }
  return result;
}

export const MANTISSA_1E18 = pow10BigInt(18);

export type PreviewPlan = {
  readonly cacheKey: string;
  readonly execute: () => Promise<{ data: LinkPreviewResponse; ttl: number }>;
};

export type CompoundTarget =
  | { kind: "market"; version: "v2"; market: CompoundV2MarketConfig }
  | { kind: "market"; version: "v3"; market: CompoundV3MarketConfig }
  | { kind: "account"; address: Address }
  | { kind: "tx"; hash: Hash };

const TX_HASH_LENGTH = 66;

export function isPossibleTxHash(value: string): value is Hash {
  return (
    value.startsWith("0x") && value.length === TX_HASH_LENGTH && isHex(value)
  );
}

export function normalizeAddress(value: string): Address | null {
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

function trimTrailingZeros(value: string): string {
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

export function formatUnitsWithPrecision(
  value: bigint,
  decimals: number,
  precision = 6
): string {
  const formatted = formatUnits(value, decimals);
  if (formatted.includes(".")) {
    const [intPart, fracPart] = formatted.split(".");
    const trimmed = `${intPart}.${fracPart?.slice(0, precision)}`;
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

export function getExchangeRateScale(
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
    readonly tvlUsd?: string | undefined;
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
  readonly usdPrice?: string | undefined;
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
    readonly tvlUsd?: string | undefined;
  };
};

export async function fetchV2MarketState(
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
      {
        address: cToken,
        abi: cTokenAbi,
        functionName: "reserveFactorMantissa",
      },
      { address: cToken, abi: cTokenAbi, functionName: "supplyRatePerBlock" },
      { address: cToken, abi: cTokenAbi, functionName: "borrowRatePerBlock" },
    ],
  });

  const cTokenDecimalsRaw = marketResults[0] as number;
  const exchangeRateStored = marketResults[1];
  const totalBorrows = marketResults[2];
  const totalReserves = marketResults[3];
  const totalSupply = marketResults[4];
  const cash = marketResults[5];
  const reserveFactorMantissa = marketResults[6];
  const supplyRatePerBlock = marketResults[7];
  const borrowRatePerBlock = marketResults[8];

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
  const exchangeRateScale = getExchangeRateScale(
    underlyingDecimals,
    cTokenDecimals
  );
  const tvlUnderlying =
    (cash ?? BIGINT_ZERO) +
    (totalBorrows ?? BIGINT_ZERO) -
    (totalReserves ?? BIGINT_ZERO);

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
    const tvlUsdScaled = (tvlUnderlying * underlyingPrice) / pow10BigInt(18);
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
    collateralFactorMantissa: collateralFactorMantissa,
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

export async function fetchV3MarketState(
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
  const utilizationRaw = marketCoreResults[2];
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
  const { totalSupplyBase, totalBorrowBase } = totalsBasic as {
    totalSupplyBase: bigint;
    totalBorrowBase: bigint;
  };

  const numAssets = Number(numAssetsRaw ?? 0);
  const collaterals: V3CollateralInfo[] = [];
  const collateralCalls = Array.from(
    { length: numAssets },
    (_, index) =>
      ({
        address: comet,
        abi: cometAbi,
        functionName: "getAssetInfo",
        args: [BigInt(index)],
      }) as const
  );

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

            const priceValue = priceResults[0];
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
      basePrice = basePriceResults[0];
      basePriceDecimals = Number(basePriceResults[1] ?? 8);
    } catch {
      basePrice = null;
      basePriceDecimals = null;
    }
  }

  const supplyApy = calculateApyFromRatePerSecond(supplyRate);
  const borrowApy = calculateApyFromRatePerSecond(borrowRate);
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
    supplyRate: supplyRate,
    borrowRate: borrowRate,
    utilization: utilizationRaw,
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

export function buildV2MarketResponse(
  state: V2MarketState
): LinkPreviewResponse {
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

export function buildV3MarketResponse(
  state: V3MarketState
): LinkPreviewResponse {
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

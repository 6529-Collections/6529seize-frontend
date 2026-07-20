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
import {
  BIGINT_ZERO,
  MANTISSA_1E18,
  buildV2MarketResponse,
  buildV3MarketResponse,
  fetchV2MarketState,
  fetchV3MarketState,
  formatUnitsWithPrecision,
  getExchangeRateScale,
  isPossibleTxHash,
  normalizeAddress,
  type CompoundTarget,
  type PreviewPlan,
} from "./markets";
export type { PreviewPlan } from "./markets";

const BLOCKS_PER_YEAR = 2_365_200;
const SECONDS_PER_YEAR = 31_536_000;

const V2_MARKET_TTL_MS = 90_000;
const V3_MARKET_TTL_MS = 90_000;
const ACCOUNT_TTL_MS = 45_000;
const TX_TTL_SUCCESS_MS = 24 * 60 * 60 * 1000;
const TX_TTL_PENDING_MS = 30_000;

async function fetchV2Account(address: Address): Promise<LinkPreviewResponse> {
  const markets = Array.from(v2MarketsByAddress.values());
  const states = await Promise.all(
    markets.map((market) => fetchV2MarketState(market))
  );

  const positionsRaw = await Promise.all(
    states.map(async (state) => {
      const cToken = state.config.address as Address;
      const [balanceResult, borrowResult] = await publicClient.multicall({
        allowFailure: false,
        contracts: [
          {
            address: cToken,
            abi: cTokenAbi,
            functionName: "balanceOf",
            args: [address],
          },
          {
            address: cToken,
            abi: cTokenAbi,
            functionName: "borrowBalanceStored",
            args: [address],
          },
        ],
      });

      const balance = balanceResult;
      const borrowBalance = borrowResult;
      const exchangeRateScale = getExchangeRateScale(
        state.config.underlying.decimals,
        state.cTokenDecimals
      );

      const supplyUnderlyingRaw =
        (balance * state.exchangeRateStored) / pow10BigInt(exchangeRateScale);
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
        hasPosition:
          supplyUnderlyingRaw > BIGINT_ZERO || borrowBalance > BIGINT_ZERO,
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

  const liquidityUsd = formatUnitsWithPrecision(liquidityRaw, 18, 2);
  const shortfallUsd = formatUnitsWithPrecision(shortfallRaw, 18, 2);
  const liquidityValue = liquidityRaw;
  const shortfallValue = shortfallRaw;

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

type V3CollateralEntry = {
  readonly asset: string;
  readonly amount: string;
  readonly usdPrice?: string | undefined;
  readonly collateralFactor: string;
};

type V3AccountPosition = {
  readonly comet: Address;
  readonly baseSymbol: string;
  readonly supplyBase: string;
  readonly borrowBase: string;
  readonly collateral: V3CollateralEntry[];
  readonly supplyApy: string;
  readonly borrowApy: string;
};

async function fetchV3Account(address: Address): Promise<{
  readonly v3Positions: V3AccountPosition[];
  readonly v3Rewards?: string | undefined;
}> {
  const markets = Array.from(v3MarketsByAddress.values());
  const states = await Promise.all(
    markets.map((market) => fetchV3MarketState(market))
  );

  const v3Positions = await Promise.all(
    states.map(async (state) => {
      const comet = state.config.address as Address;
      const [balanceResult, borrowResult] = await publicClient.multicall({
        allowFailure: false,
        contracts: [
          {
            address: comet,
            abi: cometAbi,
            functionName: "balanceOf",
            args: [address],
          },
          {
            address: comet,
            abi: cometAbi,
            functionName: "borrowBalanceOf",
            args: [address],
          },
        ],
      });

      const baseSupplyRaw = balanceResult;
      const baseSupply = formatUnitsWithPrecision(
        baseSupplyRaw,
        state.config.base.decimals,
        6
      );
      let baseBorrow = "0";
      let baseBorrowRaw = BIGINT_ZERO;
      try {
        baseBorrowRaw = borrowResult;
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
        baseSupplyRaw > BIGINT_ZERO ||
        baseBorrowRaw > BIGINT_ZERO ||
        collateralEntries.length > 0;

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
      .map(({ hasPosition: _ignored, ...rest }) => rest),
  };
}

type CompoundAccountResponse = LinkPreviewResponse & {
  positions: { v2: unknown; v3: unknown };
  rewards?: { [key: string]: unknown } | undefined;
};

async function fetchCompoundAccount(
  address: Address
): Promise<LinkPreviewResponse> {
  const [v2Response, v3Response] = await Promise.all([
    fetchV2Account(address),
    fetchV3Account(address),
  ]);

  const combined = v2Response as CompoundAccountResponse;
  combined.positions.v3 = v3Response.v3Positions;
  if (!combined.rewards) {
    combined.rewards = {};
  }
  combined.rewards["v3Claimable"] = v3Response.v3Rewards ?? "0";
  return combined;
}

function decodeV2Event(log: {
  address: Address;
  data: `0x${string}`;
  topics: readonly `0x${string}`[];
}) {
  try {
    const topics = (
      log.topics.length === 0
        ? []
        : ([...log.topics] as [`0x${string}`, ...`0x${string}`[]])
    ) as [] | [`0x${string}`, ...`0x${string}`[]];
    return decodeEventLog({
      abi: cTokenAbi,
      data: log.data,
      topics,
    });
  } catch {
    return null;
  }
}

function decodeV3Event(log: {
  address: Address;
  data: `0x${string}`;
  topics: readonly `0x${string}`[];
}) {
  try {
    const topics = (
      log.topics.length === 0
        ? []
        : ([...log.topics] as [`0x${string}`, ...`0x${string}`[]])
    ) as [] | [`0x${string}`, ...`0x${string}`[]];
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
  const { receipt, status, blockNumber } =
    await getTransactionReceiptDetails(hash);
  const participants = extractTransactionParticipants(transaction);
  const summary = buildCompoundSummaryFromLogs(
    receipt?.logs ?? [],
    participants
  );

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

type PublicClientReceipt = Awaited<
  ReturnType<typeof publicClient.getTransactionReceipt>
>;

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
  readonly from?: Address | undefined;
  readonly to?: Address | undefined;
};

type CompoundSummaryAction =
  | "supply"
  | "redeem"
  | "borrow"
  | "repay"
  | "liquidate"
  | "withdraw";

type TxParticipants = {
  readonly from?: Address | undefined;
  readonly to?: Address | undefined;
};

async function getTransactionReceiptDetails(
  hash: Hash
): Promise<ReceiptDetails> {
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
  readonly from?: string | null | undefined;
  readonly to?: string | null | undefined;
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
    const summary =
      buildV2Summary(log, participants) ?? buildV3Summary(log, participants);
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
  const amount = formatUnitsWithPrecision(
    amountRaw,
    market.underlying.decimals,
    6
  );
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

function detectAppCompoundAccount(
  url: URL,
  pathname: string
): CompoundTarget | null {
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

function detectAppCompoundTarget(
  url: URL,
  pathname: string
): CompoundTarget | null {
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

function detectEtherscanCompoundTarget(
  pathname: string
): CompoundTarget | null {
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
        const ttl =
          data["status"] === "pending" ? TX_TTL_PENDING_MS : TX_TTL_SUCCESS_MS;
        return { data, ttl };
      },
    };
  }

  return null;
}

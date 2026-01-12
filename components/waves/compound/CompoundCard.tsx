import Link from "next/link";
import type { ReactElement } from "react";

import { LinkPreviewCardLayout } from "../OpenGraphPreview";
import {
  type CompoundAccountResponse,
  type CompoundMarketV2Response,
  type CompoundMarketV3Response,
  type CompoundResponse,
  type CompoundTxResponse,
  isCompoundAccount,
  isCompoundMarket,
  isCompoundResponse,
  isCompoundTx,
} from "./types";

interface CompoundCardProps {
  readonly href: string;
  readonly response: CompoundResponse;
}

const cardContainerClass =
  "tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-4 tw-flex tw-flex-col tw-gap-y-4";

function formatPercent(value?: string): string {
  if (!value) {
    return "-";
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return value;
  }
  const percent = (numeric * 100).toFixed(2);
  return `${Number.parseFloat(percent)}%`;
}

function formatNumber(value?: string): string {
  if (!value) {
    return "-";
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return value;
  }
  return numeric.toLocaleString(undefined, {
    maximumFractionDigits: 6,
  });
}

function formatCurrency(value?: string): string {
  if (!value) {
    return "-";
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return `$${value}`;
  }
  return numeric.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

function MarketStatsRow({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div className="tw-flex tw-flex-col tw-gap-1">
      <span className="tw-text-xs tw-uppercase tw-tracking-wide tw-text-iron-400">
        {label}
      </span>
      <span className="tw-text-base tw-font-semibold tw-text-iron-50">
        {value}
      </span>
    </div>
  );
}

function renderMarketV2(response: CompoundMarketV2Response) {
  const { metrics, market, links } = response;
  return (
    <div className={cardContainerClass}>
      <div className="tw-flex tw-flex-col tw-gap-y-1">
        <span className="tw-text-xs tw-font-semibold tw-uppercase tw-text-primary-300">
          Compound v2 Market
        </span>
        <h3 className="tw-text-xl tw-font-semibold tw-text-white">
          {market.symbol}
          <span className="tw-ml-2 tw-text-sm tw-font-normal tw-text-iron-400">
            {market.underlying.symbol}
          </span>
        </h3>
        <div className="tw-flex tw-flex-wrap tw-gap-x-4 tw-text-xs tw-text-iron-400">
          <span>cToken: {market.cToken}</span>
          <span>Underlying: {market.underlying.address}</span>
        </div>
      </div>
      <div className="tw-grid tw-grid-cols-1 tw-gap-4 md:tw-grid-cols-2">
        <MarketStatsRow
          label="Supply APY"
          value={formatPercent(metrics.supplyApy)}
        />
        <MarketStatsRow
          label="Borrow APY"
          value={formatPercent(metrics.borrowApy)}
        />
        <MarketStatsRow
          label="Utilization"
          value={formatPercent(metrics.utilization)}
        />
        <MarketStatsRow
          label="Exchange Rate"
          value={formatNumber(metrics.exchangeRate)}
        />
        <MarketStatsRow
          label={`TVL (${market.underlying.symbol})`}
          value={formatNumber(metrics.tvlUnderlying)}
        />
        <MarketStatsRow
          label="TVL (USD)"
          value={formatCurrency(metrics.tvlUsd)}
        />
        <MarketStatsRow
          label="Collateral Factor"
          value={formatPercent(metrics.collateralFactor)}
        />
        <MarketStatsRow
          label="Reserve Factor"
          value={formatPercent(metrics.reserveFactor)}
        />
      </div>
      <div className="tw-flex tw-flex-wrap tw-gap-4">
        {links.marketUrl && (
          <Link
            href={links.marketUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="tw-text-sm tw-font-semibold tw-text-primary-300 hover:tw-text-primary-300"
          >
            View on Compound
          </Link>
        )}
        {links.etherscan && (
          <Link
            href={links.etherscan}
            target="_blank"
            rel="noopener noreferrer"
            className="tw-text-sm tw-font-semibold tw-text-primary-300 hover:tw-text-primary-300"
          >
            View on Etherscan
          </Link>
        )}
      </div>
    </div>
  );
}

function renderMarketV3(response: CompoundMarketV3Response) {
  const { metrics, market, links } = response;
  return (
    <div className={cardContainerClass}>
      <div className="tw-flex tw-flex-col tw-gap-y-1">
        <span className="tw-text-xs tw-font-semibold tw-uppercase tw-text-primary-300">
          Compound v3 Market
        </span>
        <h3 className="tw-text-xl tw-font-semibold tw-text-white">
          {market.base.symbol}
          <span className="tw-ml-2 tw-text-sm tw-font-normal tw-text-iron-400">
            Base Asset
          </span>
        </h3>
        <div className="tw-flex tw-flex-wrap tw-gap-x-4 tw-text-xs tw-text-iron-400">
          <span>Comet: {market.comet}</span>
          <span>Base: {market.base.address}</span>
        </div>
      </div>
      <div className="tw-grid tw-grid-cols-1 tw-gap-4 md:tw-grid-cols-2">
        <MarketStatsRow
          label="Supply APY"
          value={formatPercent(metrics.supplyApy)}
        />
        <MarketStatsRow
          label="Borrow APY"
          value={formatPercent(metrics.borrowApy)}
        />
        <MarketStatsRow
          label="Utilization"
          value={formatPercent(metrics.utilization)}
        />
        <MarketStatsRow
          label={`Total Supply (${market.base.symbol})`}
          value={formatNumber(metrics.totalSupplyBase)}
        />
        <MarketStatsRow
          label={`Total Borrow (${market.base.symbol})`}
          value={formatNumber(metrics.totalBorrowBase)}
        />
        <MarketStatsRow
          label="TVL (USD)"
          value={formatCurrency(metrics.tvlUsd)}
        />
      </div>
      {market.collaterals.length > 0 && (
        <div className="tw-flex tw-flex-col tw-gap-y-2">
          <span className="tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-400">
            Collateral Assets
          </span>
          <div className="tw-flex tw-flex-wrap tw-gap-3">
            {market.collaterals.map((collateral) => (
              <div
                key={collateral.address}
                className="tw-rounded-lg tw-border tw-border-iron-700 tw-bg-iron-900/60 tw-px-3 tw-py-2"
              >
                <div className="tw-text-sm tw-font-semibold tw-text-iron-100">
                  {collateral.symbol}
                </div>
                <div className="tw-text-xs tw-text-iron-400">
                  CF: {formatPercent(collateral.collateralFactor)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="tw-flex tw-flex-wrap tw-gap-4">
        {links.marketUrl && (
          <Link
            href={links.marketUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="tw-text-sm tw-font-semibold tw-text-primary-300 hover:tw-text-primary-300"
          >
            View on Compound
          </Link>
        )}
        {links.etherscan && (
          <Link
            href={links.etherscan}
            target="_blank"
            rel="noopener noreferrer"
            className="tw-text-sm tw-font-semibold tw-text-primary-300 hover:tw-text-primary-300"
          >
            View on Etherscan
          </Link>
        )}
      </div>
    </div>
  );
}

function renderAccount(response: CompoundAccountResponse) {
  const { positions, risk, rewards, address, links } = response;
  const hasV2 = positions.v2.length > 0;
  const hasV3 = positions.v3.length > 0;
  return (
    <div className={cardContainerClass}>
      <div className="tw-flex tw-flex-col tw-gap-y-1">
        <span className="tw-text-xs tw-font-semibold tw-uppercase tw-text-primary-300">
          Compound Account
        </span>
        <h3 className="tw-text-xl tw-font-semibold tw-text-white">{address}</h3>
      </div>
      {risk && (
        <div className="tw-grid tw-grid-cols-1 tw-gap-4 md:tw-grid-cols-3">
          <MarketStatsRow
            label="Liquidity"
            value={formatCurrency(risk.liquidityUsd)}
          />
          <MarketStatsRow
            label="Shortfall"
            value={formatCurrency(risk.shortfallUsd)}
          />
          <MarketStatsRow label="Health" value={risk.healthLabel ?? "-"} />
        </div>
      )}
      {hasV2 && (
        <div className="tw-flex tw-flex-col tw-gap-y-2">
          <h4 className="tw-text-lg tw-font-semibold tw-text-iron-50">
            Compound v2 Positions
          </h4>
          <div className="tw-flex tw-flex-col tw-gap-2">
            {positions.v2.map((position) => (
              <div
                key={position.cToken}
                className="tw-flex tw-flex-col tw-gap-2 tw-rounded-lg tw-border tw-border-iron-700 tw-bg-iron-900/60 tw-p-3"
              >
                <div className="tw-flex tw-justify-between tw-text-sm tw-font-semibold tw-text-iron-100">
                  <span>{position.symbol}</span>
                  <span>
                    Price:{" "}
                    {position.usdPrice
                      ? formatCurrency(position.usdPrice)
                      : "-"}
                  </span>
                </div>
                <div className="tw-grid tw-grid-cols-1 tw-gap-3 md:tw-grid-cols-3">
                  <MarketStatsRow
                    label="Supplied"
                    value={`${formatNumber(position.supplyUnderlying)} ${position.symbol}`}
                  />
                  <MarketStatsRow
                    label="Borrowed"
                    value={`${formatNumber(position.borrowUnderlying)} ${position.symbol}`}
                  />
                  <MarketStatsRow
                    label="Collateral Factor"
                    value={formatPercent(position.collateralFactor)}
                  />
                  <MarketStatsRow
                    label="Supply APY"
                    value={formatPercent(position.supplyApy)}
                  />
                  <MarketStatsRow
                    label="Borrow APY"
                    value={formatPercent(position.borrowApy)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {hasV3 && (
        <div className="tw-flex tw-flex-col tw-gap-y-2">
          <h4 className="tw-text-lg tw-font-semibold tw-text-iron-50">
            Compound v3 Positions
          </h4>
          <div className="tw-flex tw-flex-col tw-gap-2">
            {positions.v3.map((position) => (
              <div
                key={position.comet}
                className="tw-flex tw-flex-col tw-gap-2 tw-rounded-lg tw-border tw-border-iron-700 tw-bg-iron-900/60 tw-p-3"
              >
                <div className="tw-flex tw-justify-between tw-text-sm tw-font-semibold tw-text-iron-100">
                  <span>{position.baseSymbol}</span>
                </div>
                <div className="tw-grid tw-grid-cols-1 tw-gap-3 md:tw-grid-cols-3">
                  <MarketStatsRow
                    label="Supplied"
                    value={`${formatNumber(position.supplyBase)} ${position.baseSymbol}`}
                  />
                  <MarketStatsRow
                    label="Borrowed"
                    value={`${formatNumber(position.borrowBase)} ${position.baseSymbol}`}
                  />
                  <MarketStatsRow
                    label="Supply APY"
                    value={formatPercent(position.supplyApy)}
                  />
                  <MarketStatsRow
                    label="Borrow APY"
                    value={formatPercent(position.borrowApy)}
                  />
                </div>
                {position.collateral.length > 0 && (
                  <div className="tw-flex tw-flex-col tw-gap-y-2">
                    <span className="tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-400">
                      Collateral
                    </span>
                    <div className="tw-flex tw-flex-wrap tw-gap-3">
                      {position.collateral.map((collateral) => (
                        <div
                          key={`${position.comet}-${collateral.asset}`}
                          className="tw-rounded-lg tw-border tw-border-iron-700 tw-bg-iron-900/80 tw-px-3 tw-py-2"
                        >
                          <div className="tw-text-sm tw-font-semibold tw-text-iron-100">
                            {collateral.asset}
                          </div>
                          <div className="tw-text-xs tw-text-iron-400">
                            {formatNumber(collateral.amount)}
                          </div>
                          <div className="tw-text-xs tw-text-iron-400">
                            CF: {formatPercent(collateral.collateralFactor)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {rewards && (
        <div className="tw-flex tw-flex-wrap tw-gap-4">
          {rewards.v2CompAccrued && (
            <span className="tw-text-sm tw-text-iron-300">
              COMP accrued: {formatNumber(rewards.v2CompAccrued)}
            </span>
          )}
          {rewards.v3Claimable && (
            <span className="tw-text-sm tw-text-iron-300">
              v3 rewards: {formatNumber(rewards.v3Claimable)}
            </span>
          )}
        </div>
      )}
      <div className="tw-flex tw-flex-wrap tw-gap-4">
        {links?.etherscan && (
          <Link
            href={links.etherscan}
            target="_blank"
            rel="noopener noreferrer"
            className="tw-text-sm tw-font-semibold tw-text-primary-300 hover:tw-text-primary-300"
          >
            View on Etherscan
          </Link>
        )}
      </div>
    </div>
  );
}

function renderTx(response: CompoundTxResponse) {
  const { summary, status, blockNumber, links, hash } = response;
  return (
    <div className={cardContainerClass}>
      <div className="tw-flex tw-flex-col tw-gap-y-1">
        <span className="tw-text-xs tw-font-semibold tw-uppercase tw-text-primary-300">
          Compound Transaction
        </span>
        <h3 className="tw-text-lg tw-font-semibold tw-text-white">{hash}</h3>
      </div>
      <div className="tw-grid tw-grid-cols-1 tw-gap-4 md:tw-grid-cols-2">
        <MarketStatsRow label="Status" value={status} />
        {blockNumber !== undefined && (
          <MarketStatsRow label="Block" value={blockNumber.toString()} />
        )}
        {summary?.action && (
          <MarketStatsRow label="Action" value={summary.action} />
        )}
        {summary?.token && (
          <MarketStatsRow label="Token" value={summary.token} />
        )}
        {summary?.amount && (
          <MarketStatsRow label="Amount" value={formatNumber(summary.amount)} />
        )}
        {summary?.market?.symbol && (
          <MarketStatsRow label="Market" value={summary.market.symbol} />
        )}
      </div>
      <div className="tw-flex tw-flex-wrap tw-gap-4">
        {links?.etherscan && (
          <Link
            href={links.etherscan}
            target="_blank"
            rel="noopener noreferrer"
            className="tw-text-sm tw-font-semibold tw-text-primary-300 hover:tw-text-primary-300"
          >
            View on Etherscan
          </Link>
        )}
      </div>
    </div>
  );
}

export default function CompoundCard({ href, response }: CompoundCardProps) {
  let content: ReactElement | null = null;

  if (isCompoundMarket(response)) {
    content =
      response.version === "v2"
        ? renderMarketV2(response)
        : renderMarketV3(response);
  } else if (isCompoundAccount(response)) {
    content = renderAccount(response);
  } else if (isCompoundTx(response)) {
    content = renderTx(response);
  }

  if (!content) {
    return null;
  }

  return <LinkPreviewCardLayout href={href}>{content}</LinkPreviewCardLayout>;
}

export function toCompoundResponse(
  response: unknown
): CompoundResponse | undefined {
  if (!isCompoundResponse(response)) {
    return undefined;
  }
  return response;
}

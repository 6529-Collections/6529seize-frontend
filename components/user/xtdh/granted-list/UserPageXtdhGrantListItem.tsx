"use client";

import Image from "next/image";
import { type ReactNode } from "react";

import type { ApiTdhGrantsPage } from "@/generated/models/ApiTdhGrantsPage";
import {
  formatAmount,
  formatDateTime,
  formatTargetTokensCount,
} from "@/components/user/xtdh/utils/xtdhGrantFormatters";
import { isValidEthAddress } from "@/helpers/Helpers";
import { useContractOverviewQuery } from "@/hooks/useAlchemyNftQueries";
import type { ContractOverview, SupportedChain } from "@/types/nft";

export interface UserPageXtdhGrantListItemProps {
  readonly grant: ApiTdhGrantsPage["data"][number];
}

export function UserPageXtdhGrantListItem({
  grant,
}: Readonly<UserPageXtdhGrantListItemProps>) {
  const contractAddress = getContractAddress(grant.target_contract);
  const chain = mapGrantChainToSupportedChain(grant.target_chain);
  const { data: contract, isLoading, isError } = useContractOverviewQuery({
    address: contractAddress,
    chain,
    enabled: Boolean(contractAddress),
  });
  const tokensCountLabel = formatTargetTokensCount(grant.target_tokens);
  const tdhRateLabel = formatAmount(grant.tdh_rate);
  const validUntilLabel = formatDateTime(grant.valid_to ?? null);

  const baseDetails = {
    tokenTypeLabel: "Unknown",
    totalSupplyLabel: "Unknown",
    floorPriceLabel: "Unknown",
    tokensCountLabel,
    tdhRateLabel,
    validUntilLabel,
  };


  if (isLoading) {
    return (
      <li className="tw-list-none tw-rounded-xl tw-border tw-border-iron-800 tw-bg-iron-900 tw-p-4">
        <GrantItemSkeleton />
      </li>
    );
  }

  const hasContractData = Boolean(contract);
  const details = hasContractData
    ? {
        ...baseDetails,
        tokenTypeLabel: contract?.tokenType ?? "Unknown",
        totalSupplyLabel: formatTotalSupply(contract?.totalSupply),
        floorPriceLabel: formatFloorPrice(contract?.floorPriceEth),
      }
    : baseDetails;

  return (
    <li className="tw-list-none tw-rounded-xl tw-border tw-border-iron-800 tw-bg-iron-900 tw-p-4">
      {hasContractData && !isError ? (
        <GrantItemContent
          contract={contract!}
          status={grant.status}
          details={details}
        />
      ) : (
        <GrantItemError
          contractLabel={contractAddress ?? grant.target_contract}
          status={grant.status}
          details={details}
        />
      )}
    </li>
  );
}

interface GrantItemContentProps {
  readonly contract: ContractOverview;
  readonly status: string;
  readonly details: GrantDetails;
}

function GrantItemContent({
  contract,
  status,
  details,
}: Readonly<GrantItemContentProps>) {
  const name = contract.name ?? shortenAddress(contract.address);

  return (
    <div className="tw-flex tw-flex-col tw-gap-4">
      <header className="tw-flex tw-flex-wrap tw-items-start tw-justify-between tw-gap-4">
        <div className="tw-flex tw-items-start tw-gap-3">
          <div className="tw-relative tw-h-14 tw-w-14 tw-overflow-hidden tw-rounded-lg tw-bg-iron-800">
            {contract.imageUrl ? (
              <Image
                src={contract.imageUrl}
                alt={name}
                fill
                sizes="56px"
                className="tw-h-full tw-w-full tw-object-cover"
              />
            ) : (
              <div className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-400">
                NFT
              </div>
            )}
          </div>
          <div className="tw-flex tw-flex-col tw-gap-1">
            <p className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-100">
              {name}
            </p>
            <p className="tw-m-0 tw-text-xs tw-text-iron-400">
              {shortenAddress(contract.address)}
            </p>
          </div>
        </div>
        <StatusBadge status={status} />
      </header>
      <GrantDetailsGrid details={details} />
    </div>
  );
}

interface GrantItemErrorProps {
  readonly contractLabel?: string;
  readonly status: string;
  readonly details: GrantDetails;
}

function GrantItemError({
  contractLabel,
  status,
  details,
}: Readonly<GrantItemErrorProps>) {
  return (
    <div className="tw-flex tw-flex-col tw-gap-4">
      <header className="tw-flex tw-flex-wrap tw-items-start tw-justify-between tw-gap-4">
        <div>
          <p className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-100">
            Contract details unavailable
          </p>
          <p className="tw-m-0 tw-text-xs tw-text-iron-400">
            {contractLabel
              ? `We couldn't load metadata for ${formatContractLabel(contractLabel)}.`
              : "We couldn't load metadata for this contract."}
          </p>
        </div>
        <StatusBadge status={status} />
      </header>
      <GrantDetailsGrid details={details} />
    </div>
  );
}

function GrantItemSkeleton() {
  return (
    <div className="tw-animate-pulse tw-space-y-4">
      <div className="tw-flex tw-flex-wrap tw-items-start tw-justify-between tw-gap-4">
        <div className="tw-flex tw-items-start tw-gap-3">
          <div className="tw-h-14 tw-w-14 tw-rounded-lg tw-bg-iron-800" />
          <div className="tw-space-y-2">
            <div className="tw-h-4 tw-w-36 tw-rounded tw-bg-iron-800" />
            <div className="tw-h-3 tw-w-24 tw-rounded tw-bg-iron-800" />
          </div>
        </div>
        <div className="tw-h-5 tw-w-16 tw-rounded-full tw-bg-iron-800" />
      </div>
      <div className="tw-grid tw-gap-3 sm:tw-grid-cols-2 lg:tw-grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="tw-space-y-2">
            <div className="tw-h-3 tw-w-20 tw-rounded tw-bg-iron-800" />
            <div className="tw-h-4 tw-w-24 tw-rounded tw-bg-iron-700" />
          </div>
        ))}
      </div>
    </div>
  );
}

interface GrantDetails {
  readonly tokenTypeLabel: string;
  readonly totalSupplyLabel: string;
  readonly floorPriceLabel: string;
  readonly tokensCountLabel: string;
  readonly tdhRateLabel: string;
  readonly validUntilLabel: string;
}

interface GrantDetailsGridProps {
  readonly details: GrantDetails;
}

function GrantDetailsGrid({ details }: Readonly<GrantDetailsGridProps>) {
  return (
    <dl className="tw-grid tw-gap-3 sm:tw-grid-cols-2 lg:tw-grid-cols-3">
      <GrantDetailsRow label="Token type" value={details.tokenTypeLabel} />
      <GrantDetailsRow label="Total supply" value={details.totalSupplyLabel} />
      <GrantDetailsRow label="Floor price" value={details.floorPriceLabel} />
      <GrantDetailsRow label="Tokens" value={details.tokensCountLabel} />
      <GrantDetailsRow label="TDH rate" value={details.tdhRateLabel} />
      <GrantDetailsRow label="Valid until" value={details.validUntilLabel} />
    </dl>
  );
}

interface GrantDetailsRowProps {
  readonly label: string;
  readonly value: ReactNode;
}

function GrantDetailsRow({
  label,
  value,
}: Readonly<GrantDetailsRowProps>) {
  return (
    <div className="tw-flex tw-flex-col tw-gap-0.5">
      <dt className="tw-text-[11px] tw-font-semibold tw-uppercase tw-text-iron-500">
        {label}
      </dt>
      <dd className="tw-m-0 tw-text-sm tw-font-medium tw-text-iron-100">
        {value}
      </dd>
    </div>
  );
}

interface StatusBadgeProps {
  readonly status: string;
}

function StatusBadge({ status }: Readonly<StatusBadgeProps>) {
  return (
    <span className="tw-inline-flex tw-items-center tw-rounded-full tw-bg-iron-800 tw-px-2.5 tw-py-0.5 tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-200">
      {status}
    </span>
  );
}

function getContractAddress(
  contract: string
): `0x${string}` | undefined {
  if (!contract) {
    return undefined;
  }
  const trimmed = contract.trim();
  if (!isValidEthAddress(trimmed)) {
    return undefined;
  }
  return trimmed as `0x${string}`;
}

function shortenAddress(address: `0x${string}`): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function formatContractLabel(contract?: string): string {
  if (!contract) {
    return "this contract";
  }
  if (isValidEthAddress(contract)) {
    return shortenAddress(contract as `0x${string}`);
  }
  return contract;
}

function formatTotalSupply(value?: string | null): string {
  if (!value) {
    return "Unknown";
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return value;
  }
  return new Intl.NumberFormat().format(parsed);
}

function formatFloorPrice(value?: number | null): string {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "Unknown";
  }
  return `Ξ${new Intl.NumberFormat(undefined, {
    maximumFractionDigits: value < 1 ? 4 : 2,
  }).format(value)}`;
}

function mapGrantChainToSupportedChain(
  chain: ApiTdhGrantsPage["data"][number]["target_chain"]
): SupportedChain {
  switch (chain) {
    case "ETHEREUM_MAINNET":
    default:
      return "ethereum";
  }
}

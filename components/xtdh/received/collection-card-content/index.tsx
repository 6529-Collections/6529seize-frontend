"use client";

import Image from "next/image";
import { useMemo } from "react";
import clsx from "clsx";

import type { ApiXTdhCollectionsPage } from "@/generated/models/ApiXTdhCollectionsPage";
import { useContractOverviewQuery } from "@/hooks/useAlchemyNftQueries";
import { isValidEthAddress } from "@/helpers/Helpers";
import { shortenAddress } from "@/helpers/address.helpers";

import {
  formatFloorPrice,
  formatTotalSupply,
} from "@/components/user/xtdh/granted-list/UserPageXtdhGrantListItem/formatters";
import {
  formatCount,
  formatXtdhRate,
  formatXtdhValue,
} from "../utils/formatters";
import { XtdhRatePill } from "./subcomponents/XtdhRatePill";

type ApiXtdhCollection = ApiXTdhCollectionsPage["data"][number];

type InteractionMode = "button" | "static";

interface XtdhReceivedCollectionCardProps {
  readonly collection: ApiXtdhCollection;
  readonly isSelected?: boolean;
  readonly onSelect?: (contract: string | null) => void;
  readonly interactionMode?: InteractionMode;
}

export function XtdhReceivedCollectionCard({
  collection,
  isSelected = false,
  onSelect,
  interactionMode = "button",
}: Readonly<XtdhReceivedCollectionCardProps>) {
  const contractAddress = useMemo(() => {
    const trimmed = collection.contract?.trim() ?? "";
    return isValidEthAddress(trimmed)
      ? (trimmed as `0x${string}`)
      : null;
  }, [collection.contract]);
  const { data: contract, isLoading, isError } = useContractOverviewQuery({
    address: contractAddress ?? undefined,
    enabled: Boolean(contractAddress),
  });

  const displayName = useMemo(() => {
    if (contract?.name) {
      return contract.name;
    }
    if (contractAddress) {
      return shortenAddress(contractAddress);
    }
    return "Unknown collection";
  }, [contract?.name, contractAddress]);

  const secondaryLabel = useMemo(() => {
    if (isLoading) {
      return "Loading metadata...";
    }
    if (isError) {
      return "Metadata unavailable";
    }
    if (contractAddress) {
      return contractAddress.toLowerCase();
    }
    return collection.contract ?? "Unknown contract";
  }, [collection.contract, contractAddress, isError, isLoading]);

  const imageUrl = contract?.imageUrl ?? null;
  const tokenTypeLabel = contract?.tokenType ?? "Unknown";
  const totalSupplyLabel = formatTotalSupply(contract?.totalSupply);
  const floorPriceLabel = formatFloorPrice(contract?.floorPriceEth);
  const totalTokensGrantedLabel = formatCount(collection.total_token_count);
  const activeTokensGrantedLabel = formatCount(collection.active_token_count);
  const totalContributorsLabel = formatCount(collection.total_contributor_count);
  const activeContributorsLabel = formatCount(collection.active_contributor_count);
  const xtdhValueLabel = formatXtdhValue(collection.xtdh);
  const xtdhRateLabel = formatXtdhRate(collection.xtdh_rate);

  const isSelectable = interactionMode === "button" && Boolean(onSelect && collection.contract);

  const content = (
    <div
      className={clsx(
        "tw-flex tw-w-full tw-flex-col tw-items-stretch tw-rounded-2xl tw-border tw-border-iron-800 tw-bg-iron-900 tw-p-4 tw-text-left tw-shadow-inner tw-shadow-black/20 tw-transition-colors",
        interactionMode === "button" && "desktop-hover:hover:tw-bg-iron-900/80",
        isSelected && "tw-border-primary-500",
        !isSelectable && interactionMode === "button" && "tw-cursor-not-allowed tw-opacity-70"
      )}
    >
      <header className="tw-flex tw-flex-wrap tw-items-start tw-justify-between tw-gap-3">
        <div className="tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-gap-3">
          <div className="tw-relative tw-h-14 tw-w-14 tw-flex-shrink-0 tw-overflow-hidden tw-rounded-xl tw-bg-iron-800">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={displayName}
                fill
                sizes="56px"
                className="tw-h-full tw-w-full tw-object-cover"
              />
            ) : (
              <div className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-text-xs tw-font-semibold tw-text-iron-400">
                NFT
              </div>
            )}
          </div>
          <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-1">
            <p className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-100">
              {displayName}
            </p>
            <div className="tw-flex tw-w-full tw-flex-wrap tw-items-center tw-gap-2">
              <p className="tw-m-0 tw-flex-1 tw-text-xs tw-text-iron-400 tw-break-all">
                {secondaryLabel}
              </p>
              <span className="tw-inline-flex tw-items-center tw-rounded-full tw-bg-iron-800 tw-px-2 tw-py-0.5 tw-text-[10px] tw-font-semibold tw-uppercase tw-text-iron-200">
                {tokenTypeLabel}
              </span>
            </div>
          </div>
        </div>
        <XtdhRatePill rateLabel={xtdhRateLabel} totalLabel={xtdhValueLabel} />
      </header>
      <dl className="tw-mt-3 tw-grid tw-gap-3 sm:tw-grid-cols-3">
        <CollectionMetric label="Total supply" value={totalSupplyLabel} />
        <CollectionMetric label="Active tokens" value={activeTokensGrantedLabel} />
        <CollectionMetric label="Tokens granted" value={totalTokensGrantedLabel} />
        <CollectionMetric label="Floor price" value={floorPriceLabel} />
        <CollectionMetric label="Active contributors" value={activeContributorsLabel} />
        <CollectionMetric label="Contributors" value={totalContributorsLabel} />
      </dl>
    </div>
  );

  if (interactionMode === "static") {
    return <li className="tw-list-none">{content}</li>;
  }

  const handleSelect = () => {
    if (!onSelect || !collection.contract) {
      return;
    }
    onSelect(collection.contract);
  };

  return (
    <li className="tw-list-none">
      <button
        type="button"
        onClick={handleSelect}
        disabled={!isSelectable}
        aria-pressed={isSelected}
        className="tw-w-full tw-bg-transparent tw-p-0 tw-text-left tw-border-none"
      >
        {content}
      </button>
    </li>
  );
}

export function CollectionMetric({
  label,
  value,
  className,
}: Readonly<{ label: string; value: string; className?: string }>) {
  return (
    <div
      className={clsx("tw-flex tw-flex-col tw-gap-0.5 tw-text-left", className)}
    >
      <dt className="tw-text-[11px] tw-font-semibold tw-uppercase tw-text-iron-500">
        {label}
      </dt>
      <dd className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-100">
        {value}
      </dd>
    </div>
  );
}

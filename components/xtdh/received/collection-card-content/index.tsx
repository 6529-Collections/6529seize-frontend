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
} from "@/components/user/xtdh/granted-list/subcomponents/UserPageXtdhGrantListItem/formatters";
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

  const { secondaryLabel, secondaryLabelTitle } = useMemo(() => {
    if (isLoading) {
      return {
        secondaryLabel: "Loading metadata...",
        secondaryLabelTitle: undefined,
      };
    }
    if (isError) {
      return {
        secondaryLabel: "Metadata unavailable",
        secondaryLabelTitle: undefined,
      };
    }
    if (contractAddress) {
      const normalized = contractAddress.toLowerCase();
      return {
        secondaryLabel: shortenAddress(normalized),
        secondaryLabelTitle: normalized,
      };
    }
    const fallback = collection.contract ?? "Unknown contract";
    return {
      secondaryLabel: fallback,
      secondaryLabelTitle: fallback,
    };
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
        "tw-flex tw-group tw-w-full tw-flex-col tw-items-stretch tw-text-left tw-transition-colors tw-duration-300 tw-overflow-hidden",
        interactionMode === "static"
          ? "tw-rounded-xl tw-bg-iron-900 tw-border tw-border-solid tw-border-iron-800 tw-p-4"
          : "tw-py-6 tw-px-6 desktop-hover:hover:tw-bg-iron-900 tw-rounded-b-xl",
        isSelected && "tw-bg-iron-900/50",
        !isSelectable && interactionMode === "button" && "tw-cursor-not-allowed tw-opacity-70"
      )}
    >
      <header className="tw-flex tw-flex-col md:tw-flex-row tw-items-start tw-justify-between tw-gap-x-3 tw-gap-y-6">
        <div className="tw-flex tw-flex-col sm:tw-flex-row tw-min-w-0 tw-flex-1 sm:tw-items-center tw-gap-3">
          <div className="tw-relative tw-h-16 tw-w-16 tw-bg-iron-800 tw-overflow-hidden tw-rounded-lg group-hover:tw-scale-105 tw-transition-transform tw-duration-300 tw-shadow-inner">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={displayName}
                fill
                sizes="64px"
                className="tw-h-full tw-w-full tw-object-cover"
              />
            ) : (
              <div className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-400">
                NFT
              </div>
            )}
          </div>
          <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-0.5">
            <p className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-50">
              {displayName}
            </p>
            <div className="tw-flex tw-w-full tw-items-center tw-gap-2">
              <p
                className="tw-m-0 tw-text-xs tw-text-iron-500 tw-mb-0"
                title={secondaryLabelTitle}
              >
                {secondaryLabel}
              </p>
              <span className="tw-inline-flex tw-items-center tw-rounded tw-bg-white/5 tw-border tw-border-solid tw-border-white/10 tw-px-2 tw-py-1 tw-text-[10px] tw-font-bold tw-uppercase tw-text-iron-400">
                {tokenTypeLabel}
              </span>
            </div>
          </div>
        </div>
        <XtdhRatePill rateLabel={xtdhRateLabel} totalLabel={xtdhValueLabel} />
      </header>
      <dl className="tw-mt-6 md:tw-mt-4 md:tw-ml-20 tw-grid tw-gap-x-6 tw-gap-y-4 sm:tw-grid-cols-2 md:tw-grid-cols-3 tw-mb-0">
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
      className={clsx("tw-flex tw-flex-col tw-text-left", className)}
    >
      <dt className="tw-text-[10px] tw-font-medium tw-uppercase tw-tracking-wider tw-text-iron-500 tw-mb-1.5">
        {label}
      </dt>
      <dd className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-50">
        {value}
      </dd>
    </div>
  );
}

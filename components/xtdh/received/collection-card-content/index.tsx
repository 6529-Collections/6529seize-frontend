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
  readonly isSelected?: boolean | undefined;
  readonly onSelect?: ((contract: string | null) => void) | undefined;
  readonly interactionMode?: InteractionMode | undefined;
}

export function XtdhReceivedCollectionCard({
  collection,
  isSelected = false,
  onSelect,
  interactionMode = "button",
}: Readonly<XtdhReceivedCollectionCardProps>) {
  const contractAddress = useMemo(() => {
    const trimmed = collection.contract.trim();
    return isValidEthAddress(trimmed) ? (trimmed as `0x${string}`) : null;
  }, [collection.contract]);
  const {
    data: contract,
    isLoading,
    isError,
  } = useContractOverviewQuery({
    address: contractAddress ?? undefined,
    enabled: Boolean(contractAddress),
  });
  const isMetadataLoading = Boolean(contractAddress) && isLoading;

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
    const fallback = collection.contract;
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
  const totalContributorsLabel = formatCount(
    collection.total_contributor_count
  );
  const activeContributorsLabel = formatCount(
    collection.active_contributor_count
  );
  const xtdhValueLabel = formatXtdhValue(collection.xtdh);
  const xtdhRateLabel = formatXtdhRate(collection.xtdh_rate);

  const isSelectable =
    interactionMode === "button" && Boolean(onSelect && collection.contract);

  let collectionImage = (
    <div className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-400">
      NFT
    </div>
  );
  if (imageUrl) {
    collectionImage = (
      <Image
        src={imageUrl}
        alt=""
        fill
        sizes="56px"
        className="tw-h-full tw-w-full tw-object-cover"
      />
    );
  }
  if (isMetadataLoading) {
    collectionImage = (
      <div
        aria-hidden="true"
        className="tw-h-full tw-w-full tw-animate-pulse tw-bg-iron-800 motion-reduce:tw-animate-none"
      />
    );
  }

  const content = (
    <div
      aria-busy={isMetadataLoading}
      className={clsx(
        "tw-group tw-flex tw-w-full tw-flex-col tw-items-stretch tw-overflow-hidden tw-text-left tw-transition-colors tw-duration-300 motion-reduce:tw-transition-none",
        interactionMode === "static"
          ? "tw-rounded-xl tw-bg-iron-900 tw-p-4 tw-ring-1 tw-ring-white/[0.05]"
          : "tw-rounded-xl tw-p-4 desktop-hover:hover:tw-bg-iron-900/40",
        isSelected && "tw-bg-white/[0.03]",
        !isSelectable &&
          interactionMode === "button" &&
          "tw-cursor-not-allowed tw-opacity-70"
      )}
    >
      <header className="tw-flex tw-flex-col tw-items-start tw-justify-between tw-gap-4 sm:tw-flex-row sm:tw-items-center">
        <div className="tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-gap-3">
          <div className="tw-relative tw-size-14 tw-flex-shrink-0 tw-overflow-hidden tw-rounded-lg tw-bg-iron-800 tw-shadow-inner tw-transition-transform tw-duration-300 group-hover:tw-scale-105 motion-reduce:tw-transform-none motion-reduce:tw-transition-none">
            {collectionImage}
          </div>
          <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-gap-1">
            {isMetadataLoading ? (
              <>
                <div
                  aria-hidden="true"
                  className="tw-animate-pulse motion-reduce:tw-animate-none"
                >
                  <div className="tw-h-4 tw-w-36 tw-max-w-full tw-rounded-full tw-bg-iron-800" />
                </div>
                <output className="tw-text-xs tw-text-iron-500">
                  Loading metadata...
                </output>
              </>
            ) : (
              <>
                <p className="tw-m-0 tw-break-words tw-text-base tw-font-semibold tw-leading-5 tw-text-iron-100">
                  {displayName}
                </p>
                <div className="tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-2">
                  <p
                    className="tw-m-0 tw-truncate tw-text-xs tw-text-iron-500"
                    title={secondaryLabelTitle}
                  >
                    {secondaryLabel}
                  </p>
                  <span className="tw-inline-flex tw-items-center tw-rounded-md tw-bg-white/[0.04] tw-px-2 tw-py-1 tw-text-[10px] tw-font-medium tw-uppercase tw-tracking-wider tw-text-iron-500 tw-ring-1 tw-ring-inset tw-ring-white/[0.05]">
                    {tokenTypeLabel}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
        <XtdhRatePill rateLabel={xtdhRateLabel} totalLabel={xtdhValueLabel} />
      </header>
      <dl className="tw-mb-0 tw-mt-4 tw-grid tw-grid-cols-2 tw-gap-x-6 tw-gap-y-4 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/[0.05] tw-pt-4 sm:tw-grid-cols-3 lg:tw-grid-cols-6">
        <CollectionMetric
          label="Total supply"
          value={totalSupplyLabel}
          isLoading={isMetadataLoading}
        />
        <CollectionMetric
          label="Active tokens"
          value={activeTokensGrantedLabel}
        />
        <CollectionMetric
          label="Tokens granted"
          value={totalTokensGrantedLabel}
        />
        <CollectionMetric
          label="Floor price"
          value={floorPriceLabel}
          isLoading={isMetadataLoading}
        />
        <CollectionMetric
          label="Active contributors"
          value={activeContributorsLabel}
        />
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
        className="tw-w-full tw-rounded-xl tw-border-none tw-bg-transparent tw-p-0 tw-text-left focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
      >
        {content}
      </button>
    </li>
  );
}

function CollectionMetric({
  label,
  value,
  className,
  isLoading = false,
}: Readonly<{
  label: string;
  value: string;
  className?: string | undefined;
  isLoading?: boolean | undefined;
}>) {
  return (
    <div className={clsx("tw-flex tw-flex-col tw-text-left", className)}>
      <dt className="tw-mb-1.5 tw-text-[10px] tw-font-medium tw-uppercase tw-leading-4 tw-tracking-wider tw-text-iron-500">
        {label}
      </dt>
      <dd className="tw-m-0 tw-min-h-5 tw-text-sm tw-font-semibold tw-leading-5 tw-text-iron-100 sm:tw-text-base">
        {isLoading ? (
          <span
            aria-hidden="true"
            className="tw-block tw-h-4 tw-w-16 tw-animate-pulse tw-rounded-full tw-bg-iron-800 motion-reduce:tw-animate-none"
          />
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

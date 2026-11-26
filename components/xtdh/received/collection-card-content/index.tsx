"use client";

import Image from "next/image";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
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
  readonly variant?: "default" | "profile";
  readonly collection: ApiXtdhCollection;
  readonly isSelected?: boolean | undefined;
  readonly onSelect?:
    | ((contract: string | null) => void)
    | undefined
    | undefined;
  readonly interactionMode?: InteractionMode | undefined;
}

export function XtdhReceivedCollectionCard({
  variant = "default",
  collection,
  isSelected = false,
  onSelect,
  interactionMode = "button",
}: Readonly<XtdhReceivedCollectionCardProps>) {
  const contractAddress = useMemo(() => {
    const trimmed = collection.contract?.trim() ?? "";
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

  const content = (
    <div
      className={clsx(
        "tw-group tw-flex tw-w-full tw-flex-col tw-items-stretch tw-overflow-hidden tw-text-left tw-transition-colors tw-duration-300",
        interactionMode === "static"
          ? "tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900 tw-p-4"
          : "tw-rounded-b-xl tw-px-6 tw-py-6 desktop-hover:hover:tw-bg-iron-900",
        variant === "profile" &&
          "tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.04] tw-bg-iron-900/50 max-md:tw-p-4",
        isSelected && "tw-bg-iron-900/50",
        !isSelectable &&
          interactionMode === "button" &&
          "tw-cursor-not-allowed tw-opacity-70"
      )}
    >
      <header
        className={`tw-relative tw-flex tw-flex-col tw-items-start tw-justify-between tw-gap-x-3 tw-gap-y-6 md:tw-flex-row ${variant === "profile" ? "max-md:tw-gap-2.5" : ""}`}
      >
        <div
          className={`tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-gap-3 sm:tw-flex-row sm:tw-items-center ${variant === "profile" ? "max-md:tw-w-full max-md:tw-flex-row max-md:tw-items-center max-md:tw-pr-6" : ""}`}
        >
          <div
            className={`tw-relative tw-h-16 tw-w-16 tw-overflow-hidden tw-rounded-lg tw-bg-iron-800 tw-shadow-inner tw-transition-transform tw-duration-300 group-hover:tw-scale-105 ${variant === "profile" ? "tw-shrink-0 max-md:tw-size-10" : ""}`}
          >
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
            <p className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-50 group-data-[typography=profile]/profile-xtdh:tw-text-[15px] group-data-[typography=profile]/profile-xtdh:tw-text-iron-100 max-md:group-data-[typography=profile]/profile-xtdh:tw-leading-5">
              {displayName}
            </p>
            <div className="tw-flex tw-w-full tw-items-center tw-gap-2">
              <p
                className="tw-m-0 tw-mb-0 tw-text-xs tw-text-iron-500 group-data-[typography=profile]/profile-xtdh:tw-text-meta group-data-[typography=profile]/profile-xtdh:tw-font-normal group-data-[typography=profile]/profile-xtdh:tw-tabular-nums"
                title={secondaryLabelTitle}
              >
                {secondaryLabel}
              </p>
              <span className="tw-inline-flex tw-items-center tw-rounded tw-border tw-border-solid tw-border-white/10 tw-bg-white/5 tw-px-2 tw-py-1 tw-text-[10px] tw-font-bold tw-uppercase tw-text-iron-400">
                {tokenTypeLabel}
              </span>
            </div>
          </div>
        </div>
        <XtdhRatePill
          rateLabel={xtdhRateLabel}
          totalLabel={xtdhValueLabel}
          className={
            variant === "profile"
              ? "max-md:[&>span:first-child]:tw-font-normal max-md:[&>span:first-child]:tw-text-iron-400 max-md:[&>span:last-child]:tw-font-medium"
              : undefined
          }
        />
        {variant === "profile" && isSelectable && (
          <ChevronRightIcon
            aria-hidden="true"
            className="tw-absolute tw-right-0 tw-top-0 tw-size-4 tw-text-iron-400 md:tw-hidden"
          />
        )}
      </header>
      <dl
        className={`tw-mb-0 tw-mt-6 tw-grid tw-gap-x-6 tw-gap-y-4 sm:tw-grid-cols-2 md:tw-ml-20 md:tw-mt-4 md:tw-grid-cols-3 ${variant === "profile" ? "max-md:tw-mt-4 max-md:tw-grid-cols-2 max-md:tw-gap-x-3 max-md:tw-gap-y-3" : ""}`}
      >
        <CollectionMetric label="Total supply" value={totalSupplyLabel} />
        <CollectionMetric
          label="Active tokens"
          value={activeTokensGrantedLabel}
        />
        <CollectionMetric
          label="Tokens granted"
          value={totalTokensGrantedLabel}
        />
        <CollectionMetric label="Floor price" value={floorPriceLabel} />
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
        className={clsx(
          "tw-w-full tw-border-none tw-bg-transparent tw-p-0 tw-text-left",
          variant === "profile" && "tw-rounded-xl"
        )}
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
}: Readonly<{ label: string; value: string; className?: string | undefined }>) {
  return (
    <div className={clsx("tw-flex tw-flex-col tw-text-left", className)}>
      <dt className="tw-mb-1.5 tw-text-[10px] tw-font-medium tw-uppercase tw-tracking-wider tw-text-iron-500">
        {label}
      </dt>
      <dd className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-50">
        {value}
      </dd>
    </div>
  );
}

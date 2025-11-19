"use client";

import Image from "next/image";
import { useCallback, useMemo } from "react";

import type { ApiXTdhCollectionsPage } from "@/generated/models/ApiXTdhCollectionsPage";
import { useContractOverviewQuery } from "@/hooks/useAlchemyNftQueries";
import { useXtdhTokensQuery } from "@/hooks/useXtdhTokensQuery";
import { shortenAddress } from "@/helpers/address.helpers";
import { isValidEthAddress } from "@/helpers/Helpers";

import { XtdhTokensList } from "./XtdhTokensList";
import { XtdhTokensControls, buildTokensResultSummary } from "../tokens-controls";
import { useXtdhTokensFilters } from "../hooks/useXtdhTokensFilters";
import {
  formatCount,
  formatXtdhRate,
  formatXtdhValue,
} from "../utils/formatters";
import {
  formatFloorPrice,
  formatTotalSupply,
} from "@/components/user/xtdh/granted-list/UserPageXtdhGrantListItem/formatters";

type ApiXtdhCollection = ApiXTdhCollectionsPage["data"][number];

export interface XtdhCollectionTokensPanelProps {
  readonly identity: string | null;
  readonly contract: string | null;
  readonly normalizedContract: string | null;
  readonly collection?: ApiXtdhCollection;
  readonly onBack: () => void;
}

const TOKENS_PAGE_SIZE = 25;

export function XtdhCollectionTokensPanel({
  identity,
  contract,
  normalizedContract,
  collection,
  onBack,
}: Readonly<XtdhCollectionTokensPanelProps>) {
  const contractParam = normalizedContract?.trim() ?? contract?.trim() ?? "";
  const { activeSortField, activeSortDirection, apiOrder, handleSortChange } =
    useXtdhTokensFilters();

  const {
    tokens,
    isLoading,
    isError,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    refetch,
    fetchNextPage,
    errorMessage,
    isEnabled,
  } = useXtdhTokensQuery({
    identity,
    contract: contractParam,
    pageSize: TOKENS_PAGE_SIZE,
    sortField: activeSortField,
    order: apiOrder,
    enabled: Boolean(identity && contractParam),
  });

  const handleRetry = useCallback(() => {
    refetch().catch(() => {
      // Error surfaced via query state
    });
  }, [refetch]);

  const handleLoadMore = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) {
      return;
    }
    fetchNextPage().catch(() => {
      // Error surfaced via query state
    });
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const normalizedAddress = useMemo(() => {
    if (!contractParam) {
      return null;
    }
    return isValidEthAddress(contractParam)
      ? (contractParam.toLowerCase() as `0x${string}`)
      : null;
  }, [contractParam]);

  const { data: contractOverview } = useContractOverviewQuery({
    address: normalizedAddress ?? undefined,
    enabled: Boolean(normalizedAddress),
  });

  const contractDisplayName = useMemo(() => {
    if (contractOverview?.name) {
      return contractOverview.name;
    }
    if (normalizedAddress) {
      return shortenAddress(normalizedAddress);
    }
    if (contract?.trim()) {
      return contract;
    }
    return "Selected collection";
  }, [contractOverview?.name, normalizedAddress, contract]);

  const subtitleLabel = useMemo(() => {
    if (normalizedAddress) {
      return normalizedAddress;
    }
    return contract ?? normalizedContract ?? "";
  }, [normalizedAddress, contract, normalizedContract]);

  const headerMetrics = useMemo(() => {
    return [
      { label: "Token type", value: contractOverview?.tokenType ?? "Unknown" },
      { label: "Total supply", value: formatTotalSupply(contractOverview?.totalSupply) },
      { label: "Floor price", value: formatFloorPrice(contractOverview?.floorPriceEth) },
      {
        label: "Tokens granted",
        value: collection ? formatCount(collection.token_count) : "—",
      },
      {
        label: "Grants count",
        value: collection ? formatCount(collection.grant_count) : "—",
      },
      {
        label: "xTDH",
        value: collection ? formatXtdhValue(collection.xtdh) : "—",
      },
      {
        label: "xTDH rate",
        value: collection ? formatXtdhRate(collection.xtdh_rate) : "—",
      },
    ];
  }, [collection, contractOverview]);

  const resultSummary = useMemo(() => {
    if (!isEnabled || tokens.length === 0) {
      return null;
    }
    return buildTokensResultSummary(
      tokens.length,
      activeSortField,
      activeSortDirection
    );
  }, [isEnabled, tokens.length, activeSortField, activeSortDirection]);

  const controlsDisabled = isLoading || isFetching;
  const showLoadMore = hasNextPage && isEnabled;

  return (
    <section className="tw-rounded-2xl tw-border tw-border-iron-800 tw-bg-iron-950 tw-p-4 tw-space-y-4">
      <header className="tw-flex tw-flex-col tw-gap-3">
        <button
          type="button"
          onClick={onBack}
          className="tw-inline-flex tw-items-center tw-gap-2 tw-self-start tw-rounded-lg tw-border tw-border-iron-800 tw-bg-transparent tw-px-3 tw-py-1.5 tw-text-xs tw-font-semibold tw-text-iron-50 desktop-hover:hover:tw-bg-iron-900"
        >
          Back to received collections
        </button>
        <div className="tw-rounded-2xl tw-border tw-border-iron-800 tw-bg-iron-900 tw-p-4 tw-shadow-inner tw-shadow-black/20">
          <div className="tw-flex tw-flex-col tw-gap-3 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between">
            <div className="tw-flex tw-items-center tw-gap-3">
              <div className="tw-relative tw-h-14 tw-w-14 tw-overflow-hidden tw-rounded-xl tw-bg-iron-800">
                {contractOverview?.imageUrl ? (
                  <Image
                    src={contractOverview.imageUrl}
                    alt={contractDisplayName}
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
              <div className="tw-flex tw-flex-col">
                <p className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-50">
                  {contractDisplayName}
                </p>
                {subtitleLabel ? (
                  <p className="tw-m-0 tw-text-xs tw-text-iron-400 tw-break-all">
                    {subtitleLabel}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="tw-text-sm tw-text-iron-300">
              Inspect each token&apos;s contribution to your received xTDH.
            </div>
          </div>
          <dl className="tw-mt-4 tw-grid tw-gap-3 sm:tw-grid-cols-2 xl:tw-grid-cols-4">
            {headerMetrics.map((metric) => (
              <CollectionMetric key={metric.label} label={metric.label} value={metric.value} />
            ))}
          </dl>
        </div>
      </header>

      <XtdhTokensControls
        activeSortField={activeSortField}
        activeSortDirection={activeSortDirection}
        onSortChange={handleSortChange}
        resultSummary={resultSummary}
        isDisabled={controlsDisabled}
      />

      <XtdhTokensList
        tokens={tokens}
        contractAddress={normalizedAddress}
        isEnabled={isEnabled}
        isLoading={isLoading}
        isError={isError}
        errorMessage={errorMessage}
        onRetry={handleRetry}
      />

      {showLoadMore ? (
        <div className="tw-flex tw-justify-center">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={isFetchingNextPage}
            className="tw-px-4 tw-py-2 tw-rounded-lg tw-text-sm tw-transition tw-bg-iron-900 tw-text-iron-400 tw-border tw-border-solid tw-border-iron-800 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-300"
          >
            {isFetchingNextPage ? "Loading..." : "Load More"}
          </button>
        </div>
      ) : null}
    </section>
  );
}

function CollectionMetric({
  label,
  value,
}: Readonly<{ label: string; value: string }>) {
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

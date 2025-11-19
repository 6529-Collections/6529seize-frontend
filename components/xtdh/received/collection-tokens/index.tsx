"use client";

import { useCallback, useMemo } from "react";

import { useXtdhTokensQuery } from "@/hooks/useXtdhTokensQuery";

import { useXtdhTokensFilters } from "../hooks/useXtdhTokensFilters";
import { XtdhTokensControls, buildTokensResultSummary } from "../tokens-controls";
import { useCollectionContractDetails } from "./hooks/useCollectionContractDetails";
import { XtdhTokensList } from "./XtdhTokensList";
import { CollectionHeader } from "./subcomponents/CollectionHeader";
import { CollectionLoadMore } from "./subcomponents/CollectionLoadMore";
import type { XtdhCollectionTokensPanelProps } from "./types";

const TOKENS_PAGE_SIZE = 25;

export function XtdhCollectionTokensPanel({
  identity,
  contract,
  normalizedContract,
  collection,
  onBack,
}: Readonly<XtdhCollectionTokensPanelProps>) {
  const { activeSortField, activeSortDirection, apiOrder, handleSortChange } =
    useXtdhTokensFilters();

  const {
    contractParam,
    normalizedAddress,
    contractDisplayName,
    subtitleLabel,
    headerMetrics,
    contractImageUrl,
  } = useCollectionContractDetails({
    contract,
    normalizedContract,
    collection,
  });

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
      <CollectionHeader
        onBack={onBack}
        contractDisplayName={contractDisplayName}
        subtitleLabel={subtitleLabel}
        contractImageUrl={contractImageUrl}
        headerMetrics={headerMetrics}
      />

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

      <CollectionLoadMore
        isVisible={showLoadMore}
        isFetching={isFetchingNextPage}
        onLoadMore={handleLoadMore}
      />
    </section>
  );
}

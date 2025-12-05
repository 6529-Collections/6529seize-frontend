"use client";

import { useCallback, useMemo, useState } from "react";

import { useXtdhTokensQuery } from "@/hooks/useXtdhTokensQuery";

import { useXtdhTokensFilters } from "../hooks/useXtdhTokensFilters";
import { XtdhTokensControls } from "../tokens-controls";
import { XtdhReceivedCollectionCard } from "../collection-card-content";
import { useCollectionContractDetails } from "./hooks/useCollectionContractDetails";
import { useXtdhTokenSelection } from "./hooks/useXtdhTokenSelection";
import { XtdhTokensList } from "./XtdhTokensList";
import { CollectionBreadcrumbs } from "./subcomponents/CollectionBreadcrumbs";
import { CollectionLoadMore } from "./subcomponents/CollectionLoadMore";
import { XtdhTokenListItem } from "./subcomponents/XtdhTokenListItem";
import { XtdhTokenContributorsPanel } from "./token-contributors";
import type {
  XtdhCollectionTokensPanelProps,
} from "./types";
import { getTokenLabel } from "./utils/getTokenLabel";

const TOKENS_PAGE_SIZE = 25;

export function XtdhCollectionTokensPanel({
  identity,
  contract,
  normalizedContract,
  collection,
  onBack,
  requireIdentity = true,
}: Readonly<XtdhCollectionTokensPanelProps>) {
  const { activeSortField, activeSortDirection, apiOrder, handleSortChange } =
    useXtdhTokensFilters();
  const {
    selectedToken,
    selectToken,
    clearSelectedToken,
  } = useXtdhTokenSelection();

  const [selectedGrant, setSelectedGrant] = useState<{
    id: string;
    label: string;
  } | null>(null);

  const {
    contractParam,
    normalizedAddress,
    contractDisplayName,
  } = useCollectionContractDetails({
    contract,
    normalizedContract,
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
    requireIdentity,
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



  const controlsDisabled = isLoading || isFetching;
  const showLoadMore = hasNextPage && isEnabled;
  const selectedTokenLabel = useMemo(() => {
    if (!selectedToken) {
      return undefined;
    }
    return selectedToken.metadata?.name ?? getTokenLabel(selectedToken.token.token);
  }, [selectedToken]);

  const handleBackToTokens = useCallback(() => {
    clearSelectedToken();
    setSelectedGrant(null);
  }, [clearSelectedToken]);

  const handleBackToContributors = useCallback(() => {
    setSelectedGrant(null);
  }, []);

  const selectedTokenId = useMemo(() => {
    if (!selectedToken) {
      return null;
    }
    return Number.isFinite(selectedToken.token.token)
      ? Math.trunc(selectedToken.token.token)
      : null;
  }, [selectedToken]);

  return (
    <section className="tw-rounded-xl tw-border tw-border-iron-800 tw-bg-iron-950 tw-space-y-4 tw-px-6 tw-pb-6">
      <CollectionBreadcrumbs
        collectionLabel={contractDisplayName}
        tokenLabel={selectedTokenLabel}
        grantLabel={selectedGrant?.label}
        onNavigateToCollections={onBack}
        onNavigateToTokens={selectedToken ? handleBackToTokens : undefined}
        onNavigateToContributors={selectedGrant ? handleBackToContributors : undefined}
      />
      {collection ? (
        <XtdhReceivedCollectionCard
          collection={collection}
          interactionMode="static"
        />
      ) : (
        <div className="tw-rounded-xl tw-border tw-border-iron-800 tw-bg-iron-900 tw-p-4 tw-text-sm tw-text-iron-300">
          Collection summary unavailable.
        </div>
      )}

      {selectedToken && selectedTokenId !== null ? (
        <div className="tw-space-y-4">
          <XtdhTokenListItem
            as="div"
            className="tw-p-4 tw-cursor-pointer tw-transition-all tw-duration-300 desktop-hover:hover:tw-bg-iron-950"
            token={selectedToken.token}
            metadata={selectedToken.metadata}
            isMetadataLoading={selectedToken.isMetadataLoading}
            hasMetadataError={selectedToken.hasMetadataError}
            onSelect={handleBackToTokens}
          />
          {!selectedGrant && (
            <p className="tw-m-0 tw-text-sm tw-text-iron-300">
              Explore the grants and grantors powering this token&apos;s xTDH.
            </p>
          )}
          <XtdhTokenContributorsPanel
            contract={contractParam}
            tokenId={selectedTokenId}
            selectedGrantId={selectedGrant?.id ?? null}
            onSelectGrant={(id, label) => setSelectedGrant({ id, label })}
          />
        </div>
      ) : (
        <>
          <XtdhTokensControls
            activeSortField={activeSortField}
            activeSortDirection={activeSortDirection}
            onSortChange={handleSortChange}
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
            onTokenSelect={selectToken}
          />

          <CollectionLoadMore
            isVisible={showLoadMore}
            isFetching={isFetchingNextPage}
            onLoadMore={handleLoadMore}
          />
        </>
      )}
    </section>
  );
}

"use client";

import { useCallback, useMemo } from "react";

import type { ReactElement } from "react";

import type { ApiXTdhCollectionsPage } from "@/generated/models/ApiXTdhCollectionsPage";
import { useXtdhCollectionsQuery } from "@/hooks/useXtdhCollectionsQuery";

import { XtdhCollectionsControls } from "./collections-controls";
import { useXtdhCollectionsFilters } from "./hooks/useXtdhCollectionsFilters";
import { useXtdhCollectionSelection } from "./hooks/useXtdhCollectionSelection";
import { XtdhCollectionsList } from "./subcomponents/XtdhCollectionsList";
import { XtdhCollectionTokensPanel } from "./collection-tokens";

export interface XtdhReceivedSectionProps {
  readonly profileId: string | null;
  readonly pageSize?: number;
  readonly requireIdentity?: boolean;
}

const DEFAULT_PAGE_SIZE = 10;

export default function XtdhReceivedSection({
  profileId,
  pageSize = DEFAULT_PAGE_SIZE,
  requireIdentity = true,
}: Readonly<XtdhReceivedSectionProps>): ReactElement {
  const {
    activeSortField,
    activeSortDirection,
    apiOrder,
    handleSortChange,
  } = useXtdhCollectionsFilters();

  const {
    collections,
    isLoading,
    isError,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    refetch,
    fetchNextPage,
    errorMessage,
    isEnabled,
  } = useXtdhCollectionsQuery({
    identity: profileId,
    pageSize,
    sortField: activeSortField,
    order: apiOrder,
    enabled: requireIdentity ? Boolean(profileId) : true,
    requireIdentity,
  });

  const {
    selectedContract,
    handleCollectionSelect,
    clearSelection,
  } = useXtdhCollectionSelection();

  const selectedCollection = useMemo<ApiXTdhCollectionsPage["data"][number] | null>(() => {
    if (!selectedContract) {
      return null;
    }
    const normalized = selectedContract.trim().toLowerCase();
    return (
      collections.find((collection) =>
        (collection.contract?.trim().toLowerCase() ?? "") === normalized
      ) ?? null
    );
  }, [collections, selectedContract]);

  const handleRetry = useCallback(() => {
    refetch().catch(() => {
      // Errors are surfaced via query state rendered below.
    });
  }, [refetch]);

  const handleLoadMore = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) {
      return;
    }
    fetchNextPage().catch(() => {
      // Errors are surfaced via query state rendered below.
    });
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);



  const showLoadMore = hasNextPage && isEnabled;
  const controlsDisabled = isLoading || isFetching;

  const isViewingTokens = Boolean(selectedContract);
  const isIdentityScoped = Boolean(profileId);
  let description =
    "Collections across the ecosystem that are accruing xTDH from grants.";

  if (isViewingTokens) {
    description =
      "Review tokens in the selected collection and how much xTDH each accrues.";
  } else if (isIdentityScoped) {
    description =
      "Collections where this identity accrues xTDH through grants it has received.";
  }

  return (
    <section className="tw-rounded-2xl tw-border tw-border-iron-800 tw-bg-iron-950 tw-p-4 tw-space-y-4">
      <header>
        <h2 className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-100">
          {isViewingTokens ? "Received xTDH Tokens" : "Received xTDH Collections"}
        </h2>
        <p className="tw-mt-1 tw-text-sm tw-text-iron-400">
          {description}
        </p>
      </header>
      {selectedContract ? (
        <XtdhCollectionTokensPanel
          identity={profileId}
          contract={selectedCollection?.contract ?? selectedContract}
          normalizedContract={selectedContract}
          collection={selectedCollection ?? undefined}
          onBack={clearSelection}
          requireIdentity={requireIdentity}
        />
      ) : (
        <>
          <XtdhCollectionsControls
            activeSortField={activeSortField}
            activeSortDirection={activeSortDirection}
            onSortChange={handleSortChange}
            isDisabled={controlsDisabled}
          />
          <XtdhCollectionsList
            isEnabled={isEnabled}
            isLoading={isLoading}
            isError={isError}
            collections={collections}
            errorMessage={errorMessage}
            onRetry={handleRetry}
            selectedContract={selectedContract}
            onSelectCollection={handleCollectionSelect}
            isIdentityScoped={isIdentityScoped}
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
        </>
      )}
    </section>
  );
}

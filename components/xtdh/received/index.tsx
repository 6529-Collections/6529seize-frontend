"use client";

import { useCallback, useMemo, useState } from "react";

import type { ReactElement } from "react";

import type { ApiXTdhCollectionsPage } from "@/generated/models/ApiXTdhCollectionsPage";
import { useXtdhCollectionsQuery } from "@/hooks/useXtdhCollectionsQuery";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

import { XtdhCollectionsControls } from "./collections-controls";
import { useXtdhCollectionsFilters } from "./hooks/useXtdhCollectionsFilters";
import { useXtdhCollectionSelection } from "./hooks/useXtdhCollectionSelection";
import { XtdhCollectionsList } from "./subcomponents/XtdhCollectionsList";
import { XtdhCollectionTokensPanel } from "./collection-tokens";

export interface XtdhReceivedSectionProps {
  readonly profileId: string | null;
  readonly pageSize?: number | undefined;
  readonly requireIdentity?: boolean | undefined;
}

const DEFAULT_PAGE_SIZE = 10;
const DEBOUNCE_DELAY = 300;

export default function XtdhReceivedSection({
  profileId,
  pageSize = DEFAULT_PAGE_SIZE,
  requireIdentity = true,
}: Readonly<XtdhReceivedSectionProps>): ReactElement {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebouncedValue(searchTerm, DEBOUNCE_DELAY);

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
    collectionName: debouncedSearchTerm || undefined,
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
  let description = "Collections accruing xTDH from grants.";

  if (isViewingTokens) {
    description = "Review tokens and their xTDH accrual.";
  } else if (isIdentityScoped) {
    description = "Collections where this identity accrues xTDH.";
  }

  return (
    <section className="tw-rounded-b-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-space-y-6">
      <header className="tw-px-6 tw-pt-6">
        <h2 className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-100">
          {isViewingTokens ? "xTDH Tokens" : "xTDH Collections"}
        </h2>
        <p className="tw-mt-1 tw-text-sm tw-text-iron-400 tw-mb-0">
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
          {(collections.length > 0 || searchTerm) && (
            <XtdhCollectionsControls
              activeSortField={activeSortField}
              activeSortDirection={activeSortDirection}
              onSortChange={handleSortChange}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              isDisabled={controlsDisabled}
            />
          )}
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
            <div className="tw-flex tw-justify-center tw-px-6 tw-pb-6">
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

"use client";

import { useCallback, useMemo } from "react";

import type { ReactElement } from "react";

import { useXtdhCollectionsQuery } from "@/hooks/useXtdhCollectionsQuery";

import { XtdhCollectionsControls, buildCollectionsResultSummary } from "./collections-controls";
import { useXtdhCollectionsFilters } from "./hooks/useXtdhCollectionsFilters";
import { XtdhCollectionsList } from "./subcomponents/XtdhCollectionsList";

export interface XtdhReceivedSectionProps {
  readonly profileId: string | null;
  readonly pageSize?: number;
}

const DEFAULT_PAGE_SIZE = 10;

export default function XtdhReceivedSection({
  profileId,
  pageSize = DEFAULT_PAGE_SIZE,
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
    enabled: Boolean(profileId),
  });

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

  const resultSummary = useMemo(() => {
    if (!collections.length) {
      return null;
    }
    return buildCollectionsResultSummary(
      collections.length,
      activeSortField,
      activeSortDirection
    );
  }, [collections.length, activeSortField, activeSortDirection]);

  const showLoadMore = hasNextPage && isEnabled;
  const controlsDisabled = isLoading || isFetching;

  return (
    <section className="tw-rounded-2xl tw-border tw-border-iron-800 tw-bg-iron-950 tw-p-4 tw-space-y-4">
      <header>
        <h2 className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-100">
          Received xTDH Collections
        </h2>
        <p className="tw-mt-1 tw-text-sm tw-text-iron-400">
          Collections where this identity accrues xTDH through grants it has
          received.
        </p>
      </header>
      <XtdhCollectionsControls
        activeSortField={activeSortField}
        activeSortDirection={activeSortDirection}
        onSortChange={handleSortChange}
        resultSummary={resultSummary}
        isDisabled={controlsDisabled}
      />
      <XtdhCollectionsList
        isEnabled={isEnabled}
        isLoading={isLoading}
        isError={isError}
        collections={collections}
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

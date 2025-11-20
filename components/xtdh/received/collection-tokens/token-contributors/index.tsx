import { useCallback, useMemo } from "react";

import { useXtdhTokenContributorsQuery } from "@/hooks/useXtdhTokenContributorsQuery";

import { CollectionLoadMore } from "../subcomponents/CollectionLoadMore";
import { useXtdhTokenContributorsFilters } from "./hooks/useXtdhTokenContributorsFilters";
import { XtdhTokenContributorsControls, buildTokenContributorsResultSummary } from "./subcomponents/XtdhTokenContributorsControls";
import { XtdhTokenContributorsList } from "./subcomponents/XtdhTokenContributorsList";

interface XtdhTokenContributorsPanelProps {
  readonly contract: string;
  readonly tokenId: number | null;
}

const CONTRIBUTORS_PAGE_SIZE = 25;

export function XtdhTokenContributorsPanel({
  contract,
  tokenId,
}: Readonly<XtdhTokenContributorsPanelProps>) {
  const {
    activeSortField,
    activeSortDirection,
    activeGroupBy,
    apiOrder,
    handleSortChange,
    handleGroupByChange,
  } = useXtdhTokenContributorsFilters();

  const {
    contributors,
    isLoading,
    isError,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    refetch,
    fetchNextPage,
    errorMessage,
    isEnabled,
  } = useXtdhTokenContributorsQuery({
    contract,
    tokenId,
    pageSize: CONTRIBUTORS_PAGE_SIZE,
    sortField: activeSortField,
    order: apiOrder,
    groupBy: activeGroupBy,
  });

  const handleRetry = useCallback(() => {
    refetch().catch(() => {
      // Errors surface via query state
    });
  }, [refetch]);

  const handleLoadMore = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) {
      return;
    }
    fetchNextPage().catch(() => {
      // Errors surface via query state
    });
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const resultSummary = useMemo(() => {
    if (!isEnabled || contributors.length === 0) {
      return null;
    }
    return buildTokenContributorsResultSummary(
      contributors.length,
      activeSortField,
      activeSortDirection,
      activeGroupBy
    );
  }, [
    contributors.length,
    activeSortField,
    activeSortDirection,
    activeGroupBy,
    isEnabled,
  ]);

  const controlsDisabled = isLoading || isFetching;
  const showLoadMore = hasNextPage && isEnabled;

  return (
    <section className="tw-space-y-4">
      <XtdhTokenContributorsControls
        activeSortField={activeSortField}
        activeSortDirection={activeSortDirection}
        activeGroupBy={activeGroupBy}
        onSortChange={handleSortChange}
        onGroupByChange={handleGroupByChange}
        resultSummary={resultSummary}
        isDisabled={controlsDisabled}
      />

      <XtdhTokenContributorsList
        contributors={contributors}
        groupBy={activeGroupBy}
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

import { useCallback } from "react";

import { useXtdhTokenContributorsQuery } from "@/hooks/useXtdhTokenContributorsQuery";

import { CollectionLoadMore } from "../subcomponents/CollectionLoadMore";
import { useXtdhTokenContributorsFilters } from "./hooks/useXtdhTokenContributorsFilters";
import { XtdhTokenContributorsControls } from "./subcomponents/XtdhTokenContributorsControls";
import { XtdhTokenContributorsList } from "./subcomponents/XtdhTokenContributorsList";
import { XtdhGrantDetailsPanel } from "./subcomponents/XtdhGrantDetailsPanel";

interface XtdhTokenContributorsPanelProps {
  readonly contract: string;
  readonly tokenId: number | null;
  readonly selectedGrantId: string | null;
  readonly onSelectGrant: (grantId: string, label: string) => void;
}

const CONTRIBUTORS_PAGE_SIZE = 25;

export function XtdhTokenContributorsPanel({
  contract,
  tokenId,
  selectedGrantId,
  onSelectGrant,
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

  const controlsDisabled = isLoading || isFetching;
  const showLoadMore = hasNextPage && isEnabled;

  if (selectedGrantId) {
    return (
      <XtdhGrantDetailsPanel
        grantId={selectedGrantId}
      />
    );
  }

  return (
    <section className="tw-space-y-4">
      <XtdhTokenContributorsControls
        activeSortField={activeSortField}
        activeSortDirection={activeSortDirection}
        activeGroupBy={activeGroupBy}
        onSortChange={handleSortChange}
        onGroupByChange={handleGroupByChange}

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
        onSelectGrant={onSelectGrant}
      />

      <CollectionLoadMore
        isVisible={showLoadMore}
        isFetching={isFetchingNextPage}
        onLoadMore={handleLoadMore}
      />
    </section>
  );
}

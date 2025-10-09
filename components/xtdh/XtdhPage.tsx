"use client";

import { useContext, useMemo } from "react";
import { AuthContext } from "@/components/auth/Auth";
import { deriveProfileIdentifier } from "./profile-utils";
import XtdhStatsOverview from "./XtdhStatsOverview";
import XtdhViewSwitcher from "./XtdhViewSwitcher";
import XtdhCollectionsView, { COLLECTIONS_PAGE_SIZE } from "./collections/XtdhCollectionsView";
import XtdhTokensView, { TOKENS_PAGE_SIZE } from "./tokens/XtdhTokensView";
import XtdhFilterBar from "./filters/XtdhFilterBar";
import {
  COLLECTION_SORT_OPTIONS,
  TOKEN_SORT_OPTIONS,
  DEFAULT_COLLECTION_SORT,
  DEFAULT_TOKEN_SORT,
} from "./filters/constants";
import { useXtdhFilters } from "./filters/useXtdhFilters";
import { useXtdhCollections, useXtdhTokens } from "@/hooks/useXtdhOverview";

export default function XtdhPage() {
  const { connectedProfile } = useContext(AuthContext);

  const connectedProfileId = useMemo(
    () => deriveProfileIdentifier(connectedProfile),
    [connectedProfile]
  );

  const {
    view,
    collectionSort,
    tokenSort,
    direction,
    page,
    networks,
    minRate,
    minGrantors,
    showMyGrants,
    showMyReceiving,
    setView,
    setSort,
    setSortDirection,
    setNetworks,
    setMinRate,
    setMinGrantors,
    toggleMyGrants,
    toggleMyReceiving,
    setPage,
    resetFilters,
  } = useXtdhFilters(connectedProfileId);

  const sharedState = {
    direction,
    page,
    networks,
    minRate,
    minGrantors,
    showMyGrants,
    showMyReceiving,
  };

  const collectionsFilterState = {
    sort: collectionSort,
    direction,
    networks,
    minRate,
    minGrantors,
    showMyGrants,
    showMyReceiving,
  };

  const tokensFilterState = {
    sort: tokenSort,
    direction,
    networks,
    minRate,
    minGrantors,
    showMyGrants,
    showMyReceiving,
  };

  const collectionsQuery = useXtdhCollections({
    sort: view === "collections" ? collectionSort : DEFAULT_COLLECTION_SORT,
    dir: direction,
    page,
    pageSize: COLLECTIONS_PAGE_SIZE,
    networks,
    minRate,
    minGrantors,
    grantorProfileId:
      connectedProfileId && showMyGrants ? connectedProfileId : null,
    holderProfileId:
      connectedProfileId && showMyReceiving ? connectedProfileId : null,
    enabled: view === "collections",
  });

  const tokensQuery = useXtdhTokens({
    sort: view === "tokens" ? tokenSort : DEFAULT_TOKEN_SORT,
    dir: direction,
    page,
    pageSize: TOKENS_PAGE_SIZE,
    networks,
    minRate,
    minGrantors,
    grantorProfileId:
      connectedProfileId && showMyGrants ? connectedProfileId : null,
    holderProfileId:
      connectedProfileId && showMyReceiving ? connectedProfileId : null,
    enabled: view === "tokens",
  });

  const sharedViewProps = {
    connectedProfileId,
    onPageChange: setPage,
  };

  const filterBarProps =
    view === "collections"
      ? {
          view: "collections" as const,
          state: collectionsFilterState,
          sortOptions: COLLECTION_SORT_OPTIONS,
          availableNetworks: collectionsQuery.data?.availableFilters.networks ?? [],
          disableInteractions: collectionsQuery.isLoading || collectionsQuery.isFetching,
        }
      : {
          view: "tokens" as const,
          state: tokensFilterState,
          sortOptions: TOKEN_SORT_OPTIONS,
          availableNetworks: tokensQuery.data?.availableFilters.networks ?? [],
          disableInteractions: tokensQuery.isLoading || tokensQuery.isFetching,
        };

  return (
    <div className="tailwind-scope tw-flex tw-flex-col tw-gap-6 tw-pb-16">
      <XtdhStatsOverview />
      <div className="tw-flex tw-flex-col tw-gap-4">
        <XtdhViewSwitcher view={view} onViewChange={setView} />
        <XtdhFilterBar
          {...filterBarProps}
          connectedProfileId={connectedProfileId}
          onSortChange={setSort}
          onDirectionChange={setSortDirection}
          onNetworksChange={setNetworks}
          onMinRateChange={setMinRate}
          onMinGrantorsChange={setMinGrantors}
          onToggleMyGrants={toggleMyGrants}
          onToggleReceiving={toggleMyReceiving}
          onClearAll={resetFilters}
        />
        {view === "collections" ? (
          <XtdhCollectionsView
            {...sharedViewProps}
            state={{ ...sharedState, sort: collectionSort }}
            query={collectionsQuery}
          />
        ) : (
          <XtdhTokensView
            {...sharedViewProps}
            state={{ ...sharedState, sort: tokenSort }}
            query={tokensQuery}
          />
        )}
      </div>
    </div>
  );
}

"use client";

import { useContext, useMemo } from "react";
import { AuthContext } from "@/components/auth/Auth";
import { deriveProfileIdentifier } from "./profile-utils";
import XtdhStatsOverview from "./XtdhStatsOverview";
import XtdhViewSwitcher from "./XtdhViewSwitcher";
import XtdhCollectionsView, { COLLECTIONS_PAGE_SIZE } from "./collections/XtdhCollectionsView";
import XtdhTokensView, { TOKENS_PAGE_SIZE } from "./tokens/XtdhTokensView";
import {
  DEFAULT_COLLECTION_SORT,
  DEFAULT_TOKEN_SORT,
  useXtdhQueryState,
} from "./hooks/useXtdhQueryState";
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
    toggleDirection,
    setNetworks,
    setMinRate,
    setMinGrantors,
    toggleMyGrants,
    toggleMyReceiving,
    setPage,
  } = useXtdhQueryState(connectedProfileId);

  const sharedState = {
    direction,
    page,
    networks,
    minRate,
    minGrantors,
    showMyGrants,
    showMyReceiving,
  };

  const sharedViewProps = {
    connectedProfileId,
    onSortChange: setSort,
    onDirectionToggle: toggleDirection,
    onNetworksChange: setNetworks,
    onMinRateChange: setMinRate,
    onMinGrantorsChange: setMinGrantors,
    onToggleMyGrants: toggleMyGrants,
    onToggleReceiving: toggleMyReceiving,
    onPageChange: setPage,
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

  return (
    <div className="tailwind-scope tw-flex tw-flex-col tw-gap-6 tw-pb-16">
      <XtdhStatsOverview />
      <div className="tw-flex tw-flex-col tw-gap-4">
        <XtdhViewSwitcher view={view} onViewChange={setView} />
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

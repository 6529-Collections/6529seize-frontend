"use client";

import TransferToggle from "@/components/nft-transfer/TransferToggle";
import UserAddressesSelectDropdown from "@/components/user/utils/addresses-select/UserAddressesSelectDropdown";
import type { CommonSelectItem } from "@/components/utils/select/CommonSelect";
import CommonSelect from "@/components/utils/select/CommonSelect";
import type { CollectionSeized } from "@/entities/IProfile";
import { CollectedCollectionType, CollectionSort } from "@/entities/IProfile";
import { SortDirection } from "@/entities/ISort";
import type { MemeSeason } from "@/entities/ISeason";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { RefObject } from "react";
import Button from "@/components/utils/button/Button";
import type { ProfileCollectedFilters } from "../UserPageCollected";
import { getCollectedFilterMessage } from "./user-page-collected-filter-labels";
import { COLLECTED_COLLECTIONS_META } from "./user-page-collected-filters.helpers";
import UserPageCollectedFiltersNativeDropdown from "./UserPageCollectedFiltersNativeDropdown";
import UserPageCollectedFiltersNetworkCollection from "./UserPageCollectedFiltersNetworkCollection";
import UserPageCollectedFiltersSeized from "./UserPageCollectedFiltersSeized";
import UserPageCollectedFiltersSortBy from "./UserPageCollectedFiltersSortBy";
import UserPageCollectedFiltersSzn from "./UserPageCollectedFiltersSzn";

enum MainTab {
  NATIVE = "NATIVE",
  NETWORK = "NETWORK",
}

export default function UserPageCollectedFilters({
  profile,
  filters,
  containerRef,
  setCollection,
  setSortBy,
  setSeized,
  setSzn,
  setSubcollection,
  showTransfer,
  clearFilters,
}: {
  readonly profile: ApiIdentity;
  readonly filters: ProfileCollectedFilters;
  readonly containerRef: RefObject<HTMLDivElement | null>;
  readonly setCollection: (collection: CollectedCollectionType | null) => void;
  readonly setSortBy: (sortBy: CollectionSort) => void;
  readonly setSeized: (seized: CollectionSeized | null) => void;
  readonly setSzn: (szn: MemeSeason | null) => void;
  readonly setSubcollection: (subcollection: string | null) => void;
  readonly showTransfer: boolean;
  readonly clearFilters: () => void;
}) {
  const getShowSeized = (
    collection: CollectedCollectionType | null
  ): boolean =>
    collection ? COLLECTED_COLLECTIONS_META[collection].filters.seized : false;

  const getShowSzn = (collection: CollectedCollectionType | null): boolean =>
    collection ? COLLECTED_COLLECTIONS_META[collection].filters.szn : false;

  const activeMainTab =
    filters.collection === CollectedCollectionType.NETWORK
      ? MainTab.NETWORK
      : MainTab.NATIVE;

  const mainTabItems: CommonSelectItem<MainTab>[] = [
    {
      label: getCollectedFilterMessage("user.collected.filters.view.native"),
      value: MainTab.NATIVE,
      key: MainTab.NATIVE,
    },
    {
      label: getCollectedFilterMessage("user.collected.filters.view.network"),
      value: MainTab.NETWORK,
      key: MainTab.NETWORK,
    },
  ];

  const handleMainTabChange = (tab: MainTab) => {
    if (tab === MainTab.NATIVE) {
      if (activeMainTab !== MainTab.NATIVE) {
        setCollection(null); // Default to All when switching to Native
      }
    } else {
      setCollection(CollectedCollectionType.NETWORK);
    }
  };

  const hasFilters =
    filters.collection !== null ||
    !filters.accountForConsolidations ||
    filters.sortBy !== CollectionSort.TOKEN_ID ||
    filters.sortDirection !== SortDirection.DESC;

  return (
    <section
      aria-label={getCollectedFilterMessage("user.collected.filters.heading")}
      className="tw-space-y-3"
    >
      <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-2">
        <h3 className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-200">
          {getCollectedFilterMessage("user.collected.filters.heading")}
        </h3>
        {hasFilters && (
          <Button
            variant="tertiary"
            size="sm"
            className="tw-min-h-11"
            onClick={clearFilters}
          >
            {getCollectedFilterMessage("user.collected.filters.clear")}
          </Button>
        )}
      </div>
      <div className="tw-grid tw-grid-cols-1 tw-gap-3 min-[400px]:tw-grid-cols-2 xl:tw-grid-cols-3 [&_button]:tw-min-h-11">
        <CommonSelect
          items={mainTabItems}
          activeItem={activeMainTab}
          setSelected={handleMainTabChange}
          filterLabel={getCollectedFilterMessage("user.collected.filters.view")}
          size="sm"
          showFilterLabel
        />
        {activeMainTab === MainTab.NATIVE ? (
          <UserPageCollectedFiltersNativeDropdown
            selected={filters.collection}
            setSelected={setCollection}
          />
        ) : (
          <UserPageCollectedFiltersNetworkCollection
            identity={filters.handleOrWallet}
            selected={filters.subcollection}
            setSelected={setSubcollection}
          />
        )}
        <UserPageCollectedFiltersSortBy
          selected={filters.sortBy}
          direction={filters.sortDirection}
          collection={filters.collection}
          setSelected={setSortBy}
        />
        {getShowSeized(filters.collection) && (
          <UserPageCollectedFiltersSeized
            selected={filters.seized}
            containerRef={containerRef}
            setSelected={setSeized}
          />
        )}
        {getShowSzn(filters.collection) && (
          <UserPageCollectedFiltersSzn
            selected={filters.szn}
            initialSeasonId={filters.initialSznId}
            setSelected={setSzn}
          />
        )}
        <UserAddressesSelectDropdown
          wallets={profile.wallets ?? []}
          containerRef={containerRef}
          onActiveAddress={() => undefined}
        />
        {showTransfer && <TransferToggle />}
      </div>
      <p className="tw-m-0 tw-text-xs tw-leading-relaxed tw-text-iron-400">
        {getCollectedFilterMessage(
          activeMainTab === MainTab.NATIVE
            ? "user.collected.filters.nativeContext"
            : "user.collected.filters.networkContext"
        )}
      </p>
    </section>
  );
}

"use client";

import IconButton from "@/components/utils/button/IconButton";

import TransferToggle from "@/components/nft-transfer/TransferToggle";
import UserAddressesSelectDropdown from "@/components/user/utils/addresses-select/UserAddressesSelectDropdown";
import DropdownToolbar from "@/components/utils/select/dropdown/DropdownToolbar";
import type { CommonSelectItem } from "@/components/utils/select/CommonSelect";
import CommonSelect from "@/components/utils/select/CommonSelect";
import type { CollectionSeized, CollectionSort } from "@/entities/IProfile";
import { CollectedCollectionType } from "@/entities/IProfile";
import type { MemeSeason } from "@/entities/ISeason";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import {
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { RefObject } from "react";
import { useEffect, useRef, useState } from "react";
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
  onAddressChange,
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
  readonly onAddressChange?: (() => void) | undefined;
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const contentContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    const contentContainer = contentContainerRef.current;
    if (!container) return;

    checkScroll();
    container.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);

    const resizeObserver = new ResizeObserver(() => {
      checkScroll();
    });
    resizeObserver.observe(container);
    if (contentContainer) {
      resizeObserver.observe(contentContainer);
    }

    return () => {
      container.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        checkScroll();
      });
    });
  }, [filters.collection]);

  const scrollLeft = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollBy({ left: -150, behavior: "smooth" });
  };

  const scrollRight = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollBy({ left: 150, behavior: "smooth" });
  };

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

  return (
    <DropdownToolbar
      variant="compact"
      className="tw-relative -tw-mx-4 sm:-tw-mx-6 md:tw-mx-0 md:tw-w-full"
    >
      <div
        ref={scrollContainerRef}
        className="tw-w-full tw-overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:tw-hidden"
      >
        <div
          ref={contentContainerRef}
          className="tw-nowrap tw-flex tw-w-max tw-min-w-full tw-items-center tw-gap-x-2 tw-px-4 md:tw-w-full md:tw-min-w-max md:tw-justify-between md:tw-px-0 lg:tw-gap-x-3"
        >
          <div className="tw-nowrap tw-flex tw-flex-shrink-0 tw-items-center tw-gap-x-2 lg:tw-gap-x-3">
            {showTransfer && <TransferToggle />}

            <CommonSelect
              items={mainTabItems}
              activeItem={activeMainTab}
              setSelected={handleMainTabChange}
              filterLabel={getCollectedFilterMessage(
                "user.collected.filters.view"
              )}
              size="sm"
              variant="filter"
              tabsVariant="connected"
              connectedSize="sm"
              fill={false}
            />

            {activeMainTab === MainTab.NATIVE && (
              <UserPageCollectedFiltersNativeDropdown
                selected={filters.collection}
                setSelected={setCollection}
              />
            )}

            {activeMainTab === MainTab.NETWORK && (
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
          </div>
          <div className="tw-flex-shrink-0">
            {filters.collection !== CollectedCollectionType.NETWORK && (
              <UserAddressesSelectDropdown
                wallets={profile.wallets ?? []}
                variant="filter"
                containerRef={containerRef}
                onActiveAddress={() => undefined}
                onAddressChange={onAddressChange}
              />
            )}
          </div>
        </div>
      </div>
      {canScrollLeft && (
        <>
          <div className="tw-pointer-events-none tw-absolute tw-bottom-0 tw-left-0 tw-top-0 tw-z-10 tw-hidden tw-w-12 tw-bg-gradient-to-r tw-from-black tw-via-black/40 tw-to-black/0 md:tw-block" />
          <IconButton
            type="button"
            onClick={scrollLeft}
            aria-label={getCollectedFilterMessage(
              "user.collected.filters.scrollLeft"
            )}
            layout="scroll-filter-left"
            className="tw-left-0 tw-hidden md:tw-flex"
          >
            <FontAwesomeIcon
              icon={faChevronLeft}
              className="tw-h-4 tw-w-4 tw-text-iron-200 tw-transition tw-duration-300 tw-ease-out group-hover:tw-text-iron-300"
            />
          </IconButton>
        </>
      )}
      {canScrollRight && (
        <>
          <div className="tw-pointer-events-none tw-absolute tw-bottom-0 tw-right-0 tw-top-0 tw-z-10 tw-hidden tw-w-12 tw-bg-gradient-to-l tw-from-black tw-via-black/40 tw-to-black/0 md:tw-block" />
          <IconButton
            type="button"
            onClick={scrollRight}
            aria-label={getCollectedFilterMessage(
              "user.collected.filters.scrollRight"
            )}
            layout="scroll-filter-right"
            className="tw-right-0 tw-hidden md:tw-flex"
          >
            <FontAwesomeIcon
              icon={faChevronRight}
              className="tw-h-4 tw-w-4 tw-text-iron-200 tw-transition tw-duration-300 tw-ease-out group-hover:tw-text-iron-300"
            />
          </IconButton>
        </>
      )}
    </DropdownToolbar>
  );
}

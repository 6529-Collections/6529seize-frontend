"use client";

import TransferToggle from "@/components/nft-transfer/TransferToggle";
import UserAddressesSelectDropdown from "@/components/user/utils/addresses-select/UserAddressesSelectDropdown";
import type {
  CommonSelectItem,
} from "@/components/utils/select/CommonSelect";
import CommonSelect from "@/components/utils/select/CommonSelect";
import type {
  CollectionSeized,
  CollectionSort} from "@/entities/IProfile";
import {
  CollectedCollectionType
} from "@/entities/IProfile";
import type { MemeSeason } from "@/entities/ISeason";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import {
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { RefObject} from "react";
import { useEffect, useRef, useState } from "react";
import type { ProfileCollectedFilters } from "../UserPageCollected";
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
    container.addEventListener("scroll", checkScroll);
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

  const getShowSeized = (collection: CollectedCollectionType | null): boolean =>
    collection ? COLLECTED_COLLECTIONS_META[collection].filters.seized : false;

  const getShowSzn = (collection: CollectedCollectionType | null): boolean =>
    collection ? COLLECTED_COLLECTIONS_META[collection].filters.szn : false;

  const activeMainTab =
    filters.collection === CollectedCollectionType.NETWORK
      ? MainTab.NETWORK
      : MainTab.NATIVE;

  const mainTabItems: CommonSelectItem<MainTab>[] = [
    {
      label: "Native",
      value: MainTab.NATIVE,
      key: MainTab.NATIVE,
    },
    {
      label: "Network",
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
    <div className="tw-relative tw-w-full">
      <div
        ref={scrollContainerRef}
        className="tw-w-full tw-overflow-x-auto [&::-webkit-scrollbar]:tw-hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div
          ref={contentContainerRef}
          className="tw-flex tw-nowrap tw-justify-between tw-gap-x-3 lg:tw-gap-x-4 tw-items-center tw-w-full tw-min-w-max">
          <div className="tw-flex tw-nowrap tw-gap-x-3 lg:tw-gap-x-4 tw-items-center tw-flex-shrink-0">
            {showTransfer && <TransferToggle />}

            <CommonSelect
              items={mainTabItems}
              activeItem={activeMainTab}
              setSelected={handleMainTabChange}
              filterLabel="View"
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
                containerRef={containerRef}
                onActiveAddress={() => undefined}
              />
            )}
          </div>
        </div>
      </div>
      {canScrollLeft && (
        <>
          <div className="tw-absolute tw-left-0 tw-top-0 tw-bottom-0 tw-w-24 tw-pointer-events-none tw-z-10 tw-bg-gradient-to-r tw-from-black tw-via-black/40 tw-to-black/0" />
          <button
            onClick={scrollLeft}
            aria-label="Scroll filters left"
            className="tw-absolute tw-left-0 tw-top-1/2 tw--translate-y-1/2 tw-z-20 tw-inline-flex tw-items-center tw-justify-start tw-group tw-p-0 tw-h-10 tw-w-10 tw-bg-transparent tw-border-none tw-outline-none">
            <FontAwesomeIcon
              icon={faChevronLeft}
              className="tw-h-6 tw-w-6 tw-text-iron-200 group-hover:tw-text-iron-300 tw-transition tw-duration-300 tw-ease-out"
            />
          </button>
        </>
      )}
      {canScrollRight && (
        <>
          <div className="tw-absolute tw-right-0 tw-top-0 tw-bottom-0 tw-w-24 tw-pointer-events-none tw-z-10 tw-bg-gradient-to-l tw-from-black tw-via-black/40 tw-to-black/0" />
          <button
            onClick={scrollRight}
            aria-label="Scroll filters right"
            className="tw-absolute tw-right-0 tw-top-1/2 tw--translate-y-1/2 tw-z-20 tw-inline-flex tw-items-center tw-justify-end tw-group tw-p-0 tw-h-10 tw-w-10 tw-bg-transparent tw-border-none tw-outline-none">
            <FontAwesomeIcon
              icon={faChevronRight}
              className="tw-h-6 tw-w-6 tw-text-iron-200 group-hover:tw-text-iron-300 tw-transition tw-duration-300 tw-ease-out"
            />
          </button>
        </>
      )}
    </div>
  );
}

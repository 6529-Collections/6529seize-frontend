"use client";

import TransferToggle from "@/components/nft-transfer/TransferToggle";
import UserAddressesSelectDropdown from "@/components/user/utils/addresses-select/UserAddressesSelectDropdown";
import {
  CollectedCollectionType,
  CollectionSeized,
  CollectionSort,
} from "@/entities/IProfile";
import { MEMES_SEASON } from "@/enums";
import { ApiIdentity } from "@/generated/models/ApiIdentity";
import { RefObject, useEffect, useRef, useState } from "react";
import { ProfileCollectedFilters } from "../UserPageCollected";
import { COLLECTED_COLLECTIONS_META } from "./user-page-collected-filters.helpers";
import UserPageCollectedFiltersCollection from "./UserPageCollectedFiltersCollection";
import UserPageCollectedFiltersSeized from "./UserPageCollectedFiltersSeized";
import UserPageCollectedFiltersSortBy from "./UserPageCollectedFiltersSortBy";
import UserPageCollectedFiltersSzn from "./UserPageCollectedFiltersSzn";

export default function UserPageCollectedFilters({
  profile,
  filters,
  containerRef,
  setCollection,
  setSortBy,
  setSeized,
  setSzn,
  showTransfer,
}: {
  readonly profile: ApiIdentity;
  readonly filters: ProfileCollectedFilters;
  readonly containerRef: RefObject<HTMLDivElement | null>;
  readonly setCollection: (collection: CollectedCollectionType | null) => void;
  readonly setSortBy: (sortBy: CollectionSort) => void;
  readonly setSeized: (seized: CollectionSeized | null) => void;
  readonly setSzn: (szn: MEMES_SEASON | null) => void;
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
    container.scrollBy({ left: -50, behavior: "smooth" });
  };

  const scrollRight = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollBy({ left: 50, behavior: "smooth" });
  };

  const getShowSeized = (collection: CollectedCollectionType | null): boolean =>
    collection ? COLLECTED_COLLECTIONS_META[collection].filters.seized : false;

  const getShowSzn = (collection: CollectedCollectionType | null): boolean =>
    collection ? COLLECTED_COLLECTIONS_META[collection].filters.szn : false;

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
            <UserPageCollectedFiltersCollection
              selected={filters.collection}
              setSelected={setCollection}
            />
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
                containerRef={containerRef}
                setSelected={setSzn}
              />
            )}
          </div>
          <div className="tw-flex-shrink-0">
            <UserAddressesSelectDropdown
              wallets={profile.wallets ?? []}
              containerRef={containerRef}
              onActiveAddress={() => undefined}
            />
          </div>
        </div>
      </div>
      {canScrollLeft && (
        <>
          <div className="tw-absolute tw-left-0 tw-top-0 tw-bottom-0 tw-w-24 tw-pointer-events-none tw-z-10 tw-bg-gradient-to-r tw-from-iron-950 tw-via-iron-950/80 tw-to-transparent" />
          <button
            onClick={scrollLeft}
            aria-label="Scroll filters left"
            className="tw-absolute tw-left-2 tw-top-1/2 tw--translate-y-1/2 tw-z-20 tw-inline-flex tw-items-center tw-justify-center tw-group tw-p-0 tw-h-8 tw-w-8 tw-bg-iron-700 tw-ring-1 tw-ring-inset tw-ring-white/5 tw-rounded-md tw-border-none">
            <svg
              className="tw-h-5 tw-w-5 tw-text-iron-200 group-hover:tw-text-iron-400 tw-rotate-90 tw-transition tw-duration-300 tw-ease-out"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg">
              <path
                d="M6 9L12 15L18 9"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </>
      )}
      {canScrollRight && (
        <>
          <div className="tw-absolute tw-right-0 tw-top-0 tw-bottom-0 tw-w-24 tw-pointer-events-none tw-z-10 tw-bg-gradient-to-l tw-from-iron-950 tw-via-iron-950/80 tw-to-transparent" />
          <button
            onClick={scrollRight}
            aria-label="Scroll filters right"
            className="tw-absolute tw-right-2 tw-top-1/2 tw--translate-y-1/2 tw-z-20 tw-inline-flex tw-items-center tw-justify-center tw-group tw-p-0 tw-h-8 tw-w-8 tw-bg-iron-700 tw-ring-1 tw-ring-inset tw-ring-white/5 tw-rounded-md tw-border-none">
            <svg
              className="tw-h-5 tw-w-5 tw-text-iron-200 group-hover:tw-text-iron-400 -tw-rotate-90 tw-transition tw-duration-300 tw-ease-out"
              viewBox="0 0 24 24"
              aria-hidden="true"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <path
                d="M6 9L12 15L18 9"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}

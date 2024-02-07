import { RefObject, useEffect, useRef, useState } from "react";
import {
  CollectedCollectionType,
  CollectionSeized,
  CollectionSort,
  IProfileAndConsolidations,
} from "../../../../entities/IProfile";
import { MEMES_SEASON } from "../../../../enums";
import { ProfileCollectedFilters } from "../UserPageCollected";
import UserPageCollectedFiltersCollection from "./UserPageCollectedFiltersCollection";
import UserPageCollectedFiltersSortBy from "./UserPageCollectedFiltersSortBy";
import UserPageCollectedFiltersSeized from "./UserPageCollectedFiltersSeized";
import UserPageCollectedFiltersSzn from "./UserPageCollectedFiltersSzn";
import UserAddressesSelectDropdown from "../../utils/addresses-select/UserAddressesSelectDropdown";
import { COLLECTED_COLLECTIONS_META } from "./user-page-collected-filters.helpers";

export default function UserPageCollectedFilters({
  profile,
  filters,
  containerRef,
  setCollection,
  setSortBy,
  setSeized,
  setSzn,
  scrollHorizontally,
}: {
  readonly profile: IProfileAndConsolidations;
  readonly filters: ProfileCollectedFilters;
  readonly containerRef: RefObject<HTMLDivElement>;
  readonly setCollection: (collection: CollectedCollectionType | null) => void;
  readonly setSortBy: (sortBy: CollectionSort) => void;
  readonly setSeized: (seized: CollectionSeized | null) => void;
  readonly setSzn: (szn: MEMES_SEASON | null) => void;
  readonly scrollHorizontally: (direction: "left" | "right") => void;
}) {
  const mostLeftFilterRef = useRef<HTMLDivElement>(null);
  const mostRightFilterRef = useRef<HTMLDivElement>(null);

  const leftArrowRef = useRef<HTMLButtonElement>(null);
  const rightArrowRef = useRef<HTMLButtonElement>(null);

  const [isMostLeftFilterVisible, setIsMostLeftFilterVisible] =
    useState<boolean>(false);
  const [isMostRightFilterVisible, setIsMostRightFilterVisible] =
    useState<boolean>(false);

  const checkVisibility = (elementRef: RefObject<HTMLDivElement>): boolean => {
    if (window.matchMedia("(pointer: coarse)").matches) return true;
    const element = elementRef.current;
    const container = containerRef.current;

    if (element && container) {
      const containerRect = container.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      const fullyVisible =
        +elementRect.left.toFixed(0) >= +containerRect.left.toFixed(0) &&
        +elementRect.right.toFixed(0) <= +containerRect.right.toFixed(0);

      return fullyVisible;
    }
    return false;
  };

  const getContainerLeftRightPositions = () => {
    const container = containerRef.current;
    if (container) {
      const { left, right } = container.getBoundingClientRect();
      return { left, right };
    }
    return { left: 0, right: 0 };
  };

  const setVisibility = () => {
    const { left, right } = getContainerLeftRightPositions();
    const viewportWidth = window.innerWidth;
    const leftArrow = leftArrowRef.current;
    const rightArrow = rightArrowRef.current;
    const isDesktop = viewportWidth >= 1024;
    const newLeft = isDesktop ? left - 40 : left - 20;
    const newRight = isDesktop ? right + 8 : right - 12;
    if (leftArrow) {
      leftArrow.style.left = `${newLeft}px`;
    }
    if (rightArrow) {
      rightArrow.style.left = `${newRight}px`;
    }

    setIsMostLeftFilterVisible(checkVisibility(mostLeftFilterRef));
    setIsMostRightFilterVisible(checkVisibility(mostRightFilterRef));
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", setVisibility);
      window.addEventListener("resize", setVisibility);
      setVisibility();
      return () => {
        container.removeEventListener("scroll", setVisibility);
        window.removeEventListener("resize", setVisibility);
      };
    }
  }, []);

  const getShowSeized = (collection: CollectedCollectionType | null): boolean =>
    collection ? COLLECTED_COLLECTIONS_META[collection].filters.seized : false;

  const getShowSzn = (collection: CollectedCollectionType | null): boolean =>
    collection ? COLLECTED_COLLECTIONS_META[collection].filters.szn : false;

  return (
    <div>
      <div className="tw-w-full tw-flex tw-justify-between tw-gap-3 tw-items-center">
        {!isMostLeftFilterVisible && (
          <button
            ref={leftArrowRef}
            className="tw-inline-flex tw-items-center tw-justify-center tw-group tw-absolute tw-z-10 tw-p-0 tw-h-8 tw-w-8 tw-left-0 tw-bg-iron-700 tw-ring-1 tw-ring-inset tw-ring-white/5 tw-rounded-md tw-border-none"
            onClick={() => scrollHorizontally("left")}
          >
            <svg
              className="tw-h-5 tw-w-5 tw-text-iron-200 group-hover:tw-text-iron-400 tw-rotate-90 tw-transition tw-duration-300 tw-ease-out"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6 9L12 15L18 9"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
        {!isMostRightFilterVisible && (
          <button
            ref={rightArrowRef}
            className="tw-inline-flex tw-items-center tw-justify-center tw-group tw-absolute tw-z-10 tw-p-0 tw-h-8 tw-w-8 tw-right-0 tw-bg-iron-700 tw-ring-1 tw-ring-inset tw-ring-white/5 tw-rounded-md tw-border-none"
            onClick={() => scrollHorizontally("right")}
          >
            <svg
              className="tw-h-5 tw-w-5 tw-text-iron-200 group-hover:tw-text-iron-400 -tw-rotate-90 tw-transition tw-duration-300 tw-ease-out"
              viewBox="0 0 24 24"
              aria-hidden="true"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6 9L12 15L18 9"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
        <div className="tw-gap-x-3 lg:tw-gap-x-4 tw-gap-y-3 tw-flex tw-items-center">
          <div ref={mostLeftFilterRef}>
            <UserPageCollectedFiltersCollection
              selected={filters.collection}
              setSelected={setCollection}
            />
          </div>
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
        <div ref={mostRightFilterRef}>
          <UserAddressesSelectDropdown
            addresses={profile.consolidation.wallets}
            containerRef={containerRef}
            onActiveAddress={() => undefined}
          />
        </div>
      </div>
    </div>
  );
}

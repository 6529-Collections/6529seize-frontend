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
  const getShowSeizedAndSzn = (
    targetCollection: CollectedCollectionType | null
  ): boolean => targetCollection === CollectedCollectionType.MEMES;

  const [showSeizedAndSzn, setShowSeizedAndSzn] = useState<boolean>(
    getShowSeizedAndSzn(filters.collection)
  );

  useEffect(() => {
    setShowSeizedAndSzn(getShowSeizedAndSzn(filters.collection));
  }, [filters.collection]);

  const mostLeftFilterRef = useRef<HTMLDivElement>(null);
  const mostRightFilterRef = useRef<HTMLDivElement>(null);

  const [isMostLeftFilterVisible, setIsMostLeftFilterVisible] =
    useState<boolean>(false);
  const [isMostRightFilterVisible, setIsMostRightFilterVisible] =
    useState<boolean>(false);

  const checkVisibility = (elementRef: RefObject<HTMLDivElement>): boolean => {
    const element = elementRef.current;
    const container = containerRef.current;

    if (element && container) {
      const containerRect = container.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();

      const fullyVisible =
        elementRect.left >= containerRect.left &&
        elementRect.right <= containerRect.right;

      return fullyVisible;
    }
    return false;
  };

  const setVisibility = () => {
    setIsMostLeftFilterVisible(checkVisibility(mostLeftFilterRef));
    setIsMostRightFilterVisible(checkVisibility(mostRightFilterRef));
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      // Listen for scroll events on the parent container
      container.addEventListener("scroll", setVisibility);
      window.addEventListener("resize", setVisibility);
      setVisibility(); // Initial check

      // Cleanup
      return () => {
        container.removeEventListener("scroll", setVisibility);
        window.removeEventListener("resize", setVisibility);
      };
    }
  }, []);

  return (
    <div>
      <div className="tw-w-full tw-flex tw-justify-between tw-gap-3 tw-items-center">
        {!isMostLeftFilterVisible && (
          <button
            className="tw-absolute tw-left-0 tw-bg-transparent tw-border-none"
            onClick={() => scrollHorizontally("left")}
          >
            <svg
              className="tw-h-5 tw-w-5 tw-text-white tw-rotate-90"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6 9L12 15L18 9"
                stroke="currentColor"
                strokeWidth="2"
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
            setSelected={setSortBy}
          />

          {showSeizedAndSzn && (
            <>
              <UserPageCollectedFiltersSeized
                selected={filters.seized}
                setSelected={setSeized}
              />
              <UserPageCollectedFiltersSzn
                selected={filters.szn}
                setSelected={setSzn}
              />
            </>
          )}
        </div>
        <div ref={mostRightFilterRef}>
          <UserAddressesSelectDropdown
            addresses={profile.consolidation.wallets}
            onActiveAddress={() => undefined}
          />
        </div>
        {!isMostRightFilterVisible && (
          <button
            className="tw-absolute tw-right-0 tw-bg-transparent tw-border-none"
            onClick={() => scrollHorizontally("right")}
          >
            <svg
              className="tw-h-5 tw-w-5 tw-text-white -tw-rotate-90"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6 9L12 15L18 9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

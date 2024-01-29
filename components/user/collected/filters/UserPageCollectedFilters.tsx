import { useEffect, useState } from "react";
import {
  CollectedCollectionType,
  CollectionSeized,
  CollectionSort,
  IProfileAndConsolidations,
} from "../../../../entities/IProfile";
import UserPageHeaderAddresses from "../../user-page-header/addresses/UserPageHeaderAddresses";
import { MEMES_SEASON } from "../../../../enums";
import { ProfileCollectedFilters } from "../UserPageCollected";
import { createBreakpoint } from "react-use";
import UserPageCollectedFiltersDesktop from "./UserPageCollectedFiltersDesktop";
import UserPageCollectedFiltersMobile from "./UserPageCollectedFiltersMobile";
import CircleLoader from "../../../distribution-plan-tool/common/CircleLoader";

const useBreakpoint = createBreakpoint({ LG: 1024, S: 0 });

export default function UserPageCollectedFilters({
  profile,
  filters,
  loading,
  setCollection,
  setSortBy,
  setSeized,
  setSzn,
}: {
  readonly profile: IProfileAndConsolidations;
  readonly filters: ProfileCollectedFilters;
  readonly loading: boolean;
  readonly setCollection: (collection: CollectedCollectionType | null) => void;
  readonly setSortBy: (sortBy: CollectionSort) => void;
  readonly setSeized: (seized: CollectionSeized | null) => void;
  readonly setSzn: (szn: MEMES_SEASON | null) => void;
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

  const breakpoint = useBreakpoint();

  return (
    <div className="tw-flex tw-justify-between tw-gap-y-6 tw-gap-x-4">
      <div className="tw-flex tw-items-center tw-flex-wrap tw-gap-y-3 tw-gap-x-4">
        <UserPageCollectedFiltersDesktop
          filters={filters}
          setCollection={setCollection}
          setSortBy={setSortBy}
          setSeized={setSeized}
          setSzn={setSzn}
          showSeizedAndSzn={showSeizedAndSzn}
        />
        {/* {breakpoint === "LG" ? (
          <UserPageCollectedFiltersDesktop
            filters={filters}
            setCollection={setCollection}
            setSortBy={setSortBy}
            setSeized={setSeized}
            setSzn={setSzn}
            showSeizedAndSzn={showSeizedAndSzn}
          />
        ) : (
          <UserPageCollectedFiltersMobile
            filters={filters}
            setCollection={setCollection}
            setSortBy={setSortBy}
            setSeized={setSeized}
            setSzn={setSzn}
            showSeizedAndSzn={showSeizedAndSzn}
          />
        )} */}
      </div>
      <div className="tw-inline-flex tw-space-x-4">
        {loading && <CircleLoader />}
        <UserPageHeaderAddresses
          addresses={profile.consolidation.wallets}
          onActiveAddress={() => undefined}
        />
      </div>
    </div>
  );
}

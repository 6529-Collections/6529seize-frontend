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
import CircleLoader from "../../../distribution-plan-tool/common/CircleLoader";
import UserPageCollectedFiltersCollection from "./UserPageCollectedFiltersCollection";
import UserPageCollectedFiltersSortBy from "./UserPageCollectedFiltersSortBy";
import UserPageCollectedFiltersSeized from "./UserPageCollectedFiltersSeized";
import UserPageCollectedFiltersSzn from "./UserPageCollectedFiltersSzn";

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

  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    if ("ontouchstart" in window || navigator.maxTouchPoints) {
      setIsTouchDevice(true);
    }
  }, []);

  useEffect(() => {
    setShowSeizedAndSzn(getShowSeizedAndSzn(filters.collection));
  }, [filters.collection]);

  return (
    <div className="">
      <div className="tw-w-full tw-flex tw-justify-between tw-gap-3">
        <div className="tw-gap-x-3 lg:tw-gap-x-4 tw-gap-y-3 tw-flex tw-items-center">
          <UserPageCollectedFiltersCollection
            selected={filters.collection}
            setSelected={setCollection}
          />
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
        <UserPageHeaderAddresses
          addresses={profile.consolidation.wallets}
          onActiveAddress={() => undefined}
        />
      </div>
    </div>
  );
}

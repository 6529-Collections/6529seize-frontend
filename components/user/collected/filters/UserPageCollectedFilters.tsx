import { useEffect, useState } from "react";
import {
  CollectedCollectionType,
  CollectionSeized,
  CollectionSort,
  IProfileAndConsolidations,
} from "../../../../entities/IProfile";
import UserPageHeaderAddresses from "../../user-page-header/addresses/UserPageHeaderAddresses";
import UserPageCollectedFiltersSeized from "./UserPageCollectedFiltersSeized";
import { MEMES_SEASON } from "../../../../enums";
import UserPageCollectedFiltersSzn from "./UserPageCollectedFiltersSzn";
import UserPageCollectedFiltersCollection from "./UserPageCollectedFiltersCollection";
import UserPageCollectedFiltersSortBy from "./UserPageCollectedFiltersSortBy";
import { ProfileCollectedFilters } from "../UserPageCollected";

export default function UserPageCollectedFilters({
  profile,
  filters,
  setCollection,
  setSortBy,
  setSeized,
  setSzn,
}: {
  readonly profile: IProfileAndConsolidations;
  readonly filters: ProfileCollectedFilters;
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

  return (
    <div className="tw-flex tw-flex-wrap md:tw-flex-nowrap md:tw-flex-row-reverse lg:tw-justify-between tw-gap-y-6 tw-gap-x-4">
      <UserPageHeaderAddresses
        addresses={profile.consolidation.wallets}
        onActiveAddress={() => undefined}
      />
      <div className="tw-flex tw-flex-wrap tw-gap-y-3 tw-gap-x-4">
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
    </div>
  );
}

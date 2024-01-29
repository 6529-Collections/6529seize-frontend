import {
  CollectedCollectionType,
  CollectionSeized,
  CollectionSort,
} from "../../../../entities/IProfile";
import { MEMES_SEASON } from "../../../../enums";
import { ProfileCollectedFilters } from "../UserPageCollected";
import UserPageCollectedFiltersCollection from "./UserPageCollectedFiltersCollection";
import UserPageCollectedFiltersSeized from "./UserPageCollectedFiltersSeized";
import UserPageCollectedFiltersSortBy from "./UserPageCollectedFiltersSortBy";
import UserPageCollectedFiltersSzn from "./UserPageCollectedFiltersSzn";

export default function UserPageCollectedFiltersDesktop({
  filters,
  setCollection,
  setSortBy,
  setSeized,
  setSzn,
  showSeizedAndSzn,
}: {
  readonly filters: ProfileCollectedFilters;
  readonly setCollection: (collection: CollectedCollectionType | null) => void;
  readonly setSortBy: (sortBy: CollectionSort) => void;
  readonly setSeized: (seized: CollectionSeized | null) => void;
  readonly setSzn: (szn: MEMES_SEASON | null) => void;
  readonly showSeizedAndSzn: boolean;
}) {
  return (
    <div>
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
  );
}

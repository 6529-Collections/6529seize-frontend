// collection_type?: string;

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
import { SortDirection } from "../../../../entities/ISort";
import UserPageCollectedFiltersCollection from "./UserPageCollectedFiltersCollection";
import UserPageCollectedFiltersSortBy from "./UserPageCollectedFiltersSortBy";

// consolidations?: string;
// "true" | "false";

//     seized?: string;

//     szn?: string;
// 1-6 (seasons)

//     page?: string;
//     page_size?: string;

//     sort_direction?: string;
// DESC | ASC

//     sort?: string;
// token_id | tdh | rank

// endpoint /handleOrWallet/collected

export default function UserPageCollectedFilters({
  profile,
}: {
  readonly profile: IProfileAndConsolidations;
}) {
  const PAGE_SIZE = 20;
  const [activeAddress, setActiveAddress] = useState<string | null>(null);
  const [consolidations, setConsolidations] = useState<boolean>(
    !!activeAddress
  );

  const [collection, setCollection] = useState<CollectedCollectionType | null>(
    null
  );

  const [seized, setSeized] = useState<CollectionSeized | null>(null);
  const [szn, setSzn] = useState<MEMES_SEASON | null>(null);
  const [sortBy, setSortBy] = useState<CollectionSort>(CollectionSort.TOKEN_ID);
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    SortDirection.DESC
  );

  const onSort = (newSortBy: CollectionSort) => {
    if (newSortBy === sortBy) {
      setSortDirection((prev) =>
        prev === SortDirection.ASC ? SortDirection.DESC : SortDirection.ASC
      );
    } else {
      setSortBy(newSortBy);
      setSortDirection(SortDirection.DESC);
    }
  };

  useEffect(() => {
    setConsolidations(!!activeAddress);
  }, [activeAddress]);
  return (
    <div className="tw-w-full tw-inline-flex tw-justify-between">
      <UserPageCollectedFiltersCollection
        selected={collection}
        setSelected={setCollection}
      />
      <UserPageCollectedFiltersSortBy
        selected={sortBy}
        direction={sortDirection}
        setSelected={onSort}
      />
      <UserPageCollectedFiltersSeized
        selected={seized}
        setSelected={setSeized}
      />
      <UserPageCollectedFiltersSzn selected={szn} setSelected={setSzn} />

      <UserPageHeaderAddresses
        addresses={profile.consolidation.wallets}
        onActiveAddress={setActiveAddress}
      />
    </div>
  );
}

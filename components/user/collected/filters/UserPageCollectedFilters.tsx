// collection_type?: string;

import { useEffect, useState } from "react";
import {
  CollectedCollectionType,
  CollectionSeized,
  IProfileAndConsolidations,
} from "../../../../entities/IProfile";
import UserPageHeaderAddresses from "../../user-page-header/addresses/UserPageHeaderAddresses";
import UserPageCollectedFiltersSeized from "./UserPageCollectedFiltersSeized";
import { MEMES_SEASON } from "../../../../enums";
import UserPageCollectedFiltersSzn from "./UserPageCollectedFiltersSzn";
import { SortDirection } from "../../../../entities/ISort";
import UserPageCollectedFiltersCollection from "./UserPageCollectedFiltersCollection";

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

  const [seized, setSeized] = useState<CollectionSeized | null>(null);
  const [szn, setSzn] = useState<MEMES_SEASON | null>(null);
  const [collection, setCollection] = useState<CollectedCollectionType | null>(
    null
  );

  useEffect(() => {
    setConsolidations(!!activeAddress);
  }, [activeAddress]);
  return (
    <div>
      <UserPageCollectedFiltersSeized
        selected={seized}
        setSelected={setSeized}
      />
      <UserPageCollectedFiltersSzn selected={szn} setSelected={setSzn} />
      <UserPageCollectedFiltersCollection
        selected={collection}
        setSelected={setCollection}
      />
      <UserPageHeaderAddresses
        addresses={profile.consolidation.wallets}
        onActiveAddress={setActiveAddress}
      />
    </div>
  );
}

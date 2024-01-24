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
import { useRouter } from "next/router";
import { useDebounce } from "react-use";
import { usePathname, useSearchParams } from "next/navigation";

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

interface ProfileCollectedFilters {
  readonly handleOrWallet: string;
  readonly consolidations: true | null;
  readonly collection: CollectedCollectionType | null;
  readonly seized: CollectionSeized | null;
  readonly szn: MEMES_SEASON | null;
  readonly page: number;
  readonly pageSize: number;
  readonly sortBy: CollectionSort;
  readonly sortDirection: SortDirection;
}

interface QueryUpdateInput {
  name: keyof typeof SEARCH_PARAMS_FIELDS;
  value: string | null;
}

const SEARCH_PARAMS_FIELDS = {
  address: "address",
  collection: "collection",
  seized: "seized",
  szn: "szn",
  page: "page",
  sortBy: "sort-by",
  sortDirection: "sort-direction",
} as const;

const SNZ_TO_SEARCH_PARAMS: Record<MEMES_SEASON, string> = {
  [MEMES_SEASON.SZN1]: "1",
  [MEMES_SEASON.SZN2]: "2",
  [MEMES_SEASON.SZN3]: "3",
  [MEMES_SEASON.SZN4]: "4",
  [MEMES_SEASON.SZN5]: "5",
  [MEMES_SEASON.SZN6]: "6",
};

export default function UserPageCollectedFilters({
  profile,
}: {
  readonly profile: IProfileAndConsolidations;
}) {
  const defaultSortBy = CollectionSort.TOKEN_ID;
  const defaultSortDirection = SortDirection.DESC;
  const PAGE_SIZE = 20;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const user = (router.query.user as string).toLowerCase();

  const convertAddress = (address: any): string | null => {
    if (!address) return null;
    if (typeof address === "string") return address.toLowerCase();
    return null;
  };

  const getFilters = (): ProfileCollectedFilters => {
    const address = searchParams.get(SEARCH_PARAMS_FIELDS.address);
    const collection = searchParams.get(SEARCH_PARAMS_FIELDS.collection);
    const seized = searchParams.get(SEARCH_PARAMS_FIELDS.seized);
    const szn = searchParams.get(SEARCH_PARAMS_FIELDS.szn);
    const page = searchParams.get(SEARCH_PARAMS_FIELDS.page);
    const sortBy = searchParams.get(SEARCH_PARAMS_FIELDS.sortBy);
    const sortDirection = searchParams.get(SEARCH_PARAMS_FIELDS.sortDirection);

    const convertedAddress = convertAddress(address);

    const convertedCollection = collection
      ? Object.values(CollectedCollectionType).find(
          (c) => c === collection.toUpperCase()
        ) ?? null
      : null;

    const convertedSeized = seized
      ? Object.values(CollectionSeized).find(
          (c) => c === seized.toUpperCase()
        ) ?? null
      : null;

    const convertedSzn = szn
      ? Object.values(MEMES_SEASON).find(
          (c) => SNZ_TO_SEARCH_PARAMS[c] === szn
        ) ?? null
      : null;

    const convertedPage = page ? parseInt(page) : 1;

    const convertedSortBy = sortBy
      ? Object.values(CollectionSort).find((c) => c === sortBy.toUpperCase()) ??
        defaultSortBy
      : defaultSortBy;
    const convertedSortDirection = sortDirection
      ? Object.values(SortDirection).find(
          (c) => c === sortDirection.toUpperCase()
        ) ?? defaultSortDirection
      : defaultSortDirection;
    return {
      handleOrWallet: convertedAddress ?? profile.profile?.handle ?? user,
      consolidations: convertedAddress ? null : true,
      collection: convertedCollection,
      seized: convertedSeized,
      szn: convertedSzn,
      page: convertedPage,
      pageSize: PAGE_SIZE,
      sortBy: convertedSortBy,
      sortDirection: convertedSortDirection,
    };
  };

  const createQueryString = (updateItems: QueryUpdateInput[]): string => {
    const params = new URLSearchParams(searchParams.toString());
    for (const { name, value } of updateItems) {
      if (!value) {
        params.delete(name);
      } else {
        params.set(name, value);
      }
    }
    return params.toString();
  };

  const updateFields = async (
    updateItems: QueryUpdateInput[]
  ): Promise<void> => {
    const queryString = createQueryString(updateItems);
    const path = queryString ? pathname + "?" + queryString : pathname;
    await router.replace(path, undefined, {
      shallow: true,
    });
  };

  const [filters, setFilters] = useState<ProfileCollectedFilters>(getFilters());
  useEffect(() => setFilters(getFilters()), [searchParams]);
  useEffect(() => console.log(filters), [filters]);

  const setCollection = async (
    collection: CollectedCollectionType | null
  ): Promise<void> => {
    if (!filters.collection && !collection) return;
    const items: QueryUpdateInput[] = [
      {
        name: SEARCH_PARAMS_FIELDS.collection,
        value:
          filters.collection === collection
            ? null
            : collection?.toLowerCase() ?? null,
      },
      {
        name: SEARCH_PARAMS_FIELDS.page,
        value: "1",
      },
    ];
    await updateFields(items);
  };

  const [seized, setSeized] = useState<CollectionSeized | null>(null);
  const [szn, setSzn] = useState<MEMES_SEASON | null>(null);
  const [sortBy, setSortBy] = useState<CollectionSort>(defaultSortBy);
  const [sortDirection, setSortDirection] =
    useState<SortDirection>(defaultSortDirection);
  const [page, setPage] = useState<number>(1);
  const onSort = (newSortBy: CollectionSort) => {
    if (newSortBy === sortBy) {
      setSortDirection((prev) =>
        prev === SortDirection.ASC ? SortDirection.DESC : SortDirection.ASC
      );
    } else {
      setSortBy(newSortBy);
      setSortDirection(defaultSortDirection);
    }
  };

  const getShowSeizedAndSzn = (
    targetCollection: CollectedCollectionType | null
  ): boolean => targetCollection === CollectedCollectionType.MEMES;

  const getShowRank = (
    targetCollection: CollectedCollectionType | null
  ): boolean => {
    if (!targetCollection) return false;
    return [
      CollectedCollectionType.MEMES,
      CollectedCollectionType.GRADIENTS,
    ].includes(targetCollection);
  };

  const [showSeizedAndSzn, setShowSeizedAndSzn] = useState<boolean>(false);

  const [showRank, setShowRank] = useState<boolean>(false);

  const onCollection = (newCollection: CollectedCollectionType | null) => {
    setCollection(newCollection);
    const rank = getShowRank(newCollection);
    if (!rank && sortBy === CollectionSort.RANK) {
      setSortBy(defaultSortBy);
      setSortDirection(defaultSortDirection);
    }
    setShowRank(rank);
    const seizedAndSzn = getShowSeizedAndSzn(newCollection);
    if (!seizedAndSzn) {
      setSeized(null);
      setSzn(null);
    }
    setShowSeizedAndSzn(seizedAndSzn);
  };

  return (
    <div className="tw-w-full tw-inline-flex tw-justify-between tw-space-x-2">
      <div className="tw-inline-flex tw-w-full tw-space-x-2">
        <UserPageCollectedFiltersCollection
          selected={filters.collection}
          setSelected={setCollection}
        />
        <UserPageCollectedFiltersSortBy
          selected={sortBy}
          direction={sortDirection}
          setSelected={onSort}
          showRank={showRank}
        />

        {showSeizedAndSzn && (
          <>
            <UserPageCollectedFiltersSeized
              selected={seized}
              setSelected={setSeized}
            />
            <UserPageCollectedFiltersSzn selected={szn} setSelected={setSzn} />
          </>
        )}
      </div>

      <UserPageHeaderAddresses
        addresses={profile.consolidation.wallets}
        onActiveAddress={() => undefined}
      />
    </div>
  );
}

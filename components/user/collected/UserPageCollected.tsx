"use client";

import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import TransferPanel from "@/components/nft-transfer/TransferPanel";
import { useTransfer } from "@/components/nft-transfer/TransferState";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import {
  EMPTY_USER_PAGE_STATS_INITIAL_DATA,
  type UserPageStatsInitialData,
} from "@/components/user/stats/userPageStats.types";
import { publicEnv } from "@/config/env";
import type { CollectedCard } from "@/entities/IProfile";
import {
  CollectedCollectionType,
  CollectionSeized,
  CollectionSort,
} from "@/entities/IProfile";
import type { MemeSeason } from "@/entities/ISeason";
import { SortDirection } from "@/entities/ISort";
import type { ApiIdentity } from "@/generated/models/ObjectSerializer";
import { areEqualAddresses } from "@/helpers/Helpers";
import type { Page } from "@/helpers/Types";
import useIsMobileScreen from "@/hooks/isMobileScreen";
import { fetchAllPages } from "@/services/6529api";
import { commonApiFetch } from "@/services/api/common-api";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import UserPageCollectedCards from "./cards/UserPageCollectedCards";
import UserPageCollectedNetworkCards from "./cards/UserPageCollectedNetworkCards";
import {
  COLLECTED_COLLECTIONS_META,
  convertAddressToLowerCase,
} from "./filters/user-page-collected-filters.helpers";
import UserPageCollectedFilters from "./filters/UserPageCollectedFilters";
import { useXtdhTokensQuery } from "./hooks/useXtdhTokensQuery";
import UserPageCollectedFirstLoading from "./UserPageCollectedFirstLoading";
import UserPageCollectedStats from "./UserPageCollectedStats";

export interface ProfileCollectedFilters {
  readonly handleOrWallet: string;
  readonly accountForConsolidations: boolean;
  readonly collection: CollectedCollectionType | null;
  readonly subcollection: string | null;
  readonly seized: CollectionSeized | null;
  readonly szn: MemeSeason | null;
  readonly initialSznId: number | null;
  readonly page: number;
  readonly pageSize: number;
  readonly sortBy: CollectionSort;
  readonly sortDirection: SortDirection;
}

interface QueryUpdateInput {
  name: keyof typeof SEARCH_PARAMS_FIELDS;
  value: string | null;
}

interface NormalizedCollectedQueryState {
  readonly address: string | null;
  readonly collection: CollectedCollectionType | null;
  readonly subcollection: string | null;
  readonly seized: CollectionSeized | null;
  readonly sznId: number | null;
  readonly page: number;
  readonly sortBy: CollectionSort;
  readonly sortDirection: SortDirection;
}

const SEARCH_PARAMS_FIELDS = {
  address: "address",
  collection: "collection",
  subcollection: "subcollection",
  seized: "seized",
  szn: "szn",
  page: "page",
  sortBy: "sort-by",
  sortDirection: "sort-direction",
} as const;

const DEFAULT_SORT_BY = CollectionSort.TOKEN_ID;
const DEFAULT_SORT_DIRECTION = SortDirection.DESC;
const DEFAULT_SEIZED = CollectionSeized.SEIZED;
const PAGE_SIZE = 24;
const COLLECTION_VALUES = Object.values(CollectedCollectionType);
const SEIZED_VALUES = Object.values(CollectionSeized);
const SORT_VALUES = Object.values(CollectionSort);
const SORT_DIRECTION_VALUES = Object.values(SortDirection);

const getDefaultSortBy = (
  collection: CollectedCollectionType | null
): CollectionSort =>
  collection === CollectedCollectionType.NETWORK
    ? CollectionSort.XTDH
    : DEFAULT_SORT_BY;

const convertSeized = ({
  seized,
  collection,
}: {
  readonly seized: string | null;
  readonly collection: CollectedCollectionType | null;
}): CollectionSeized | null => {
  if (collection === null) return DEFAULT_SEIZED;
  if (!COLLECTED_COLLECTIONS_META[collection].filters.seized) {
    return DEFAULT_SEIZED;
  }
  if (seized === null) return null;
  const normalizedSeized = seized.toUpperCase() as CollectionSeized;
  return SEIZED_VALUES.includes(normalizedSeized) ? normalizedSeized : null;
};

const convertSznId = ({
  szn,
  collection,
}: {
  readonly szn: string | null;
  readonly collection: CollectedCollectionType | null;
}): number | null => {
  if (collection === null) return null;
  if (!COLLECTED_COLLECTIONS_META[collection].filters.szn) return null;
  if (szn === null) return null;
  const parsed = Number.parseInt(szn, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const convertCollection = (
  collection: string | null
): CollectedCollectionType | null => {
  if (collection === null) return null;
  const normalizedCollection =
    collection.toUpperCase() as CollectedCollectionType;
  return COLLECTION_VALUES.includes(normalizedCollection)
    ? normalizedCollection
    : null;
};

const convertSortedBy = ({
  sortBy,
  collection,
}: {
  readonly sortBy: string | null;
  readonly collection: CollectedCollectionType | null;
}): CollectionSort => {
  const defaultCollectionSortBy = getDefaultSortBy(collection);
  if (sortBy === null) return defaultCollectionSortBy;
  const normalizedSortBy = sortBy.toUpperCase() as CollectionSort;
  if (
    collection !== null &&
    !COLLECTED_COLLECTIONS_META[collection].filters.sort.includes(
      normalizedSortBy
    )
  ) {
    return defaultCollectionSortBy;
  }
  return SORT_VALUES.includes(normalizedSortBy)
    ? normalizedSortBy
    : defaultCollectionSortBy;
};

const convertSortDirection = (sortDirection: string | null): SortDirection => {
  if (sortDirection === null) return DEFAULT_SORT_DIRECTION;
  const normalizedSortDirection = sortDirection.toUpperCase() as SortDirection;
  return SORT_DIRECTION_VALUES.includes(normalizedSortDirection)
    ? normalizedSortDirection
    : DEFAULT_SORT_DIRECTION;
};

const getCanonicalCollectedQueryState = (
  queryParams: URLSearchParams
): NormalizedCollectedQueryState => {
  const collection = convertCollection(
    queryParams.get(SEARCH_PARAMS_FIELDS.collection)
  );
  const pageParam = queryParams.get(SEARCH_PARAMS_FIELDS.page);
  const parsedPage = pageParam ? Number.parseInt(pageParam, 10) : 1;

  return {
    address: convertAddressToLowerCase(
      queryParams.get(SEARCH_PARAMS_FIELDS.address)
    ),
    collection,
    subcollection:
      collection === CollectedCollectionType.NETWORK
        ? queryParams.get(SEARCH_PARAMS_FIELDS.subcollection)
        : null,
    seized: convertSeized({
      seized: queryParams.get(SEARCH_PARAMS_FIELDS.seized),
      collection,
    }),
    sznId: convertSznId({
      szn: queryParams.get(SEARCH_PARAMS_FIELDS.szn),
      collection,
    }),
    page: Number.isNaN(parsedPage) ? 1 : parsedPage,
    sortBy: convertSortedBy({
      sortBy: queryParams.get(SEARCH_PARAMS_FIELDS.sortBy),
      collection,
    }),
    sortDirection: convertSortDirection(
      queryParams.get(SEARCH_PARAMS_FIELDS.sortDirection)
    ),
  };
};

const setCanonicalCollectedQueryParams = ({
  normalizedParams,
  state,
}: {
  readonly normalizedParams: URLSearchParams;
  readonly state: NormalizedCollectedQueryState;
}) => {
  if (state.address !== null) {
    normalizedParams.set(SEARCH_PARAMS_FIELDS.address, state.address);
  }
  if (state.collection !== null) {
    normalizedParams.set(
      SEARCH_PARAMS_FIELDS.collection,
      state.collection.toLowerCase()
    );
  }
  if (state.subcollection !== null) {
    normalizedParams.set(
      SEARCH_PARAMS_FIELDS.subcollection,
      state.subcollection.toLowerCase()
    );
  }
  if (
    state.collection !== null &&
    COLLECTED_COLLECTIONS_META[state.collection].filters.seized &&
    state.seized !== null
  ) {
    normalizedParams.set(
      SEARCH_PARAMS_FIELDS.seized,
      state.seized.toLowerCase()
    );
  }
  if (
    state.collection !== null &&
    COLLECTED_COLLECTIONS_META[state.collection].filters.szn &&
    state.sznId !== null
  ) {
    normalizedParams.set(SEARCH_PARAMS_FIELDS.szn, state.sznId.toString());
  }
  if (state.page > 1) {
    normalizedParams.set(SEARCH_PARAMS_FIELDS.page, state.page.toString());
  }
  if (state.sortBy !== getDefaultSortBy(state.collection)) {
    normalizedParams.set(
      SEARCH_PARAMS_FIELDS.sortBy,
      state.sortBy.toLowerCase()
    );
  }
  if (state.sortDirection !== DEFAULT_SORT_DIRECTION) {
    normalizedParams.set(
      SEARCH_PARAMS_FIELDS.sortDirection,
      state.sortDirection.toLowerCase()
    );
  }
};

export default function UserPageCollected({
  profile,
  initialStatsData = EMPTY_USER_PAGE_STATS_INITIAL_DATA,
}: {
  readonly profile: ApiIdentity;
  readonly initialStatsData?: UserPageStatsInitialData | undefined;
}) {
  const { address: connectedAddress } = useSeizeConnectContext();
  const isMobile = useIsMobileScreen();

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const user = params?.["user"]?.toString().toLowerCase() ?? "";

  const getFilters = useCallback((): ProfileCollectedFilters => {
    const addressParam = searchParams.get(SEARCH_PARAMS_FIELDS.address);
    const collectionParam = searchParams.get(SEARCH_PARAMS_FIELDS.collection);
    const subcollectionParam = searchParams.get(
      SEARCH_PARAMS_FIELDS.subcollection
    );
    const seizedParam = searchParams.get(SEARCH_PARAMS_FIELDS.seized);
    const sznParam = searchParams.get(SEARCH_PARAMS_FIELDS.szn);
    const pageParam = searchParams.get(SEARCH_PARAMS_FIELDS.page);
    const sortByParam = searchParams.get(SEARCH_PARAMS_FIELDS.sortBy);
    const sortDirectionParam = searchParams.get(
      SEARCH_PARAMS_FIELDS.sortDirection
    );

    const convertedAddress = convertAddressToLowerCase(addressParam);
    const convertedCollection = convertCollection(collectionParam ?? null);
    return {
      handleOrWallet: convertedAddress ?? profile.handle ?? user,
      accountForConsolidations: !convertedAddress,
      collection: convertedCollection,
      subcollection:
        convertedCollection === CollectedCollectionType.NETWORK
          ? (subcollectionParam ?? null)
          : null,
      seized: convertSeized({
        seized: seizedParam ?? null,
        collection: convertedCollection,
      }),
      szn: null,
      initialSznId: convertSznId({
        szn: sznParam ?? null,
        collection: convertedCollection,
      }),
      page: pageParam ? Number.parseInt(pageParam, 10) : 1,
      pageSize: PAGE_SIZE,
      sortBy: convertSortedBy({
        sortBy: sortByParam ?? null,
        collection: convertedCollection,
      }),
      sortDirection: convertSortDirection(sortDirectionParam ?? null),
    };
  }, [searchParams, profile.handle, user]);

  const createQueryString = useCallback(
    (updateItems: QueryUpdateInput[]): string => {
      const queryParams = new URLSearchParams(searchParams.toString());
      for (const { name, value } of updateItems) {
        const key = SEARCH_PARAMS_FIELDS[name];
        if (!value) {
          queryParams.delete(key);
        } else {
          queryParams.set(key, value.toLowerCase());
        }
      }
      const state = getCanonicalCollectedQueryState(queryParams);
      const normalizedParams = new URLSearchParams();
      const knownParamKeys = new Set<string>(
        Object.values(SEARCH_PARAMS_FIELDS)
      );

      for (const [key, value] of queryParams.entries()) {
        if (!knownParamKeys.has(key)) {
          normalizedParams.append(key, value);
        }
      }
      setCanonicalCollectedQueryParams({ normalizedParams, state });

      return normalizedParams.toString();
    },
    [searchParams]
  );

  const updateFields = useCallback(
    async (updateItems: QueryUpdateInput[]): Promise<void> => {
      const queryString = createQueryString(updateItems);
      const path = queryString ? pathname + "?" + queryString : pathname;
      if (path) {
        router.replace(path, {
          scroll: false,
        });
      }
    },
    [pathname, router, createQueryString]
  );

  const [filters, setFilters] = useState<ProfileCollectedFilters>(getFilters());
  const effectiveSeasonId = filters.szn?.id ?? filters.initialSznId;

  const { enabled: transferEnabled } = useTransfer();

  const getCollectionSortUpdate = (
    nextCollection: CollectedCollectionType | null
  ): {
    readonly nextSortBy: CollectionSort;
    readonly nextSortDirection: SortDirection;
    readonly updateItems: QueryUpdateInput[];
  } => {
    const isSwitchingFromNetwork =
      filters.collection === CollectedCollectionType.NETWORK &&
      nextCollection !== CollectedCollectionType.NETWORK;

    if (
      (nextCollection !== null &&
        nextCollection !== CollectedCollectionType.NETWORK &&
        !COLLECTED_COLLECTIONS_META[nextCollection].filters.sort.includes(
          filters.sortBy
        )) ||
      isSwitchingFromNetwork
    ) {
      return {
        nextSortBy: CollectionSort.TOKEN_ID,
        nextSortDirection: SortDirection.DESC,
        updateItems: [
          {
            name: "sortBy",
            value: CollectionSort.TOKEN_ID,
          },
          {
            name: "sortDirection",
            value: SortDirection.DESC,
          },
        ],
      };
    }

    if (nextCollection === CollectedCollectionType.NETWORK) {
      return {
        nextSortBy: CollectionSort.XTDH,
        nextSortDirection: SortDirection.DESC,
        updateItems: [
          {
            name: "sortBy",
            value: CollectionSort.XTDH,
          },
          {
            name: "sortDirection",
            value: SortDirection.DESC,
          },
        ],
      };
    }

    return {
      nextSortBy: filters.sortBy,
      nextSortDirection: filters.sortDirection,
      updateItems: [],
    };
  };

  const getCollectionUpdate = ({
    collection,
    allowToggle,
  }: {
    readonly collection: CollectedCollectionType | null;
    readonly allowToggle: boolean;
  }): {
    readonly nextFilters: ProfileCollectedFilters;
    readonly updateItems: QueryUpdateInput[];
  } => {
    const nextCollection =
      allowToggle && filters.collection === collection ? null : collection;
    const sortUpdate = getCollectionSortUpdate(nextCollection);

    const updateItems: QueryUpdateInput[] = [
      {
        name: "collection",
        value: nextCollection,
      },
      {
        name: "page",
        value: "1",
      },
      {
        name: "seized",
        value: DEFAULT_SEIZED,
      },
      {
        name: "szn",
        value: null,
      },
      {
        name: "subcollection",
        value: null,
      },
      ...sortUpdate.updateItems,
    ];

    return {
      nextFilters: {
        ...filters,
        collection: nextCollection,
        subcollection: null,
        seized: DEFAULT_SEIZED,
        szn: null,
        initialSznId: null,
        page: 1,
        sortBy: sortUpdate.nextSortBy,
        sortDirection: sortUpdate.nextSortDirection,
      },
      updateItems,
    };
  };

  const setCollection = async (
    collection: CollectedCollectionType | null
  ): Promise<void> => {
    if (filters.collection === null && collection === null) return;
    const { nextFilters, updateItems } = getCollectionUpdate({
      collection,
      allowToggle: true,
    });
    setFilters(nextFilters);
    await updateFields(updateItems);
  };

  const setCollectionShortcut = async (
    collection: CollectedCollectionType
  ): Promise<void> => {
    const { nextFilters, updateItems } = getCollectionUpdate({
      collection,
      allowToggle: true,
    });
    setFilters(nextFilters);
    await updateFields(updateItems);
  };

  const setSeasonShortcut = async (seasonNumber: number): Promise<void> => {
    const isActiveSeasonShortcut =
      filters.collection === CollectedCollectionType.MEMES &&
      effectiveSeasonId === seasonNumber;
    const nextInitialSznId = isActiveSeasonShortcut ? null : seasonNumber;
    const { nextFilters: nextCollectionFilters, updateItems } =
      getCollectionUpdate({
        collection: isActiveSeasonShortcut
          ? null
          : CollectedCollectionType.MEMES,
        allowToggle: false,
      });
    const nextFilters: ProfileCollectedFilters = {
      ...nextCollectionFilters,
      szn:
        nextInitialSznId !== null && filters.szn?.id === nextInitialSznId
          ? filters.szn
          : null,
      initialSznId: nextInitialSznId,
    };
    const items = updateItems.map((item) =>
      item.name === "szn"
        ? {
            ...item,
            value: nextInitialSznId?.toString() ?? null,
          }
        : item
    );

    setFilters(nextFilters);
    await updateFields(items);
  };

  const calculateSortDirection = ({
    newSortBy,
    currentSortBy,
    currentSortDirection,
  }: {
    newSortBy: CollectionSort;
    currentSortBy: CollectionSort;
    currentSortDirection: SortDirection;
  }): SortDirection | null => {
    if (newSortBy === currentSortBy) {
      if (currentSortDirection === SortDirection.ASC) {
        return SortDirection.DESC;
      }
      return SortDirection.ASC;
    }
    return DEFAULT_SORT_DIRECTION;
  };

  const setSortBy = async (sortBy: CollectionSort): Promise<void> => {
    const items: QueryUpdateInput[] = [
      {
        name: "sortBy",
        value: sortBy,
      },
      {
        name: "sortDirection",
        value: calculateSortDirection({
          newSortBy: sortBy,
          currentSortBy: filters.sortBy,
          currentSortDirection: filters.sortDirection,
        }),
      },
      {
        name: "page",
        value: "1",
      },
    ];
    await updateFields(items);
  };

  const setSeized = async (seized: CollectionSeized | null): Promise<void> => {
    const items: QueryUpdateInput[] = [
      {
        name: "seized",
        value: seized,
      },
      {
        name: "page",
        value: "1",
      },
    ];
    await updateFields(items);
  };

  const setSzn = async (szn: MemeSeason | null): Promise<void> => {
    const nextInitialSznId = szn?.id ?? null;
    setFilters((prev) => ({
      ...prev,
      szn,
      initialSznId: nextInitialSznId,
      page: 1,
    }));
    const items: QueryUpdateInput[] = [
      {
        name: "collection",
        value: filters.collection,
      },
      {
        name: "seized",
        value: filters.seized,
      },
      {
        name: "szn",
        value: nextInitialSznId?.toString() ?? null,
      },
      {
        name: "page",
        value: "1",
      },
    ];
    await updateFields(items);
  };

  const setSubcollection = async (
    subcollection: string | null
  ): Promise<void> => {
    const items: QueryUpdateInput[] = [
      {
        name: "subcollection",
        value: subcollection,
      },
      {
        name: "page",
        value: "1",
      },
    ];
    await updateFields(items);
  };

  const setPage = async (page: number): Promise<void> => {
    if (page === filters.page) {
      return;
    }

    const items: QueryUpdateInput[] = [
      {
        name: "page",
        value: page.toString(),
      },
    ];
    await updateFields(items);
  };

  useEffect(() => {
    setFilters((prev) => {
      const newFilters = getFilters();
      if (prev.szn && newFilters.initialSznId === prev.szn.id) {
        return { ...newFilters, szn: prev.szn };
      }
      return newFilters;
    });
  }, [searchParams, profile, user, connectedAddress, getFilters]);

  const {
    isFetching,
    isLoading: isInitialLoading,
    data,
  } = useQuery<Page<CollectedCard>>({
    queryKey: [QueryKey.PROFILE_COLLECTED, filters],
    queryFn: async () => {
      const params: Record<string, string> = {
        page: filters.page.toString(),
        page_size: filters.pageSize.toString(),
        sort: filters.sortBy.toLowerCase(),
        sort_direction: filters.sortDirection,
      };

      if (!filters.accountForConsolidations) {
        params["account_for_consolidations"] = "false";
      }

      if (filters.collection) {
        params["collection"] = filters.collection;
      }

      if (filters.seized) {
        params["seized"] = filters.seized;
      }

      if (effectiveSeasonId !== null) {
        params["szn"] = effectiveSeasonId.toString();
      }

      return await commonApiFetch<Page<CollectedCard>>({
        endpoint: `profiles/${filters.handleOrWallet}/collected`,
        params,
      });
    },
    placeholderData: keepPreviousData,
    enabled: filters.collection !== CollectedCollectionType.NETWORK,
  });

  const isNetwork = filters.collection === CollectedCollectionType.NETWORK;
  const {
    data: dataNetwork,
    isLoading: isNetworkLoading,
    isFetching: isNetworkFetching,
  } = useXtdhTokensQuery({
    identity: filters.handleOrWallet,
    page: filters.page,
    pageSize: filters.pageSize,
    sort: filters.sortBy,
    order: filters.sortDirection,
    contract: filters.subcollection,
    enabled: isNetwork,
  });
  const isFetchingData = isNetwork ? isNetworkFetching : isFetching;
  const isLoading = isNetwork ? isNetworkLoading : isInitialLoading;

  const showTransfer =
    !isMobile &&
    !!(
      profile.wallets?.some((w) =>
        areEqualAddresses(w.wallet, connectedAddress)
      ) &&
      data?.data &&
      data.data.length > 0
    );

  const { isFetching: isFetchingTransfer, data: dataTransfer } = useQuery<
    CollectedCard[]
  >({
    queryKey: [QueryKey.PROFILE_COLLECTED_TRANSFER, filters, connectedAddress],
    queryFn: async () => {
      try {
        const allPagesUrl = `${publicEnv.API_ENDPOINT}/api/profiles/${connectedAddress}/collected?page_size=200&seized=${CollectionSeized.SEIZED}&account_for_consolidations=false`;
        return await fetchAllPages<CollectedCard>(allPagesUrl);
      } catch (error) {
        console.error(
          `Failed to fetch transfer data for profile ${connectedAddress}`,
          error
        );
        throw error;
      }
    },
    enabled: showTransfer && transferEnabled,
    placeholderData: keepPreviousData,
  });

  const [totalPages, setTotalPages] = useState<number>(1);

  useEffect(() => {
    if (isFetchingData) return;
    if (isNetwork) {
      // Network tab handles pagination via 'next' property, no total pages count
      return;
    }
    if (!data?.count) {
      setPage(1);
      setTotalPages(1);
      return;
    }
    const pagesCount = Math.ceil(data.count / filters.pageSize);
    if (pagesCount < filters.page) {
      setPage(pagesCount);
      return;
    }
    setTotalPages(pagesCount);
  }, [
    data?.count,
    data?.page,
    isFetchingData,
    isNetwork,
    filters.pageSize,
    filters.page,
  ]);

  const getShowDataRow = (): boolean =>
    filters.collection
      ? COLLECTED_COLLECTIONS_META[filters.collection].showCardDataRow
      : true;

  const [showDataRow, setShowDataRow] = useState<boolean>(getShowDataRow());

  useEffect(() => {
    if (isNetwork) {
      setShowDataRow(false);
    } else {
      setShowDataRow(getShowDataRow());
    }
  }, [filters.collection, isNetwork]);

  const scrollContainer = useRef<HTMLDivElement>(null);

  return (
    <div className="tailwind-scope">
      <UserPageCollectedStats
        profile={profile}
        activeAddress={
          filters.accountForConsolidations ? null : filters.handleOrWallet
        }
        initialStatsData={initialStatsData}
        activeCollection={filters.collection}
        activeSeasonNumber={effectiveSeasonId}
        onCollectionShortcut={setCollectionShortcut}
        onSeasonShortcut={setSeasonShortcut}
      />

      {isLoading ? (
        <div className="tw-mt-6">
          <UserPageCollectedFirstLoading />
        </div>
      ) : (
        <>
          <div ref={scrollContainer} className="tw-mt-6">
            <UserPageCollectedFilters
              profile={profile}
              filters={filters}
              containerRef={scrollContainer}
              setCollection={setCollection}
              setSortBy={setSortBy}
              setSeized={setSeized}
              setSzn={setSzn}
              setSubcollection={setSubcollection}
              showTransfer={showTransfer}
            />
          </div>

          <div className="tw-mt-6 tw-flex tw-gap-6">
            {isNetwork ? (
              <UserPageCollectedNetworkCards
                cards={dataNetwork?.data ?? []}
                page={filters.page}
                setPage={setPage}
                next={dataNetwork?.next ?? false}
              />
            ) : (
              <UserPageCollectedCards
                cards={data?.data ?? []}
                totalPages={totalPages}
                page={filters.page}
                showDataRow={showDataRow}
                filters={filters}
                setPage={setPage}
                dataTransfer={dataTransfer ?? []}
                isTransferLoading={isFetchingTransfer}
              />
            )}
          </div>
          {showTransfer && transferEnabled && (
            <TransferPanel isLoading={isFetchingTransfer} />
          )}
        </>
      )}
    </div>
  );
}

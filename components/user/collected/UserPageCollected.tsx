"use client";

import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import TransferPanel from "@/components/nft-transfer/TransferPanel";
import { useTransfer } from "@/components/nft-transfer/TransferState";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { publicEnv } from "@/config/env";
import {
  CollectedCard,
  CollectedCollectionType,
  CollectionSeized,
  CollectionSort,
} from "@/entities/IProfile";
import { MemeSeason } from "@/entities/ISeason";
import { SortDirection } from "@/entities/ISort";
import { ApiIdentity } from "@/generated/models/ObjectSerializer";
import { areEqualAddresses } from "@/helpers/Helpers";
import { Page } from "@/helpers/Types";
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

export default function UserPageCollected({
  profile,
}: {
  readonly profile: ApiIdentity;
}) {
  const { address: connectedAddress } = useSeizeConnectContext();
  const isMobile = useIsMobileScreen();
  const defaultSortBy = CollectionSort.TOKEN_ID;
  const defaultSortDirection = SortDirection.DESC;
  const defaultSeized = CollectionSeized.SEIZED;
  const PAGE_SIZE = 24;

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const user = params?.user?.toString().toLowerCase() ?? "";

  const convertSeized = ({
    seized,
    collection,
  }: {
    readonly seized: string | null;
    readonly collection: CollectedCollectionType | null;
  }): CollectionSeized | null => {
    if (!collection) return defaultSeized;
    if (!COLLECTED_COLLECTIONS_META[collection].filters.seized)
      return defaultSeized;
    if (!seized) return null;
    return (
      Object.values(CollectionSeized).find((c) => c === seized.toUpperCase()) ??
      null
    );
  };

  const convertSznId = ({
    szn,
    collection,
  }: {
    readonly szn: string | null;
    readonly collection: CollectedCollectionType | null;
  }): number | null => {
    if (!collection) return null;
    if (!COLLECTED_COLLECTIONS_META[collection].filters.szn) return null;
    if (!szn) return null;
    const parsed = Number.parseInt(szn, 10);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const convertCollection = (
    collection: string | null
  ): CollectedCollectionType | null => {
    if (!collection) return null;
    return (
      Object.values(CollectedCollectionType).find(
        (c) => c === collection.toUpperCase()
      ) ?? null
    );
  };

  const convertSortedBy = ({
    sortBy,
    collection,
  }: {
    readonly sortBy: string | null;
    readonly collection: CollectedCollectionType | null;
  }): CollectionSort => {
    if (!sortBy) return defaultSortBy;
    if (
      collection &&
      collection !== CollectedCollectionType.NETWORK &&
      !COLLECTED_COLLECTIONS_META[collection].filters.sort.includes(
        sortBy.toUpperCase() as CollectionSort
      )
    ) {
      return defaultSortBy;
    }
    return (
      Object.values(CollectionSort).find((c) => c === sortBy.toUpperCase()) ??
      defaultSortBy
    );
  };

  const convertSortDirection = (sortDirection: string | null) => {
    if (!sortDirection) return defaultSortDirection;
    return (
      Object.values(SortDirection).find(
        (c) => c === sortDirection.toUpperCase()
      ) ?? defaultSortDirection
    );
  };

  const getFilters = useCallback((): ProfileCollectedFilters => {
    const address = searchParams?.get(SEARCH_PARAMS_FIELDS.address);
    const collection = searchParams?.get(SEARCH_PARAMS_FIELDS.collection);
    const subcollection = searchParams?.get(SEARCH_PARAMS_FIELDS.subcollection);
    const seized = searchParams?.get(SEARCH_PARAMS_FIELDS.seized);
    const szn = searchParams?.get(SEARCH_PARAMS_FIELDS.szn);
    const page = searchParams?.get(SEARCH_PARAMS_FIELDS.page);
    const sortBy = searchParams?.get(SEARCH_PARAMS_FIELDS.sortBy);
    const sortDirection = searchParams?.get(SEARCH_PARAMS_FIELDS.sortDirection);

    const convertedAddress = convertAddressToLowerCase(address);
    const convertedCollection = convertCollection(collection ?? null);
    return {
      handleOrWallet: convertedAddress ?? profile.handle ?? user,
      accountForConsolidations: !convertedAddress,
      collection: convertedCollection,
      subcollection: subcollection ?? null,
      seized: convertSeized({
        seized: seized ?? null,
        collection: convertedCollection,
      }),
      szn: null,
      initialSznId: convertSznId({
        szn: szn ?? null,
        collection: convertedCollection,
      }),
      page: page ? Number.parseInt(page, 10) : 1,
      pageSize: PAGE_SIZE,
      sortBy: convertSortedBy({
        sortBy: sortBy ?? null,
        collection: convertedCollection,
      }),
      sortDirection: convertSortDirection(sortDirection ?? null),
    };
  }, [searchParams, profile.handle, user]);

  const createQueryString = useCallback(
    (updateItems: QueryUpdateInput[]): string => {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      for (const { name, value } of updateItems) {
        const key = SEARCH_PARAMS_FIELDS[name];
        if (!value) {
          params.delete(key);
        } else {
          params.set(key, value.toLowerCase());
        }
      }
      return params.toString();
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

  const { enabled: transferEnabled } = useTransfer();

  const setCollection = async (
    collection: CollectedCollectionType | null
  ): Promise<void> => {
    if (!filters.collection && !collection) return;
    const items: QueryUpdateInput[] = [
      {
        name: "collection",
        value: filters.collection === collection ? null : collection ?? null,
      },
      {
        name: "page",
        value: "1",
      },
      {
        name: "seized",
        value: defaultSeized,
      },
      {
        name: "szn",
        value: null,
      },
      {
        name: "subcollection",
        value: null,
      },
    ];

    const isSwitchingFromNetwork =
      filters.collection === CollectedCollectionType.NETWORK;

    if (
      collection &&
      collection !== CollectedCollectionType.NETWORK &&
      !COLLECTED_COLLECTIONS_META[collection].filters.sort.includes(
        filters.sortBy
      )
    ) {
      items.push({
        name: "sortBy",
        value: CollectionSort.TOKEN_ID,
      });
      items.push({
        name: "sortDirection",
        value: SortDirection.DESC,
      });
    } else if (collection === CollectedCollectionType.NETWORK) {
      items.push({
        name: "sortBy",
        value: CollectionSort.XTDH,
      });
      items.push({
        name: "sortDirection",
        value: SortDirection.DESC,
      });
    } else if (isSwitchingFromNetwork) {
      items.push({
        name: "sortBy",
        value: CollectionSort.TOKEN_ID,
      });
      items.push({
        name: "sortDirection",
        value: SortDirection.DESC,
      });
    }

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
    return defaultSortDirection;
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
    setFilters((prev) => ({ ...prev, szn }));
    const items: QueryUpdateInput[] = [
      {
        name: "szn",
        value: szn ? szn.id.toString() : null,
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
        params.account_for_consolidations = "false";
      }

      if (filters.collection) {
        params.collection = filters.collection;
      }

      if (filters.seized) {
        params.seized = filters.seized;
      }

      if (filters.szn) {
        params.szn = filters.szn.id.toString();
      }

      return await commonApiFetch<Page<CollectedCard>>({
        endpoint: `profiles/${filters.handleOrWallet}/collected`,
        params,
      });
    },
    placeholderData: keepPreviousData,
    enabled: filters.collection !== CollectedCollectionType.NETWORK,
  });

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
  });

  const isNetwork = filters.collection === CollectedCollectionType.NETWORK;
  const isFetchingData = isFetching || isNetworkFetching;
  const isLoading = isInitialLoading || isNetworkLoading;

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
        const allPagesUrl = `${publicEnv.API_ENDPOINT}/api/profiles/${connectedAddress}/collected?page_size=200&seized=${CollectionSeized.SEIZED}`;
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
      {isLoading ? (
        <UserPageCollectedFirstLoading />
      ) : (
        <>
          <div ref={scrollContainer}>
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

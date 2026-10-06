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
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { areEqualAddresses } from "@/helpers/Helpers";
import { buildProfileCollectedReturnPath } from "@/helpers/profile-collected-navigation";
import type { Page } from "@/helpers/Types";
import useIsMobileScreen from "@/hooks/isMobileScreen";
import Button from "@/components/utils/button/Button";
import { t } from "@/i18n/messages";
import { formatInteger } from "@/i18n/format";
import { normalizeLocale } from "@/i18n/locales";
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
import {
  applyQueryUpdateItemsToState,
  convertCollection,
  convertSeized,
  convertSortDirection,
  convertSortedBy,
  convertSznId,
  DEFAULT_SEIZED,
  DEFAULT_SORT_DIRECTION,
  getNormalizedCollectedQueryStateFromFilters,
  normalizePageNumber,
  PAGE_SIZE,
  type ProfileCollectedFilters,
  type QueryUpdateInput,
  SEARCH_PARAMS_FIELDS,
  setCanonicalCollectedQueryParams,
} from "./userPageCollectedQueryState";

export type { ProfileCollectedFilters } from "./userPageCollectedQueryState";

type CollectedHistoryMode = "push" | "replace";

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
  const locale = normalizeLocale(searchParams.get("locale"));
  const collectedReturnTo = buildProfileCollectedReturnPath({
    pathname,
    searchParams: searchParams.toString(),
  });

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
      page: normalizePageNumber(pageParam ? Number.parseInt(pageParam, 10) : 1),
      pageSize: PAGE_SIZE,
      sortBy: convertSortedBy({
        sortBy: sortByParam ?? null,
        collection: convertedCollection,
      }),
      sortDirection: convertSortDirection(sortDirectionParam ?? null),
    };
  }, [searchParams, profile.handle, user]);

  const [filters, setFilters] = useState<ProfileCollectedFilters>(() =>
    getFilters()
  );
  const effectiveSeasonId = filters.szn?.id ?? filters.initialSznId;

  const createQueryString = useCallback(
    (updateItems: QueryUpdateInput[]): string => {
      const queryParams = new URLSearchParams(searchParams.toString());
      const state = applyQueryUpdateItemsToState({
        state: getNormalizedCollectedQueryStateFromFilters(filters),
        updateItems,
      });
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
    [searchParams, filters]
  );

  const updateFields = useCallback(
    async (
      updateItems: QueryUpdateInput[],
      historyMode: CollectedHistoryMode = "push"
    ): Promise<void> => {
      const queryString = createQueryString(updateItems);
      const path = queryString ? pathname + "?" + queryString : pathname;
      if (path) {
        const navigationOptions = { scroll: false };
        if (historyMode === "replace") {
          router.replace(path, navigationOptions);
        } else {
          router.push(path, navigationOptions);
        }
      }
    },
    [pathname, router, createQueryString]
  );

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

  const setPage = async (
    page: number,
    historyMode: CollectedHistoryMode = "push"
  ): Promise<void> => {
    if (page === filters.page) {
      return;
    }

    const items: QueryUpdateInput[] = [
      {
        name: "page",
        value: page.toString(),
      },
    ];
    await updateFields(items, historyMode);
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
    isError: isNativeError,
    refetch: refetchNative,
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
    isError: isNetworkError,
    refetch: refetchNetwork,
  } = useXtdhTokensQuery({
    identity: filters.handleOrWallet,
    page: filters.page,
    pageSize: filters.pageSize,
    sort: filters.sortBy,
    order: filters.sortDirection,
    contract: filters.subcollection,
    enabled: isNetwork,
  });
  const isError = isNetwork ? isNetworkError : isNativeError;
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

  const totalPages = Math.max(1, Math.ceil((data?.count ?? 0) / PAGE_SIZE));

  // The response can invalidate a deep-linked page without any user event.
  /* eslint-disable react-you-might-not-need-an-effect/no-event-handler -- Synchronize the external URL with server pagination, preserving failed-request state. */
  useEffect(() => {
    if (
      !data ||
      isFetchingData ||
      isError ||
      isNetwork ||
      filters.page <= totalPages
    )
      return;
    void updateFields(
      [{ name: "page", value: totalPages.toString() }],
      "replace"
    );
  }, [
    data,
    isFetchingData,
    isError,
    isNetwork,
    filters.page,
    totalPages,
    updateFields,
  ]);
  /* eslint-enable react-you-might-not-need-an-effect/no-event-handler */

  const showDataRow =
    !isNetwork &&
    (filters.collection !== null
      ? COLLECTED_COLLECTIONS_META[filters.collection].showCardDataRow
      : true);

  const clearFilters = () =>
    updateFields([
      { name: "collection", value: null },
      { name: "subcollection", value: null },
      { name: "szn", value: null },
      { name: "seized", value: DEFAULT_SEIZED },
      { name: "address", value: null },
      { name: "sortBy", value: CollectionSort.TOKEN_ID },
      { name: "sortDirection", value: DEFAULT_SORT_DIRECTION },
      { name: "page", value: "1" },
    ]);

  const scrollContainer = useRef<HTMLDivElement>(null);

  const getResultsAnnouncement = () => {
    if (isLoading || isFetchingData) return t(locale, "user.collected.loading");
    if (isError) return t(locale, "user.collected.loadError");
    const count = (isNetwork ? dataNetwork?.data : data?.data)?.length ?? 0;
    return t(locale, "user.collected.results", {
      count: formatInteger(locale, count),
      page: formatInteger(locale, filters.page),
    });
  };

  const renderCards = () => {
    if (isError)
      return (
        <div className="tw-space-y-3 tw-py-8 tw-text-center tw-text-iron-300">
          <p>{t(locale, "user.collected.loadError")}</p>
          <Button
            variant="secondary"
            disabled={isFetchingData}
            onClick={() => {
              void (isNetwork ? refetchNetwork() : refetchNative());
            }}
          >
            {t(locale, "user.collected.retry")}
          </Button>
        </div>
      );
    if (isLoading) return <UserPageCollectedFirstLoading />;
    if (isNetwork)
      return (
        <UserPageCollectedNetworkCards
          cards={dataNetwork?.data ?? []}
          page={filters.page}
          setPage={setPage}
          next={dataNetwork?.next ?? false}
          returnTo={collectedReturnTo}
          locale={locale}
        />
      );
    return (
      <UserPageCollectedCards
        cards={data?.data ?? []}
        totalPages={totalPages}
        page={filters.page}
        showDataRow={showDataRow}
        filters={filters}
        setPage={setPage}
        dataTransfer={dataTransfer ?? []}
        isTransferLoading={isFetchingTransfer}
        locale={locale}
        returnTo={collectedReturnTo}
      />
    );
  };

  return (
    <div className="tailwind-scope">
      <h2 className="tw-mb-3 tw-break-words tw-text-xl tw-font-semibold tw-text-iron-100">
        {t(locale, "user.collected.heading", {
          profile: profile.handle ?? user,
        })}
      </h2>
      <UserPageCollectedStats
        profile={profile}
        activeAddress={
          filters.accountForConsolidations ? null : filters.handleOrWallet
        }
        initialStatsData={initialStatsData}
        autoScrollDetailsOnOpen={isMobile}
        locale={locale}
        activeCollection={filters.collection}
        activeSeasonNumber={effectiveSeasonId}
        onCollectionShortcut={setCollectionShortcut}
        onSeasonShortcut={setSeasonShortcut}
      />

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
          clearFilters={clearFilters}
        />
      </div>

      <output aria-live="polite" aria-atomic="true" className="tw-sr-only">
        {getResultsAnnouncement()}
      </output>
      <div className="tw-mt-6 tw-min-w-0" aria-busy={isFetchingData}>
        {renderCards()}
      </div>
      {showTransfer && transferEnabled && (
        <TransferPanel isLoading={isFetchingTransfer} />
      )}
    </div>
  );
}

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  CollectedCard,
  CollectedCollectionType,
  CollectionSeized,
  CollectionSort,
  IProfileAndConsolidations,
} from "../../../entities/IProfile";
import { commonApiFetch } from "../../../services/api/common-api";
import { Page } from "../../../helpers/Types";
import UserPageCollectedFilters from "./filters/UserPageCollectedFilters";
import { MEMES_SEASON } from "../../../enums";
import { SortDirection } from "../../../entities/ISort";
import { useRouter } from "next/router";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import UserPageCollectedCards from "./cards/UserPageCollectedCards";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import UserPageCollectedFirstLoading from "./UserPageCollectedFirstLoading";

export interface ProfileCollectedFilters {
  readonly handleOrWallet: string;
  readonly accountForConsolidations: boolean;
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

const SHOW_DATA_ROW_COLLECTIONS: CollectedCollectionType[] = [
  CollectedCollectionType.MEMES,
  CollectedCollectionType.GRADIENTS,
];

export default function UserPageCollected({
  profile,
}: {
  readonly profile: IProfileAndConsolidations;
}) {
  const defaultSortBy = CollectionSort.TOKEN_ID;
  const defaultSortDirection = SortDirection.DESC;
  const defaultSeized = CollectionSeized.SEIZED;
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

  const convertSeized = ({
    seized,
    isMemes,
  }: {
    readonly seized: string | null;
    isMemes: boolean;
  }): CollectionSeized | null => {
    if (!isMemes) return defaultSeized;
    if (!seized) return null;
    return (
      Object.values(CollectionSeized).find((c) => c === seized.toUpperCase()) ??
      null
    );
  };

  const convertSzn = ({
    szn,
    isMemes,
  }: {
    readonly szn: string | null;
    readonly isMemes: boolean;
  }): MEMES_SEASON | null => {
    if (!isMemes) return null;
    if (!szn) return null;
    const entry = Object.entries(SNZ_TO_SEARCH_PARAMS).find(
      ([k, v]) => v === szn
    );
    return entry ? (entry[0] as MEMES_SEASON) : null;
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

  const convertSortedBy = (sortBy: string | null): CollectionSort => {
    if (!sortBy) return defaultSortBy;
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

  const getFilters = (): ProfileCollectedFilters => {
    const address = searchParams.get(SEARCH_PARAMS_FIELDS.address);
    const collection = searchParams.get(SEARCH_PARAMS_FIELDS.collection);
    const seized = searchParams.get(SEARCH_PARAMS_FIELDS.seized);
    const szn = searchParams.get(SEARCH_PARAMS_FIELDS.szn);
    const page = searchParams.get(SEARCH_PARAMS_FIELDS.page);
    const sortBy = searchParams.get(SEARCH_PARAMS_FIELDS.sortBy);
    const sortDirection = searchParams.get(SEARCH_PARAMS_FIELDS.sortDirection);

    const convertedAddress = convertAddress(address);
    const convertedCollection = convertCollection(collection);
    const isMemes = convertedCollection === CollectedCollectionType.MEMES;
    return {
      handleOrWallet: convertedAddress ?? profile.profile?.handle ?? user,
      accountForConsolidations: !convertedAddress,
      collection: convertedCollection,
      seized: convertSeized({ seized, isMemes }),
      szn: convertSzn({ szn, isMemes }),
      page: page ? parseInt(page) : 1,
      pageSize: PAGE_SIZE,
      sortBy: convertSortedBy(sortBy),
      sortDirection: convertSortDirection(sortDirection),
    };
  };

  const createQueryString = (updateItems: QueryUpdateInput[]): string => {
    const params = new URLSearchParams(searchParams.toString());
    for (const { name, value } of updateItems) {
      const key = SEARCH_PARAMS_FIELDS[name];
      if (!value) {
        params.delete(key);
      } else {
        params.set(key, value.toLowerCase());
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
    ];

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

  const setSzn = async (szn: MEMES_SEASON | null): Promise<void> => {
    const items: QueryUpdateInput[] = [
      {
        name: "szn",
        value: szn ? SNZ_TO_SEARCH_PARAMS[szn] : null,
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

  useEffect(() => setFilters(getFilters()), [searchParams]);

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
        params.szn = SNZ_TO_SEARCH_PARAMS[filters.szn];
      }
      return await commonApiFetch<Page<CollectedCard>>({
        endpoint: `profiles/${filters.handleOrWallet}/collected`,
        params,
      });
    },
    placeholderData: keepPreviousData,
  });

  const [totalPages, setTotalPages] = useState<number>(1);

  useEffect(() => {
    if (isFetching) return;
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
  }, [data?.count, data?.page, isFetching]);

  const getShowDataRow = (): boolean => {
    if (!filters.collection) return true;
    return SHOW_DATA_ROW_COLLECTIONS.includes(filters.collection);
  };

  const [showDataRow, setShowDataRow] = useState<boolean>(getShowDataRow());

  useEffect(() => {
    setShowDataRow(getShowDataRow());
  }, [filters.collection]);

  const scrollContainer = useRef<HTMLDivElement>(null);

  const calculateScroll = ({
    direction,
    scrollLeft,
    scrollRight,
    scrollStep,
  }: {
    direction: "left" | "right";
    scrollLeft: number;
    scrollRight: number;
    scrollStep: number;
  }): number => {
    switch (direction) {
      case "left":
        return -1 * (scrollLeft > scrollStep ? scrollStep : scrollLeft);
      case "right":
        return scrollRight > scrollStep ? scrollStep : scrollRight;
      default:
        return 0;
    }
  };

  const scrollHorizontally = (direction: "left" | "right") => {
    if (!scrollContainer.current) return;
    const scrollLeft = scrollContainer.current.scrollLeft;
    const scrollWidth = scrollContainer.current.scrollWidth;
    const clientWidth = scrollContainer.current.clientWidth;
    const scrollRight = scrollWidth - scrollLeft - clientWidth;
    const scrollStep = clientWidth / 1.1;

    scrollContainer.current.scrollTo({
      left:
        scrollLeft +
        calculateScroll({ direction, scrollLeft, scrollRight, scrollStep }),
      behavior: "smooth",
    });
  };

  return (
    <div className="tailwind-scope">
      {isInitialLoading ? (
        <UserPageCollectedFirstLoading />
      ) : (
        <>
          <div
            className="tw-overflow-x-auto horizontal-menu-hide-scrollbar horizontal-menu-scrollable-x"
            ref={scrollContainer}
          >
            <UserPageCollectedFilters
              profile={profile}
              filters={filters}
              containerRef={scrollContainer}
              setCollection={setCollection}
              setSortBy={setSortBy}
              setSeized={setSeized}
              setSzn={setSzn}
              scrollHorizontally={scrollHorizontally}
            />
          </div>
          <div className="tw-mt-6">
            <UserPageCollectedCards
              cards={data?.data ?? []}
              totalPages={totalPages}
              page={filters.page}
              showDataRow={showDataRow}
              filters={filters}
              setPage={setPage}
            />
          </div>
        </>
      )}
    </div>
  );
}

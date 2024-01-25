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
import { useEffect, useState } from "react";
import UserPageCollectedCards from "./cards/UserPageCollectedCards";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import CommonTablePagination from "../../utils/CommonTablePagination";
import { watchEvent } from "viem/_types/actions/public/watchEvent";
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

    const isMemes = convertedCollection === CollectedCollectionType.MEMES;

    const convertedSeized =
      seized && isMemes
        ? Object.values(CollectionSeized).find(
            (c) => c === seized.toUpperCase()
          ) ?? defaultSeized
        : defaultSeized;

    const convertedSzn =
      szn && isMemes
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
      accountForConsolidations: !convertedAddress,
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

  const setSortBy = async (sortBy: CollectionSort): Promise<void> => {
    const items: QueryUpdateInput[] = [
      {
        name: "sortBy",
        value: sortBy,
      },
      {
        name: "sortDirection",
        value:
          sortBy === filters.sortBy
            ? filters.sortDirection === SortDirection.ASC
              ? SortDirection.DESC
              : SortDirection.ASC
            : defaultSortDirection,
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

      if (!params.account_for_consolidations) {
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

  return (
    <div className="tailwind-scope">
      {isInitialLoading ? (
        <UserPageCollectedFirstLoading />
      ) : (
        <>
          <UserPageCollectedFilters
            profile={profile}
            filters={filters}
            setCollection={setCollection}
            setSortBy={setSortBy}
            setSeized={setSeized}
            setSzn={setSzn}
          />
          <div className="tw-mt-6 lg:tw-mt-8">
            <UserPageCollectedCards
              cards={data?.data ?? []}
              totalPages={totalPages}
              page={filters.page}
              setPage={setPage}
            />
          </div>
        </>
      )}
    </div>
  );
}

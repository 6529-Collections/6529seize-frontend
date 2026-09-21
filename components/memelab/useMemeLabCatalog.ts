"use client";

import type { Paginated } from "@/components/pagination/Pagination";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { publicEnv } from "@/config/env";
import type { LabExtendedData, LabNFT } from "@/entities/INFT";
import { SortDirection } from "@/entities/ISort";
import { fetchAllPages, fetchUrl } from "@/services/6529api";
import { MemeLabSort } from "@/types/enums";
import { useQuery } from "@tanstack/react-query";

export const MEME_LAB_PAGE_SIZE = 40;

const MEME_LAB_STALE_TIME = 5 * 60 * 1000;
const EMPTY_NFTS: LabNFT[] = [];
const EMPTY_NFT_METAS: LabExtendedData[] = [];
const METADATA_SORTS = new Set<MemeLabSort>([
  MemeLabSort.COLLECTIONS,
  MemeLabSort.HODLERS,
  MemeLabSort.UNIQUE_PERCENT,
  MemeLabSort.UNIQUE_PERCENT_EX_MUSEUM,
]);

function getAgeApiDirection(sortDirection: SortDirection) {
  return sortDirection === SortDirection.ASC
    ? SortDirection.DESC
    : SortDirection.ASC;
}

export function useMemeLabCatalog(
  sort: MemeLabSort,
  sortDirection: SortDirection,
  page: number
) {
  const isAgeSort = sort === MemeLabSort.AGE;
  const needsMetadata = METADATA_SORTS.has(sort);
  const ageApiDirection = getAgeApiDirection(sortDirection);

  const ageQuery = useQuery({
    queryKey: [
      QueryKey.NFTS,
      {
        scope: "meme-lab-catalog-page",
        page,
        pageSize: MEME_LAB_PAGE_SIZE,
        direction: ageApiDirection,
      },
    ],
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(MEME_LAB_PAGE_SIZE),
        sort_direction: ageApiDirection,
      });
      return fetchUrl<Paginated<LabNFT>>(
        `${publicEnv.API_ENDPOINT}/api/nfts_memelab?${params.toString()}`,
        { signal }
      );
    },
    enabled: isAgeSort,
    staleTime: MEME_LAB_STALE_TIME,
  });

  const completeNftsQuery = useQuery({
    queryKey: [QueryKey.NFTS, { scope: "meme-lab-catalog-complete" }],
    queryFn: ({ signal }) =>
      fetchAllPages<LabNFT>(`${publicEnv.API_ENDPOINT}/api/nfts_memelab`, {
        signal,
      }),
    enabled: !isAgeSort,
    staleTime: MEME_LAB_STALE_TIME,
  });

  const metadataQuery = useQuery({
    queryKey: [QueryKey.NFTS, { scope: "meme-lab-catalog-metadata" }],
    queryFn: ({ signal }) =>
      fetchAllPages<LabExtendedData>(
        `${publicEnv.API_ENDPOINT}/api/lab_extended_data`,
        { signal }
      ),
    enabled: !isAgeSort && needsMetadata,
    staleTime: MEME_LAB_STALE_TIME,
  });

  const nfts = isAgeSort
    ? (ageQuery.data?.data ?? EMPTY_NFTS)
    : (completeNftsQuery.data ?? EMPTY_NFTS);
  const nftMetas = needsMetadata
    ? (metadataQuery.data ?? EMPTY_NFT_METAS)
    : EMPTY_NFT_METAS;
  const isLoading = isAgeSort
    ? ageQuery.isPending
    : completeNftsQuery.isPending || (needsMetadata && metadataQuery.isPending);
  const isInitialError = isAgeSort
    ? ageQuery.isError
    : completeNftsQuery.isError || (needsMetadata && metadataQuery.isError);

  const retry = async () => {
    if (isAgeSort) {
      await ageQuery.refetch();
      return;
    }

    const retries: Promise<unknown>[] = [completeNftsQuery.refetch()];
    if (needsMetadata) {
      retries.push(metadataQuery.refetch());
    }
    await Promise.all(retries);
  };

  return {
    nfts,
    nftMetas,
    totalResults: isAgeSort
      ? (ageQuery.data?.count ?? 0)
      : (completeNftsQuery.data?.length ?? 0),
    isLoading,
    isInitialError,
    isRetrying:
      (isAgeSort ? ageQuery.isFetching : completeNftsQuery.isFetching) ||
      (needsMetadata && metadataQuery.isFetching),
    retry,
  };
}

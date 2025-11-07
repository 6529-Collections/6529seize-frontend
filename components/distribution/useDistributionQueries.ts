import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { publicEnv } from "@/config/env";
import { DBResponse } from "@/entities/IDBResponse";
import { Distribution, DistributionPhoto } from "@/entities/IDistribution";
import { fetchAllPages, fetchUrl } from "@/services/6529api";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

interface DistributionDBResponse extends DBResponse {
  data: Distribution[];
}

interface UseDistributionDataParams {
  nftId?: string;
  contract: string;
  page: number;
  searchWallets: string[];
}

export function useDistributionData({
  nftId,
  contract,
  page,
  searchWallets,
}: UseDistributionDataParams) {
  return useQuery<DistributionDBResponse>({
    queryKey: [QueryKey.DISTRIBUTIONS, { nftId, contract, page, searchWallets }],
    queryFn: async () => {
      if (!nftId) {
        throw new Error("Attempted to fetch distributions without an nftId");
      }

      const walletFilter =
        searchWallets.length === 0
          ? ""
          : `&search=${searchWallets
              .map((wallet) => encodeURIComponent(wallet))
              .join(",")}`;

      const url = `${publicEnv.API_ENDPOINT}/api/distributions?card_id=${nftId}&contract=${contract}&page=${page}${walletFilter}`;
      const response = (await fetchUrl(url)) as DistributionDBResponse;
      return response;
    },
    enabled: Boolean(nftId),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  });
}

interface UseDistributionPhotosParams {
  nftId?: string;
  contract: string;
}

export function useDistributionPhotos({
  nftId,
  contract,
}: UseDistributionPhotosParams) {
  return useQuery<DistributionPhoto[]>({
    queryKey: [QueryKey.DISTRIBUTION_PHOTOS, { nftId, contract }],
    queryFn: async () => {
      if (!nftId) {
        throw new Error("Attempted to fetch distribution photos without an nftId");
      }

      const url = `${publicEnv.API_ENDPOINT}/api/distribution_photos/${contract}/${nftId}`;
      return await fetchAllPages<DistributionPhoto>(url);
    },
    enabled: Boolean(nftId),
    staleTime: 5 * 60_000,
  });
}

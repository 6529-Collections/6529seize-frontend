import { useQuery } from "@tanstack/react-query";
import type { NFTWithMemesExtendedData } from "@/entities/INFT";
import { commonApiFetch } from "@/services/api/common-api";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";

const fetchNowMinting = () =>
  commonApiFetch<NFTWithMemesExtendedData>({
    endpoint: "memes_latest",
  });

export const useNowMinting = () => {
  const { data, isFetched, isFetching, isLoading, error } =
    useQuery<NFTWithMemesExtendedData>({
      queryKey: [QueryKey.MEMES_LATEST],
      queryFn: fetchNowMinting,
    });

  return {
    nft: data,
    isFetched,
    isFetching,
    isLoading,
    error,
  };
};

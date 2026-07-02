import { useQuery } from "@tanstack/react-query";
import type { ApiMemesExtendedData } from "@/generated/models/ApiMemesExtendedData";
import { commonApiFetch } from "@/services/api/common-api";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";

const fetchNowMinting = () =>
  commonApiFetch<ApiMemesExtendedData>({
    endpoint: "memes_latest",
  });

export const useNowMinting = () => {
  const { data, isFetched, isFetching, isLoading, error } =
    useQuery<ApiMemesExtendedData>({
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

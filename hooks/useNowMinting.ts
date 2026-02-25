import { useQuery } from "@tanstack/react-query";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { NFTWithMemesExtendedData } from "@/entities/INFT";
import { commonApiFetch } from "@/services/api/common-api";

const fetchNowMinting = () =>
  commonApiFetch<NFTWithMemesExtendedData>({
    endpoint: "memes_latest",
  });

export const useNowMinting = () => {
  const { data, isFetching, error } = useQuery<NFTWithMemesExtendedData>({
    queryKey: [QueryKey.MEMES_LATEST],
    queryFn: fetchNowMinting,
  });

  return {
    nft: data,
    isFetching,
    error,
  };
};

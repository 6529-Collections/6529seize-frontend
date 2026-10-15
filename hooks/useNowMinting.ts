import { useQuery } from "@tanstack/react-query";
import { memesLatestQueryOptions } from "@/services/api/latest-drop-query";

export const useNowMinting = () => {
  const { data, isFetched, isFetching, isLoading, error } = useQuery(
    memesLatestQueryOptions
  );

  return {
    nft: data,
    isFetched,
    isFetching,
    isLoading,
    error,
  };
};

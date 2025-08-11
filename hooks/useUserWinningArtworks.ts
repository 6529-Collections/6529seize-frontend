import { useQueries } from "@tanstack/react-query";
import { ApiDrop } from "../generated/models/ApiDrop";
import { ApiProfileMin } from "../generated/models/ApiProfileMin";
import { commonApiFetch } from "../services/api/common-api";
import { QueryKey } from "../components/react-query-wrapper/ReactQueryWrapper";

interface UseUserWinningArtworksProps {
  readonly user: ApiProfileMin;
  readonly enabled?: boolean;
}

const fetchDrop = async (dropId: string): Promise<ApiDrop> => {
  return commonApiFetch<ApiDrop>({
    endpoint: `drops/${dropId}`,
  });
};

export const useUserWinningArtworks = ({
  user,
  enabled = true,
}: UseUserWinningArtworksProps) => {
  const winnerDropIds = user.winner_main_stage_drop_ids || [];

  const queries = useQueries({
    queries: winnerDropIds.map((dropId) => ({
      queryKey: [QueryKey.DROP, { drop_id: dropId }],
      queryFn: () => fetchDrop(dropId),
      enabled: enabled && winnerDropIds.length > 0,
      staleTime: 5 * 60 * 1000, // 5 minutes
    })),
  });

  const isLoading = queries.some((query) => query.isLoading);
  const isError = queries.some((query) => query.isError);
  const winningDrops = queries
    .filter((query) => query.data)
    .map((query) => query.data as ApiDrop);

  return {
    winningDrops,
    isLoading,
    isError,
    winnerDropIds,
  };
};
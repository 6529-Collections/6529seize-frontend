import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import {
  DROP_BATCH_STALE_TIME_MS,
  fetchDropsByIds,
  orderDropsByIds,
  seedDropCache,
} from "@/services/api/drop-api";

interface UseUserWinningArtworksProps {
  readonly user: ApiProfileMin;
  readonly enabled?: boolean | undefined;
}

export const useUserWinningArtworks = ({
  user,
  enabled = true,
}: UseUserWinningArtworksProps) => {
  const queryClient = useQueryClient();
  const winnerDropIds = user.winner_main_stage_drop_ids;
  const winnerDropIdsKey = winnerDropIds.join(",");

  const { data, isLoading, isError } = useQuery<ApiDrop[]>({
    queryKey: [
      QueryKey.DROP,
      {
        ids: winnerDropIdsKey,
        scope: "user-winning-artworks",
      },
    ],
    queryFn: async () => {
      const drops = await fetchDropsByIds(winnerDropIds);
      seedDropCache(queryClient, drops);
      return orderDropsByIds(winnerDropIds, drops);
    },
    enabled: enabled && winnerDropIds.length > 0,
    staleTime: DROP_BATCH_STALE_TIME_MS,
  });

  const winningDrops = data ?? [];

  return {
    winningDrops,
    isLoading,
    isError,
    winnerDropIds,
  };
};

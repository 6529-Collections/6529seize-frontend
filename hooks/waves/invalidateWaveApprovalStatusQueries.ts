import type { QueryClient } from "@tanstack/react-query";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";

export function invalidateWaveApprovalStatusQueries(
  queryClient: QueryClient,
  waveId: string | null | undefined
): void {
  if (!waveId) {
    return;
  }

  void queryClient.invalidateQueries({
    queryKey: [QueryKey.WAVE, { wave_id: waveId }],
  });
  void queryClient.invalidateQueries({
    queryKey: [QueryKey.WAVE_DECISIONS, { waveId }],
  });
  void queryClient.invalidateQueries({
    queryKey: [QueryKey.DROPS_LEADERBOARD, { waveId }],
  });
  void queryClient.invalidateQueries({
    queryKey: [QueryKey.DROPS, { waveId }],
  });
  void queryClient.invalidateQueries({
    queryKey: [QueryKey.DROP_VOTERS],
  });
  void queryClient.invalidateQueries({
    queryKey: [QueryKey.DROP_VOTE_LOGS],
  });
}

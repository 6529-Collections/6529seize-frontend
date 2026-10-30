import type { QueryClient } from "@tanstack/react-query";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { updateDropInCachedDrops } from "@/components/react-query-wrapper/utils/updateAttachmentInCachedDrops";
import { updateMemesQuickVoteCachedDrop } from "@/hooks/memesQuickVote.query";
import type { ApiDrop } from "@/generated/models/ApiDrop";

export function invalidateWaveApprovalSummaryQueries(
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
}

export function invalidateWaveApprovalStatusQueries(
  queryClient: QueryClient,
  waveId: string | null | undefined
): void {
  if (!waveId) {
    return;
  }

  invalidateWaveApprovalSummaryQueries(queryClient, waveId);
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

export function applyWaveDropVoteUpdate(
  queryClient: QueryClient,
  updatedDrop: ApiDrop,
  waveId: string,
  options: {
    readonly invalidateWaveSummary?: boolean;
    readonly contextProfile?: string | null | undefined;
  } = {}
): void {
  // The API contract returns a complete ApiDrop. Merge defensively so a
  // partial runtime response cannot erase richer cached card fields.
  updateDropInCachedDrops(queryClient, updatedDrop, {
    mergeWithExisting: true,
    clearLargestVote: true,
  });

  updateMemesQuickVoteCachedDrop(
    queryClient,
    updatedDrop,
    options.contextProfile
  );

  void queryClient.invalidateQueries({
    queryKey: [
      QueryKey.DROP,
      { drop_id: updatedDrop.id, view: "vote-summary" },
    ],
    exact: true,
  });

  if (options.invalidateWaveSummary !== false) {
    invalidateWaveApprovalSummaryQueries(queryClient, waveId);
  }

  // Keep the updated leaderboard data in place. Mark its ordering stale so a
  // later natural refetch can reconcile ranks without refetching every loaded
  // page while the voter is still scrolling.
  queryClient
    .invalidateQueries({
      queryKey: [QueryKey.DROPS_LEADERBOARD, { waveId }],
      refetchType: "none",
    })
    .catch(() => undefined);
  queryClient
    .invalidateQueries({
      queryKey: [QueryKey.DROP_VOTERS, { dropId: updatedDrop.id }],
    })
    .catch(() => undefined);
  queryClient
    .invalidateQueries({
      queryKey: [QueryKey.DROP_VOTE_LOGS, { dropId: updatedDrop.id }],
    })
    .catch(() => undefined);
}

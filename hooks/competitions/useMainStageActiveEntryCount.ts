"use client";

import { useAuth } from "@/components/auth/Auth";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import type { ApiCompetition } from "@/generated/models/ApiCompetition";
import { ApiCompetitionCapability } from "@/generated/models/ApiCompetitionCapability";
import type { ApiCompetitionEntryPage } from "@/generated/models/ApiCompetitionEntryPage";
import { ApiCompetitionEntryStatus } from "@/generated/models/ApiCompetitionEntryStatus";
import {
  COMPETITION_ACTIVE_ENTRY_COUNT,
  competitionScope,
  fetchCompetitionResource,
} from "@/services/api/competitions-api";
import { useQuery } from "@tanstack/react-query";
import { useCompetitionViewer } from "./useCompetitionQueries";

type CompetitionForEntryCount = Pick<ApiCompetition, "id" | "wave_id"> &
  Partial<
    Pick<ApiCompetition, "capabilities" | "permissions" | "participation">
  >;

/** Count this viewer's active entries up to the configured submission limit. */
export function useMainStageActiveEntryCount(
  competition: CompetitionForEntryCount | null | undefined,
  enabled: boolean
): number | null | undefined {
  const { connectedProfile, activeProfileProxy } = useAuth();
  const viewer = useCompetitionViewer();
  const profileId = activeProfileProxy?.created_by.id ?? connectedProfile?.id;
  const identity = {
    waveId: competition?.wave_id ?? "",
    competitionId: competition?.id ?? "",
  };
  const mainStage =
    enabled &&
    competition?.capabilities?.includes(ApiCompetitionCapability.MainStage) &&
    competition.permissions?.submit === true
      ? competition
      : null;
  const limit = mainStage?.participation?.max_entries_per_participant ?? null;
  const count = useQuery<number>({
    queryKey: [
      QueryKey.COMPETITION_RESOURCE,
      { ...competitionScope(identity), viewer },
      COMPETITION_ACTIVE_ENTRY_COUNT,
      { profileId, limit },
    ],
    enabled: limit !== null && limit > 0 && !!profileId,
    retry: 1,
    // Recover transient failures while the header is still open.
    refetchInterval: (query) =>
      query.state.status === "error" ? 15_000 : false,
    staleTime: 15_000,
    queryFn: async ({ signal }) => {
      if (limit === null || !profileId)
        throw new Error("Active entry count requires a profile and a limit");

      let active = 0;
      let cursor: string | null = null;
      while (active < limit) {
        const page: ApiCompetitionEntryPage = await fetchCompetitionResource(
          identity,
          "entries",
          {
            status: ApiCompetitionEntryStatus.Active,
            submitter: profileId,
            limit: String(Math.min(limit - active, 100)),
            ...(cursor ? { cursor } : {}),
          },
          signal
        );
        active += page.data.length;
        if (!page.has_more || active >= limit) break;
        if (!page.next_cursor || !page.data.length)
          throw new Error("Incomplete active entry count");
        cursor = page.next_cursor;
      }
      return active;
    },
  });

  if (limit === null) return undefined;
  if (limit === 0) return 0;
  return count.data ?? null;
}

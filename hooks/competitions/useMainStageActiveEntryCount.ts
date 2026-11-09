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

/** Count this viewer's active entries up to the configured submission limit. */
export function useMainStageActiveEntryCount(
  competition: ApiCompetition | null | undefined,
  enabled: boolean
): number | null | undefined {
  const { connectedProfile, activeProfileProxy } = useAuth();
  const viewer = useCompetitionViewer();
  const profileId = activeProfileProxy?.created_by.id ?? connectedProfile?.id;
  const identity = {
    waveId: competition?.wave_id ?? "",
    competitionId: competition?.id ?? "",
  };
  const limit = competition?.participation.max_entries_per_participant ?? null;
  const needsCount =
    enabled &&
    competition?.permissions.submit === true &&
    competition.capabilities.includes(ApiCompetitionCapability.MainStage) &&
    limit !== null;
  const count = useQuery({
    queryKey: [
      QueryKey.COMPETITION_RESOURCE,
      { ...competitionScope(identity), viewer },
      COMPETITION_ACTIVE_ENTRY_COUNT,
      { profileId, limit },
    ],
    enabled: needsCount && !!profileId && limit > 0,
    retry: false,
    staleTime: 15_000,
    queryFn: async ({ signal }) => {
      if (!needsCount || !profileId)
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

  if (!needsCount) return undefined;
  if (limit === 0) return 0;
  return count.isError ? null : (count.data ?? null);
}

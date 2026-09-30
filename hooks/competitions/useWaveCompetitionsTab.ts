"use client";

import type { ApiWave } from "@/generated/models/ApiWave";
import { useEffect } from "react";
import { isMultiCompetitionEnabled } from "@/helpers/competition.helpers";
import { useCompetitionHub, useCompetitionList } from "./useCompetitionQueries";

export function useWaveCompetitionsTab(wave: ApiWave | null | undefined) {
  const enabled =
    isMultiCompetitionEnabled() &&
    Boolean(wave) &&
    !wave?.chat.scope.group?.is_direct_message;
  const waveId = wave?.id ?? "";
  const hub = useCompetitionHub(waveId, enabled);
  const canReadCompetitions = enabled && hub.isSuccess;
  const canCreate = hub.data?.permissions.create_competition === true;
  const competitions = useCompetitionList(
    waveId,
    "all",
    canReadCompetitions && !canCreate
  );
  const active = useCompetitionList(
    waveId,
    "active",
    canReadCompetitions,
    30_000
  );
  const { hasNextPage, isFetching, isError, fetchNextPage } = active;
  useEffect(() => {
    if (canReadCompetitions && hasNextPage && !isFetching && !isError) {
      void fetchNextPage();
    }
  }, [canReadCompetitions, hasNextPage, isFetching, isError, fetchNextPage]);

  return {
    hasCompetitions:
      enabled &&
      (canCreate ||
        competitions.data?.pages.some((page) => page.data.length > 0) === true),
    activeCount:
      canReadCompetitions && active.isSuccess && !hasNextPage
        ? active.data.pages.reduce((count, page) => count + page.data.length, 0)
        : undefined,
  };
}

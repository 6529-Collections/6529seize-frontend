"use client";

import type { ApiWave } from "@/generated/models/ApiWave";
import { useEffect } from "react";
import { isCompetitionAccessError } from "@/helpers/competition.helpers";
import {
  useCompetitionHub,
  useCompetitionList,
  useDefaultCompetition,
} from "./useCompetitionQueries";

export function useWaveCompetitionsTab(wave: ApiWave | null | undefined) {
  const enabled = Boolean(wave) && !wave?.chat.scope.group?.is_direct_message;
  const waveId = wave?.id ?? "";
  const defaultCompetition = useDefaultCompetition(waveId, enabled);
  const hub = useCompetitionHub(waveId, enabled);
  const canReadCompetitions =
    enabled && Boolean(hub.data) && !isCompetitionAccessError(hub.error);
  const canCreate =
    canReadCompetitions && hub.data?.permissions.create_competition === true;
  const canAdminister =
    canReadCompetitions && hub.data?.permissions.administer === true;
  const competitions = useCompetitionList(
    waveId,
    "all",
    canReadCompetitions && !canCreate,
    30_000
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

  const {
    hasNextPage: hasMoreCompetitions,
    isFetching: isFetchingCompetitions,
    isError: isCompetitionsError,
    fetchNextPage: fetchMoreCompetitions,
  } = competitions;
  const competitionIds = new Set(
    competitions.data?.pages.flatMap((page) => page.data.map(({ id }) => id))
  );
  useEffect(() => {
    // Two distinct records already prove that the collection must remain visible.
    if (
      canReadCompetitions &&
      competitionIds.size < 2 &&
      hasMoreCompetitions &&
      !isFetchingCompetitions &&
      !isCompetitionsError
    ) {
      void fetchMoreCompetitions();
    }
  }, [
    canReadCompetitions,
    competitionIds.size,
    hasMoreCompetitions,
    isFetchingCompetitions,
    isCompetitionsError,
    fetchMoreCompetitions,
  ]);
  // Unknown/failed reads cannot expose the collection. Cached visible records
  // keep its classification stable during a transient background failure.
  const hideCompetitionsTab =
    enabled &&
    !canAdminister &&
    !(
      canReadCompetitions &&
      competitionIds.size >= 2 &&
      !isCompetitionAccessError(competitions.error)
    );

  return {
    isPending:
      enabled &&
      (defaultCompetition.isPending ||
        hub.isPending ||
        (canReadCompetitions &&
          !canCreate &&
          (competitions.isPending ||
            (competitionIds.size < 2 && hasMoreCompetitions)))),
    hideCompetitionsTab,
    defaultSelectionEnabled: enabled,
    defaultCompetitionId: !isCompetitionAccessError(defaultCompetition.error)
      ? (defaultCompetition.data?.competition_id ?? null)
      : null,
    hasCompetitions:
      enabled &&
      (canCreate ||
        canAdminister ||
        Boolean(defaultCompetition.data?.competition_id) ||
        competitions.data?.pages.some((page) => page.data.length > 0) === true),
    activeCount:
      canReadCompetitions && active.isSuccess && !hasNextPage
        ? active.data.pages.reduce((count, page) => count + page.data.length, 0)
        : undefined,
  };
}

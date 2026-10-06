"use client";

import type { ApiWave } from "@/generated/models/ApiWave";
import { useAuth } from "@/components/auth/Auth";
import { useEffect } from "react";
import { isMultiCompetitionEnabled } from "@/helpers/competition.helpers";
import {
  useCompetitionHub,
  useCompetitionList,
  useDefaultCompetition,
} from "./useCompetitionQueries";

export function useWaveCompetitionsTab(wave: ApiWave | null | undefined) {
  const { connectedProfile, isAuthenticated } = useAuth();
  const enabled =
    isMultiCompetitionEnabled() &&
    Boolean(wave) &&
    !wave?.chat.scope.group?.is_direct_message;
  const waveId = wave?.id ?? "";
  const defaultCompetition = useDefaultCompetition(waveId, enabled);
  const hub = useCompetitionHub(waveId, enabled);
  const canReadCompetitions = enabled && hub.isSuccess;
  const canCreate = hub.data?.permissions.create_competition === true;
  const canAdminister = hub.data?.permissions.administer === true;
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
  const hideCompetitionsTab = Boolean(
    canReadCompetitions &&
    isAuthenticated === true &&
    connectedProfile?.id &&
    !hub.isFetching &&
    hub.data.permissions.administer === false &&
    competitions.isSuccess &&
    !isFetchingCompetitions &&
    !isCompetitionsError &&
    !hasMoreCompetitions &&
    // A missing next cursor is not proof of completeness: fail open if has_more disagrees.
    competitions.data.pages.at(-1)?.has_more === false &&
    competitionIds.size === 1 &&
    !defaultCompetition.isError &&
    defaultCompetition.isSuccess &&
    !defaultCompetition.isFetching &&
    defaultCompetition.data.competition_id !== null &&
    competitionIds.has(defaultCompetition.data.competition_id)
  );

  return {
    isPending:
      enabled &&
      (defaultCompetition.isPending ||
        hub.isPending ||
        (canReadCompetitions &&
          !canCreate &&
          (competitions.isPending ||
            (competitionIds.size < 2 &&
              (hasMoreCompetitions || isFetchingCompetitions))))),
    hideCompetitionsTab,
    defaultSelectionEnabled: enabled,
    defaultCompetitionId:
      !defaultCompetition.isError && defaultCompetition.isSuccess
        ? defaultCompetition.data.competition_id
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

"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  CompetitionProvider,
  type CompetitionContextValue,
} from "@/contexts/CompetitionContext";
import { CompetitionNavigationContext } from "@/contexts/CompetitionNavigationContext";
import { ApiCompetitionLifecycle } from "@/generated/models/ApiCompetitionLifecycle";
import {
  getCompetitionIdFromPathname,
  isCompetitionAccessError,
} from "@/helpers/competition.helpers";
import { getWaveIdFromPathname } from "@/helpers/navigation.helpers";
import {
  useCompetitionDetail,
  useCompetitionHub,
  useCompetitionViewer,
  useDefaultCompetition,
} from "@/hooks/competitions/useCompetitionQueries";
import { useWaveData } from "@/hooks/useWaveData";

interface CompetitionRouteState {
  readonly waveId: string | null;
  readonly competitionId: string | null;
  readonly viewer: string | null;
  readonly value: CompetitionContextValue | null;
  readonly error: boolean;
  readonly flat: boolean;
  readonly retry: () => void;
}

const CompetitionRouteContext = createContext<CompetitionRouteState | null>(
  null
);

const hasRestoredDefault = (
  selection: ReturnType<typeof useDefaultCompetition>,
  competitionId: string | null
) =>
  !isCompetitionAccessError(selection.error) &&
  selection.data?.competition_id === competitionId &&
  !selection.isFetching &&
  (selection.isFetchedAfterMount || selection.isError);

export function CompetitionRouteProvider({
  children,
}: {
  readonly children: ReactNode;
}) {
  const pathname = usePathname();
  const search = useSearchParams();
  const competitionId = getCompetitionIdFromPathname(pathname);
  const waveId = competitionId ? getWaveIdFromPathname(pathname) : null;
  const enabled = Boolean(waveId && competitionId);
  const restoring = enabled && search.get("restore") === "1";
  const viewer = useCompetitionViewer();
  const wave = useWaveData({ waveId });
  const hub = useCompetitionHub(waveId ?? "", enabled);
  const competition = useCompetitionDetail(
    { waveId: waveId ?? "", competitionId: competitionId ?? "" },
    enabled
  );
  const selection = useDefaultCompetition(waveId ?? "", restoring);
  const restored = !restoring || hasRestoredDefault(selection, competitionId);
  const accessRejected = [wave.error, hub.error, competition.error].some(
    isCompetitionAccessError
  );
  const value = useMemo<CompetitionContextValue | null>(() => {
    if (
      enabled &&
      restored &&
      !accessRejected &&
      wave.data?.id === waveId &&
      hub.data?.id === waveId &&
      competition.data?.wave_id === waveId &&
      competition.data.id === competitionId
    ) {
      return { wave: wave.data, hub: hub.data, competition: competition.data };
    }
    return null;
  }, [
    enabled,
    restored,
    accessRejected,
    wave.data,
    hub.data,
    competition.data,
    waveId,
    competitionId,
  ]);
  const visit = `${waveId ?? ""}:${competitionId ?? ""}:${viewer ?? "anonymous"}`;
  const [presentation, setPresentation] = useState<{
    visit: string;
    flat: boolean | null;
  }>(() => ({ visit, flat: null }));
  const resolvedFlat =
    value?.competition.lifecycle !== ApiCompetitionLifecycle.Draft;
  if (presentation.visit !== visit || (value && presentation.flat === null)) {
    // Classification belongs to this visit; publishing a draft must not replace
    // its mounted editor. The providers and the wave shell stay mounted.
    setPresentation({ visit, flat: value ? resolvedFlat : null });
  }
  const flat =
    enabled &&
    (presentation.visit === visit
      ? (presentation.flat ?? resolvedFlat)
      : resolvedFlat);
  const nativeCompetition =
    value && value.hub.legacy_primary_competition_id !== competitionId
      ? value.competition
      : null;
  const error =
    value === null &&
    (wave.isError ||
      hub.isError ||
      competition.isError ||
      (restoring && selection.isError));
  const refetchWave = wave.refetch;
  const refetchHub = hub.refetch;
  const refetchCompetition = competition.refetch;
  const refetchSelection = selection.refetch;
  const state = useMemo<CompetitionRouteState>(
    () => ({
      waveId,
      competitionId,
      viewer,
      value,
      flat,
      error,
      retry: () => {
        void refetchWave();
        void refetchHub();
        void refetchCompetition();
        if (restoring) void refetchSelection();
      },
    }),
    [
      waveId,
      competitionId,
      viewer,
      value,
      flat,
      error,
      restoring,
      refetchWave,
      refetchHub,
      refetchCompetition,
      refetchSelection,
    ]
  );
  const navigation = useMemo(
    () => ({ flat, nativeCompetition }),
    [flat, nativeCompetition]
  );
  return (
    <CompetitionRouteContext.Provider value={state}>
      <CompetitionProvider value={value}>
        <CompetitionNavigationContext.Provider value={navigation}>
          {children}
        </CompetitionNavigationContext.Provider>
      </CompetitionProvider>
    </CompetitionRouteContext.Provider>
  );
}

export function useCompetitionRoute() {
  const context = useContext(CompetitionRouteContext);
  if (!context) throw new Error("Competition route provider is required");
  return context;
}

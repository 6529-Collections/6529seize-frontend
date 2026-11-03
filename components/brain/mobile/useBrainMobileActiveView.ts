"use client";

import type { ReadonlyURLSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import type { ApiWave } from "@/generated/models/ApiWave";
import { BrainView } from "./brainMobileViews";
import {
  hasWaveDestination,
  getHistoryWaveTab,
  getRememberedTab,
  useWaveTabPreference,
} from "@/hooks/useWaveTabPreference";
import { waveCompetitionTabs } from "@/helpers/default-competition.helpers";
import { isCompetitionPathname } from "@/helpers/competition.helpers";

const GLOBAL_VIEWS = new Set([
  BrainView.DEFAULT,
  BrainView.WAVES,
  BrainView.PROFILE_FEED,
  BrainView.MESSAGES,
  BrainView.NOTIFICATIONS,
]);

const NON_WAVE_VIEWS = new Set([
  BrainView.NOTIFICATIONS,
  BrainView.MESSAGES,
  BrainView.WAVES,
  BrainView.PROFILE_FEED,
]);

const WAVE_TAB_VIEWS: Readonly<Record<string, BrainView>> = {
  chat: BrainView.DEFAULT,
  competitions: BrainView.COMPETITIONS,
  about: BrainView.ABOUT,
  configuration: BrainView.CONFIGURATION,
  leaderboard: BrainView.LEADERBOARD,
  submissions: BrainView.SUBMISSIONS,
  sales: BrainView.SALES,
  winners: BrainView.WINNERS,
  outcome: BrainView.OUTCOME,
  my_votes: BrainView.MY_VOTES,
  polls: BrainView.POLLS,
  faq: BrainView.FAQ,
};

interface UseBrainMobileActiveViewParams {
  readonly firstDecisionDone: boolean;
  readonly isApp: boolean;
  readonly isCompleted: boolean;
  readonly hasAuthenticatedProfile: boolean;
  readonly hasPolls?: boolean | undefined;
  readonly hasCompetitions?: boolean | undefined;
  readonly isCurationWave: boolean;
  readonly isMemesWave: boolean;
  readonly isRankWave: boolean;
  readonly isApproveWave?: boolean | undefined;
  readonly showOutcomeView?: boolean | undefined;
  readonly pathname: string;
  readonly searchParams: ReadonlyURLSearchParams;
  readonly wave: ApiWave | null | undefined;
  readonly waveId: string | null;
  readonly defaultSelectionEnabled?: boolean | undefined;
  readonly restoredView?: BrainView | null | undefined;
}

interface UseBrainMobileActiveViewResult {
  readonly activeView: BrainView;
  readonly onViewChange: (view: BrainView) => void;
}

interface WaveViewState {
  readonly firstDecisionDone: boolean;
  readonly hasAuthenticatedProfile: boolean;
  readonly hasPolls: boolean;
  readonly hasCompetitions: boolean;
  readonly isApproveWave: boolean;
  readonly isCompleted: boolean;
  readonly isCurationWave: boolean;
  readonly isMemesWave: boolean;
  readonly isRankWave: boolean;
  readonly showOutcomeView: boolean;
}

function getRouteDefaultView({
  createParam,
  isApp,
  pathname,
  viewParam,
  waveId,
}: Pick<UseBrainMobileActiveViewParams, "isApp" | "pathname" | "waveId"> & {
  readonly createParam: string | null;
  readonly viewParam: string | null;
}): BrainView | null {
  if (createParam && isApp) {
    return BrainView.DEFAULT;
  }

  if (
    (!waveId && pathname === "/notifications") ||
    (!waveId && viewParam === "notifications")
  ) {
    return BrainView.NOTIFICATIONS;
  }

  if (
    (!waveId && pathname === "/messages") ||
    (!waveId && viewParam === "messages")
  ) {
    return BrainView.MESSAGES;
  }

  if (
    !waveId &&
    isApp &&
    pathname === "/waves" &&
    viewParam === "profile-feed"
  ) {
    return BrainView.PROFILE_FEED;
  }

  if (
    (!waveId && pathname === "/waves") ||
    (!waveId && viewParam === "waves")
  ) {
    return BrainView.WAVES;
  }

  if (pathname === "/" && !waveId && !viewParam) {
    return BrainView.DEFAULT;
  }

  return null;
}

function getWaveViewAvailability({
  firstDecisionDone,
  hasPolls = false,
  hasCompetitions,
  isApproveWave,
  isCompleted,
  isCurationWave,
  isMemesWave,
  isRankWave,
  showOutcomeView,
}: WaveViewState): Partial<Record<BrainView, boolean>> {
  const isCompetitionWave = isRankWave || isApproveWave;

  return {
    [BrainView.COMPETITIONS]: hasCompetitions,
    [BrainView.LEADERBOARD]: isCompetitionWave,
    [BrainView.SUBMISSIONS]: isRankWave && !isApproveWave && isCompleted,
    [BrainView.SALES]: isCurationWave,
    [BrainView.WINNERS]:
      isCompetitionWave && (isApproveWave || firstDecisionDone),
    [BrainView.OUTCOME]:
      isCompetitionWave && !isCurationWave && showOutcomeView,
    [BrainView.MY_VOTES]: isCompetitionWave,
    [BrainView.POLLS]: hasPolls,
    [BrainView.FAQ]: isMemesWave,
  };
}

function normalizeActiveView({
  activeView,
  firstDecisionDone,
  hasWave,
  isCompleted,
  hasAuthenticatedProfile,
  hasPolls,
  hasCompetitions,
  isCurationWave,
  isMemesWave,
  isRankWave,
  isApproveWave = false,
  showOutcomeView = true,
  routeDefaultView,
  wave,
}: {
  readonly activeView: BrainView;
  readonly firstDecisionDone: boolean;
  readonly hasWave: boolean;
  readonly isCompleted: boolean;
  readonly hasAuthenticatedProfile: boolean;
  readonly hasPolls: boolean;
  readonly hasCompetitions: boolean;
  readonly isCurationWave: boolean;
  readonly isMemesWave: boolean;
  readonly isRankWave: boolean;
  readonly isApproveWave?: boolean | undefined;
  readonly showOutcomeView?: boolean | undefined;
  readonly routeDefaultView: BrainView | null;
  readonly wave: ApiWave | null | undefined;
}): BrainView {
  const waveViewState: WaveViewState = {
    firstDecisionDone,
    hasAuthenticatedProfile,
    hasPolls,
    hasCompetitions,
    isApproveWave,
    isCompleted,
    isCurationWave,
    isMemesWave,
    isRankWave,
    showOutcomeView,
  };

  if (!hasWave) {
    if (!GLOBAL_VIEWS.has(activeView)) {
      return routeDefaultView ?? BrainView.DEFAULT;
    }

    return activeView;
  }

  if (!wave) {
    return activeView;
  }

  if (NON_WAVE_VIEWS.has(activeView)) {
    return BrainView.DEFAULT;
  }

  if (
    activeView === BrainView.LEADERBOARD &&
    isRankWave &&
    !isApproveWave &&
    isCompleted
  ) {
    return BrainView.SUBMISSIONS;
  }

  const isCurrentViewAvailable =
    getWaveViewAvailability(waveViewState)[activeView] ?? true;

  return isCurrentViewAvailable ? activeView : BrainView.DEFAULT;
}

interface ActiveViewSelection {
  readonly contextToken: symbol;
  readonly view: BrainView;
}

function getRememberedView(
  remembered: ReturnType<typeof getHistoryWaveTab>,
  searchParams: ReadonlyURLSearchParams,
  defaultSelectionEnabled: boolean
): BrainView | null {
  const savedTab = getRememberedTab(remembered);
  if (
    hasWaveDestination(searchParams) ||
    typeof remembered !== "string" ||
    savedTab === undefined ||
    (defaultSelectionEnabled && waveCompetitionTabs[savedTab])
  )
    return null;
  return WAVE_TAB_VIEWS[savedTab.toLowerCase()] ?? null;
}

export function useBrainMobileActiveView({
  firstDecisionDone,
  isApp,
  isCompleted,
  hasAuthenticatedProfile,
  hasPolls = false,
  hasCompetitions = false,
  isCurationWave,
  isMemesWave,
  isRankWave,
  isApproveWave = false,
  showOutcomeView = true,
  pathname,
  searchParams,
  wave,
  waveId,
  restoredView = null,
  defaultSelectionEnabled = false,
}: UseBrainMobileActiveViewParams): UseBrainMobileActiveViewResult {
  const { tabs } = useWaveTabPreference();
  const [selection, setSelection] = useState<ActiveViewSelection | null>(null);
  const hasWave = Boolean(waveId);
  const isCompetitionRoute = isCompetitionPathname(pathname);
  const viewParam = searchParams.get("view");
  const createParam = searchParams.get("create");
  const serialNoParam = searchParams.get("serialNo");
  const tabParam = searchParams.get("tab");
  const routeDefaultView = getRouteDefaultView({
    createParam,
    isApp,
    pathname,
    viewParam,
    waveId,
  });
  const shellContextKey = `shell:${pathname}:${viewParam ?? ""}`;
  const chatTargetKey = serialNoParam === null ? "" : `serial:${serialNoParam}`;
  const waveTargetKey = isCompetitionRoute
    ? pathname
    : `${chatTargetKey}:${tabParam ?? ""}`;
  const currentContextKey = waveId
    ? `wave:${waveId}:${waveTargetKey}`
    : shellContextKey;
  const currentContextToken = useMemo(
    () => Symbol(currentContextKey),
    [currentContextKey]
  );
  let baseView = routeDefaultView ?? BrainView.DEFAULT;
  if (hasWave) {
    const remembered =
      getHistoryWaveTab(waveId ?? undefined) ??
      (waveId ? tabs[waveId] : undefined);
    const savedView = getRememberedView(
      remembered,
      searchParams,
      defaultSelectionEnabled
    );
    baseView = restoredView ?? savedView ?? BrainView.DEFAULT;
    if (serialNoParam !== null) baseView = BrainView.DEFAULT;
    if (serialNoParam === null && tabParam !== null)
      baseView = WAVE_TAB_VIEWS[tabParam] ?? baseView;
    if (isCompetitionRoute) baseView = BrainView.COMPETITIONS;
  }
  const candidateView =
    selection?.contextToken === currentContextToken ? selection.view : baseView;

  const onViewChange = useCallback(
    (view: BrainView) => {
      setSelection({
        contextToken: currentContextToken,
        view,
      });
    },
    [currentContextToken]
  );

  const activeView = normalizeActiveView({
    activeView: candidateView,
    firstDecisionDone,
    hasWave,
    isCompleted,
    hasAuthenticatedProfile,
    hasPolls,
    hasCompetitions: hasCompetitions || isCompetitionRoute,
    isCurationWave,
    isMemesWave,
    isRankWave,
    isApproveWave,
    showOutcomeView,
    routeDefaultView,
    wave,
  });

  return { activeView, onViewChange };
}

"use client";

import type { ReadonlyURLSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import type { ApiWave } from "@/generated/models/ApiWave";
import { BrainView } from "./brainMobileViews";

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

interface UseBrainMobileActiveViewParams {
  readonly firstDecisionDone: boolean;
  readonly isApp: boolean;
  readonly isCompleted: boolean;
  readonly hasAuthenticatedProfile: boolean;
  readonly hasPolls?: boolean | undefined;
  readonly isCurationWave: boolean;
  readonly isMemesWave: boolean;
  readonly isRankWave: boolean;
  readonly isApproveWave?: boolean | undefined;
  readonly showOutcomeView?: boolean | undefined;
  readonly pathname: string;
  readonly searchParams: ReadonlyURLSearchParams;
  readonly wave: ApiWave | null | undefined;
  readonly waveId: string | null;
}

interface UseBrainMobileActiveViewResult {
  readonly activeView: BrainView;
  readonly onViewChange: (view: BrainView) => void;
}

interface WaveViewState {
  readonly firstDecisionDone: boolean;
  readonly hasAuthenticatedProfile: boolean;
  readonly hasPolls: boolean;
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

function getWaveDefaultView({
  hasLoadedWave,
  isApproveWave,
  isCompleted,
  isRankWave,
}: Pick<WaveViewState, "isApproveWave" | "isCompleted" | "isRankWave"> & {
  readonly hasLoadedWave: boolean;
}): BrainView {
  return hasLoadedWave && isRankWave && !isApproveWave && isCompleted
    ? BrainView.SUBMISSIONS
    : BrainView.DEFAULT;
}

function getWaveViewAvailability({
  firstDecisionDone,
  hasAuthenticatedProfile,
  hasPolls = false,
  isApproveWave,
  isCompleted,
  isCurationWave,
  isMemesWave,
  isRankWave,
  showOutcomeView,
}: WaveViewState): Partial<Record<BrainView, boolean>> {
  const isCompetitionWave = isRankWave || isApproveWave;

  return {
    [BrainView.LEADERBOARD]: isCompetitionWave,
    [BrainView.SUBMISSIONS]: isRankWave && !isApproveWave && isCompleted,
    [BrainView.SALES]: isCurationWave,
    [BrainView.WINNERS]:
      isCompetitionWave && (isApproveWave || firstDecisionDone),
    [BrainView.OUTCOME]:
      isCompetitionWave && !isCurationWave && showOutcomeView,
    [BrainView.MY_VOTES]:
      isCompetitionWave && (isCurationWave || hasAuthenticatedProfile),
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
  readonly isCurationWave: boolean;
  readonly isMemesWave: boolean;
  readonly isRankWave: boolean;
  readonly isApproveWave?: boolean | undefined;
  readonly showOutcomeView?: boolean | undefined;
  readonly routeDefaultView: BrainView | null;
  readonly wave: ApiWave | null | undefined;
}): BrainView {
  const hasLoadedWave = wave !== null && wave !== undefined;
  const waveViewState: WaveViewState = {
    firstDecisionDone,
    hasAuthenticatedProfile,
    hasPolls,
    isApproveWave,
    isCompleted,
    isCurationWave,
    isMemesWave,
    isRankWave,
    showOutcomeView,
  };
  const waveDefaultView = getWaveDefaultView({
    hasLoadedWave,
    isApproveWave,
    isCompleted,
    isRankWave,
  });

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
    waveDefaultView === BrainView.SUBMISSIONS
  ) {
    return BrainView.SUBMISSIONS;
  }

  const isCurrentViewAvailable =
    getWaveViewAvailability(waveViewState)[activeView] ?? true;

  return isCurrentViewAvailable ? activeView : waveDefaultView;
}

interface ActiveViewSelection {
  readonly contextToken: symbol;
  readonly view: BrainView;
}

export function useBrainMobileActiveView({
  firstDecisionDone,
  isApp,
  isCompleted,
  hasAuthenticatedProfile,
  hasPolls = false,
  isCurationWave,
  isMemesWave,
  isRankWave,
  isApproveWave = false,
  showOutcomeView = true,
  pathname,
  searchParams,
  wave,
  waveId,
}: UseBrainMobileActiveViewParams): UseBrainMobileActiveViewResult {
  const [selection, setSelection] = useState<ActiveViewSelection | null>(null);
  const hasWave = Boolean(waveId);
  const viewParam = searchParams.get("view");
  const createParam = searchParams.get("create");
  const routeDefaultView = getRouteDefaultView({
    createParam,
    isApp,
    pathname,
    viewParam,
    waveId,
  });
  const shellContextKey = `shell:${pathname}:${viewParam ?? ""}`;
  const currentContextKey = waveId ? `wave:${waveId}` : shellContextKey;
  const currentContextToken = useMemo(
    () => Symbol(currentContextKey),
    [currentContextKey]
  );
  const hasLoadedWave = wave !== null && wave !== undefined;
  const waveDefaultView = getWaveDefaultView({
    hasLoadedWave: hasWave && hasLoadedWave,
    isApproveWave,
    isCompleted,
    isRankWave,
  });
  const baseView = hasWave
    ? waveDefaultView
    : (routeDefaultView ?? BrainView.DEFAULT);
  const candidateView =
    selection?.contextToken === currentContextToken ? selection.view : baseView;

  const onViewChange = (view: BrainView) => {
    setSelection({
      contextToken: currentContextToken,
      view,
    });
  };

  const activeView = normalizeActiveView({
    activeView: candidateView,
    firstDecisionDone,
    hasWave,
    isCompleted,
    hasAuthenticatedProfile,
    hasPolls,
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

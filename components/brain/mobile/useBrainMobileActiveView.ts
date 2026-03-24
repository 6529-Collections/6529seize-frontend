"use client";

import type { ReadonlyURLSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import type { ApiWave } from "@/generated/models/ApiWave";
import { BrainView } from "./brainMobileViews";

const GLOBAL_VIEWS = new Set([
  BrainView.DEFAULT,
  BrainView.WAVES,
  BrainView.MESSAGES,
  BrainView.NOTIFICATIONS,
]);

const NON_WAVE_VIEWS = new Set([
  BrainView.NOTIFICATIONS,
  BrainView.MESSAGES,
  BrainView.WAVES,
]);

interface UseBrainMobileActiveViewParams {
  readonly firstDecisionDone: boolean;
  readonly isApp: boolean;
  readonly isCompleted: boolean;
  readonly isCurationWave: boolean;
  readonly isMemesWave: boolean;
  readonly isRankWave: boolean;
  readonly pathname: string;
  readonly searchParams: ReadonlyURLSearchParams;
  readonly wave: ApiWave | null | undefined;
  readonly waveId: string | null;
}

interface UseBrainMobileActiveViewResult {
  readonly activeView: BrainView;
  readonly onViewChange: (view: BrainView) => void;
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

function normalizeActiveView({
  activeView,
  firstDecisionDone,
  hasWave,
  isCompleted,
  isCurationWave,
  isMemesWave,
  isRankWave,
  routeDefaultView,
  wave,
}: {
  readonly activeView: BrainView;
  readonly firstDecisionDone: boolean;
  readonly hasWave: boolean;
  readonly isCompleted: boolean;
  readonly isCurationWave: boolean;
  readonly isMemesWave: boolean;
  readonly isRankWave: boolean;
  readonly routeDefaultView: BrainView | null;
  readonly wave: ApiWave | null | undefined;
}): BrainView {
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

  const shouldResetToDefault =
    (activeView === BrainView.LEADERBOARD && (!isRankWave || isCompleted)) ||
    (activeView === BrainView.SALES && !isCurationWave) ||
    (activeView === BrainView.WINNERS && (!isRankWave || !firstDecisionDone)) ||
    (activeView === BrainView.OUTCOME && !isRankWave) ||
    (activeView === BrainView.MY_VOTES && !isMemesWave && !isCurationWave) ||
    (activeView === BrainView.FAQ && !isMemesWave);

  return shouldResetToDefault ? BrainView.DEFAULT : activeView;
}

interface ActiveViewSelection {
  readonly contextToken: symbol;
  readonly view: BrainView;
}

export function useBrainMobileActiveView({
  firstDecisionDone,
  isApp,
  isCompleted,
  isCurationWave,
  isMemesWave,
  isRankWave,
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
  const baseView = hasWave
    ? BrainView.DEFAULT
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
    isCurationWave,
    isMemesWave,
    isRankWave,
    routeDefaultView,
    wave,
  });

  return { activeView, onViewChange };
}

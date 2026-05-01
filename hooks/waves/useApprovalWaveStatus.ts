"use client";

import { useEffect, useMemo, useState } from "react";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiWaveDecision } from "@/generated/models/ApiWaveDecision";
import { Time } from "@/helpers/time";
import {
  FULL_APPROVAL_WAVE_DECISIONS_PAGE_SIZE,
  useWaveDecisions,
} from "@/hooks/waves/useWaveDecisions";
import {
  getApprovalWaveCloseStatus,
  getApprovalWindowEndTime,
  getApprovedDropsCount,
  hasApprovalDecisionCounts,
  isApproveWave,
  type ApprovalWaveCloseStatus,
} from "@/helpers/waves/approve-wave.helpers";

interface UseApprovalWaveStatusParams {
  readonly wave: ApiWave | null | undefined;
  readonly areDecisionPointsComplete?: boolean | undefined;
  /**
   * When defined, decision points are owned by the caller and this hook will
   * not start a second full decision-page load for status checks.
   */
  readonly decisionPoints?: readonly ApiWaveDecision[] | undefined;
}

interface ApprovalWaveStatus {
  readonly winningThreshold: number | null;
  readonly approvedCount: number | null;
  readonly closeStatus: ApprovalWaveCloseStatus;
  readonly isApprovalStatusLoading: boolean;
  readonly isVotingClosed: boolean;
}

const getValidThreshold = (threshold: number | null | undefined) =>
  typeof threshold === "number" && Number.isFinite(threshold) && threshold > 0
    ? threshold
    : null;

const isValidApprovalCount = (
  value: number | null | undefined
): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

const MAX_TIMEOUT_MS = 2_147_483_647;

export function useApprovalWaveStatus({
  areDecisionPointsComplete = false,
  wave,
  decisionPoints,
}: UseApprovalWaveStatusParams): ApprovalWaveStatus {
  const approveWave = isApproveWave(wave);
  const [, setStatusClockTick] = useState(0);
  const currentMillis = Time.currentMillis();
  const hasCallerOwnedDecisionPoints = decisionPoints !== undefined;

  const winningThreshold = useMemo(
    () =>
      approveWave && wave
        ? getValidThreshold(wave.wave.winning_threshold)
        : null,
    [approveWave, wave]
  );

  const providedApprovedCount = useMemo(
    () =>
      approveWave && wave
        ? getApprovedDropsCount({
            areDecisionPointsComplete,
            decisionPoints,
            wave,
          })
        : 0,
    [areDecisionPointsComplete, approveWave, decisionPoints, wave]
  );

  const shouldLoadCompleteDecisionPoints = useMemo(() => {
    if (
      !approveWave ||
      !wave ||
      areDecisionPointsComplete ||
      hasCallerOwnedDecisionPoints
    ) {
      return false;
    }

    if (!isValidApprovalCount(wave.wave.max_winners)) {
      return false;
    }

    if (hasApprovalDecisionCounts(wave)) {
      return false;
    }

    const endTime = getApprovalWindowEndTime(wave);
    if (endTime !== null && currentMillis >= endTime) {
      return false;
    }

    return providedApprovedCount === null;
  }, [
    areDecisionPointsComplete,
    approveWave,
    currentMillis,
    hasCallerOwnedDecisionPoints,
    providedApprovedCount,
    wave,
  ]);

  const {
    decisionPoints: loadedDecisionPoints,
    hasLoadedAllPages: hasLoadedCompleteDecisionPoints,
  } = useWaveDecisions({
    waveId: wave?.id ?? "",
    enabled: shouldLoadCompleteDecisionPoints,
    loadAllPages: true,
    pageSize: FULL_APPROVAL_WAVE_DECISIONS_PAGE_SIZE,
  });

  const approvedCount = useMemo(() => {
    if (!approveWave || !wave) {
      return 0;
    }

    if (providedApprovedCount !== null) {
      return providedApprovedCount;
    }

    return getApprovedDropsCount({
      areDecisionPointsComplete: hasLoadedCompleteDecisionPoints,
      decisionPoints: loadedDecisionPoints,
      wave,
    });
  }, [
    approveWave,
    hasLoadedCompleteDecisionPoints,
    loadedDecisionPoints,
    providedApprovedCount,
    wave,
  ]);

  const closeStatus = useMemo(
    () =>
      approveWave && wave
        ? getApprovalWaveCloseStatus({
            approvedCount,
            now: currentMillis,
            wave,
          })
        : null,
    [approvedCount, approveWave, currentMillis, wave]
  );

  const isApprovalStatusLoading = Boolean(
    approveWave &&
    wave &&
    isValidApprovalCount(wave.wave.max_winners) &&
    !isValidApprovalCount(wave.wave.no_of_decisions_left) &&
    approvedCount === null &&
    closeStatus === null
  );

  useEffect(() => {
    if (!approveWave || !wave || closeStatus !== null) {
      return;
    }

    const endTime = getApprovalWindowEndTime(wave);
    if (endTime === null) {
      return;
    }

    const delay = Math.min(
      Math.max(endTime - currentMillis, 0),
      MAX_TIMEOUT_MS
    );

    const timeoutId = globalThis.setTimeout(() => {
      setStatusClockTick((tick) => tick + 1);
    }, delay);

    return () => {
      globalThis.clearTimeout(timeoutId);
    };
  }, [approveWave, closeStatus, currentMillis, wave]);

  return {
    winningThreshold,
    approvedCount,
    closeStatus,
    isApprovalStatusLoading,
    isVotingClosed: closeStatus !== null || isApprovalStatusLoading,
  };
}

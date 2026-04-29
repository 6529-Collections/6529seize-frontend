"use client";

import { useEffect, useMemo, useState } from "react";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiWaveDecision } from "@/generated/models/ApiWaveDecision";
import { Time } from "@/helpers/time";
import {
  getApprovalWaveCloseStatus,
  getApprovalWindowEndTime,
  getApprovedDropsCount,
  isApproveWave,
  type ApprovalWaveCloseStatus,
} from "@/helpers/waves/approve-wave.helpers";

interface UseApprovalWaveStatusParams {
  readonly wave: ApiWave | null | undefined;
  readonly decisionPoints?: readonly ApiWaveDecision[] | undefined;
}

interface ApprovalWaveStatus {
  readonly winningThreshold: number | null;
  readonly approvedCount: number;
  readonly closeStatus: ApprovalWaveCloseStatus;
  readonly isVotingClosed: boolean;
}

const getValidThreshold = (threshold: number | null | undefined) =>
  typeof threshold === "number" && Number.isFinite(threshold) && threshold > 0
    ? threshold
    : null;

const MAX_TIMEOUT_MS = 2_147_483_647;

export function useApprovalWaveStatus({
  wave,
  decisionPoints,
}: UseApprovalWaveStatusParams): ApprovalWaveStatus {
  const approveWave = isApproveWave(wave);

  const winningThreshold = useMemo(
    () =>
      approveWave && wave
        ? getValidThreshold(wave.wave.winning_threshold)
        : null,
    [approveWave, wave]
  );

  const approvedCount = useMemo(
    () =>
      approveWave && wave
        ? getApprovedDropsCount({
            decisionPoints,
            wave,
          })
        : 0,
    [approveWave, decisionPoints, wave]
  );

  const [, setStatusClockTick] = useState(0);
  const currentMillis = Time.currentMillis();

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
    isVotingClosed: closeStatus !== null,
  };
}

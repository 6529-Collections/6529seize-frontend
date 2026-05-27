import { useEffect, useMemo, useState } from "react";
import { Time } from "@/helpers/time";
import {
  getApprovalCountdownDelayMs,
  getApprovalDropStatus,
  type ApprovalDropStatus,
  type ApprovalDropStatusDrop,
} from "@/helpers/waves/approve-wave.helpers";

const MAX_TIMEOUT_MS = 2_147_483_647;

export function useApprovalDropStatus({
  drop,
  isClosed = false,
  winningThreshold,
  winningThresholdMinDurationMs,
}: {
  readonly drop: ApprovalDropStatusDrop;
  readonly isClosed?: boolean | undefined;
  readonly winningThreshold: number | null | undefined;
  readonly winningThresholdMinDurationMs?: number | null | undefined;
}): ApprovalDropStatus {
  const [, setClockTick] = useState(0);
  const nowMs = Time.currentMillis();
  const status = useMemo(
    () =>
      getApprovalDropStatus({
        drop,
        isClosed,
        nowMs,
        winningThreshold,
        winningThresholdMinDurationMs,
      }),
    [drop, isClosed, nowMs, winningThreshold, winningThresholdMinDurationMs]
  );

  useEffect(() => {
    if (status.kind !== "approving" || status.countdownMs === null) {
      return;
    }

    const delayMs = getApprovalCountdownDelayMs(status.countdownMs);
    if (delayMs === null) {
      return;
    }

    const timeoutId = globalThis.setTimeout(() => {
      setClockTick((tick) => tick + 1);
    }, Math.min(delayMs, MAX_TIMEOUT_MS));

    return () => {
      globalThis.clearTimeout(timeoutId);
    };
  }, [status.countdownMs, status.kind]);

  return status;
}

"use client";

import { useEffect, useMemo, useState } from "react";
import type { ApiWave } from "@/generated/models/ApiWave";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { Time } from "@/helpers/time";
import { calculateTimeLeft } from "@/helpers/waves/time.utils";
import type { ApprovalWaveCloseStatus } from "@/helpers/waves/approve-wave.helpers";
import { getApprovalWindowEndTime } from "@/helpers/waves/approve-wave.helpers";

interface WaveApprovalStatusBarProps {
  readonly approvedCount: number | null;
  readonly closeStatus: ApprovalWaveCloseStatus;
  readonly wave: ApiWave;
}

const formatTimeLeft = (targetTime: number, currentMillis: number): string => {
  const timeLeft = calculateTimeLeft(targetTime, currentMillis);

  if (timeLeft.days > 0) {
    return `${timeLeft.days}d ${timeLeft.hours}h left`;
  }

  if (timeLeft.hours > 0) {
    return `${timeLeft.hours}h ${timeLeft.minutes}m left`;
  }

  return `${timeLeft.minutes}m left`;
};

const getCurrentMillisForStatusRender = (
  _clockTick: number,
  _endTime: number | null,
  _closeStatus: ApprovalWaveCloseStatus
): number => Time.currentMillis();

export default function WaveApprovalStatusBar({
  approvedCount,
  closeStatus,
  wave,
}: WaveApprovalStatusBarProps) {
  const winningThreshold = wave.wave.winning_threshold;
  const maxWinners = wave.wave.max_winners;
  const endTime = getApprovalWindowEndTime(wave);
  const [clockTick, setClockTick] = useState(0);
  const currentMillis = useMemo(
    () => getCurrentMillisForStatusRender(clockTick, endTime, closeStatus),
    [clockTick, endTime, closeStatus]
  );

  useEffect(() => {
    if (closeStatus !== null || endTime === null) {
      return;
    }

    const intervalId = globalThis.setInterval(() => {
      setClockTick((tick) => tick + 1);
    }, 1000);

    return () => {
      globalThis.clearInterval(intervalId);
    };
  }, [closeStatus, endTime]);

  const thresholdLabel =
    typeof winningThreshold === "number" && Number.isFinite(winningThreshold)
      ? formatNumberWithCommas(winningThreshold)
      : "Not set";
  const approvedLabel = (() => {
    if (approvedCount === null) {
      return "Checking";
    }

    if (typeof maxWinners === "number" && Number.isFinite(maxWinners)) {
      const approved = formatNumberWithCommas(approvedCount);
      const max = formatNumberWithCommas(maxWinners);
      return `${approved} / ${max}`;
    }

    return formatNumberWithCommas(approvedCount);
  })();
  let statusLabel: string;
  if (closeStatus === "max_reached") {
    statusLabel = "Max approvals reached";
  } else if (closeStatus === "ended") {
    statusLabel = "Approval window ended";
  } else if (approvedCount === null) {
    statusLabel = "Checking";
  } else if (endTime !== null) {
    statusLabel = formatTimeLeft(endTime, currentMillis);
  } else {
    statusLabel = "Open";
  }

  return (
    <div className="tw-mt-2 tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-px-3 tw-py-3 md:tw-mt-4">
      <div className="tw-grid tw-grid-cols-1 tw-gap-3 sm:tw-grid-cols-3">
        <div>
          <p className="tw-mb-1 tw-text-xs tw-font-medium tw-text-iron-500">
            Threshold
          </p>
          <p className="tw-mb-0 tw-text-sm tw-font-semibold tw-text-iron-100">
            {thresholdLabel}
          </p>
        </div>
        <div>
          <p className="tw-mb-1 tw-text-xs tw-font-medium tw-text-iron-500">
            Approved
          </p>
          <p className="tw-mb-0 tw-text-sm tw-font-semibold tw-text-iron-100">
            {approvedLabel}
          </p>
        </div>
        <div>
          <p className="tw-mb-1 tw-text-xs tw-font-medium tw-text-iron-500">
            Status
          </p>
          <p
            className={`tw-mb-0 tw-text-sm tw-font-semibold ${
              closeStatus === null ? "tw-text-iron-100" : "tw-text-amber-200"
            }`}
          >
            {statusLabel}
          </p>
        </div>
      </div>
    </div>
  );
}

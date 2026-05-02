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
  readonly isApprovalStatusError?: boolean | undefined;
  readonly retryApprovalStatus?: (() => void) | null | undefined;
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
  isApprovalStatusError = false,
  retryApprovalStatus = null,
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
    if (isApprovalStatusError) {
      return "Unavailable";
    }

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
  } else if (isApprovalStatusError) {
    statusLabel = "Unable to check approvals";
  } else if (approvedCount === null) {
    statusLabel = "Checking";
  } else if (endTime !== null) {
    statusLabel = formatTimeLeft(endTime, currentMillis);
  } else {
    statusLabel = "Open";
  }
  let statusTextClassName = "tw-text-amber-200";
  if (isApprovalStatusError) {
    statusTextClassName = "tw-text-rose-200";
  } else if (closeStatus === null) {
    statusTextClassName = "tw-text-iron-100";
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
            className={`tw-mb-0 tw-text-sm tw-font-semibold ${statusTextClassName}`}
          >
            {statusLabel}
          </p>
        </div>
      </div>
      {isApprovalStatusError && (
        <div className="tw-mt-3 tw-flex tw-flex-col tw-gap-2 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between">
          <p className="tw-mb-0 tw-text-xs tw-font-medium tw-text-iron-400">
            Unable to check approval status. Voting and create controls are
            paused until the check succeeds.
          </p>
          {retryApprovalStatus && (
            <button
              type="button"
              onClick={retryApprovalStatus}
              className="tw-inline-flex tw-w-fit tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-600 tw-bg-iron-900 tw-px-3 tw-py-1.5 tw-text-xs tw-font-semibold tw-text-iron-100 tw-transition-colors focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-iron-300 desktop-hover:hover:tw-border-iron-400 desktop-hover:hover:tw-bg-iron-800"
            >
              Try again
            </button>
          )}
        </div>
      )}
    </div>
  );
}

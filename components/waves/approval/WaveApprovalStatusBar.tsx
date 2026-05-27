"use client";

import { type FC, useEffect, useMemo, useState } from "react";
import type { ApiWave } from "@/generated/models/ApiWave";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { Time } from "@/helpers/time";
import { calculateTimeLeft } from "@/helpers/waves/time.utils";
import type { ApprovalWaveCloseStatus } from "@/helpers/waves/approve-wave.helpers";
import { getApprovalWindowEndTime } from "@/helpers/waves/approve-wave.helpers";

interface WaveApprovalStatusBarProps {
  readonly approvedCount: number | null;
  readonly closeStatus: ApprovalWaveCloseStatus;
  readonly isApprovalCountError?: boolean | undefined;
  readonly isApprovalStatusError?: boolean | undefined;
  readonly retryApprovalCount?: (() => void) | null | undefined;
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

const MINUTE_IN_MS = 60 * 1000;
const MINUTES_IN_HOUR = 60;

const formatWinningThresholdMinDuration = (
  durationMs: number | null | undefined
): string => {
  if (
    typeof durationMs !== "number" ||
    !Number.isFinite(durationMs) ||
    durationMs <= 0
  ) {
    return "Immediate";
  }

  const totalMinutes = Math.floor(durationMs / MINUTE_IN_MS);
  if (totalMinutes <= 0) {
    return "<1m";
  }

  const hours = Math.floor(totalMinutes / MINUTES_IN_HOUR);
  const minutes = totalMinutes % MINUTES_IN_HOUR;

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (hours > 0) {
    return `${hours}h`;
  }

  return `${minutes}m`;
};

const getCurrentMillisForStatusRender = (
  _clockTick: number,
  _endTime: number | null,
  _closeStatus: ApprovalWaveCloseStatus
): number => Time.currentMillis();
const approvalStatusErrorMessage =
  "Unable to check approval status. " +
  "Voting and create controls are paused until the check succeeds.";
const approvalCountErrorMessage = "Unable to load approved count.";

interface ApprovalStatusItemProps {
  readonly label: string;
  readonly value: string;
  readonly valueClassName?: string | undefined;
}

const ApprovalStatusItem: FC<ApprovalStatusItemProps> = ({
  label,
  value,
  valueClassName = "tw-text-iron-100",
}) => (
  <div className="tw-inline-flex tw-min-w-0 tw-items-baseline tw-gap-1.5 tw-whitespace-nowrap tw-leading-5">
    <span className="tw-text-xs tw-font-medium tw-text-iron-500">{label}</span>
    <span className={`tw-text-sm tw-font-semibold ${valueClassName}`}>
      {value}
    </span>
  </div>
);

export default function WaveApprovalStatusBar({
  approvedCount,
  closeStatus,
  isApprovalCountError = false,
  isApprovalStatusError = false,
  retryApprovalCount = null,
  retryApprovalStatus = null,
  wave,
}: WaveApprovalStatusBarProps) {
  const winningThreshold = wave.wave.winning_threshold;
  const winningThresholdMinDuration =
    wave.wave.winning_threshold_min_duration_ms;
  const maxWinners = wave.wave.max_winners;
  const endTime = getApprovalWindowEndTime(wave);
  const [clockTick, setClockTick] = useState(0);
  const currentMillis = useMemo(
    () => getCurrentMillisForStatusRender(clockTick, endTime, closeStatus),
    [clockTick, endTime, closeStatus]
  );
  const isCountOnlyError = isApprovalCountError && !isApprovalStatusError;

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
  const thresholdMinDurationLabel = formatWinningThresholdMinDuration(
    winningThresholdMinDuration
  );
  const approvedLabel = (() => {
    if (isApprovalStatusError || isCountOnlyError) {
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
  } else if (approvedCount === null && !isCountOnlyError) {
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
  const errorMessage = (() => {
    if (isApprovalStatusError) {
      return approvalStatusErrorMessage;
    }

    if (isCountOnlyError) {
      return approvalCountErrorMessage;
    }

    return null;
  })();
  const retryError = (() => {
    if (isApprovalStatusError) {
      return retryApprovalStatus;
    }

    if (isCountOnlyError) {
      return retryApprovalCount;
    }

    return null;
  })();

  return (
    <div className="tw-mt-2 tw-flex-none tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-px-3 tw-py-2 md:tw-mt-3">
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-8 tw-gap-y-1">
        <ApprovalStatusItem label="Threshold" value={thresholdLabel} />
        <ApprovalStatusItem
          label="Min time"
          value={thresholdMinDurationLabel}
        />
        <ApprovalStatusItem label="Approved" value={approvedLabel} />
        <ApprovalStatusItem
          label="Status"
          value={statusLabel}
          valueClassName={statusTextClassName}
        />
      </div>
      {errorMessage && (
        <div className="tw-mt-3 tw-flex tw-flex-col tw-gap-2 sm:tw-flex-row sm:tw-items-center sm:tw-justify-between">
          <p className="tw-mb-0 tw-text-xs tw-font-medium tw-text-iron-400">
            {errorMessage}
          </p>
          {retryError && (
            <button
              type="button"
              onClick={retryError}
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

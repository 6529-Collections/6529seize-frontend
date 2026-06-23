"use client";

import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  type FC,
  type ReactNode,
  useEffect,
  useId,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import HoverCard from "@/components/utils/tooltip/HoverCard";
import type { ApiWave } from "@/generated/models/ApiWave";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { Time } from "@/helpers/time";
import { calculateTimeLeft } from "@/helpers/waves/time.utils";
import type { ApprovalWaveCloseStatus } from "@/helpers/waves/approve-wave.helpers";
import { getApprovalWindowEndTime } from "@/helpers/waves/approve-wave.helpers";
import { WAVE_VOTING_LABELS } from "@/helpers/waves/waves.constants";
import useDeviceInfo from "@/hooks/useDeviceInfo";

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

const formatDurationCore = (
  durationMs: number | null | undefined
): string | null => {
  if (
    typeof durationMs !== "number" ||
    !Number.isFinite(durationMs) ||
    durationMs <= 0
  ) {
    return null;
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

const formatWinningThresholdMinDuration = (
  durationMs: number | null | undefined
): string => formatDurationCore(durationMs) ?? "Immediate";

const formatTimeWeightedDuration = (
  durationMs: number | null | undefined
): string | null => formatDurationCore(durationMs);

const getCurrentMillisForStatusRender = (
  _clockTick: number,
  _endTime: number | null,
  _closeStatus: ApprovalWaveCloseStatus
): number => Time.currentMillis();
const approvalStatusErrorMessage =
  "Unable to check approval status. " +
  "Voting and create controls are paused until the check succeeds.";
const approvalCountErrorMessage = "Unable to load approved count.";
const APPROVAL_RULES_TITLE = "Approval rules";
const FALLBACK_CREDIT_LABEL = "credit";
const subscribeToClientRender = () => () => {};
const getClientRenderSnapshot = () => true;
const getServerRenderSnapshot = () => false;

interface ApprovalStatusItemProps {
  readonly label: string;
  readonly value: string;
  readonly valueClassName?: string | undefined;
  readonly withSeparator?: boolean | undefined;
}

const ApprovalStatusItem: FC<ApprovalStatusItemProps> = ({
  label,
  value,
  valueClassName = "tw-text-iron-100",
  withSeparator = false,
}) => (
  <div
    className={`tw-flex tw-min-w-0 tw-items-baseline tw-gap-1.5 tw-text-left tw-leading-5 ${
      withSeparator
        ? "md:tw-border-0 md:tw-border-l md:tw-border-solid md:tw-border-iron-700 md:tw-pl-3"
        : ""
    }`}
  >
    <span className="tw-shrink-0 tw-whitespace-nowrap tw-text-xs tw-font-medium tw-text-iron-500">
      {label}
    </span>{" "}
    <span
      className={`tw-min-w-0 tw-text-sm tw-font-semibold ${valueClassName}`}
    >
      {value}
    </span>
  </div>
);

interface ApprovalRulesHelpProps {
  readonly creditNoun: string;
  readonly holdTimeLabel: string;
  readonly isTimeWeighted: boolean;
  readonly scoringDurationLabel: string | null;
  readonly requiresHoldTime: boolean;
  readonly thresholdIsSet: boolean;
  readonly thresholdLabel: string;
}

const getApprovalThresholdRuleText = ({
  creditNoun,
  holdTimeLabel,
  isTimeWeighted,
  requiresHoldTime,
  thresholdLabel,
}: Pick<
  ApprovalRulesHelpProps,
  | "creditNoun"
  | "holdTimeLabel"
  | "isTimeWeighted"
  | "requiresHoldTime"
  | "thresholdLabel"
>): ReactNode => {
  if (isTimeWeighted && requiresHoldTime) {
    return (
      <>
        A drop is approved when its time-weighted score reaches {thresholdLabel}{" "}
        {creditNoun} and keeps at least that much credit for {holdTimeLabel}.
      </>
    );
  }

  if (isTimeWeighted) {
    return (
      <>
        A drop is approved when its time-weighted score reaches {thresholdLabel}{" "}
        {creditNoun}.
      </>
    );
  }

  if (requiresHoldTime) {
    return (
      <>
        A drop is approved when it reaches {thresholdLabel} {creditNoun} and
        keeps at least that much credit for {holdTimeLabel}.
      </>
    );
  }

  return (
    <>
      A drop is approved as soon as it reaches {thresholdLabel} {creditNoun}.
    </>
  );
};

const getVoteScoringDescription = (
  isTimeWeighted: boolean,
  scoringDurationLabel: string | null
): ReactNode => {
  if (isTimeWeighted && scoringDurationLabel !== null) {
    return (
      <>
        Approval uses a {scoringDurationLabel} average. New votes gain influence
        gradually, so votes given now can be higher than the approval score.
      </>
    );
  }

  return <>Votes count immediately in the approval score.</>;
};

const ApprovalRulesHelp: FC<ApprovalRulesHelpProps> = ({
  creditNoun,
  holdTimeLabel,
  isTimeWeighted,
  scoringDurationLabel,
  requiresHoldTime,
  thresholdIsSet,
  thresholdLabel,
}) => (
  <div className="tw-w-80 tw-max-w-[calc(100vw-2rem)] tw-text-sm tw-leading-5 tw-text-iron-200">
    <div className="tw-space-y-2">
      {thresholdIsSet ? (
        <p className="tw-mb-0">
          This wave uses {creditNoun}.{" "}
          {getApprovalThresholdRuleText({
            creditNoun,
            holdTimeLabel,
            isTimeWeighted,
            requiresHoldTime,
            thresholdLabel,
          })}
        </p>
      ) : (
        <p className="tw-mb-0">This wave has no credit threshold set yet.</p>
      )}
    </div>

    <dl className="tw-mb-0 tw-mt-4 tw-space-y-3">
      <div>
        <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-500">
          Credit needed
        </dt>
        <dd className="tw-mb-0 tw-mt-1 tw-text-iron-200">
          How much {creditNoun} a drop must reach before it can be approved.
        </dd>
      </div>
      <div>
        <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-500">
          Vote scoring
        </dt>
        <dd className="tw-mb-0 tw-mt-1 tw-text-iron-200">
          {getVoteScoringDescription(isTimeWeighted, scoringDurationLabel)}
        </dd>
      </div>
      <div>
        <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-500">
          Hold time
        </dt>
        <dd className="tw-mb-0 tw-mt-1 tw-text-iron-200">
          How long a drop must stay at or above the credit needed. If it falls
          below, the timer starts again.
        </dd>
      </div>
      <div>
        <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-500">
          Approved drops
        </dt>
        <dd className="tw-mb-0 tw-mt-1 tw-text-iron-200">
          How many drops are already approved. If there is a cap, this shows
          approved / max.
        </dd>
      </div>
      <div>
        <dt className="tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-500">
          Approval window
        </dt>
        <dd className="tw-mb-0 tw-mt-1 tw-text-iron-200">
          Open means drops can still be approved. It closes when the end time
          passes or the max approvals are reached.
        </dd>
      </div>
    </dl>
  </div>
);

interface ApprovalRulesButtonProps {
  readonly "aria-controls"?: string | undefined;
  readonly "aria-expanded"?: boolean | undefined;
  readonly "aria-haspopup"?: "dialog" | undefined;
  readonly onClick?: (() => void) | undefined;
}

const ApprovalRulesButton: FC<ApprovalRulesButtonProps> = ({
  "aria-controls": ariaControls,
  "aria-expanded": ariaExpanded,
  "aria-haspopup": ariaHasPopup,
  onClick,
}) => (
  <button
    type="button"
    aria-label={APPROVAL_RULES_TITLE}
    aria-controls={ariaControls}
    aria-expanded={ariaExpanded}
    aria-haspopup={ariaHasPopup}
    onClick={onClick}
    className="tw-inline-flex tw-size-6 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-p-0 tw-text-iron-400 tw-transition-colors focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-iron-300 desktop-hover:hover:tw-border-iron-500 desktop-hover:hover:tw-text-iron-200"
  >
    <FontAwesomeIcon icon={faInfoCircle} className="tw-size-3.5" />
  </button>
);

const formatWinningThreshold = (
  winningThreshold: number | null | undefined
): string => {
  if (
    typeof winningThreshold === "number" &&
    Number.isFinite(winningThreshold)
  ) {
    return formatNumberWithCommas(winningThreshold);
  }

  return "Not set";
};

const getCreditLabel = (
  creditType: ApiWave["voting"]["credit_type"]
): string => {
  const votingLabels: Partial<
    Record<ApiWave["voting"]["credit_type"], string>
  > = WAVE_VOTING_LABELS;

  return votingLabels[creditType] ?? FALLBACK_CREDIT_LABEL;
};

const getCreditNoun = (creditLabel: string): string => {
  if (creditLabel === FALLBACK_CREDIT_LABEL) {
    return FALLBACK_CREDIT_LABEL;
  }

  return `${creditLabel} credit`;
};

const getThresholdValueLabel = (
  thresholdIsSet: boolean,
  thresholdLabel: string,
  creditLabel: string
): string => {
  if (thresholdIsSet) {
    return `${thresholdLabel} ${creditLabel}`;
  }

  return thresholdLabel;
};

interface ApprovedLabelArgs {
  readonly approvedCount: number | null;
  readonly isApprovalStatusError: boolean;
  readonly isCountOnlyError: boolean;
  readonly maxWinners: number | null | undefined;
}

const getApprovedLabel = ({
  approvedCount,
  isApprovalStatusError,
  isCountOnlyError,
  maxWinners,
}: ApprovedLabelArgs): string => {
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
};

interface ApprovalStatusLabelArgs {
  readonly approvedCount: number | null;
  readonly closeStatus: ApprovalWaveCloseStatus;
  readonly currentMillis: number;
  readonly endTime: number | null;
  readonly isApprovalStatusError: boolean;
  readonly isCountOnlyError: boolean;
}

const getApprovalStatusLabel = ({
  approvedCount,
  closeStatus,
  currentMillis,
  endTime,
  isApprovalStatusError,
  isCountOnlyError,
}: ApprovalStatusLabelArgs): string => {
  if (closeStatus === "max_reached") {
    return "Max approvals reached";
  }

  if (closeStatus === "ended") {
    return "Approval window ended";
  }

  if (isApprovalStatusError) {
    return "Unable to check approvals";
  }

  if (approvedCount === null && !isCountOnlyError) {
    return "Checking";
  }

  if (endTime !== null) {
    return formatTimeLeft(endTime, currentMillis);
  }

  return "Open";
};

const getApprovalStatusTextClassName = (
  isApprovalStatusError: boolean,
  closeStatus: ApprovalWaveCloseStatus
): string => {
  if (isApprovalStatusError) {
    return "tw-text-rose-200";
  }

  if (closeStatus === null) {
    return "tw-text-iron-100";
  }

  return "tw-text-amber-200";
};

const getApprovalErrorMessage = (
  isApprovalStatusError: boolean,
  isCountOnlyError: boolean
): string | null => {
  if (isApprovalStatusError) {
    return approvalStatusErrorMessage;
  }

  if (isCountOnlyError) {
    return approvalCountErrorMessage;
  }

  return null;
};

const getRetryError = ({
  isApprovalStatusError,
  isCountOnlyError,
  retryApprovalCount,
  retryApprovalStatus,
}: Pick<
  WaveApprovalStatusBarProps,
  "retryApprovalCount" | "retryApprovalStatus"
> & {
  readonly isApprovalStatusError: boolean;
  readonly isCountOnlyError: boolean;
}): (() => void) | null | undefined => {
  if (isApprovalStatusError) {
    return retryApprovalStatus;
  }

  if (isCountOnlyError) {
    return retryApprovalCount;
  }

  return null;
};

export default function WaveApprovalStatusBar({
  approvedCount,
  closeStatus,
  isApprovalCountError = false,
  isApprovalStatusError = false,
  retryApprovalCount = null,
  retryApprovalStatus = null,
  wave,
}: WaveApprovalStatusBarProps) {
  const { hasTouchScreen } = useDeviceInfo();
  const isClientHydrated = useSyncExternalStore(
    subscribeToClientRender,
    getClientRenderSnapshot,
    getServerRenderSnapshot
  );
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const approvalRulesHelpId = useId();
  const winningThreshold = wave.wave.winning_threshold;
  const winningThresholdMinDuration =
    wave.wave.winning_threshold_min_duration_ms;
  const timeWeightedDurationLabel = formatTimeWeightedDuration(
    wave.wave.time_lock_ms
  );
  const isTimeWeighted = timeWeightedDurationLabel !== null;
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

  const thresholdLabel = formatWinningThreshold(winningThreshold);
  const thresholdIsSet = thresholdLabel !== "Not set";
  const thresholdMinDurationLabel = formatWinningThresholdMinDuration(
    winningThresholdMinDuration
  );
  const requiresHoldTime =
    typeof winningThresholdMinDuration === "number" &&
    Number.isFinite(winningThresholdMinDuration) &&
    winningThresholdMinDuration > 0;
  const creditLabel = getCreditLabel(wave.voting.credit_type);
  const creditNoun = getCreditNoun(creditLabel);
  const thresholdValueLabel = getThresholdValueLabel(
    thresholdIsSet,
    thresholdLabel,
    creditLabel
  );
  const approvedLabel = getApprovedLabel({
    approvedCount,
    isApprovalStatusError,
    isCountOnlyError,
    maxWinners,
  });
  const statusLabel = getApprovalStatusLabel({
    approvedCount,
    closeStatus,
    currentMillis,
    endTime,
    isApprovalStatusError,
    isCountOnlyError,
  });
  const statusTextClassName = getApprovalStatusTextClassName(
    isApprovalStatusError,
    closeStatus
  );
  const errorMessage = getApprovalErrorMessage(
    isApprovalStatusError,
    isCountOnlyError
  );
  const retryError = getRetryError({
    isApprovalStatusError,
    isCountOnlyError,
    retryApprovalCount,
    retryApprovalStatus,
  });
  const approvalRulesHelp = (
    <ApprovalRulesHelp
      creditNoun={creditNoun}
      holdTimeLabel={thresholdMinDurationLabel}
      isTimeWeighted={isTimeWeighted}
      scoringDurationLabel={timeWeightedDurationLabel}
      requiresHoldTime={requiresHoldTime}
      thresholdIsSet={thresholdIsSet}
      thresholdLabel={thresholdLabel}
    />
  );
  const useMobileHelp = isClientHydrated && hasTouchScreen;
  const approvalRulesButton = useMobileHelp ? (
    <ApprovalRulesButton
      aria-controls={isHelpOpen ? approvalRulesHelpId : undefined}
      aria-expanded={isHelpOpen}
      aria-haspopup="dialog"
      onClick={() => setIsHelpOpen(true)}
    />
  ) : (
    <HoverCard
      content={approvalRulesHelp}
      ariaLabel={APPROVAL_RULES_TITLE}
      placement="left"
      delayShow={300}
      delayHide={0}
      offset={8}
    >
      <ApprovalRulesButton aria-haspopup="dialog" />
    </HoverCard>
  );

  return (
    <div className="tw-mt-2 tw-flex tw-flex-none tw-items-stretch tw-gap-2 md:tw-mt-3">
      <div
        role="group"
        aria-label="Approval status"
        className="tw-min-w-0 tw-flex-1 tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-px-3 tw-py-2"
      >
        <div className="tw-grid tw-grid-cols-2 tw-items-center tw-gap-x-3 tw-gap-y-1 md:tw-flex md:tw-flex-wrap md:tw-gap-x-3">
          <ApprovalStatusItem
            label="Credit needed"
            value={thresholdValueLabel}
          />
          <ApprovalStatusItem
            label="Hold time"
            value={thresholdMinDurationLabel}
            withSeparator
          />
          <ApprovalStatusItem
            label="Approved drops"
            value={approvedLabel}
            withSeparator
          />
          <ApprovalStatusItem
            label="Approval window"
            value={statusLabel}
            valueClassName={statusTextClassName}
            withSeparator
          />
        </div>
        {timeWeightedDurationLabel !== null && (
          <p className="tw-mb-0 tw-mt-2 tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-2 tw-text-xs tw-font-medium tw-leading-5 tw-text-iron-400">
            Time-weighted scoring is on: approval uses a{" "}
            {timeWeightedDurationLabel} average, not the raw votes-given-now{" "}
            total.
          </p>
        )}
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
      <div className="tw-flex tw-shrink-0 tw-items-center">
        {approvalRulesButton}
      </div>
      {useMobileHelp && (
        <MobileWrapperDialog
          isOpen={isHelpOpen}
          onClose={() => setIsHelpOpen(false)}
          title={APPROVAL_RULES_TITLE}
        >
          <div id={approvalRulesHelpId} className="tw-px-4 tw-pb-2 tw-pt-3">
            {approvalRulesHelp}
          </div>
        </MobileWrapperDialog>
      )}
    </div>
  );
}

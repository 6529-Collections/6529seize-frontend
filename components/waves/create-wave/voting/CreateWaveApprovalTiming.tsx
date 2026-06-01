import type { TimeWeightedVotingConfig } from "./types";

export enum CreateWaveApprovalTimingMode {
  IMMEDIATE = "IMMEDIATE",
  THRESHOLD_TIME = "THRESHOLD_TIME",
  TIME_WEIGHTED = "TIME_WEIGHTED",
}

const APPROVAL_TIMING_OPTIONS: readonly {
  readonly mode: CreateWaveApprovalTimingMode;
  readonly label: string;
  readonly description: string;
}[] = [
  {
    mode: CreateWaveApprovalTimingMode.IMMEDIATE,
    label: "Immediate",
    description: "Approve as soon as the threshold is reached.",
  },
  {
    mode: CreateWaveApprovalTimingMode.THRESHOLD_TIME,
    label: "Minimum time",
    description: "Require the score to stay above the threshold.",
  },
  {
    mode: CreateWaveApprovalTimingMode.TIME_WEIGHTED,
    label: "Time-weighted",
    description: "Use an averaged vote count over time.",
  },
];

export const getCreateWaveApprovalTimingMode = ({
  thresholdTimeMs,
  timeWeighted,
}: {
  readonly thresholdTimeMs: number | null;
  readonly timeWeighted: TimeWeightedVotingConfig;
}): CreateWaveApprovalTimingMode => {
  if (timeWeighted.enabled) {
    return CreateWaveApprovalTimingMode.TIME_WEIGHTED;
  }

  if (thresholdTimeMs !== null && Number.isFinite(thresholdTimeMs)) {
    return CreateWaveApprovalTimingMode.THRESHOLD_TIME;
  }

  return CreateWaveApprovalTimingMode.IMMEDIATE;
};

export default function CreateWaveApprovalTiming({
  selectedMode,
  errorMessage,
  onModeChange,
}: {
  readonly selectedMode: CreateWaveApprovalTimingMode;
  readonly errorMessage?: string | undefined;
  readonly onModeChange: (mode: CreateWaveApprovalTimingMode) => void;
}) {
  const hasError = errorMessage !== undefined;
  const errorId = "approval-timing-error";

  return (
    <fieldset
      className="tw-mt-6 tw-border-0 tw-p-0"
      aria-describedby={hasError ? errorId : undefined}
    >
      <legend
        className={`tw-mb-3 tw-block tw-text-sm tw-font-semibold ${
          hasError ? "tw-text-error" : "tw-text-iron-100"
        }`}
      >
        Approval timing
      </legend>
      <div className="tw-grid tw-grid-cols-1 tw-gap-3 md:tw-grid-cols-3">
        {APPROVAL_TIMING_OPTIONS.map((option) => {
          const selected = selectedMode === option.mode;
          return (
            <label
              key={option.mode}
              className={`tw-flex tw-cursor-pointer tw-gap-x-3 tw-rounded-xl tw-border tw-border-solid tw-p-4 tw-ring-1 tw-ring-inset tw-transition tw-duration-300 tw-ease-out ${
                selected
                  ? "tw-border-primary-400 tw-bg-primary-500/5 tw-ring-primary-500/30"
                  : "tw-border-white/5 tw-bg-iron-900 tw-ring-white/5 hover:tw-border-white/10 hover:tw-bg-iron-800 hover:tw-ring-white/10"
              }`}
            >
              <input
                type="radio"
                name="approval-timing-mode"
                value={option.mode}
                checked={selected}
                onChange={() => onModeChange(option.mode)}
                className="tw-mt-1 tw-form-radio tw-h-4 tw-w-4 tw-cursor-pointer tw-border tw-border-solid tw-border-iron-650 tw-bg-iron-800 tw-text-primary-400 tw-ring-offset-iron-800 tw-transition tw-duration-300 tw-ease-out focus:tw-ring-2 focus:tw-ring-primary-400"
              />
              <span className="tw-min-w-0">
                <span
                  className={`tw-block tw-text-sm tw-font-semibold ${
                    selected ? "tw-text-primary-400" : "tw-text-iron-200"
                  }`}
                >
                  {option.label}
                </span>
                <span className="tw-mt-1 tw-block tw-text-xs tw-font-medium tw-leading-5 tw-text-iron-400">
                  {option.description}
                </span>
              </span>
            </label>
          );
        })}
      </div>
      {hasError && (
        <p
          id={errorId}
          className="tw-mb-0 tw-mt-2 tw-text-xs tw-font-medium tw-text-error"
          role="alert"
        >
          {errorMessage}
        </p>
      )}
    </fieldset>
  );
}

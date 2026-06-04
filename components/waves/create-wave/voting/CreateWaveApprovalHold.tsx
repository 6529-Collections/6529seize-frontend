export enum CreateWaveApprovalHoldMode {
  NONE = "NONE",
  HOLD = "HOLD",
}

const APPROVAL_HOLD_OPTIONS: readonly {
  readonly mode: CreateWaveApprovalHoldMode;
  readonly label: string;
  readonly description: string;
}[] = [
  {
    mode: CreateWaveApprovalHoldMode.NONE,
    label: "No hold",
    description: "Approve as soon as the score reaches the threshold.",
  },
  {
    mode: CreateWaveApprovalHoldMode.HOLD,
    label: "Require hold time",
    description: "Require the score to stay at or above the threshold.",
  },
];

export const getCreateWaveApprovalHoldMode = ({
  thresholdTimeMs,
}: {
  readonly thresholdTimeMs: number | null;
}): CreateWaveApprovalHoldMode => {
  if (thresholdTimeMs !== null && Number.isFinite(thresholdTimeMs)) {
    return CreateWaveApprovalHoldMode.HOLD;
  }

  return CreateWaveApprovalHoldMode.NONE;
};

export default function CreateWaveApprovalHold({
  selectedMode,
  onModeChange,
}: {
  readonly selectedMode: CreateWaveApprovalHoldMode;
  readonly onModeChange: (mode: CreateWaveApprovalHoldMode) => void;
}) {
  return (
    <fieldset className="tw-mt-6 tw-border-0 tw-p-0">
      <legend className="tw-mb-3 tw-block tw-text-sm tw-font-semibold tw-text-iron-100">
        Approval hold
      </legend>
      <div className="tw-grid tw-grid-cols-1 tw-gap-3 md:tw-grid-cols-2">
        {APPROVAL_HOLD_OPTIONS.map((option) => {
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
                name="approval-hold-mode"
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
    </fieldset>
  );
}

import type { RefObject } from "react";
import WaveSettingEditorActions from "./WaveSettingEditorActions";

type ApprovalThresholdTimeUnit = "minutes" | "hours";
type ApprovalThresholdEditorField = "threshold" | "holdTime";

interface WaveApprovalThresholdsEditorFormProps {
  readonly disabled: boolean;
  readonly field: ApprovalThresholdEditorField;
  readonly inputRef: RefObject<HTMLInputElement | null>;
  readonly minTimeValue: string;
  readonly onCancel: () => void;
  readonly onMinTimeValueChange: (value: string) => void;
  readonly onSave: () => void;
  readonly onThresholdValueChange: (value: string) => void;
  readonly onUnitChange: (unit: ApprovalThresholdTimeUnit) => void;
  readonly thresholdValue: string;
  readonly unit: ApprovalThresholdTimeUnit;
}

const APPROVAL_THRESHOLD_TIME_UNITS = ["minutes", "hours"] as const;

const isApprovalThresholdTimeUnit = (
  value: string
): value is ApprovalThresholdTimeUnit =>
  APPROVAL_THRESHOLD_TIME_UNITS.some((unit) => unit === value);

export default function WaveApprovalThresholdsEditorForm({
  disabled,
  field,
  inputRef,
  minTimeValue,
  onCancel,
  onMinTimeValueChange,
  onSave,
  onThresholdValueChange,
  onUnitChange,
  thresholdValue,
  unit,
}: WaveApprovalThresholdsEditorFormProps) {
  const showThreshold = field === "threshold";
  const showHoldTime = field === "holdTime";

  return (
    <form
      className="tw-flex tw-flex-col tw-gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSave();
      }}
    >
      {showThreshold && (
        <label className="tw-flex tw-flex-col tw-gap-1.5 tw-text-sm tw-font-medium tw-text-iron-100">
          <span>Required approvals</span>
          <input
            ref={inputRef}
            aria-label="Required approvals"
            autoComplete="off"
            autoFocus
            className="tw-min-w-0 tw-rounded-md tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-2.5 tw-py-2 tw-text-sm tw-text-iron-100 focus:tw-border-primary-400 focus:tw-outline-none"
            disabled={disabled}
            inputMode="numeric"
            type="text"
            value={thresholdValue}
            onFocus={(event) => event.currentTarget.select()}
            onChange={(event) => onThresholdValueChange(event.target.value)}
          />
        </label>
      )}

      {showHoldTime && (
        <div className="tw-flex tw-flex-col tw-gap-1.5 tw-text-sm tw-font-medium tw-text-iron-100">
          <span>Hold time</span>
          <div className="tw-flex tw-gap-2">
            <input
              aria-label="Minimum time above threshold"
              autoComplete="off"
              autoFocus
              className="tw-min-w-0 tw-flex-1 tw-rounded-md tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-2.5 tw-py-2 tw-text-sm tw-text-iron-100 focus:tw-border-primary-400 focus:tw-outline-none"
              disabled={disabled}
              inputMode="numeric"
              type="text"
              value={minTimeValue}
              onFocus={(event) => event.currentTarget.select()}
              onChange={(event) => onMinTimeValueChange(event.target.value)}
            />
            <select
              aria-label="Minimum time above threshold unit"
              className="tw-rounded-md tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-2.5 tw-py-2 tw-text-sm tw-text-iron-100 focus:tw-border-primary-400 focus:tw-outline-none"
              disabled={disabled}
              value={unit}
              onChange={(event) => {
                if (isApprovalThresholdTimeUnit(event.target.value)) {
                  onUnitChange(event.target.value);
                }
              }}
            >
              {APPROVAL_THRESHOLD_TIME_UNITS.map((timeUnit) => (
                <option key={timeUnit} value={timeUnit}>
                  {timeUnit}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {showHoldTime && (
        <p className="tw-mb-0 tw-text-xs tw-leading-5 tw-text-iron-400">
          Leave hold time blank for immediate approval.
        </p>
      )}

      <WaveSettingEditorActions disabled={disabled} onCancel={onCancel} />
    </form>
  );
}

export type { ApprovalThresholdTimeUnit };
export type { ApprovalThresholdEditorField };

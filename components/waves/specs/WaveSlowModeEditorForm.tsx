import {
  SLOW_MODE_UNITS,
  type SlowModeUnit,
} from "@/helpers/waves/slow-mode.helpers";
import type { RefObject } from "react";
import WaveSettingEditorActions from "./WaveSettingEditorActions";

interface WaveSlowModeEditorFormProps {
  readonly disabled: boolean;
  readonly inputRef: RefObject<HTMLInputElement | null>;
  readonly isSlowModeEnabled: boolean;
  readonly onCancel: () => void;
  readonly onDisable: () => void;
  readonly onSave: () => void;
  readonly onUnitChange: (unit: SlowModeUnit) => void;
  readonly onValueChange: (value: string) => void;
  readonly unit: SlowModeUnit;
  readonly value: string;
}

const isSlowModeUnit = (value: string): value is SlowModeUnit =>
  SLOW_MODE_UNITS.some((unit) => unit === value);

export default function WaveSlowModeEditorForm({
  disabled,
  inputRef,
  isSlowModeEnabled,
  onCancel,
  onDisable,
  onSave,
  onUnitChange,
  onValueChange,
  unit,
  value,
}: WaveSlowModeEditorFormProps) {
  return (
    <form
      className="tw-flex tw-flex-col tw-gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSave();
      }}
    >
      <div className="tw-flex tw-gap-2">
        <input
          ref={inputRef}
          aria-label="Slow mode value"
          autoFocus
          className="tw-min-w-0 tw-flex-1 tw-rounded-md tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-2.5 tw-py-2 tw-text-sm tw-text-iron-100 focus:tw-border-primary-400 focus:tw-outline-none"
          disabled={disabled}
          min={1}
          step={1}
          type="number"
          value={value}
          onFocus={(event) => event.currentTarget.select()}
          onChange={(event) => onValueChange(event.target.value)}
        />
        <select
          aria-label="Slow mode unit"
          className="tw-rounded-md tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-2.5 tw-py-2 tw-text-sm tw-text-iron-100 focus:tw-border-primary-400 focus:tw-outline-none"
          disabled={disabled}
          value={unit}
          onChange={(event) => {
            if (isSlowModeUnit(event.target.value)) {
              onUnitChange(event.target.value);
            }
          }}
        >
          {SLOW_MODE_UNITS.map((slowModeUnit) => (
            <option key={slowModeUnit} value={slowModeUnit}>
              {slowModeUnit}
            </option>
          ))}
        </select>
      </div>

      <WaveSettingEditorActions
        disabled={disabled}
        onCancel={onCancel}
        secondaryAction={{
          disabled: !isSlowModeEnabled,
          label: "Disable",
          onClick: onDisable,
        }}
      />
    </form>
  );
}

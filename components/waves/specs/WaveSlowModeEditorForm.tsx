import {
  SLOW_MODE_UNITS,
  type SlowModeUnit,
} from "@/helpers/waves/slow-mode.helpers";
import type { RefObject } from "react";

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
          className="tw-min-w-0 tw-flex-1 tw-rounded-md tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-2.5 tw-py-2 tw-text-sm tw-text-iron-100 focus:tw-border-primary-400 focus:tw-outline-none"
          disabled={disabled}
          min={1}
          step={1}
          type="number"
          value={value}
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

      <div className="tw-flex tw-items-center tw-justify-end tw-gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={onCancel}
          className="tw-rounded-md tw-border tw-border-solid tw-border-iron-700 tw-bg-transparent tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-text-iron-300 tw-transition disabled:tw-cursor-not-allowed disabled:tw-opacity-50 desktop-hover:hover:tw-border-iron-500 desktop-hover:hover:tw-text-iron-100"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={disabled || !isSlowModeEnabled}
          onClick={onDisable}
          className="tw-rounded-md tw-border tw-border-solid tw-border-red/40 tw-bg-transparent tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-text-red tw-transition disabled:tw-cursor-not-allowed disabled:tw-opacity-50 desktop-hover:hover:tw-border-red desktop-hover:hover:tw-text-red"
        >
          Disable
        </button>
        <button
          type="submit"
          disabled={disabled}
          className="tw-rounded-md tw-border tw-border-solid tw-border-primary-500 tw-bg-primary-500 tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-text-white tw-transition disabled:tw-cursor-not-allowed disabled:tw-opacity-50 desktop-hover:hover:tw-border-primary-600 desktop-hover:hover:tw-bg-primary-600"
        >
          Save
        </button>
      </div>
    </form>
  );
}

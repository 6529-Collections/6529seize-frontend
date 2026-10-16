"use client";

import { MinusIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useId } from "react";
import { TDH_FOCUS_RING } from "../../shared/tdhStyles";

const STEP_BUTTON = `tw-inline-flex tw-size-11 tw-shrink-0 tw-items-center tw-justify-center tw-border-0 tw-bg-iron-800 tw-text-iron-200 tw-transition-colors hover:tw-bg-iron-700 hover:tw-text-iron-50 disabled:tw-cursor-not-allowed disabled:tw-opacity-40 motion-reduce:tw-transition-none ${TDH_FOCUS_RING}`;

/** An integer input with steppers, clamped to its range. */
export default function IntegerField({
  label,
  value,
  min,
  max,
  onChange,
  increaseLabel,
  decreaseLabel,
  hint,
}: {
  readonly label: string;
  readonly value: number;
  readonly min: number;
  readonly max: number;
  readonly onChange: (value: number) => void;
  readonly increaseLabel: string;
  readonly decreaseLabel: string;
  readonly hint?: string;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  const set = (next: number) =>
    onChange(Math.min(max, Math.max(min, Math.trunc(next))));
  return (
    <div className="tw-min-w-0">
      <label
        htmlFor={id}
        className="tw-block tw-text-sm tw-font-medium tw-text-iron-200"
      >
        {label}
      </label>
      <div className="tw-mt-1.5 tw-flex tw-w-full tw-max-w-[14rem] tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900">
        <button
          type="button"
          aria-label={decreaseLabel}
          disabled={value <= min}
          onClick={() => set(value - 1)}
          className={STEP_BUTTON}
        >
          <MinusIcon aria-hidden="true" className="tw-size-4" />
        </button>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          step={1}
          value={value}
          aria-describedby={hint ? hintId : undefined}
          onChange={(event) => {
            const parsed = Number.parseInt(event.target.value, 10);
            if (Number.isFinite(parsed)) {
              set(parsed);
            }
          }}
          className={`tw-min-h-11 tw-w-full tw-min-w-0 tw-border-0 tw-bg-transparent tw-px-2 tw-text-center tw-text-base tw-tabular-nums tw-text-iron-50 ${TDH_FOCUS_RING}`}
        />
        <button
          type="button"
          aria-label={increaseLabel}
          disabled={value >= max}
          onClick={() => set(value + 1)}
          className={STEP_BUTTON}
        >
          <PlusIcon aria-hidden="true" className="tw-size-4" />
        </button>
      </div>
      {hint && (
        <p id={hintId} className="tw-m-0 tw-mt-1 tw-text-sm tw-text-iron-500">
          {hint}
        </p>
      )}
    </div>
  );
}

"use client";

import { EX_FOCUS } from "@/components/explained/tokens";

/**
 * Switches that are on or off independently, in the look of the kit's
 * segmented control: each a button with `aria-pressed` (EXPLAINED.md §11).
 * The kit's `Seg` picks one of several; a model that holds Genesis and
 * Nakamoto at once needs two switches. A candidate for
 * `components/explained/lens/controls.tsx`.
 */
interface ToggleOption<K extends string> {
  readonly key: K;
  readonly label: string;
}

export default function Toggles<K extends string>({
  label,
  options,
  on,
  onToggle,
}: {
  /** The group's accessible name. */
  readonly label: string;
  readonly options: readonly ToggleOption<K>[];
  readonly on: Readonly<Record<K, boolean>>;
  readonly onToggle: (key: K) => void;
}) {
  return (
    <div
      className="tw-inline-flex tw-flex-wrap tw-gap-0.5 tw-rounded-2xl tw-border tw-border-solid tw-border-iron-700 tw-p-[3px] md:tw-rounded-full"
      role="group"
      aria-label={label}
    >
      {options.map((option) => {
        const pressed = on[option.key];
        return (
          <button
            key={option.key}
            type="button"
            aria-pressed={pressed}
            data-tog={option.key}
            onClick={() => onToggle(option.key)}
            className={`tw-min-h-10 tw-flex-auto tw-cursor-pointer tw-whitespace-nowrap tw-rounded-full tw-border-0 tw-px-3 tw-text-[13px] tw-font-semibold md:tw-min-h-9 md:tw-flex-none md:tw-px-3.5 md:tw-text-sm ${pressed ? "tw-bg-iron-50 tw-text-iron-950" : "tw-bg-transparent tw-text-iron-400 hover:tw-text-iron-50"} ${EX_FOCUS}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

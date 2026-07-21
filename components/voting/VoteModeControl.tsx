"use client";

import type { SingleWaveDropVoteMode } from "../waves/drop/SingleWaveDropVote.types";

interface VoteModeControlProps {
  readonly value: SingleWaveDropVoteMode;
  readonly onChange: (mode: SingleWaveDropVoteMode) => void;
}

const voteModeOptions: ReadonlyArray<{
  readonly label: string;
  readonly value: SingleWaveDropVoteMode;
}> = [
  { label: "Slider", value: "slider" },
  { label: "Numeric", value: "numeric" },
];

export function VoteModeControl({ value, onChange }: VoteModeControlProps) {
  return (
    <div
      role="group"
      aria-label="Vote input mode"
      className="tw-flex tw-overflow-hidden tw-rounded-md tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950"
    >
      {voteModeOptions.map((mode) => {
        const isActive = value === mode.value;

        return (
          <button
            key={mode.value}
            type="button"
            onClick={() => onChange(mode.value)}
            aria-pressed={isActive}
            className={`tw-min-h-7 tw-border-0 tw-px-2.5 tw-py-1 tw-text-[11px] tw-transition-colors focus-visible:tw-relative focus-visible:tw-z-10 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-primary-400 ${
              isActive
                ? "tw-bg-iron-700 tw-font-semibold tw-text-iron-50"
                : "tw-bg-transparent tw-font-normal tw-text-iron-400 desktop-hover:hover:tw-bg-iron-900 desktop-hover:hover:tw-text-iron-200"
            }`}
          >
            {mode.label}
          </button>
        );
      })}
    </div>
  );
}

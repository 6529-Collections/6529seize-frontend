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
    <div className="tw-flex tw-overflow-hidden tw-rounded-md tw-border tw-border-solid tw-border-[#26272B]">
      {voteModeOptions.map((mode) => {
        const isActive = value === mode.value;

        return (
          <button
            key={mode.value}
            type="button"
            onClick={() => onChange(mode.value)}
            className={`tw-border-0 tw-px-2.5 tw-py-1 tw-text-[11px] tw-transition-colors ${
              isActive
                ? "tw-bg-[#26272B] tw-font-semibold tw-text-iron-100"
                : "tw-bg-transparent tw-font-normal tw-text-iron-600 desktop-hover:hover:tw-text-iron-300"
            }`}
          >
            {mode.label}
          </button>
        );
      })}
    </div>
  );
}

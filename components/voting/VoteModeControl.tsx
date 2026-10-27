"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { SingleWaveDropVoteMode } from "../waves/drop/SingleWaveDropVote.types";

interface VoteModeControlProps {
  readonly value: SingleWaveDropVoteMode;
  readonly onChange: (mode: SingleWaveDropVoteMode) => void;
}

const voteModeOptions = [
  { labelKey: "waves.voteMode.slider", value: "slider" },
  { labelKey: "waves.voteMode.numeric", value: "numeric" },
] as const;

export function VoteModeControl({ value, onChange }: VoteModeControlProps) {
  const locale = useBrowserLocale();

  return (
    <fieldset className="tw-m-0 tw-inline-flex tw-w-fit tw-min-w-0 tw-flex-wrap tw-items-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-p-0.5">
      <legend className="tw-sr-only">
        {t(locale, "waves.voteMode.groupLabel")}
      </legend>
      {voteModeOptions.map((mode) => {
        const isActive = value === mode.value;

        return (
          <button
            key={mode.value}
            type="button"
            onClick={() => onChange(mode.value)}
            aria-pressed={isActive}
            className={`tw-inline-flex tw-min-h-6 tw-items-center tw-justify-center tw-rounded-md tw-border-0 tw-px-2.5 tw-py-1 tw-text-xs tw-transition-colors focus-visible:tw-relative focus-visible:tw-z-10 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-primary-400 touch-only:tw-min-h-11 ${
              isActive
                ? "tw-bg-iron-700 tw-font-semibold tw-text-iron-50"
                : "tw-bg-transparent tw-font-normal tw-text-iron-400 desktop-hover:hover:tw-bg-iron-900 desktop-hover:hover:tw-text-iron-200"
            }`}
          >
            {t(locale, mode.labelKey)}
          </button>
        );
      })}
    </fieldset>
  );
}

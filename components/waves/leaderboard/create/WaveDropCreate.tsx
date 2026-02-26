import React from "react";

import PrivilegedDropCreator, {
  type CurationComposerVariant,
  DropMode,
} from "@/components/waves/PrivilegedDropCreator";
import type { ApiWave } from "@/generated/models/ApiWave";

interface WaveDropCreateProps {
  readonly wave: ApiWave;
  readonly onCancel?: (() => void) | undefined;
  readonly onSuccess: () => void;
  readonly isCurationLeaderboard?: boolean | undefined;
}

export const WaveDropCreate: React.FC<WaveDropCreateProps> = ({
  wave,
  onCancel,
  onSuccess,
  isCurationLeaderboard = false,
}) => {
  const curationComposerVariant: CurationComposerVariant = isCurationLeaderboard
    ? "leaderboard"
    : "default";

  return (
    <div
      className={
        isCurationLeaderboard
          ? "tw-mb-4"
          : "tw-mb-4 tw-rounded-xl tw-bg-iron-950 tw-p-4 tw-ring-1 tw-ring-inset tw-ring-iron-800"
      }
    >
      {!isCurationLeaderboard && (
        <div className="tw-mb-3 tw-flex tw-items-center tw-justify-between">
          <span className="tw-text-base tw-font-semibold tw-text-iron-200">
            Create a New Drop
          </span>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              aria-label="Close create drop"
              className="tw-rounded-lg tw-border-0 tw-bg-transparent tw-p-1 tw-text-iron-400 tw-transition-all tw-duration-300 tw-ease-out desktop-hover:hover:tw-text-iron-200"
            >
              <svg
                className="tw-size-6"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>
      )}
      <PrivilegedDropCreator
        wave={wave}
        onCancelReplyQuote={() => {}}
        onDropAddedToQueue={() => {}}
        onAllDropsAdded={onSuccess}
        dropId={null}
        activeDrop={null}
        fixedDropMode={DropMode.PARTICIPATION}
        curationComposerVariant={curationComposerVariant}
      />
    </div>
  );
};

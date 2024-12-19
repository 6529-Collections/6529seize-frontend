import React from "react";
import { ApiWave } from "../../../../../generated/models/ApiWave";
import PrivilegedDropCreator, { DropMode } from "../../PrivilegedDropCreator";

interface WaveDropCreateProps {
  readonly wave: ApiWave;
  readonly onCancel: () => void;
  readonly onSuccess: () => void;
}

export const WaveDropCreate: React.FC<WaveDropCreateProps> = ({
  wave,
  onCancel,
  onSuccess,
}) => {
  return (
    <div className="tw-mb-4 tw-bg-iron-950 tw-rounded-xl tw-p-4 tw-ring-1 tw-ring-inset tw-ring-iron-800">
      <div className="tw-flex tw-justify-between tw-items-center tw-mb-3">
        <span className="tw-text-base tw-font-semibold tw-text-iron-200">
          Create a New Drop
        </span>
        <button
          onClick={onCancel}
          className="tw-bg-transparent tw-border-0 tw-text-iron-400 desktop-hover:hover:tw-text-iron-200 tw-transition-all tw-duration-300 tw-ease-out tw-rounded-lg tw-p-1"
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
      </div>
      <PrivilegedDropCreator
        wave={wave}
        onCancelReplyQuote={() => {}}
        onDropAddedToQueue={() => {}}
        onAllDropsAdded={onSuccess}
        dropId={null}
        activeDrop={null}
        fixedDropMode={DropMode.PARTICIPATION}
      />
    </div>
  );
};

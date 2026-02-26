import React from "react";

import PrimaryButton from "@/components/utils/button/PrimaryButton";

interface WaveLeaderboardDefaultEmptyStateProps {
  readonly onCreateDrop?: (() => void) | undefined;
  readonly canCreateDrop: boolean;
  readonly dropRestrictionMessage: string | null;
}

export const WaveLeaderboardDefaultEmptyState: React.FC<
  WaveLeaderboardDefaultEmptyStateProps
> = ({ onCreateDrop, canCreateDrop, dropRestrictionMessage }) => {
  return (
    <div className="tw-flex tw-h-full tw-flex-col tw-items-center tw-justify-center tw-rounded-xl tw-bg-iron-950 tw-p-8 tw-text-center">
      <h3 className="tw-mb-2 tw-text-xl tw-font-medium tw-text-iron-400">
        No drops to show
      </h3>
      <p className="tw-mb-4 tw-text-iron-500">
        Be the first to create a drop in this wave
      </p>
      {onCreateDrop && (
        <PrimaryButton
          loading={false}
          disabled={!canCreateDrop}
          onClicked={onCreateDrop}
          padding="tw-px-4 tw-py-2"
        >
          <svg
            className="-tw-ml-1 tw-h-4 tw-w-4 tw-flex-shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z"
              clipRule="evenodd"
            />
          </svg>
          <span>Drop</span>
        </PrimaryButton>
      )}
      {!canCreateDrop && dropRestrictionMessage && (
        <p className="tw-mt-3 tw-text-xs tw-text-iron-500">
          {dropRestrictionMessage}
        </p>
      )}
    </div>
  );
};

import React from "react";
import PrimaryButton from "@/components/utils/button/PrimaryButton";

interface WaveLeaderboardCurationEmptyStateProps {
  readonly onCreateDrop?: (() => void) | undefined;
  readonly canCreateDrop: boolean;
  readonly dropRestrictionMessage: string | null;
  readonly dropRestrictionLink: {
    readonly href: string;
    readonly label: string;
  } | null;
}

export const WaveLeaderboardCurationEmptyState: React.FC<
  WaveLeaderboardCurationEmptyStateProps
> = ({
  onCreateDrop,
  canCreateDrop,
  dropRestrictionMessage,
  dropRestrictionLink,
}) => {
  const showEligibilityHelper =
    !canCreateDrop && Boolean(dropRestrictionMessage);
  const levelPhrase = "Level 10";

  const renderRestrictionMessage = () => {
    if (!dropRestrictionMessage) {
      return null;
    }

    const splitByLevel = dropRestrictionMessage.split(levelPhrase);
    if (splitByLevel.length === 1) {
      return dropRestrictionMessage;
    }

    return (
      <>
        {splitByLevel[0]}
        <span className="tw-font-semibold tw-text-white">{levelPhrase}</span>
        {splitByLevel.slice(1).join(levelPhrase)}
      </>
    );
  };

  return (
    <div className="tw-flex tw-h-full tw-flex-col tw-items-center tw-justify-center tw-rounded-xl tw-bg-iron-950 tw-p-8 tw-text-center">
      <h3 className="tw-mb-2 tw-text-xl tw-font-medium tw-text-iron-400">
        No curated drops yet
      </h3>
      {showEligibilityHelper ? (
        <div className="tw-mt-4 tw-max-w-xl tw-rounded-lg tw-border tw-border-iron-700/70 tw-bg-iron-900/50 tw-p-4">
          <p className="tw-text-sm tw-leading-relaxed tw-text-iron-300">
            {renderRestrictionMessage()}
          </p>
          {dropRestrictionLink && (
            <a
              href={dropRestrictionLink.href}
              target="_blank"
              rel="noreferrer"
              className="tw-mt-2 tw-inline-block tw-text-sm tw-font-semibold tw-text-white tw-underline tw-decoration-white/60 tw-underline-offset-2 desktop-hover:hover:tw-decoration-white"
            >
              {dropRestrictionLink.label}
            </a>
          )}
        </div>
      ) : (
        <>
          <p className="tw-mb-4 tw-text-iron-500">
            Be the first to create a curated drop in this wave
          </p>
          {onCreateDrop && (
            <PrimaryButton
              loading={false}
              disabled={false}
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
        </>
      )}
    </div>
  );
};

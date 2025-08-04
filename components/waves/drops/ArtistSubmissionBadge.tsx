import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPalette } from "@fortawesome/free-solid-svg-icons";

interface ArtistSubmissionBadgeProps {
  readonly submissionCount: number;
  readonly onBadgeClick?: () => void;
}

export const ArtistSubmissionBadge: React.FC<ArtistSubmissionBadgeProps> = ({
  submissionCount,
  onBadgeClick,
}) => {
  if (submissionCount === 0) return null;

  const displayCount = submissionCount > 9 ? "9+" : submissionCount.toString();

  return (
    <>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onBadgeClick?.();
        }}
        className="tw-absolute -tw-top-1 -tw-right-1 tw-z-10 tw-flex tw-items-center tw-justify-center tw-w-5 tw-h-5 tw-bg-gradient-to-br tw-from-indigo-600 tw-to-indigo-800 tw-text-white tw-text-xs tw-font-semibold tw-rounded-full tw-border tw-border-solid tw-border-indigo-400/50 tw-shadow-md tw-shadow-indigo-500/30 tw-transition-all tw-duration-200 tw-ease-out desktop-hover:group-hover/pfptw-bg-gradient-to-br desktop-hover:group-hover/pfphover:tw-from-indigo-500 desktop-hover:group-hover/pfphover:tw-to-indigo-700 desktop-hover:hover:tw-scale-110 desktop-hover:hover:tw-shadow-lg desktop-hover:hover:tw-shadow-indigo-400/40 desktop-hover:group-hover/pfp:tw-scale-110 desktop-hover:group-hover/pfp:tw-shadow-lg desktop-hover:group-hover/pfp:tw-shadow-indigo-400/40 tw-cursor-pointer"
        aria-label={`View ${submissionCount} art submission${
          submissionCount === 1 ? "" : "s"
        }`}
      >
        {/* Subtle glow effect */}
        <div className="tw-absolute tw-inset-0 tw-rounded-full tw-bg-indigo-500/20 tw-blur-sm tw-transition-all tw-duration-200 desktop-hover:hover:tw-bg-indigo-400/30 desktop-hover:group-hover/pfp:tw-bg-indigo-400/30"></div>

        {/* Content */}
        <div className="tw-relative tw-flex tw-items-center tw-justify-center">
          {submissionCount <= 3 ? (
            <FontAwesomeIcon
              icon={faPalette}
              className="tw-w-2.5 tw-h-2.5 tw-text-indigo-100"
            />
          ) : (
            <span className="tw-leading-none tw-text-[10px]">
              {displayCount}
            </span>
          )}
        </div>
      </button>
    </>
  );
};

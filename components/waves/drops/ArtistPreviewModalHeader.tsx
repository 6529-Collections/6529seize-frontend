import React from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";

interface ArtistPreviewModalHeaderProps {
  readonly user: ApiProfileMin;
  readonly onClose: () => void;
  readonly isApp?: boolean | undefined;
  readonly currentContentType: "active" | "winners";
  readonly submissionCount: number;
  readonly trophyCount: number;
}

export const ArtistPreviewModalHeader: React.FC<
  ArtistPreviewModalHeaderProps
> = ({
  user,
  onClose,
  isApp = false,
  currentContentType,
  submissionCount,
  trophyCount,
}) => {
  const getTitle = () => {
    const artistName = user.handle || "Unknown Artist";
    return currentContentType === "winners"
      ? `${artistName}'s Minted to Memes`
      : `${artistName}'s Submissions`;
  };

  const getCurrentCount = () => {
    const count =
      currentContentType === "winners" ? trophyCount : submissionCount;
    return `${count} artwork${count !== 1 ? "s" : ""}`;
  };

  const HeaderInner = (
    <div
      className={`tw-relative tw-z-[100] tw-flex tw-flex-col ${
        isApp ? "tw-px-6 tw-py-4" : "tw-p-6"
      } tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800/60`}
    >
      <div className="tw-flex tw-justify-between tw-gap-x-3">
        <div className="tw-flex tw-flex-col tw-gap-3 sm:tw-flex-row sm:tw-items-center sm:tw-gap-4">
          <div className="tw-h-11 tw-w-11 tw-flex-shrink-0 tw-overflow-hidden tw-rounded-lg tw-bg-iron-900 tw-ring-1 tw-ring-white/10">
            {user.pfp && (
              <img
                src={user.pfp}
                alt="Profile"
                className="tw-h-full tw-w-full tw-bg-transparent tw-object-contain"
              />
            )}
          </div>

          <div className="tw-relative tw-text-left">
            <div
              className={`tw-mb-1 tw-text-xl tw-font-semibold tw-tracking-tight sm:tw-text-[1.375rem] sm:tw-leading-7 ${
                currentContentType === "winners"
                  ? "tw-bg-gradient-to-r tw-from-amber-100 tw-via-yellow-50 tw-to-amber-100 tw-bg-clip-text tw-text-transparent"
                  : "tw-text-iron-100"
              }`}
            >
              {getTitle()}
            </div>

            <div className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-font-normal tw-text-iron-500">
              <span>{getCurrentCount()}</span>
              <span className="tw-h-1 tw-w-1 tw-rounded-full tw-bg-white/40" />
              <span>The Memes Collection</span>
            </div>
          </div>
        </div>

        {!isApp && (
          <button
            onClick={onClose}
            className="tw-flex tw-h-10 tw-w-10 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-iron-800/70 tw-bg-iron-950 tw-text-white tw-transition tw-duration-200 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-iron-600/70 active:tw-scale-95 desktop-hover:hover:tw-border-iron-700 desktop-hover:hover:tw-bg-iron-900"
            aria-label="Close Gallery"
          >
            <XMarkIcon className="tw-h-5 tw-w-5 tw-flex-shrink-0" />
          </button>
        )}
      </div>
    </div>
  );

  return HeaderInner;
};

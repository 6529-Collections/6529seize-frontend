import React from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { ApiProfileMin } from "@/generated/models/ApiProfileMin";

interface ArtistPreviewModalHeaderProps {
  readonly user: ApiProfileMin;
  readonly onClose: () => void;
  readonly isApp?: boolean;
  readonly currentContentType: "active" | "winners";
  readonly submissionCount: number;
  readonly winnerCount: number;
}

export const ArtistPreviewModalHeader: React.FC<
  ArtistPreviewModalHeaderProps
> = ({
  user,
  onClose,
  isApp = false,
  currentContentType,
  submissionCount,
  winnerCount,
}) => {
  const getTitle = () => {
    const artistName = user.handle || "Unknown Artist";
    return currentContentType === "winners"
      ? `${artistName}'s Won Artworks`
      : `${artistName}'s Submissions`;
  };

  const getCurrentCount = () => {
    const count =
      currentContentType === "winners" ? winnerCount : submissionCount;
    return `${count} artwork${count !== 1 ? "s" : ""}`;
  };

  const HeaderInner = (
    <div
      className={`tw-relative tw-z-[100] tw-flex tw-flex-col ${
        isApp ? "tw-px-6 tw-py-4" : "tw-p-6"
      } tw-border-b tw-border-iron-800/60 tw-border-solid tw-border-t-0 tw-border-x-0`}
    >
      <div className="tw-flex tw-gap-x-3 tw-justify-between">
        <div className="tw-flex sm:tw-flex-row tw-flex-col sm:tw-items-center sm:tw-gap-4 tw-gap-3">
          <div
            className="tw-h-11 tw-w-11 tw-flex-shrink-0 tw-rounded-lg tw-overflow-hidden tw-bg-iron-900 tw-border tw-border-solid tw-border-white/10"
          >
            {user.pfp && (
              <img
                src={user.pfp}
                alt="Profile"
                className="tw-w-full tw-h-full tw-object-contain tw-bg-transparent"
              />
            )}
          </div>

          <div className="tw-text-left tw-relative">
            {/* Title with subtle golden gradient for winners */}
            <div
              className={`tw-text-xl sm:tw-text-2xl tw-font-semibold tw-mb-1 tw-tracking-tight tw-transition-all tw-duration-300 ${
                currentContentType === "winners"
                  ? "tw-text-transparent tw-bg-clip-text tw-bg-gradient-to-r tw-from-amber-100 tw-via-yellow-50 tw-to-amber-100"
                  : "tw-text-iron-100"
              }`}
            >
              {getTitle()}
            </div>

            <div className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-transition-colors tw-duration-300 tw-text-white/50">
              <span>{getCurrentCount()}</span>
              <span className="tw-w-1 tw-h-1 tw-rounded-full tw-bg-white/40" />
              <span>The Memes Collection</span>
            </div>
          </div>
        </div>

        {!isApp && (
          <button
            onClick={onClose}
            className="tw-flex tw-items-center tw-justify-center tw-h-10 tw-w-10 tw-flex-shrink-0 tw-rounded-full tw-bg-iron-950 tw-text-white tw-transition tw-duration-200 tw-border tw-border-solid tw-border-iron-800/70 desktop-hover:hover:tw-border-iron-700 desktop-hover:hover:tw-bg-iron-900 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-iron-600/70 active:tw-scale-95"
            aria-label="Close Gallery"
          >
            <XMarkIcon className="tw-w-5 tw-h-5 tw-flex-shrink-0" />
          </button>
        )}
      </div>
    </div>
  );

  return currentContentType === "winners" ? (
    <div className="tw-relative tw-overflow-hidden">
      {/* warm top band (softer, spreads less) */}
      <div
        className="tw-absolute tw-inset-x-0 tw-top-0 tw-h-14 tw-pointer-events-none
      tw-bg-[linear-gradient(180deg,rgba(234,223,191,0.045),rgba(0,0,0,0)_80%)]"
      />

      {/* diagonal gallery-light streak (barely there) */}
      <div
        className="tw-absolute tw-inset-0 tw-pointer-events-none
      tw-bg-[linear-gradient(115deg,rgba(234,223,191,0.04)_0%,transparent_40%)]"
      />

      {/* bottom vignette to ease into content */}
      <div
        className="tw-absolute tw-inset-0 tw-pointer-events-none
      tw-bg-[radial-gradient(120%_140%_at_50%_120%,rgba(0,0,0,0.22),transparent_45%)]"
      />

      {/* hairline */}
      <div className="tw-absolute tw-inset-x-0 tw-bottom-0 tw-h-px tw-pointer-events-none tw-bg-white/10" />

      {HeaderInner}
    </div>
  ) : (
    HeaderInner
  );
};

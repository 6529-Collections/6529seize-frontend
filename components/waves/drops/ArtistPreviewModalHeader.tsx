import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPalette } from "@fortawesome/free-solid-svg-icons";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { ApiProfileMin } from "../../../generated/models/ApiProfileMin";
import { ModalTab } from "./ArtistPreviewModal";

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
      ? `${artistName}'s Winning Artworks`
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
        isApp ? "tw-px-6 tw-pb-4" : "tw-p-6"
      } tw-border-b tw-border-iron-800/60 tw-border-solid tw-border-t-0 tw-border-x-0`}
    >
      <div className="tw-flex tw-gap-x-3 tw-justify-between">
        <div className="tw-flex sm:tw-flex-row tw-flex-col sm:tw-items-center sm:tw-gap-4 tw-gap-3">
          <div
            className={`tw-h-12 tw-w-12 tw-rounded-lg tw-overflow-hidden ${
              currentContentType === "winners"
                ? "tw-border tw-border-[#E4CFA1]/35 tw-shadow-[0_0_3px_rgba(228,207,161,0.18)]"
                : "tw-bg-iron-900"
            }`}
            style={
              currentContentType === "winners"
                ? { backgroundColor: "#111" }
                : undefined
            }
          >
            {user.pfp ? (
              <img
                src={user.pfp}
                alt="Profile"
                className="tw-w-full tw-h-full tw-object-contain tw-bg-transparent"
              />
            ) : (
              <div
                className={`tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center ${
                  currentContentType === "winners"
                    ? "tw-bg-[#111]"
                    : "tw-bg-iron-900"
                }`}
              >
                <FontAwesomeIcon
                  icon={faPalette}
                  className={`tw-w-5 tw-h-5 tw-flex-shrink-0 ${
                    currentContentType === "winners"
                      ? "tw-text-[#E4CFA1]"
                      : "tw-text-iron-600"
                  }`}
                />
              </div>
            )}
          </div>

          <div className="tw-text-left tw-relative">
            {/* Title with subtle golden gradient for winners */}
            <div
              className={`tw-text-xl sm:tw-text-3xl tw-font-semibold tw-mb-1 tw-tracking-tight tw-transition-all tw-duration-300 ${
                currentContentType === "winners"
                  ? "tw-text-transparent tw-bg-clip-text tw-bg-gradient-to-r tw-from-amber-100 tw-via-yellow-50 tw-to-amber-100"
                  : "tw-text-iron-100"
              }`}
            >
              {getTitle()}
            </div>

            <div
              className={`tw-flex tw-items-center tw-gap-2 tw-text-sm tw-transition-colors tw-duration-300 ${
                currentContentType === "winners"
                  ? "tw-text-[#EADFBF]/70"
                  : "tw-text-iron-400"
              }`}
            >
              <span>{getCurrentCount()}</span>
              <span
                className={`tw-w-1 tw-h-1 tw-rounded-full ${
                  currentContentType === "winners"
                    ? "tw-bg-[#E4CFA1]/50"
                    : "tw-bg-iron-600"
                }`}
              />
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
    {/* warm-neutral depth band for winners */}
    <div className="tw-absolute tw-inset-x-0 tw-top-0 tw-h-14 tw-pointer-events-none 
      tw-bg-[linear-gradient(180deg,rgba(232,218,184,0.07),rgba(0,0,0,0)_85%)]" />
    
    {/* ultra-subtle champagne sweep */}
    <div className="tw-absolute tw-inset-0 tw-pointer-events-none 
      tw-bg-[radial-gradient(120%_80%_at_20%_-20%,rgba(232,218,184,0.08),transparent_65%)]" />
    
    {/* faint inner edge */}
    <div className="tw-absolute tw-inset-x-0 tw-bottom-0 tw-h-[1px] tw-pointer-events-none tw-bg-white/5" />
    
    {HeaderInner}
  </div>
) : (
  <div className="tw-relative tw-overflow-hidden">
    {/* flat background, no gradient */}
    <div className="tw-absolute tw-inset-x-0 tw-top-0 tw-h-14 tw-pointer-events-none tw-bg-iron-950" />
    {/* faint inner edge */}
    <div className="tw-absolute tw-inset-x-0 tw-bottom-0 tw-h-[1px] tw-pointer-events-none tw-bg-white/5" />
    {HeaderInner}
  </div>
  );
};

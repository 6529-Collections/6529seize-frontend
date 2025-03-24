import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExpand, faImage } from "@fortawesome/free-solid-svg-icons";

interface MemeWinnerArtworkProps {
  readonly title: string;
  readonly artworkMedia?: string;
  readonly onViewLarger: () => void;
}

export default function MemeWinnerArtwork({
  title,
  artworkMedia,
  onViewLarger,
}: MemeWinnerArtworkProps) {
  return (
    <div
      className="tw-col-span-1 md:tw-col-span-7 tw-relative tw-bg-iron-950 tw-h-full tw-cursor-pointer"
      onClick={onViewLarger}
    >
      <div className="tw-aspect-video tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center tw-bg-iron-950">
        {artworkMedia ? (
          <img
            src={artworkMedia}
            alt={title}
            className="tw-max-w-full tw-max-h-full tw-object-contain tw-cursor-pointer"
          />
        ) : (
          <div className="tw-text-center tw-text-iron-400 tw-px-6">
            <FontAwesomeIcon
              icon={faImage}
              className="tw-w-14 tw-h-14 tw-mx-auto tw-mb-3 tw-text-iron-700"
            />
            <p className="tw-text-sm">Artwork preview</p>
          </div>
        )}

        {/* View larger button */}
        <div className="tw-absolute tw-bottom-3 tw-right-3">
          <button className="tw-flex tw-items-center tw-border-0 tw-gap-1.5 tw-bg-iron-950/80 tw-text-iron-300 tw-px-3 tw-py-1.5 tw-rounded-lg tw-text-xs tw-font-medium hover:tw-bg-iron-900">
            <FontAwesomeIcon
              icon={faExpand}
              className="tw-size-3 tw-flex-shrink-0"
            />
            View larger
          </button>
        </div>
      </div>
    </div>
  );
}
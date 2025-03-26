import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExpand, faImage } from "@fortawesome/free-solid-svg-icons";

interface MemeDropArtworkProps {
  readonly artworkMedia?: string;
  readonly title: string;
  readonly onViewLarger: () => void;
}

export default function MemeDropArtwork({
  artworkMedia,
  title,
  onViewLarger,
}: MemeDropArtworkProps) {
  return (
    <div
      className="tw-relative tw-bg-iron-800/40 tw-h-full tw-cursor-pointer"
      onClick={onViewLarger}
    >
      <div className="tw-aspect-video tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center">
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
          <button className="tw-flex tw-items-center tw-border-0 tw-gap-1.5 tw-bg-iron-950/80 tw-text-iron-300 tw-px-3 tw-py-1.5 tw-rounded-lg tw-text-xs tw-font-medium hover:tw-bg-iron-900"
            onClick={(e) => {
              e.stopPropagation();
              onViewLarger();
            }}
          >
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
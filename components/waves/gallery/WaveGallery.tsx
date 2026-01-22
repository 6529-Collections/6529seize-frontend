"use client";

import React, { useCallback } from "react";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { WaveGalleryItem } from "./WaveGalleryItem";
import { useWaveGalleryDrops } from "@/hooks/useWaveGalleryDrops";
import InfiniteScrollTrigger from "@/components/utils/infinite-scroll/InfiniteScrollTrigger";

interface WaveGalleryProps {
  readonly wave: ApiWave;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

export const WaveGallery: React.FC<WaveGalleryProps> = ({
  wave,
  onDropClick,
}) => {
  const { drops, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage } =
    useWaveGalleryDrops(wave.id);

  const handleIntersection = useCallback(
    (isIntersecting: boolean) => {
      if (isIntersecting && hasNextPage && !isFetchingNextPage) {
        void fetchNextPage().catch(() => {
          // Error surfaced via query state
        });
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  if (isFetching && drops.length === 0) {
    return (
      <div className="tw-flex tw-h-full tw-items-center tw-justify-center">
        <div className="tw-flex tw-flex-col tw-items-center tw-gap-3">
          <div className="tw-h-8 tw-w-8 tw-animate-spin tw-rounded-full tw-border-2 tw-border-iron-600 tw-border-t-primary-400" />
          <span className="tw-text-sm tw-text-iron-400">
            Loading gallery...
          </span>
        </div>
      </div>
    );
  }

  if (drops.length === 0) {
    return (
      <div className="tw-flex tw-h-full tw-items-center tw-justify-center">
        <div className="tw-flex tw-flex-col tw-items-center tw-gap-2 tw-text-iron-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="tw-h-12 tw-w-12"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
            />
          </svg>
          <span className="tw-text-sm">No media drops yet</span>
        </div>
      </div>
    );
  }

  return (
    <div className="tw-h-full tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 desktop-hover:hover:tw-scrollbar-thumb-iron-300">
      <div className="tw-p-3 tw-@container sm:tw-p-4">
        <div className="tw-grid tw-grid-cols-2 tw-gap-2 @lg:tw-grid-cols-3 @3xl:tw-grid-cols-4 @5xl:tw-grid-cols-5 sm:tw-gap-3">
          {drops.map((drop) => (
            <WaveGalleryItem
              key={drop.stableKey}
              drop={drop}
              onDropClick={onDropClick}
            />
          ))}
        </div>

        {hasNextPage && (
          <div className="tw-flex tw-justify-center tw-py-8">
            {isFetchingNextPage ? (
              <div className="tw-h-6 tw-w-6 tw-animate-spin tw-rounded-full tw-border-2 tw-border-iron-600 tw-border-t-primary-400" />
            ) : (
              <InfiniteScrollTrigger onIntersection={handleIntersection} />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

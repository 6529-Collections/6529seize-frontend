"use client";

import type { ApiWave } from "@/generated/models/ApiWave";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import type { WaveDropsLeaderboardSort } from "@/hooks/useWaveDropsLeaderboard";
import { useWaveDropsLeaderboard } from "@/hooks/useWaveDropsLeaderboard";
import React from "react";
import { WaveLeaderboardGridItem } from "./WaveLeaderboardGridItem";

export type WaveLeaderboardGridMode = "compact" | "content_only";

interface WaveLeaderboardGridProps {
  readonly wave: ApiWave;
  readonly sort: WaveDropsLeaderboardSort;
  readonly mode: WaveLeaderboardGridMode;
  readonly onDropClick: (drop: ExtendedDrop) => void;
  readonly curatedByGroupId?: string | undefined;
}

export const WaveLeaderboardGrid: React.FC<WaveLeaderboardGridProps> = ({
  wave,
  sort,
  mode,
  onDropClick,
  curatedByGroupId,
}) => {
  const { drops, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage } =
    useWaveDropsLeaderboard({
      waveId: wave.id,
      sort,
      curatedByGroupId,
    });

  if (isFetching && drops.length === 0) {
    return (
      <div className="tw-@container">
        <div className="tw-grid tw-gap-4 @lg:tw-grid-cols-2 @3xl:tw-grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-800/40 tw-bg-iron-950"
            >
              <div className="tw-aspect-[16/9] tw-min-h-[14rem] tw-animate-pulse tw-bg-iron-900 md:tw-min-h-[15rem]" />
              <div className="tw-space-y-2 tw-px-3 tw-py-3">
                <div className="tw-h-4 tw-w-3/4 tw-animate-pulse tw-bg-iron-800" />
                <div className="tw-h-3 tw-w-1/3 tw-animate-pulse tw-bg-iron-800/60" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (drops.length === 0) {
    return (
      <div className="tw-flex tw-h-32 tw-items-center tw-justify-center tw-text-sm tw-text-iron-500">
        No drops to show
      </div>
    );
  }

  return (
    <div className="tw-@container">
      <div className="tw-grid tw-gap-4 @lg:tw-grid-cols-2 @3xl:tw-grid-cols-3">
        {drops.map((drop) => (
          <WaveLeaderboardGridItem
            key={drop.id}
            drop={drop}
            mode={mode}
            onDropClick={onDropClick}
          />
        ))}

        {hasNextPage && (
          <div className="tw-col-span-full tw-mb-2 tw-mt-4 tw-flex tw-justify-center">
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900 tw-px-4 tw-py-2 tw-text-sm tw-text-iron-400 tw-transition desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-300"
            >
              {isFetchingNextPage ? "Loading more..." : "Load more drops"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

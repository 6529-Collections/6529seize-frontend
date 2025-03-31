import React, { useContext } from "react";
import { ApiWave } from "../../../../generated/models/ApiWave";
import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import { AuthContext } from "../../../auth/Auth";
import { WaveLeaderboardGalleryItem } from "./WaveLeaderboardGalleryItem";
import {
  WaveDropsLeaderboardSort,
  useWaveDropsLeaderboard,
} from "../../../../hooks/useWaveDropsLeaderboard";
interface WaveLeaderboardGalleryProps {
  readonly wave: ApiWave;
  readonly sort: WaveDropsLeaderboardSort;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

export const WaveLeaderboardGallery: React.FC<WaveLeaderboardGalleryProps> = ({
  wave,
  sort,
  onDropClick,
}) => {
  const { connectedProfile } = useContext(AuthContext);
  const { drops, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage } =
    useWaveDropsLeaderboard({
      waveId: wave.id,
      connectedProfileHandle: connectedProfile?.profile?.handle,
      sort,
    });

  // Filter drops to only include those with media
  const dropsWithMedia =
    drops?.filter(
      (drop) =>
        drop.parts && drop.parts.length > 0 && drop.parts[0].media?.length > 0
    ) || [];

  if (isFetching && dropsWithMedia.length === 0) {
    return (
      <div className="tw-flex tw-justify-center tw-items-center tw-h-32">
        <div className="tw-animate-pulse tw-text-iron-500">
          Loading drops...
        </div>
      </div>
    );
  }

  if (dropsWithMedia.length === 0) {
    return (
      <div className="tw-flex tw-justify-center tw-items-center tw-h-64 tw-text-iron-500">
        No drops to show
      </div>
    );
  }

  return (
    <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-3 lg:tw-grid-cols-2 xl:tw-grid-cols-3 tw-gap-x-4 tw-gap-y-6">
      {dropsWithMedia.map((drop) => (
        <WaveLeaderboardGalleryItem
          key={drop.id}
          drop={drop}
          onDropClick={onDropClick}
        />
      ))}

      {hasNextPage && (
        <div className="tw-col-span-full tw-flex tw-justify-center tw-mt-4 tw-mb-2">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="tw-px-4 tw-py-2 tw-bg-iron-800 tw-text-iron-300 tw-rounded-lg tw-text-sm desktop-hover:hover:tw-bg-iron-700 tw-transition"
          >
            {isFetchingNextPage ? "Loading more..." : "Load more drops"}
          </button>
        </div>
      )}
    </div>
  );
};

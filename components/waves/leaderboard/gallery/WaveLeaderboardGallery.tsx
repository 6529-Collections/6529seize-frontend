import React, { useContext } from "react";
import { ApiWave } from "../../../../generated/models/ApiWave";
import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import { useWaveDropsLeaderboard } from "../../../../hooks/useWaveDropsLeaderboard";
import { AuthContext } from "../../../auth/Auth";
import DropListItemContentMedia from "../../../drops/view/item/content/media/DropListItemContentMedia";

interface WaveLeaderboardGalleryProps {
  readonly wave: ApiWave;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

export const WaveLeaderboardGallery: React.FC<WaveLeaderboardGalleryProps> = ({
  wave,
  onDropClick,
}) => {
  const { connectedProfile } = useContext(AuthContext);
  const { drops, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage } =
    useWaveDropsLeaderboard({
      waveId: wave.id,
      connectedProfileHandle: connectedProfile?.profile?.handle,
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
          Loading gallery...
        </div>
      </div>
    );
  }

  if (dropsWithMedia.length === 0) {
    return (
      <div className="tw-flex tw-justify-center tw-items-center tw-h-64 tw-text-iron-500">
        No media has been dropped yet
      </div>
    );
  }

  return (
    <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-3 lg:tw-grid-cols-2 xl:tw-grid-cols-3 tw-gap-4 tw-mt-4">
      {dropsWithMedia.map((drop) => (
        <div
          key={drop.id}
          className="tw-aspect-square tw-bg-iron-900 tw-border tw-border-iron-800 tw-overflow-hidden tw-relative"
        >
          <div className="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center">
            <DropListItemContentMedia
              media_mime_type={drop.parts[0].media[0].mime_type || ""}
              media_url={drop.parts[0].media[0].url}
            />
          </div>

          {/* Drop info button */}
          <div className="tw-absolute tw-bottom-2 tw-right-2 tw-z-20">
            <button
              className="tw-bg-black/80 tw-text-white tw-rounded-full tw-text-xs tw-h-6 tw-flex tw-items-center tw-justify-center tw-border-0 tw-opacity-60 hover:tw-opacity-100 tw-transition-opacity tw-backdrop-blur-sm"
              onClick={() => onDropClick(drop)}
              aria-label="View drop details"
            >
              View Details
            </button>
          </div>

          <div className="tw-absolute tw-bottom-0 tw-left-0 tw-right-0 tw-bg-gradient-to-t tw-from-black/70 tw-to-transparent tw-p-2 tw-z-10">
            <div className="tw-text-xs tw-text-white tw-truncate">
              {drop.author?.handle || " "}
            </div>
          </div>
        </div>
      ))}

      {hasNextPage && (
        <div className="tw-col-span-full tw-flex tw-justify-center tw-mt-4 tw-mb-2">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="tw-px-4 tw-py-2 tw-bg-iron-800 tw-text-iron-300 tw-rounded-lg tw-text-sm desktop-hover:hover:tw-bg-iron-700 tw-transition"
          >
            {isFetchingNextPage ? "Loading more..." : "Load more media"}
          </button>
        </div>
      )}
    </div>
  );
};

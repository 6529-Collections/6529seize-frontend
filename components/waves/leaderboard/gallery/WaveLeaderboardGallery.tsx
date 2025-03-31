import React, { useContext } from "react";
import { ApiWave } from "../../../../generated/models/ApiWave";
import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import { useWaveDropsLeaderboard } from "../../../../hooks/useWaveDropsLeaderboard";
import { AuthContext } from "../../../auth/Auth";
import DropListItemContentMedia from "../../../drops/view/item/content/media/DropListItemContentMedia";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faChartLine,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";

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
    <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-3 lg:tw-grid-cols-2 xl:tw-grid-cols-3 tw-gap-x-4 tw-gap-y-6">
      {dropsWithMedia.map((drop) => (
        <div>
          <div
            key={drop.id}
            className="tw-aspect-square tw-bg-iron-900 tw-border tw-border-iron-800 tw-overflow-hidden tw-relative"
          >
            <div className="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center desktop-hover:hover:tw-scale-105 tw-transition tw-duration-300 tw-ease-out tw-transform">
              <DropListItemContentMedia
                media_mime_type={drop.parts[0].media[0].mime_type || ""}
                media_url={drop.parts[0].media[0].url}
                onContainerClick={() => onDropClick(drop)}
              />
            </div>
          </div>
          <div className="tw-flex tw-flex-col tw-mt-1 tw-gap-y-1">
            <div className="tw-flex tw-items-center tw-justify-between tw-gap-x-4">
              <div className="tw-flex tw-items-center tw-gap-x-1.5">
                <span className="tw-text-sm tw-font-semibold tw-text-emerald-500">
                  123
                </span>

                <span
                  className="tw-text-emerald-400 tw-bg-emerald-950/80 tw-text-xs tw-font-medium tw-animate-pulse tw-ml-0.5 tw-px-1.5 tw-py-0.5 tw-rounded-md tw-flex tw-items-center tw-gap-x-1"
                  style={{
                    animationDuration: "2s",
                  }}
                >
                  <FontAwesomeIcon
                    icon={faArrowRight}
                    className="tw-flex-shrink-0 tw-size-3"
                  />
                  <span>321</span>
                </span>
              </div>

              <div className="tw-flex tw-items-center tw-gap-x-1.5">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2.25"
                  stroke="currentColor"
                  className="tw-size-4 tw-text-iron-400 tw-flex-shrink-0"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
                  />
                </svg>
                <span className="tw-text-sm tw-font-medium tw-text-iron-200">
                  123
                </span>
              </div>
            </div>
            <div className="tw-flex tw-items-center tw-justify-between">
              <div className="tw-text-sm tw-text-iron-200 tw-truncate">
                {drop.author?.handle || " "}
              </div>
              <button
                className="tw-bg-white/20 tw-text-iron-300 desktop-hover:hover:tw-text-iron-50 desktop-hover:hover:tw-bg-white/30 tw-rounded-md tw-text-xs tw-h-6 tw-flex tw-items-center tw-justify-center tw-border-0 tw-transition tw-duration-300 tw-ease-out tw-backdrop-blur-sm"
                onClick={() => onDropClick(drop)}
                aria-label="View drop details"
              >
                View Details
              </button>
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

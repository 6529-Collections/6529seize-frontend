import React, { useContext, useMemo } from "react";
import { ApiWave } from "../../../../../generated/models/ApiWave";
import { AuthContext } from "../../../../auth/Auth";
import {
  useWaveDropsLeaderboard,
  WaveDropsLeaderboardSortBy,
  WaveDropsLeaderboardSortDirection,
} from "../../../../../hooks/useWaveDropsLeaderboard";
import { useIntersectionObserver } from "../../../../../hooks/useIntersectionObserver";
import { WaveLeaderboardDrop } from "./WaveLeaderboardDrop";
import { ExtendedDrop } from "../../../../../helpers/waves/drop.helpers";
import PrimaryButton from "../../../../utils/button/PrimaryButton";

interface WaveLeaderboardDropsProps {
  readonly wave: ApiWave;
  readonly dropsSortBy: WaveDropsLeaderboardSortBy;
  readonly sortDirection: WaveDropsLeaderboardSortDirection;
  readonly showMyDrops: boolean;
  readonly setActiveDrop: (drop: ExtendedDrop) => void;
  readonly onCreateDrop: () => void;
}

export const WaveLeaderboardDrops: React.FC<WaveLeaderboardDropsProps> = ({
  wave,
  dropsSortBy,
  sortDirection,
  showMyDrops,
  setActiveDrop,
  onCreateDrop,
}) => {
  const { connectedProfile } = useContext(AuthContext);
  const { drops, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage } =
    useWaveDropsLeaderboard({
      waveId: wave.id,
      connectedProfileHandle: connectedProfile?.profile?.handle,
      reverse: true,
      dropsSortBy,
      sortDirection,
      handle: showMyDrops ? connectedProfile?.profile?.handle : undefined,
    });

  const memoizedDrops = useMemo(() => drops, [drops]);

  const intersectionElementRef = useIntersectionObserver(() => {
    if (hasNextPage && !isFetching && !isFetchingNextPage) {
      fetchNextPage();
    }
  });

  if (memoizedDrops.length === 0 && !isFetching) {
    return (
      <div className="tw-text-center tw-h-full tw-rounded-xl tw-bg-iron-950 tw-flex tw-flex-col tw-items-center tw-justify-center tw-p-8">
        <h3 className="tw-text-xl tw-font-medium tw-mb-2 tw-text-iron-400">
          No drops to show
        </h3>
        <p className="tw-text-iron-500 tw-mb-4">
          Be the first to create a drop in this wave
        </p>
        <PrimaryButton
          loading={false}
          disabled={false}
          onClicked={onCreateDrop}
          padding="tw-px-4 tw-py-2"
        >
          <svg
            className="tw-w-4 tw-h-4 tw-flex-shrink-0 -tw-ml-1"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z"
              clipRule="evenodd"
            />
          </svg>
          <span>Drop</span>
        </PrimaryButton>
      </div>
    );
  }

  return (
    <div className="tw-space-y-4">
      {memoizedDrops.map((drop) => (
        <WaveLeaderboardDrop
          key={drop.id}
          drop={drop}
          wave={wave}
          setActiveDrop={setActiveDrop}
        />
      ))}
      {isFetchingNextPage && (
        <div className="tw-w-full tw-h-0.5 tw-bg-iron-800 tw-overflow-hidden">
          <div className="tw-w-full tw-h-full tw-bg-indigo-400 tw-animate-loading-bar"></div>
        </div>
      )}
      <div ref={intersectionElementRef}></div>
    </div>
  );
};

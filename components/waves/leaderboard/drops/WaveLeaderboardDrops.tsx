import React, { useContext, useMemo } from "react";
import { ApiWave } from "../../../../generated/models/ApiWave";
import { AuthContext } from "../../../auth/Auth";
import {
  useWaveDropsLeaderboard,
  WaveDropsLeaderboardSortBy,
  WaveDropsLeaderboardSortDirection,
} from "../../../../hooks/useWaveDropsLeaderboard";
import { useIntersectionObserver } from "../../../../hooks/useIntersectionObserver";
import { WaveLeaderboardDrop } from "./WaveLeaderboardDrop";
import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import { useRouter } from "next/router";
import { useWave } from "../../../../hooks/useWave";
import { WaveLeaderboardEmptyState } from "./WaveLeaderboardEmptyState";
import { WaveLeaderboardLoading } from "./WaveLeaderboardLoading";
import { WaveLeaderboardLoadingBar } from "./WaveLeaderboardLoadingBar";

interface WaveLeaderboardDropsProps {
  readonly wave: ApiWave;
  readonly dropsSortBy: WaveDropsLeaderboardSortBy;
  readonly sortDirection: WaveDropsLeaderboardSortDirection;
  readonly showMyDrops: boolean;
  readonly onCreateDrop: () => void;
}

export const WaveLeaderboardDrops: React.FC<WaveLeaderboardDropsProps> = ({
  wave,
  dropsSortBy,
  sortDirection,
  showMyDrops,
  onCreateDrop,
}) => {
  const router = useRouter();
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

  const onDropClick = (drop: ExtendedDrop) => {
    const currentQuery = { ...router.query };
    currentQuery.drop = drop.id;
    router.push(
      {
        pathname: router.pathname,
        query: currentQuery,
      },
      undefined,
      { shallow: true }
    );
  };

  if (isFetching && memoizedDrops.length === 0) {
    return <WaveLeaderboardLoading />;
  }

  if (memoizedDrops.length === 0) {
    return <WaveLeaderboardEmptyState onCreateDrop={onCreateDrop} wave={wave} />;
  }

  return (
    <div className="tw-space-y-4">
      {memoizedDrops.map((drop) => (
        <WaveLeaderboardDrop
          key={drop.id}
          drop={drop}
          wave={wave}
          onDropClick={onDropClick}
        />
      ))}
      {isFetchingNextPage && <WaveLeaderboardLoadingBar />}
      <div ref={intersectionElementRef}></div>
    </div>
  );
};

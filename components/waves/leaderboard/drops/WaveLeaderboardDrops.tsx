import React, { useContext } from "react";
import { ApiWave } from "../../../../generated/models/ApiWave";
import { AuthContext } from "../../../auth/Auth";
import { useWaveDropsLeaderboard, WaveDropsLeaderboardSort } from "../../../../hooks/useWaveDropsLeaderboard";
import { useIntersectionObserver } from "../../../../hooks/useIntersectionObserver";
import { WaveLeaderboardDrop } from "./WaveLeaderboardDrop";
import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import { useRouter } from "next/router";
import { WaveLeaderboardEmptyState } from "./WaveLeaderboardEmptyState";
import { WaveLeaderboardLoading } from "./WaveLeaderboardLoading";
import { WaveLeaderboardLoadingBar } from "./WaveLeaderboardLoadingBar";

interface WaveLeaderboardDropsProps {
  readonly wave: ApiWave;
  readonly sort: WaveDropsLeaderboardSort;
  readonly onCreateDrop: () => void;
}

export const WaveLeaderboardDrops: React.FC<WaveLeaderboardDropsProps> = ({
  wave,
  sort,
  onCreateDrop,
}) => {
  const router = useRouter();
  const { connectedProfile } = useContext(AuthContext);
  const { drops, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage } =
    useWaveDropsLeaderboard({
      waveId: wave.id,
      connectedProfileHandle: connectedProfile?.profile?.handle,
      sort,
    });

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

  if (isFetching && drops.length === 0) {
    return <WaveLeaderboardLoading />;
  }

  if (drops.length === 0) {
    return (
      <WaveLeaderboardEmptyState onCreateDrop={onCreateDrop} wave={wave} />
    );
  }

  return (
    <div className="tw-space-y-4">
      {drops.map((drop) => (
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

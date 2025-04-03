import React, { useContext } from "react";
import { ApiWave } from "../../../../generated/models/ApiWave";
import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import { AuthContext } from "../../../auth/Auth";
import {
  useWaveDropsLeaderboard,
  WaveDropsLeaderboardSort,
} from "../../../../hooks/useWaveDropsLeaderboard";
import MyStreamWaveMyVote from "./MyStreamWaveMyVote";
import { useLayout } from "../layout/LayoutContext";
import { WaveLeaderboardLoadingBar } from "../../../waves/leaderboard/drops/WaveLeaderboardLoadingBar";
import { useIntersectionObserver } from "../../../../hooks/useIntersectionObserver";

interface MyStreamWaveMyVotesProps {
  readonly wave: ApiWave;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

const MyStreamWaveMyVotes: React.FC<MyStreamWaveMyVotesProps> = ({
  wave,
  onDropClick,
}) => {
  const { connectedProfile } = useContext(AuthContext);
  const { drops, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage } =
    useWaveDropsLeaderboard({
      waveId: wave.id,
      connectedProfileHandle: connectedProfile?.profile?.handle,
      sort: WaveDropsLeaderboardSort.MY_REALTIME_VOTE,
    });

  const { myVotesViewStyle } = useLayout();

  const intersectionElementRef = useIntersectionObserver(() => {
    console.log("intersectionElementRef");
    if (hasNextPage && !isFetching && !isFetchingNextPage) {
      fetchNextPage();
    }
  });

  return (
    <div
      className="tw-space-y-4 lg:tw-space-y-6 lg:tw-pr-2 tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300"
      style={myVotesViewStyle}
    >
      {drops.length === 0 && !isFetching ? (
        <div className="tw-mt-10">
          <p className="tw-text-iron-500 tw-text-sm tw-text-center">
            You haven't voted on any submissions in this wave yet.
          </p>
        </div>
      ) : (
        <div className="tw-space-y-2">
          {drops.map((drop) => (
            <MyStreamWaveMyVote
              key={drop.id}
              drop={drop}
              onDropClick={onDropClick}
            />
          ))}
          {isFetchingNextPage && <WaveLeaderboardLoadingBar />}
          <div ref={intersectionElementRef}></div>
        </div>
      )}
    </div>
  );
};

export default MyStreamWaveMyVotes;

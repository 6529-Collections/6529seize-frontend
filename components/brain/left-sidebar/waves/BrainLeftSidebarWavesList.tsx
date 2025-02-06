import React, { useContext, useEffect, useMemo, useState } from "react";
import { ApiWavesOverviewType } from "../../../../generated/models/ApiWavesOverviewType";
import { WAVE_FOLLOWING_WAVES_PARAMS } from "../../../react-query-wrapper/utils/query-utils";
import { useWavesOverview } from "../../../../hooks/useWavesOverview";
import { useIntersectionObserver } from "../../../../hooks/useIntersectionObserver";
import BrainLeftSidebarWave from "./BrainLeftSidebarWave";
import CommonSwitch from "../../../utils/switch/CommonSwitch";
import { AuthContext } from "../../../auth/Auth";
import { useNewDropsCount } from "../../../../hooks/useNewDropsCount";
import WaveFollowingWavesSort from "../../../waves/WaveFollowingWavesSort";
import BrainLeftSidebarCreateAWaveButton from "../BrainLeftSidebarCreateAWaveButton";

interface BrainLeftSidebarWavesListProps {
  readonly activeWaveId: string | null;
}

const BrainLeftSidebarWavesList: React.FC<BrainLeftSidebarWavesListProps> = ({
  activeWaveId,
}) => {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const getIsConnectedIdentity = () =>
    !!connectedProfile?.profile?.handle && !activeProfileProxy;
  const [isConnectedIdentity, setIsConnectedIdentity] = useState(
    getIsConnectedIdentity()
  );

  useEffect(() => {
    setIsConnectedIdentity(getIsConnectedIdentity());
  }, [connectedProfile, activeProfileProxy]);

  const [selectedSort, setSelectedSort] = useState<ApiWavesOverviewType>(
    WAVE_FOLLOWING_WAVES_PARAMS.initialWavesOverviewType
  );
  const [isFollowing, setIsFollowing] = useState(true);
  const { waves, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useWavesOverview({
      type: selectedSort,
      limit: WAVE_FOLLOWING_WAVES_PARAMS.limit,
      following: isConnectedIdentity && isFollowing,
      refetchInterval: 10000,
    });

  const intersectionElementRef = useIntersectionObserver(() => {
    if (hasNextPage && !isFetching && !isFetchingNextPage) {
      fetchNextPage();
    }
  });

  const { newDropsCounts, resetWaveCount } = useNewDropsCount(
    waves,
    activeWaveId
  );

  const memoizedWaves = useMemo(() => waves || [], [waves]);

  return (
    <div className="tw-mb-4">
      <div className="tw-h-full tw-bg-iron-950 tw-rounded-xl tw-ring-1 tw-ring-inset tw-ring-iron-800 tw-py-4">
        <div className="tw-flex tw-flex-col tw-gap-y-1.5 tw-px-5">
          <div className="tw-flex tw-justify-between tw-items-center">
            <p className="tw-mb-0 tw-text-lg sm:tw-text-xl tw-font-semibold tw-text-iron-200 tw-tracking-tight">
              Waves
            </p>
            {isConnectedIdentity && (
              <CommonSwitch
                label="Following"
                isOn={isFollowing}
                setIsOn={setIsFollowing}
              />
            )}
          </div>
          <div className="tw-flex tw-justify-between tw-items-center">
            <WaveFollowingWavesSort
              selectedOption={selectedSort}
              setSelectedOption={setSelectedSort}
            />
          </div>
        </div>
        <div className="tw-mt-2 tw-max-h-96 tw-pb-2 tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-600 tw-scrollbar-track-iron-900">
          <div className="tw-flex tw-flex-col">
            {memoizedWaves.map((wave) => (
              <BrainLeftSidebarWave
                key={wave.id}
                wave={wave}
                newDropsCounts={newDropsCounts}
                resetWaveCount={resetWaveCount}
              />
            ))}
            {isFetchingNextPage && (
              <div className="tw-w-full tw-h-0.5 tw-bg-iron-800 tw-overflow-hidden">
                <div className="tw-w-full tw-h-full tw-bg-indigo-400 tw-animate-loading-bar"></div>
              </div>
            )}
            <div ref={intersectionElementRef}></div>
          </div>
        </div>
        <div className="tw-px-4 tw-mt-2">
          <BrainLeftSidebarCreateAWaveButton />
        </div>
      </div>
    </div>
  );
};

export default BrainLeftSidebarWavesList;

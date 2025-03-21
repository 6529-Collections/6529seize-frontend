import React, { useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
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
  const router = useRouter();
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

  // Manage recent waves in localStorage
  const [recentWaveIds, setRecentWaveIds] = useState<string[]>([]);

  // Load recent waves from localStorage
  useEffect(() => {
    try {
      const storedWaves = JSON.parse(localStorage.getItem('recentWaves') || '[]');
      setRecentWaveIds(storedWaves);
    } catch {
      setRecentWaveIds([]);
    }
  }, []);

  // Update recent waves when active wave changes
  useEffect(() => {
    if (!activeWaveId) return;

    try {
      // Move current wave to front of recent list
      const updatedRecentWaves = [
        activeWaveId,
        ...recentWaveIds.filter(id => id !== activeWaveId)
      ].slice(0, 5); // Keep only 5 most recent

      localStorage.setItem('recentWaves', JSON.stringify(updatedRecentWaves));
      setRecentWaveIds(updatedRecentWaves);
    } catch {
      // Fail silently - recent waves are non-critical
    }
  }, [activeWaveId]);

  // Organize waves into sections: active, recent, and regular
  const { activeWave, recentWaves, regularWaves } = useMemo(() => {
    if (!waves?.length) return { activeWave: null, recentWaves: [], regularWaves: [] };

    // Find active wave
    const activeWave = waves.find(wave => wave.id === activeWaveId) || null;
    const remainingWaves = new Map(waves.filter(w => w.id !== activeWaveId).map(w => [w.id, w]));

    // Find recent waves (excluding active)
    const recentWaves = recentWaveIds
      .filter(id => id !== activeWaveId && remainingWaves.has(id))
      .map(id => {
        const wave = remainingWaves.get(id)!;
        remainingWaves.delete(id);
        return wave;
      })
      .slice(0, 3); // Show max 3 recent waves

    // All other waves
    const regularWaves = Array.from(remainingWaves.values());

    return { activeWave, recentWaves, regularWaves };
  }, [waves, activeWaveId, recentWaveIds]);

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

        {/* Waves list - prioritized by active, recent, then regular */}
        <div className="tw-overflow-y-auto tw-max-h-[calc(100vh-280px)] tw-scrollbar-thin tw-scrollbar-thumb-iron-600 tw-scrollbar-track-iron-900 tw-mt-3">
          <div className="tw-flex tw-flex-col">
            {/* Active Wave */}
            {activeWave && (
              <>
                <div className="tw-pl-5 tw-pr-2 tw-py-2 tw-flex tw-justify-between tw-items-center">
                  <p className="tw-text-xs tw-font-medium tw-text-blue-400 tw-tracking-widest tw-uppercase tw-mb-0">
                    CURRENT WAVE
                  </p>
                  <button
                    className="tw-bg-transparent tw-border-none tw-text-iron-500 hover:tw-text-iron-300 tw-transition-colors tw-duration-200 tw-ease-in-out tw-flex tw-items-center tw-justify-center tw-mr-2 tw-text-sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // Reset the wave's new drops count
                      if (activeWaveId) {
                        resetWaveCount(activeWaveId);
                      }
                      // Use the router for client-side navigation (shallow:true preserves scroll)
                      router.push("/my-stream", undefined, { shallow: true });
                    }}
                    aria-label="Close current wave"
                  >
                    Close
                  </button>
                </div>
                <BrainLeftSidebarWave
                  key={activeWave.id}
                  wave={activeWave}
                  newDropsCounts={newDropsCounts}
                  resetWaveCount={resetWaveCount}
                  isHighlighted={true}
                />
              </>
            )}

            {/* Recent Waves */}
            {recentWaves.length > 0 && (
              <div className="tw-border-t tw-border-iron-800/30 tw-mt-2">
                <div className="tw-pl-5 tw-py-2">
                  <p className="tw-text-xs tw-font-medium tw-text-iron-500 tw-tracking-widest tw-uppercase tw-mb-0">
                    RECENT WAVES
                  </p>
                </div>
                {recentWaves.map(wave => (
                  <BrainLeftSidebarWave
                    key={wave.id}
                    wave={wave}
                    newDropsCounts={newDropsCounts}
                    resetWaveCount={resetWaveCount}
                  />
                ))}
              </div>
            )}

            {/* All Other Waves */}
            {regularWaves.length > 0 && (
              <div className="tw-border-t tw-border-iron-800/30 tw-mt-2">
                <div className="tw-pl-5 tw-py-2">
                  <p className="tw-text-xs tw-font-medium tw-text-iron-500 tw-tracking-widest tw-uppercase tw-mb-0">
                    ALL WAVES
                  </p>
                </div>
                {regularWaves.map(wave => (
                  <BrainLeftSidebarWave
                    key={wave.id}
                    wave={wave}
                    newDropsCounts={newDropsCounts}
                    resetWaveCount={resetWaveCount}
                  />
                ))}
              </div>
            )}

            {/* Loading indicator */}
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

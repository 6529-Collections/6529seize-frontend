import React, { useMemo } from "react";
import { useWaves } from "../../../../hooks/useWaves";
import { useIntersectionObserver } from "../../../../hooks/useIntersectionObserver";
import BrainLeftSidebarWave from "./BrainLeftSidebarWave";

interface BrainLeftSidebarWavesMyWavesProps {
  readonly identity: string;
}

const BrainLeftSidebarWavesMyWaves: React.FC<
  BrainLeftSidebarWavesMyWavesProps
> = ({ identity }) => {
  const { waves, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useWaves({
      identity,
      waveName: null,
    });

  const intersectionElementRef = useIntersectionObserver(() => {
    if (hasNextPage && !isFetching && !isFetchingNextPage) {
      fetchNextPage();
    }
  });

  const memoizedWaves = useMemo(() => waves || [], [waves]);
  return (
    <div className="tw-mt-4 tw-mb-3">
      <div className="tw-h-full tw-bg-iron-950 tw-rounded-xl tw-ring-1 tw-ring-inset tw-ring-iron-800 tw-py-5">
        <div className="tw-flex tw-flex-col tw-gap-y-1 tw-px-5">
          <div className="tw-flex tw-justify-between tw-items-center">
            <p className="tw-mb-0 tw-text-lg sm:tw-text-xl tw-font-semibold tw-text-iron-200 tw-tracking-tight">
              My Waves
            </p>
          </div>
        </div>
        <div className="tw-mt-2 tw-max-h-96 tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-700 tw-scrollbar-track-iron-900">
          <div className="tw-flex tw-flex-col">
            {memoizedWaves.map((wave) => (
              <BrainLeftSidebarWave key={wave.id} wave={wave} />
            ))}
            {isFetchingNextPage && (
              <div className="tw-w-full tw-h-0.5 tw-bg-iron-800 tw-overflow-hidden">
                <div className="tw-w-full tw-h-full tw-bg-indigo-400 tw-animate-loading-bar"></div>
              </div>
            )}
            <div ref={intersectionElementRef}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrainLeftSidebarWavesMyWaves;

"use client";

import type { FC} from "react";
import { useMemo, useRef } from "react";
import type { ApiWave } from "@/generated/models/ApiWave";
import { WaveOutcome } from "@/components/waves/outcome/WaveOutcome";
import { useLayout } from "./layout/LayoutContext";
import SpinnerLoader from "@/components/common/SpinnerLoader";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { useWaveOutcomesQuery } from "@/hooks/waves/useWaveOutcomesQuery";

interface MyStreamWaveOutcomeProps {
  readonly wave: ApiWave;
}

const MyStreamWaveOutcome: FC<MyStreamWaveOutcomeProps> = ({ wave }) => {
  // Get the pre-calculated style from LayoutContext
  const { outcomeViewStyle } = useLayout();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const {
    outcomes,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isLoading,
    errorMessage,
  } = useWaveOutcomesQuery({ waveId: wave.id });


  const containerClassName = useMemo(() => {
    return `tw-pt-4 tw-pb-4 tw-w-full tw-flex tw-flex-col tw-overflow-y-auto no-scrollbar lg:tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 desktop-hover:hover:tw-scrollbar-thumb-iron-300 tw-flex-grow lg:tw-pr-2`;
  }, []);

  useInfiniteScroll(
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    scrollContainerRef,
    sentinelRef,
    "200px"
  );

  const hasOutcomes = outcomes.length > 0;
  const isInitialLoading = isLoading && !hasOutcomes;
  return (
    <div
      className={containerClassName}
      style={outcomeViewStyle}
      ref={scrollContainerRef}
    >
      {isInitialLoading && <SpinnerLoader text="Loading outcomes..." />}
      {!isInitialLoading && errorMessage && (
        <div className="tw-px-4 tw-text-sm tw-text-red-400">
          {errorMessage}
        </div>
      )}
      {!isInitialLoading && !errorMessage && !hasOutcomes && !isFetching && (
        <div className="tw-px-4 tw-text-sm tw-text-iron-500">
          No outcomes to show.
        </div>
      )}
      {hasOutcomes && (
        <div className="tw-px-2 sm:tw-px-4 tw-space-y-4">
          {outcomes.map((outcome, index) => (
            <WaveOutcome
              waveId={wave.id}
              key={`${outcome.index ?? index}-${outcome.type}`}
              outcome={outcome}
            />
          ))}
          <div ref={sentinelRef} style={{ height: "1px" }} />
          {isFetchingNextPage && (
            <SpinnerLoader text="Loading more outcomes..." />
          )}
        </div>
      )}
    </div>
  );
};

export default MyStreamWaveOutcome;

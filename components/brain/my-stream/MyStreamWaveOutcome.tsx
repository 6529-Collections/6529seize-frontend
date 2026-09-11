"use client";

import type { FC } from "react";
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
    return `tw-w-full tw-flex tw-flex-grow tw-flex-col tw-overflow-y-auto tw-no-scrollbar tw-pb-[21px] tw-pt-[13px] lg:tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 desktop-hover:hover:tw-scrollbar-thumb-iron-300`;
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
        <div className="tw-px-[13px] tw-text-sm tw-text-red-400 sm:tw-px-[21px]">
          {errorMessage}
        </div>
      )}
      {!isInitialLoading && !errorMessage && !hasOutcomes && !isFetching && (
        <div className="tw-px-[13px] tw-text-sm tw-text-iron-500 sm:tw-px-[21px]">
          No outcomes to show.
        </div>
      )}
      {hasOutcomes && (
        <div className="tw-space-y-[13px] tw-px-[8px] sm:tw-px-[13px]">
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

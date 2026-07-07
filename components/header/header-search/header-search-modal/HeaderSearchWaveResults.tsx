import type { RefObject } from "react";

import Drop, { DropLocation } from "@/components/waves/drops/Drop";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";

interface HeaderSearchWaveResultsProps {
  readonly wave: ApiWave;
  readonly resultsPanelRef: RefObject<HTMLDivElement | null>;
  readonly isLoadingWaveDrops: boolean;
  readonly isWaveDropsError: boolean;
  readonly shouldSearchWave: boolean;
  readonly waveDropResults: readonly ExtendedDrop[];
  readonly waveDropsHasNextPage: boolean;
  readonly fetchNextWaveDropsPage: () => void;
  readonly isFetchingNextWaveDropsPage: boolean;
  readonly onSelectSerialNo: (serialNo: number) => void;
  readonly winningThreshold: number | null;
  readonly winningThresholdMinDurationMs: number | null;
  readonly isVotingClosed: boolean;
  readonly isVotingControlsLocked: boolean;
}

export function HeaderSearchWaveResults({
  wave,
  resultsPanelRef,
  isLoadingWaveDrops,
  isWaveDropsError,
  shouldSearchWave,
  waveDropResults,
  waveDropsHasNextPage,
  fetchNextWaveDropsPage,
  isFetchingNextWaveDropsPage,
  onSelectSerialNo,
  winningThreshold,
  winningThresholdMinDurationMs,
  isVotingClosed,
  isVotingControlsLocked,
}: HeaderSearchWaveResultsProps) {
  return (
    <div className="tw-flex tw-min-h-0 tw-flex-1 tw-flex-col md:tw-flex-row md:tw-gap-4 md:tw-px-5 md:tw-pb-5">
      <div className="tw-flex tw-min-h-0 tw-flex-1 tw-flex-col md:tw-min-w-0">
        {/* Wave search results */}
        <div
          ref={resultsPanelRef}
          className="tw-h-0 tw-min-h-0 tw-flex-1 tw-overflow-y-auto tw-px-4 tw-pb-6 tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 desktop-hover:hover:tw-scrollbar-thumb-iron-300"
        >
          {isLoadingWaveDrops && (
            <div className="tw-flex tw-items-center tw-justify-center tw-py-10 tw-text-iron-300">
              Loading…
            </div>
          )}

          {!isLoadingWaveDrops && isWaveDropsError && (
            <div className="tw-flex tw-items-center tw-justify-center tw-py-10 tw-text-iron-300">
              Couldn&apos;t load search results.
            </div>
          )}

          {!isLoadingWaveDrops && !isWaveDropsError && !shouldSearchWave && (
            <div className="tw-flex tw-items-center tw-justify-center tw-py-10 tw-text-sm tw-text-iron-400">
              Type at least 2 characters to search in {wave.name}.
            </div>
          )}

          {!isLoadingWaveDrops &&
            !isWaveDropsError &&
            shouldSearchWave &&
            waveDropResults.length === 0 && (
              <div className="tw-flex tw-items-center tw-justify-center tw-py-10 tw-text-sm tw-text-iron-400">
                No matches found.
              </div>
            )}

          {!isLoadingWaveDrops &&
            !isWaveDropsError &&
            shouldSearchWave &&
            waveDropResults.length > 0 && (
              <div className="tw-space-y-2">
                <div className="tw-text-xs tw-text-iron-400">
                  {waveDropResults.length} result
                  {waveDropResults.length === 1 ? "" : "s"}
                </div>
                <div className="tw-space-y-2">
                  {waveDropResults.map((drop, index) => {
                    const previousDrop = waveDropResults[index - 1] ?? null;
                    const nextDrop = waveDropResults[index + 1] ?? null;
                    const serialNo = drop.serial_no;
                    const canSelect = typeof serialNo === "number";
                    return (
                      <button
                        type="button"
                        key={drop.stableKey}
                        disabled={!canSelect}
                        onClick={() => {
                          if (!canSelect) return;
                          onSelectSerialNo(serialNo);
                        }}
                        className="tw-w-full tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950/50 tw-text-left tw-transition tw-duration-150 disabled:tw-cursor-not-allowed disabled:tw-opacity-60 desktop-hover:hover:tw-border-iron-600 desktop-hover:hover:tw-bg-iron-900/40"
                      >
                        <div className="tw-pointer-events-none">
                          <Drop
                            drop={drop}
                            previousDrop={previousDrop}
                            nextDrop={nextDrop}
                            showWaveInfo={false}
                            activeDrop={null}
                            showReplyAndQuote={false}
                            location={DropLocation.WAVE}
                            dropViewDropId={null}
                            onReply={() => {}}
                            onReplyClick={() => {}}
                            onQuoteClick={() => {}}
                            winningThreshold={winningThreshold}
                            winningThresholdMinDurationMs={
                              winningThresholdMinDurationMs
                            }
                            isVotingClosed={isVotingClosed}
                            isVotingControlsLocked={isVotingControlsLocked}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
                {waveDropsHasNextPage && (
                  <div className="tw-flex tw-justify-center tw-pt-2">
                    <button
                      type="button"
                      onClick={() => fetchNextWaveDropsPage()}
                      disabled={isFetchingNextWaveDropsPage}
                      className="tw-inline-flex tw-items-center tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-iron-200 tw-transition tw-duration-150 hover:tw-border-iron-500 hover:tw-bg-iron-800 hover:tw-text-white disabled:tw-cursor-not-allowed disabled:tw-opacity-50"
                    >
                      {isFetchingNextWaveDropsPage ? "Loading…" : "Load more"}
                    </button>
                  </div>
                )}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

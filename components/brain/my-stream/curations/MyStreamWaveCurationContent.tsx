"use client";

import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import CurationEmptyState from "@/components/brain/my-stream/curations/CurationEmptyState";
import CommonIntersectionElement from "@/components/utils/CommonIntersectionElement";
import Drop, { DropLocation } from "@/components/waves/drops/Drop";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useWaveCurationDrops } from "@/hooks/useWaveCurationDrops";
import { useCurationManagementPermission } from "@/hooks/useCurationManagementPermission";
import type { QuickCurationAction } from "@/hooks/drops/useCanShowDropCurationsAction";
import type { ApiWave } from "@/generated/models/ApiWave";
import { useApprovalWaveStatus } from "@/hooks/waves/useApprovalWaveStatus";
import { useCallback, useMemo, type ReactNode } from "react";
import { useLayout } from "../layout/LayoutContext";

interface MyStreamWaveCurationContentProps {
  readonly wave: ApiWave;
  readonly curationId: string;
  readonly curationName?: string | null | undefined;
  readonly onDropClick?: ((drop: ExtendedDrop) => void) | undefined;
  readonly constrainToViewport?: boolean | undefined;
}

function MyStreamWaveCurationDropItem({
  drop,
  previousDrop,
  nextDrop,
  onDropClick,
  winningThreshold,
  winningThresholdMinDurationMs,
  isVotingClosed,
  isVotingControlsLocked,
  standaloneQuickRemoveCuration,
}: {
  readonly drop: ExtendedDrop;
  readonly previousDrop: ExtendedDrop | null;
  readonly nextDrop: ExtendedDrop | null;
  readonly onDropClick?: ((drop: ExtendedDrop) => void) | undefined;
  readonly winningThreshold?: number | null | undefined;
  readonly winningThresholdMinDurationMs?: number | null | undefined;
  readonly isVotingClosed?: boolean | undefined;
  readonly isVotingControlsLocked?: boolean | undefined;
  readonly standaloneQuickRemoveCuration: QuickCurationAction | null;
}) {
  return (
    <Drop
      key={drop.stableKey}
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
      onDropContentClick={onDropClick}
      showStandaloneActionsButton
      standaloneQuickRemoveCuration={standaloneQuickRemoveCuration}
      winningThreshold={winningThreshold}
      winningThresholdMinDurationMs={winningThresholdMinDurationMs}
      isVotingClosed={isVotingClosed}
      isVotingControlsLocked={isVotingControlsLocked}
    />
  );
}

export default function MyStreamWaveCurationContent({
  wave,
  curationId,
  curationName,
  onDropClick,
  constrainToViewport = true,
}: MyStreamWaveCurationContentProps) {
  const { leaderboardViewStyle } = useLayout();
  const {
    drops,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isPlaceholderData,
  } = useWaveCurationDrops({
    wave,
    curationId,
  });

  const isInitialLoading = isFetching && drops.length === 0;
  const canManageActiveCuration = useCurationManagementPermission({
    curationId,
    probeDropId: isPlaceholderData ? "" : (drops[0]?.id ?? ""),
  });
  const {
    winningThreshold,
    winningThresholdMinDurationMs,
    isVotingClosed,
    isVotingControlsLocked,
  } = useApprovalWaveStatus({ wave });

  const handleBottomIntersection = useCallback(
    (isIntersecting: boolean) => {
      if (!isIntersecting || !hasNextPage || isFetchingNextPage) {
        return;
      }

      void fetchNextPage();
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  const curationTitle = curationName?.trim() ?? "Curation";
  const standaloneQuickRemoveCuration = useMemo<QuickCurationAction | null>(
    () =>
      canManageActiveCuration && !isPlaceholderData
        ? { id: curationId, name: curationTitle }
        : null,
    [canManageActiveCuration, curationId, curationTitle, isPlaceholderData]
  );

  const renderedDrops = useMemo(
    () =>
      drops.map((drop, index) => (
        <MyStreamWaveCurationDropItem
          key={drop.stableKey}
          drop={drop}
          previousDrop={index > 0 ? (drops[index - 1] ?? null) : null}
          nextDrop={drops[index + 1] ?? null}
          onDropClick={onDropClick}
          winningThreshold={winningThreshold}
          winningThresholdMinDurationMs={winningThresholdMinDurationMs}
          isVotingClosed={isVotingClosed}
          isVotingControlsLocked={isVotingControlsLocked}
          standaloneQuickRemoveCuration={standaloneQuickRemoveCuration}
        />
      )),
    [
      drops,
      isVotingClosed,
      isVotingControlsLocked,
      onDropClick,
      standaloneQuickRemoveCuration,
      winningThreshold,
      winningThresholdMinDurationMs,
    ]
  );

  let content: ReactNode;

  if (isInitialLoading) {
    content = (
      <div className="tw-flex tw-flex-1 tw-items-center tw-justify-center">
        <CircleLoader size={CircleLoaderSize.XXLARGE} />
      </div>
    );
  } else if (drops.length === 0) {
    content = (
      <CurationEmptyState
        curationTitle={curationTitle}
        containerClassName={
          constrainToViewport
            ? "tw-flex tw-flex-1 tw-items-center tw-justify-center tw-px-6"
            : undefined
        }
      />
    );
  } else {
    content = (
      <div className="tw-flex tw-min-h-0 tw-flex-1 tw-flex-col">
        {renderedDrops}
        {(hasNextPage || isFetchingNextPage) && (
          <div className="tw-py-4">
            {isFetchingNextPage ? (
              <div className="tw-flex tw-justify-center">
                <CircleLoader size={CircleLoaderSize.MEDIUM} />
              </div>
            ) : (
              <CommonIntersectionElement
                onIntersection={handleBottomIntersection}
              />
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={
        constrainToViewport
          ? "tw-flex tw-h-full tw-min-h-0 tw-w-full tw-min-w-0 tw-flex-grow tw-flex-col tw-overflow-y-auto tw-overflow-x-hidden tw-overscroll-y-contain tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 desktop-hover:hover:tw-scrollbar-thumb-iron-300"
          : "tw-flex tw-min-h-0 tw-w-full tw-min-w-0 tw-flex-col"
      }
      style={constrainToViewport ? leaderboardViewStyle : undefined}
    >
      {content}
    </div>
  );
}

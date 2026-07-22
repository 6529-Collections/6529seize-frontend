"use client";

import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import CurationEmptyState from "@/components/brain/my-stream/curations/CurationEmptyState";
import { Spinner } from "@/components/dotLoader/DotLoader";
import CommonIntersectionElement from "@/components/utils/CommonIntersectionElement";
import Drop, { DropLocation } from "@/components/waves/drops/Drop";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useCurationManagementPermission } from "@/hooks/useCurationManagementPermission";
import { useDropCurationMembershipMutation } from "@/hooks/drops/useDropCurationMembershipMutation";
import { useWaveCurationDrops } from "@/hooks/useWaveCurationDrops";
import type { ApiWave } from "@/generated/models/ApiWave";
import { useApprovalWaveStatus } from "@/hooks/waves/useApprovalWaveStatus";
import { XMarkIcon } from "@heroicons/react/24/outline";
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
  curationId,
  canManageActiveCuration,
  onDropClick,
  winningThreshold,
  winningThresholdMinDurationMs,
  isVotingClosed,
  isVotingControlsLocked,
}: {
  readonly drop: ExtendedDrop;
  readonly previousDrop: ExtendedDrop | null;
  readonly nextDrop: ExtendedDrop | null;
  readonly curationId: string;
  readonly canManageActiveCuration: boolean;
  readonly onDropClick?: ((drop: ExtendedDrop) => void) | undefined;
  readonly winningThreshold?: number | null | undefined;
  readonly winningThresholdMinDurationMs?: number | null | undefined;
  readonly isVotingClosed?: boolean | undefined;
  readonly isVotingControlsLocked?: boolean | undefined;
}) {
  const { updateMembership, isPending } = useDropCurationMembershipMutation({
    dropId: drop.id,
  });

  const handleRemove = () => {
    updateMembership(curationId, "remove");
  };

  return (
    <div
      className={`tw-relative ${
        canManageActiveCuration ? "tw-pt-8 sm:tw-pt-0" : ""
      }`}
    >
      {canManageActiveCuration && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            handleRemove();
          }}
          disabled={isPending}
          aria-busy={isPending}
          aria-label={
            isPending
              ? "Removing drop from this curation"
              : "Remove drop from this curation"
          }
          title="Remove from curation"
          className="tw-touch-action-manipulation tw-pointer-events-auto tw-absolute tw-right-4 tw-top-5 tw-z-40 tw-inline-flex tw-h-8 tw-min-w-8 tw-items-center tw-justify-center tw-gap-1.5 tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-black/50 tw-px-2.5 tw-text-xs tw-font-semibold tw-text-iron-300 tw-shadow-[0_10px_30px_rgba(0,0,0,0.32)] tw-backdrop-blur-sm tw-transition-colors tw-duration-200 desktop-hover:hover:tw-border-rose-500/20 desktop-hover:hover:tw-bg-rose-500/10 desktop-hover:hover:tw-text-rose-400 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950 active:tw-bg-rose-500/15 disabled:tw-cursor-not-allowed disabled:tw-opacity-60 sm:tw-right-7 sm:tw-top-4"
        >
          {isPending ? (
            <>
              <Spinner dimension={12} />
              <span>Removing</span>
            </>
          ) : (
            <>
              <XMarkIcon className="tw-size-3.5 tw-flex-shrink-0 -tw-ml-0.5" />
              <span>Remove</span>
            </>
          )}
        </button>
      )}

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
        winningThreshold={winningThreshold}
        winningThresholdMinDurationMs={winningThresholdMinDurationMs}
        isVotingClosed={isVotingClosed}
        isVotingControlsLocked={isVotingControlsLocked}
      />
    </div>
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
  const { drops, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage } =
    useWaveCurationDrops({
      wave,
      curationId,
    });
  const permissionProbeDropId = drops[0]?.id ?? "";
  const canManageActiveCuration = useCurationManagementPermission({
    curationId,
    probeDropId: permissionProbeDropId,
  });

  const isInitialLoading = isFetching && drops.length === 0;
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

  const renderedDrops = useMemo(
    () =>
      drops.map((drop, index) => (
        <MyStreamWaveCurationDropItem
          key={drop.stableKey}
          drop={drop}
          previousDrop={index > 0 ? (drops[index - 1] ?? null) : null}
          nextDrop={drops[index + 1] ?? null}
          curationId={curationId}
          canManageActiveCuration={canManageActiveCuration}
          onDropClick={onDropClick}
          winningThreshold={winningThreshold}
          winningThresholdMinDurationMs={winningThresholdMinDurationMs}
          isVotingClosed={isVotingClosed}
          isVotingControlsLocked={isVotingControlsLocked}
        />
      )),
    [
      canManageActiveCuration,
      curationId,
      drops,
      isVotingClosed,
      isVotingControlsLocked,
      onDropClick,
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

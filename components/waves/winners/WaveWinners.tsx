import React from "react";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { WaveWinnersDrops } from "./drops/WaveWinnersDrops";
import { WaveWinnersPodium } from "./podium/WaveWinnersPodium";
import { WaveWinnersTimeline } from "./WaveWinnersTimeline";
import {
  FULL_APPROVAL_WAVE_DECISIONS_PAGE_SIZE,
  useWaveDecisions,
} from "@/hooks/waves/useWaveDecisions";
import { useLayout } from "@/components/brain/my-stream/layout/LayoutContext";
import { useWave } from "@/hooks/useWave";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { WaveWinnersApprovalError } from "./WaveWinnersApprovalError";
import { getApprovedWaveDecisionWinners } from "@/helpers/waves/wave-decision.helpers";
import { useWaveOutcomeVisibility } from "@/hooks/waves/useWaveMetadata";

interface WaveWinnersProps {
  readonly wave: ApiWave;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

export const WaveWinners: React.FC<WaveWinnersProps> = ({
  wave,
  onDropClick,
}) => {
  const {
    decisions: { multiDecision },
    isQuorumWave,
  } = useWave(wave);
  const isApproveWave = wave.wave.type === ApiWaveType.Approve;
  const outcomesVisible = useWaveOutcomeVisibility(wave);

  // Use layout context for container style
  const { winnersViewStyle } = useLayout();

  // Fetch data using decisions endpoint for all waves
  const {
    decisionPoints,
    isFetching,
    isLoadingAllPages,
    isLoadingAllPagesError,
    refetch,
    fetchNextPage,
    hasNextPage,
  } = useWaveDecisions({
    waveId: wave.id,
    wave,
    enabled: true, // Always enabled now that we use it for both types
    loadAllPages: isApproveWave,
    pageSize: isApproveWave
      ? FULL_APPROVAL_WAVE_DECISIONS_PAGE_SIZE
      : undefined,
  });
  const isDecisionsLoading = isApproveWave ? isLoadingAllPages : isFetching;
  const approvedWinners = getApprovedWaveDecisionWinners(decisionPoints);
  const contentPresentation = isQuorumWave ? "quorumCompact" : undefined;
  const handleApprovalWinnersRetry = () => {
    if (hasNextPage) {
      void fetchNextPage();
      return;
    }

    void refetch();
  };

  let winnersContent: React.ReactNode;

  if (isApproveWave && isLoadingAllPagesError) {
    winnersContent = (
      <div className="tw-mt-2 tw-flex-grow tw-pb-6 lg:tw-pr-2">
        <WaveWinnersApprovalError onRetry={handleApprovalWinnersRetry} />
      </div>
    );
  } else if (isApproveWave) {
    winnersContent = (
      <div className="tw-mt-2 tw-flex-grow tw-space-y-2 tw-pb-6 lg:tw-pr-2">
        <WaveWinnersDrops
          wave={wave}
          onDropClick={onDropClick}
          winners={approvedWinners}
          isLoading={isDecisionsLoading}
          isApprovalWave={true}
          emptyMessage="No drops approved yet"
          contentPresentation={contentPresentation}
          outcomesVisible={outcomesVisible}
        />
      </div>
    );
  } else if (multiDecision) {
    winnersContent = (
      <WaveWinnersTimeline
        onDropClick={onDropClick}
        decisionPoints={decisionPoints}
        wave={wave}
        isLoading={isDecisionsLoading}
        contentPresentation={contentPresentation}
        outcomesVisible={outcomesVisible}
      />
    );
  } else {
    winnersContent = (
      <div className="tw-mt-2 tw-flex-grow tw-space-y-2 tw-pb-6 lg:tw-pr-2">
        <WaveWinnersPodium
          onDropClick={onDropClick}
          winners={decisionPoints[0]?.winners ?? []}
          isLoading={isDecisionsLoading}
          outcomesVisible={outcomesVisible}
        />
        <WaveWinnersDrops
          wave={wave}
          onDropClick={onDropClick}
          winners={decisionPoints[0]?.winners ?? []}
          isLoading={isDecisionsLoading}
          contentPresentation={contentPresentation}
          outcomesVisible={outcomesVisible}
        />
      </div>
    );
  }

  return (
    <div
      className="tw-space-y-4 tw-overflow-y-auto tw-px-2 tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 hover:tw-scrollbar-thumb-iron-300 lg:tw-space-y-6"
      style={winnersViewStyle}
    >
      {winnersContent}
    </div>
  );
};

import React from "react";
import { WaveWinnersDrop } from "./WaveWinnersDrop";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import type { ApiWaveDecisionWinner } from "@/generated/models/ApiWaveDecisionWinner";
import { publicEnv } from "@/config/env";
import { getRenderableWaveDecisionWinners } from "@/helpers/waves/wave-decision.helpers";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import type { DropContentPresentation } from "@/components/waves/drops/dropContentPresentation";

interface WaveWinnersDropsProps {
  readonly wave: ApiWave;
  readonly onDropClick: (drop: ExtendedDrop) => void;
  readonly winners: ApiWaveDecisionWinner[];
  readonly isLoading?: boolean | undefined;
  readonly isApprovalWave?: boolean | undefined;
  readonly emptyMessage?: string | undefined;
  readonly contentPresentation?: DropContentPresentation | undefined;
  readonly outcomesVisible?: boolean | undefined;
}

export const WaveWinnersDrops: React.FC<WaveWinnersDropsProps> = ({
  wave,
  onDropClick,
  winners,
  isLoading = false,
  isApprovalWave = false,
  emptyMessage,
  contentPresentation = "default",
  outcomesVisible = true,
}) => {
  const renderableWinners = getRenderableWaveDecisionWinners(winners);
  const invalidWinnerCount = winners.length - renderableWinners.length;
  const shouldShowInvalidWinnerWarning =
    invalidWinnerCount > 0 && publicEnv.NODE_ENV !== "production";
  const invalidWinnersMessage =
    invalidWinnerCount === 1
      ? "Hidden 1 winner with missing drop data."
      : `Hidden ${invalidWinnerCount} winners with missing drop data.`;

  if (isLoading) {
    return (
      <div className="tw-h-0.5 tw-w-full tw-overflow-hidden tw-bg-iron-800">
        <div className="tw-h-full tw-w-full tw-animate-loading-bar tw-bg-indigo-400"></div>
      </div>
    );
  }

  // Empty state handling
  if (!renderableWinners.length) {
    if (shouldShowInvalidWinnerWarning) {
      return (
        <p className="tw-rounded-md tw-border tw-border-amber-500/40 tw-bg-amber-500/10 tw-px-3 tw-py-2 tw-text-xs tw-text-amber-200">
          {invalidWinnersMessage}
        </p>
      );
    }

    if (emptyMessage) {
      return (
        <div className="tw-flex tw-items-center tw-justify-center tw-px-4 tw-py-16">
          <div className="tw-flex tw-max-w-xs tw-flex-col tw-items-center tw-gap-4 tw-text-center">
            <CheckCircleIcon className="tw-size-10 tw-text-iron-600" />
            <p className="tw-mb-0 tw-text-base tw-font-medium tw-text-iron-300">
              {emptyMessage}
            </p>
          </div>
        </div>
      );
    }

    return <></>;
  }

  return (
    <div className="tw-space-y-3">
      {shouldShowInvalidWinnerWarning ? (
        <p className="tw-rounded-md tw-border tw-border-amber-500/40 tw-bg-amber-500/10 tw-px-3 tw-py-2 tw-text-xs tw-text-amber-200">
          {invalidWinnersMessage}
        </p>
      ) : null}
      {renderableWinners.map((winner) => (
        <WaveWinnersDrop
          key={winner.drop.id}
          winner={winner}
          wave={wave}
          onDropClick={onDropClick}
          isApprovalWave={isApprovalWave}
          contentPresentation={contentPresentation}
          outcomesVisible={outcomesVisible}
        />
      ))}
    </div>
  );
};

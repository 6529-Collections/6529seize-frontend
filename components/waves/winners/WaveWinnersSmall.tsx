"use client";

import { useState, memo, useCallback } from "react";
import type { ApiWave } from "@/generated/models/ApiWave";
import { convertApiDropToExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useWaveDecisions } from "@/hooks/waves/useWaveDecisions";
import type { ApiWaveDecision } from "@/generated/models/ApiWaveDecision";

// Import extracted components
import { WaveWinnerItemSmall } from "./WaveWinnerItemSmall";
import { WaveWinnersSmallLoading } from "./WaveWinnersSmallLoading";
import { WaveWinnersSmallEmpty } from "./WaveWinnersSmallEmpty";
import { WaveWinnersSmallDecisionSelector } from "./WaveWinnersSmallDecisionSelector";
import { useWave } from "@/hooks/useWave";
import { useWaveChatScrollOptional } from "@/contexts/wave/WaveChatScrollContext";

interface WaveWinnersSmallProps {
  readonly wave: ApiWave;
}

// Extended decision point type with UI fields
interface EnhancedDecisionPoint extends ApiWaveDecision {
  id: string; // Using decision_time as ID
  date: string; // Formatted date for UI
}

export const WaveWinnersSmall = memo<WaveWinnersSmallProps>(({ wave }) => {
  const waveChatScroll = useWaveChatScrollOptional();

  const handleDropClick = useCallback(
    (serialNo: number) => {
      waveChatScroll?.requestScrollToSerialNo({
        waveId: wave.id,
        serialNo,
      });
    },
    [waveChatScroll, wave.id]
  );
  const {
    decisions: { multiDecision },
  } = useWave(wave);
  const [selectedDecisionPoint, setSelectedDecisionPoint] = useState<
    string | null
  >(null);

  // Fetch data using decisions endpoint for all waves - same approach as WaveWinners
  const { decisionPoints: rawDecisionPoints, isFetching: isDecisionsLoading } =
    useWaveDecisions({
      wave,
      enabled: true, // Always enabled now that we use it for both types
    });

  // Process decision points to include UI-friendly fields
  const decisionPoints: EnhancedDecisionPoint[] = rawDecisionPoints.map(
    (point) => {
      const decisionTime = point.decision_time;
      // Create a formatted date string
      const dateObj = new Date(decisionTime);
      return {
        ...point,
        id: decisionTime.toString(), // Use decision_time as ID
        date: dateObj.toISOString(),
      };
    }
  );

  // Derive the effective active decision point (defaults to first if none selected)
  const activeDecisionPoint =
    selectedDecisionPoint ?? decisionPoints[0]?.id ?? null;

  // Loading state
  if (isDecisionsLoading) {
    return <WaveWinnersSmallLoading />;
  }

  // Empty state
  if (decisionPoints.length === 0) {
    return <WaveWinnersSmallEmpty isMultiDecision={multiDecision} />;
  }

  // For single decision waves, just render the first decision point's drops
  if (!multiDecision) {
    const winners = decisionPoints[0]?.winners ?? [];

    return (
      <div className="tw-p-3">
        <div className="tw-flex tw-items-center tw-justify-between tw-px-1">
          <h2 className="tw-mb-0 tw-text-base tw-font-semibold tw-text-iron-50">
            Winners
          </h2>
        </div>

        <div className="tw-mt-3 tw-space-y-3">
          {winners.map((winner) => (
            <WaveWinnerItemSmall
              key={winner.drop.id}
              drop={convertApiDropToExtendedDrop(winner.drop)}
              wave={wave}
              rank={winner.place}
              onDropClick={() => handleDropClick(winner.drop.serial_no)}
            />
          ))}
        </div>
      </div>
    );
  }

  // For multi-decision waves, add a decision point selector
  return (
    <div className="tw-p-3">
      <div className="tw-flex tw-items-center tw-justify-between tw-px-1">
        <h2 className="tw-mb-0 tw-text-base tw-font-semibold tw-text-iron-50">
          Winners
        </h2>
      </div>

      {/* Decision point selector */}
      <WaveWinnersSmallDecisionSelector
        decisionPoints={decisionPoints.map((point) => ({
          id: point.id,
          date: point.date,
          winnersCount: point.winners.length,
        }))}
        activeDecisionPoint={activeDecisionPoint}
        onChange={setSelectedDecisionPoint}
      />

      {/* Show winners for selected decision point */}
      <div className="tw-space-y-3">
        {activeDecisionPoint &&
          decisionPoints
            .find((point) => point.id === activeDecisionPoint)
            ?.winners.map((winner) => (
              <WaveWinnerItemSmall
                key={winner.drop.id}
                drop={convertApiDropToExtendedDrop(winner.drop)}
                wave={wave}
                rank={winner.place}
                onDropClick={() => handleDropClick(winner.drop.serial_no)}
              />
            ))}
      </div>
    </div>
  );
});

WaveWinnersSmall.displayName = "WaveWinnersSmall";

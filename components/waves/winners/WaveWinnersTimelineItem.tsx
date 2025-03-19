/**
 * This component is deprecated and has been integrated directly into WaveWinnersTimeline.
 * It is kept for backward compatibility but doesn't render the UI it used to.
 */
import React from "react";
import { ApiWaveDecision } from "../../../generated/models/ApiWaveDecision";
import { ApiWave } from "../../../generated/models/ApiWave";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";

interface WaveWinnersTimelineItemProps {
  readonly point: ApiWaveDecision;
  readonly roundNumber: number;
  readonly isExpanded: boolean;
  readonly toggleExpanded: () => void;
  readonly onDropClick: (drop: ExtendedDrop) => void;
  readonly wave: ApiWave;
  readonly isInteractive: boolean;
}

// This component is no longer used as its functionality is now integrated directly into WaveWinnersTimeline
export const WaveWinnersTimelineItem: React.FC<
  WaveWinnersTimelineItemProps
> = ({}) => {
  // Return null as this component is no longer used
  return null;
};
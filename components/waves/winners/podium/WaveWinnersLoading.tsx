import React from "react";
import { WaveWinnersPodiumPlaceholder } from "./WaveWinnersPodiumPlaceholder";
import {
  podiumContainerClassName,
  podiumGridClassName,
  podiumPositionStyles,
} from "./podiumStyles";

export const WaveWinnersLoading: React.FC = () => (
  <div aria-busy="true" className={podiumContainerClassName}>
    <div className={podiumGridClassName}>
      {(["second", "first", "third"] as const).map((position) => (
        <div
          key={position}
          className={`tw-min-w-0 ${podiumPositionStyles[position].offset}`}
        >
          <WaveWinnersPodiumPlaceholder position={position} loading />
        </div>
      ))}
    </div>
  </div>
);

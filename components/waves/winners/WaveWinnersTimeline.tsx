import React from "react";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import type { ApiWaveDecision } from "@/generated/models/ApiWaveDecision";
import { WaveWinnersEmpty } from "./WaveWinnersEmpty";
import { format } from "date-fns";
import { WaveWinnersTimelineLoading } from "./WaveWinnersTimelineLoading";
import { WaveWinnersDrops } from "./drops/WaveWinnersDrops";

interface WaveWinnersTimelineProps {
  readonly onDropClick: (drop: ExtendedDrop) => void;
  readonly decisionPoints: ApiWaveDecision[];
  readonly wave: ApiWave;
  readonly isLoading: boolean;
}

export const WaveWinnersTimeline: React.FC<WaveWinnersTimelineProps> = ({
  onDropClick,
  decisionPoints,
  wave,
  isLoading,
}) => {
  if (isLoading) {
    return <WaveWinnersTimelineLoading />;
  }

  const hasAnyWinners = decisionPoints.some(
    (point) => point.winners.length > 0
  );

  if (decisionPoints.length === 0 || !hasAnyWinners) {
    return <WaveWinnersEmpty />;
  }

  const sortedDisplayPoints = [...decisionPoints]
    .filter((point) => point.winners.length > 0)
    .sort(
      (a, b) =>
        new Date(b.decision_time).getTime() -
        new Date(a.decision_time).getTime()
    );

  return (
    <div className="tw-overflow-y-auto tw-pt-4 tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 hover:tw-scrollbar-thumb-iron-300">
      <div className="tw-relative">
        <div className="tw-absolute tw-bottom-0 tw-left-2 tw-top-0 tw-w-px tw-bg-iron-700/80 lg:tw-left-[19px]"></div>

        <div className="tw-space-y-6">
          {sortedDisplayPoints.map((point) => {
            const date = new Date(point.decision_time);
            const formattedDate = format(date, "EEE, MMM d, yyyy");
            const formattedTime = format(date, "h:mm a");

            return (
              <div
                key={`decision-${point.decision_time}`}
                className="group tw-relative"
              >
                <div className="tw-absolute tw-left-0 tw-top-[0.3125rem] tw-z-10 lg:tw-left-3">
                  <div className="tw-flex tw-size-4 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-iron-700/50 tw-bg-iron-800 tw-transition-all group-hover:tw-border-iron-500">
                    <div className="tw-size-2 tw-rounded-full tw-bg-iron-500 tw-transition-all group-hover:tw-size-2.5 group-hover:tw-bg-iron-400"></div>
                  </div>
                </div>

                <div className="tw-mb-2 tw-ml-6 lg:tw-mb-3 lg:tw-ml-10">
                  <div className="tw-flex tw-flex-wrap tw-items-baseline tw-gap-x-3 tw-gap-y-1">
                    <h3 className="tw-text-sm tw-font-medium tw-tracking-wide tw-text-iron-300">
                      {formattedDate}
                    </h3>

                    <span className="tw-text-xs tw-font-light tw-tracking-wide tw-text-iron-400">
                      {formattedTime}
                    </span>
                  </div>
                </div>

                <div className="tw-mb-6 tw-ml-6">
                  <div className="lg:tw-px-4 lg:tw-pb-4">
                    <WaveWinnersDrops
                      winners={point.winners}
                      onDropClick={onDropClick}
                      wave={wave}
                      isLoading={false}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

import React from "react";
import { ApiWave } from "../../../generated/models/ApiWave";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { ApiWaveDecision } from "../../../generated/models/ApiWaveDecision";
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
  const groupedByDate: Record<string, ApiWaveDecision[]> = {};

  [...decisionPoints].forEach((point) => {
    const dateKey = format(new Date(point.decision_time), "yyyy-MM-dd");
    if (!groupedByDate[dateKey]) {
      groupedByDate[dateKey] = [];
    }
    groupedByDate[dateKey].push(point);
  });

  if (isLoading) {
    return <WaveWinnersTimelineLoading />;
  }

  if (decisionPoints.length === 0) {
    return <WaveWinnersEmpty />;
  }

  const sortedDecisionPoints = [...decisionPoints]
    .filter((point) => point.winners.length > 0)
    .sort(
      (a, b) =>
        new Date(a.decision_time).getTime() -
        new Date(b.decision_time).getTime()
    );

  const roundMap = new Map();
  sortedDecisionPoints.forEach((point, index) => {
    roundMap.set(point.decision_time, index + 1);
  });

  const sortedDisplayPoints = [...decisionPoints]
    .filter((point) => point.winners.length > 0)
    .sort(
      (a, b) =>
        new Date(b.decision_time).getTime() -
        new Date(a.decision_time).getTime()
    );

  return (
    <div className="tw-pt-2 lg:tw-pt-6 tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300">
      <div className="tw-relative">
        <div className="tw-absolute tw-left-2 lg:tw-left-[19px] tw-top-0 tw-bottom-0 tw-w-px tw-bg-iron-700/80"></div>

        <div className="tw-space-y-6">
          {sortedDisplayPoints.map((point) => {
            const date = new Date(point.decision_time);
            const formattedDate = format(date, "EEE, MMM d, yyyy");
            const formattedTime = format(date, "h:mm a");

            return (
              <div
                key={`decision-${point.decision_time}`}
                className="tw-relative group"
              >
                <div className="tw-absolute tw-left-0 lg:tw-left-3 tw-top-[0.3125rem] tw-z-10">
                  <div className="tw-size-4 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-bg-iron-800 tw-border tw-border-iron-700/50 tw-transition-all group-hover:tw-border-iron-500">
                    <div className="tw-rounded-full tw-bg-iron-500 tw-size-2 tw-transition-all group-hover:tw-bg-iron-400 group-hover:tw-size-2.5"></div>
                  </div>
                </div>

                <div className="tw-ml-6 lg:tw-ml-10 tw-mb-2 lg:tw-mb-3">
                  <div className="tw-flex tw-flex-wrap tw-items-baseline tw-gap-x-3 tw-gap-y-1">
                    <h3 className="tw-text-sm tw-text-iron-300 tw-font-medium tw-tracking-wide">
                      {formattedDate}
                    </h3>

                    <span className="tw-text-xs tw-text-iron-400 tw-font-light tw-tracking-wide">
                      {formattedTime}
                    </span>
                  </div>
                </div>

                <div className="tw-ml-6 tw-mb-6">
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

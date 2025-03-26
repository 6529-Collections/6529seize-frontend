import React from "react";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { ApiWave } from "../../../generated/models/ApiWave";
import { WaveSmallLeaderboardItemOutcomes } from "../small-leaderboard/WaveSmallLeaderboardItemOutcomes";
import { SingleWaveDropAuthor } from "./SingleWaveDropAuthor";
import { Time } from "../../../helpers/time";

interface SingleWaveDropInfoAuthorSectionProps {
  readonly drop: ExtendedDrop | undefined;
  readonly wave: ApiWave | null;
}

export const SingleWaveDropInfoAuthorSection: React.FC<
  SingleWaveDropInfoAuthorSectionProps
> = ({ drop, wave }) => {
  return (
    <div className="tw-flex tw-items-center tw-flex-wrap tw-gap-y-2 tw-gap-x-4 tw-justify-between">
      <div className="tw-flex tw-items-center tw-gap-x-2">
        {drop && <SingleWaveDropAuthor drop={drop} />}
        <div className="tw-flex tw-gap-x-2 tw-items-center">
          <div className="tw-w-[3px] tw-h-[3px] tw-bg-iron-600 tw-rounded-full tw-flex-shrink-0"></div>
          <p className="tw-text-xs tw-mb-0 tw-whitespace-nowrap tw-font-normal tw-leading-none tw-text-iron-500">
            {drop &&
              Time.millis(drop.created_at).toLocaleDropDateAndTimeString()}
          </p>
        </div>
      </div>
      {wave && drop && (
        <WaveSmallLeaderboardItemOutcomes drop={drop} wave={wave} />
      )}
    </div>
  );
};

"use client";

import { memo, useState } from "react";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { convertApiDropToExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useWaveBoostedDrops } from "@/hooks/useWaveBoostedDrops";
import { TimeWindow } from "@/types/boosted-drops.types";
import BoostedDropCard from "@/components/drops/view/BoostedDropCard";
import BoostIcon from "@/components/common/icons/BoostIcon";
import { WaveLeaderboardRightSidebarTimeWindowSelect } from "./WaveLeaderboardRightSidebarTimeWindowSelect";

interface WaveLeaderboardRightSidebarBoostedDropsProps {
  readonly wave: ApiWave;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

const MAX_BOOSTED_DROPS = 5;

export const WaveLeaderboardRightSidebarBoostedDrops =
  memo<WaveLeaderboardRightSidebarBoostedDropsProps>(
    ({ wave, onDropClick }) => {
      const [timeWindow, setTimeWindow] = useState<TimeWindow>(TimeWindow.DAY);

      const { data: boostedDrops, isLoading } = useWaveBoostedDrops({
        waveId: wave.id,
        limit: MAX_BOOSTED_DROPS,
        timeWindow,
      });

      const handleDropClick = (drop: ExtendedDrop) => {
        onDropClick(drop);
      };

      if (isLoading) {
        return (
          <div className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-pb-4">
            <div className="tw-mb-3 tw-flex tw-items-center tw-justify-between">
              <div className="tw-flex tw-items-center tw-gap-x-2">
                <BoostIcon className="tw-size-4 tw-text-amber-500" />
                <span className="tw-text-sm tw-font-semibold tw-text-iron-50">
                  Trending
                </span>
              </div>
              <WaveLeaderboardRightSidebarTimeWindowSelect
                value={timeWindow}
                onChange={setTimeWindow}
              />
            </div>
            <div className="tw-space-y-2">
              <div className="tw-h-14 tw-animate-pulse tw-rounded-xl tw-bg-iron-900" />
              <div className="tw-h-14 tw-animate-pulse tw-rounded-xl tw-bg-iron-900" />
              <div className="tw-h-14 tw-animate-pulse tw-rounded-xl tw-bg-iron-900" />
            </div>
          </div>
        );
      }

      if (!boostedDrops || boostedDrops.length === 0) {
        return (
          <div className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-pb-4">
            <div className="tw-mb-3 tw-flex tw-items-center tw-justify-between">
              <div className="tw-flex tw-items-center tw-gap-x-2">
                <BoostIcon className="tw-size-4 tw-text-amber-500" />
                <span className="tw-text-sm tw-font-semibold tw-text-iron-50">
                  Trending
                </span>
              </div>
              <WaveLeaderboardRightSidebarTimeWindowSelect
                value={timeWindow}
                onChange={setTimeWindow}
              />
            </div>
            <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-py-6 tw-text-center">
              <BoostIcon className="tw-mb-2 tw-size-8 tw-text-iron-600" />
              <p className="tw-mb-0 tw-text-sm tw-text-iron-500">
                No boosted drops yet
              </p>
            </div>
          </div>
        );
      }

      return (
        <div className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-pb-4">
          <div className="tw-mb-3 tw-flex tw-items-center tw-justify-between">
            <div className="tw-flex tw-items-center tw-gap-x-2">
              <BoostIcon className="tw-size-4 tw-text-amber-500" />
              <span className="tw-text-sm tw-font-semibold tw-text-iron-50">
                Trending
              </span>
            </div>
            <WaveLeaderboardRightSidebarTimeWindowSelect
              value={timeWindow}
              onChange={setTimeWindow}
            />
          </div>
          <div className="tw-space-y-2">
            {boostedDrops.map((drop, index) => (
              <BoostedDropCard
                key={drop.id}
                drop={drop}
                rank={index + 1}
                onClick={() =>
                  handleDropClick(convertApiDropToExtendedDrop(drop))
                }
              />
            ))}
          </div>
        </div>
      );
    }
  );

WaveLeaderboardRightSidebarBoostedDrops.displayName =
  "WaveLeaderboardRightSidebarBoostedDrops";

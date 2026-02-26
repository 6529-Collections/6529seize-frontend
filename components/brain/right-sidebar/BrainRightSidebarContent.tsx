import React from "react";

import WaveGroups from "@/components/waves/groups/WaveGroups";
import { WaveLeaderboardRightSidebarBoostedDrops } from "@/components/waves/leaderboard/sidebar/WaveLeaderboardRightSidebarBoostedDrops";
import WaveSpecs from "@/components/waves/specs/WaveSpecs";
import type { ApiWave } from "@/generated/models/ApiWave";

interface BrainRightSidebarContentProps {
  readonly wave: ApiWave;
}

const BrainRightSidebarContent: React.FC<BrainRightSidebarContentProps> = ({
  wave,
}) => {
  return (
    <div className="tw-flex tw-flex-col tw-overflow-y-auto">
      <div className="tw-px-4 tw-pt-4">
        <WaveLeaderboardRightSidebarBoostedDrops wave={wave} />
      </div>
      <WaveSpecs wave={wave} useRing={false} />
      <WaveGroups wave={wave} useRing={false} />
    </div>
  );
};

export default BrainRightSidebarContent;

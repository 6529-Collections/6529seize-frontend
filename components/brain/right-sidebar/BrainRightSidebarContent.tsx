import React from "react";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import WaveSpecs from "@/components/waves/specs/WaveSpecs";
import WaveGroups from "@/components/waves/groups/WaveGroups";
import { WaveLeaderboardRightSidebarBoostedDrops } from "@/components/waves/leaderboard/sidebar/WaveLeaderboardRightSidebarBoostedDrops";

interface BrainRightSidebarContentProps {
  readonly wave: ApiWave;
  readonly onDropClick?: ((drop: ExtendedDrop) => void) | undefined;
}

const BrainRightSidebarContent: React.FC<BrainRightSidebarContentProps> = ({
  wave,
  onDropClick,
}) => {
  return (
    <div className="tw-flex tw-flex-col tw-overflow-y-auto">
      {onDropClick && (
        <div className="tw-px-4 tw-pt-4">
          <WaveLeaderboardRightSidebarBoostedDrops
            wave={wave}
            onDropClick={onDropClick}
          />
        </div>
      )}
      <WaveSpecs wave={wave} useRing={false} />
      <WaveGroups wave={wave} useRing={false} />
    </div>
  );
};

export default BrainRightSidebarContent;

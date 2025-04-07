import React from "react";
import { ApiWave } from "../../../generated/models/ApiWave";
import WaveSpecs from "../../waves/specs/WaveSpecs";
import WaveGroups from "../../waves/groups/WaveGroups";

interface BrainRightSidebarContentProps {
  readonly wave: ApiWave;
}

const BrainRightSidebarContent: React.FC<BrainRightSidebarContentProps> = ({
  wave,
}) => {
  return (
    <div className="tw-flex tw-flex-col">
      <WaveSpecs wave={wave} useRing={false} />
      <WaveGroups wave={wave} useRing={false} />
    </div>
  );
};

export default BrainRightSidebarContent;

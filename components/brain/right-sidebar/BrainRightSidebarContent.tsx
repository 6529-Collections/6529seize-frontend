import React from "react";
import { ApiWave } from "../../../generated/models/ApiWave";
import WaveSpecs from "../../waves/detailed/specs/WaveSpecs";
import WaveGroups from "../../waves/detailed/groups/WaveGroups";

interface BrainRightSidebarContentProps {
  readonly wave: ApiWave;
}

const BrainRightSidebarContent: React.FC<BrainRightSidebarContentProps> = ({
  wave,
}) => {
  return (
    <>
      <WaveSpecs wave={wave} useRing={false} />
      <WaveGroups wave={wave} useRing={false} />
    </>
  );
};

export default BrainRightSidebarContent;
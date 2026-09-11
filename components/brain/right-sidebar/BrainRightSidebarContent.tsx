import React from "react";
import type { ApiWave } from "@/generated/models/ApiWave";
import WaveSpecs from "@/components/waves/specs/WaveSpecs";

interface BrainRightSidebarContentProps {
  readonly wave: ApiWave;
}

const BrainRightSidebarContent: React.FC<BrainRightSidebarContentProps> = ({
  wave,
}) => {
  return (
    <div className="tw-flex tw-min-w-0 tw-flex-col">
      <WaveSpecs wave={wave} useRing={false} />
    </div>
  );
};

export default BrainRightSidebarContent;

import React from "react";
import type { ApiWave } from "@/generated/models/ApiWave";
import WaveFollowersList from "@/components/waves/followers/WaveFollowersList";

interface BrainRightSidebarFollowersProps {
  readonly wave: ApiWave;
  readonly closeFollowers: () => void;
}

const BrainRightSidebarFollowers: React.FC<BrainRightSidebarFollowersProps> = ({
  wave,
  closeFollowers,
}) => {
  return <WaveFollowersList wave={wave} onBackClick={closeFollowers} />;
};

export default BrainRightSidebarFollowers;

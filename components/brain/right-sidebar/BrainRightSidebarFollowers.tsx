import React from "react";
import { ApiWave } from "../../../generated/models/ApiWave";
import WaveDetailedFollowers from "../../waves/detailed/followers/WaveDetailedFollowers";

interface BrainRightSidebarFollowersProps {
  readonly wave: ApiWave;
  readonly closeFollowers: () => void;
}

const BrainRightSidebarFollowers: React.FC<BrainRightSidebarFollowersProps> = ({
  wave,
  closeFollowers,
}) => {
  return <WaveDetailedFollowers wave={wave} onBackClick={closeFollowers} />;
};

export default BrainRightSidebarFollowers;

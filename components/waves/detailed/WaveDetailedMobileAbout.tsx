import React, { useState } from "react";
import { Wave } from "../../../generated/models/Wave";
import { WaveDetailedView } from "./WaveDetailed";
import { WaveDetailedMobileView } from "./WaveDetailedMobile";
import WaveHeader from "./header/WaveHeader";
import WaveSpecs from "./specs/WaveSpecs";
import WaveGroups from "./groups/WaveGroups";
import WaveRequiredMetadata from "./metadata/WaveRequiredMetadata";
import WaveRequiredTypes from "./types/WaveRequiredTypes";
import WaveLeaderboard from "./leaderboard/WaveLeaderboard";
import WaveOutcomes from "./outcome/WaveOutcomes";
import { motion } from "framer-motion";
import { AnimatePresence } from "framer-motion";
import WaveDetailedFollowingWaves from "./WaveDetailedFollowingWaves";
import WaveDetailedAbout from "./WaveDetailedAbout";

interface WaveDetailedMobileAboutProps {
  readonly wave: Wave;
  readonly showRequiredMetadata: boolean;
  readonly showRequiredTypes: boolean;
  readonly setView: (view: WaveDetailedView) => void;
  readonly setActiveView: (view: WaveDetailedMobileView) => void;
}

const WaveDetailedMobileAbout: React.FC<WaveDetailedMobileAboutProps> = ({
  wave,
  showRequiredMetadata,
  showRequiredTypes,
  setView,
  setActiveView,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  return (
    <div className="tw-px-4 md:tw-px-2 tw-mt-4">
      <div className="tw-h-[calc(100vh-10.75rem)] tw-overflow-y-auto no-scrollbar tw-space-y-4 tw-pb-4">
        <WaveDetailedAbout
          wave={wave}
          setView={setView}
          setActiveView={setActiveView}
          showRequiredMetadata={showRequiredMetadata}
          showRequiredTypes={showRequiredTypes}
        />
      </div>
    </div>
  );
};

export default WaveDetailedMobileAbout;

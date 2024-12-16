import React, { useState } from "react";
import { ApiWave } from "../../../generated/models/ApiWave";
import WaveHeader from "./header/WaveHeader";
import { AnimatePresence, motion } from "framer-motion";

import WaveSpecs from "./specs/WaveSpecs";
import WaveRequiredTypes from "./types/WaveRequiredTypes";
import WaveRequiredMetadata from "./metadata/WaveRequiredMetadata";
import WaveDetailedFollowingWaves from "./WaveDetailedFollowingWaves";
import WaveGroups from "./groups/WaveGroups";
import { WaveDetailedView } from "./WaveDetailed";
import { WaveDetailedMobileView } from "./WaveDetailedMobile";

interface WaveDetailedAboutProps {
  readonly wave: ApiWave;
  readonly setView: (view: WaveDetailedView) => void;
  readonly setActiveView?: (view: WaveDetailedMobileView) => void;
  readonly showRequiredMetadata: boolean;
  readonly showRequiredTypes: boolean;
  readonly onWaveChange: (wave: ApiWave) => void;
  readonly setIsLoading: (isLoading: boolean) => void;
}

const WaveDetailedAbout: React.FC<WaveDetailedAboutProps> = ({
  wave,
  setView,
  setActiveView,
  showRequiredMetadata,
  showRequiredTypes,
  onWaveChange,
  setIsLoading,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleWaveChange = (newWave: ApiWave) => {
    setIsLoading(true);
    onWaveChange(newWave);
    setActiveView?.(WaveDetailedMobileView.CHAT);
    setTimeout(() => {
      setIsLoading(false);
    }, 300);
  };

  return (
    <>
      <WaveHeader
        wave={wave}
        onFollowersClick={() => {
          setView(WaveDetailedView.FOLLOWERS);
          setActiveView?.(WaveDetailedMobileView.CHAT);
        }}
      />
      <button
        onClick={toggleExpand}
        type="button"
        className={`tw-w-full tw-group tw-mt-4 tw-ring-1 tw-ring-iron-800 tw-ring-inset hover:tw-ring-primary-400/30 tw-flex tw-justify-between tw-items-center tw-font-medium tw-py-3 tw-px-5 tw-rounded-xl tw-bg-iron-950 tw-transition-all tw-duration-300 tw-border-0 ${
          isExpanded
            ? "tw-text-primary-300"
            : "tw-text-iron-300 hover:tw-text-primary-300"
        }`}
        aria-expanded={isExpanded}
      >
        <span className="tw-text-sm">Wave Info</span>
        <svg
          className={`tw-size-5 tw-transition-all tw-duration-300 ${
            isExpanded
              ? "tw-rotate-180 tw-text-primary-300"
              : "tw-text-iron-400 group-hover:tw-text-primary-300 tw-rotate-90"
          }`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          aria-hidden="true"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m4.5 15.75 7.5-7.5 7.5 7.5"
          />
        </svg>
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="tw-space-y-4 tw-mt-2">
              <WaveSpecs wave={wave} />
              <WaveGroups wave={wave} />
              {showRequiredMetadata && <WaveRequiredMetadata wave={wave} />}
              {showRequiredTypes && <WaveRequiredTypes wave={wave} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <WaveDetailedFollowingWaves
        activeWaveId={wave.id}
        onWaveChange={handleWaveChange}
        setActiveView={setActiveView || (() => {})}
        setIsLoading={setIsLoading}
      />
    </>
  );
};

export default WaveDetailedAbout;

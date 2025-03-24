import React, { useState } from "react";
import { motion } from "framer-motion";
import { DecisionPoint } from "../../../../helpers/waves/time.types";
import { HorizontalTimeline } from "./HorizontalTimeline";

interface ExpandedTimelineContentProps {
  readonly decisions: DecisionPoint[];
  readonly nextDecisionTime: number | null;
}

/**
 * Renders the expanded content of the timeline
 */
export const ExpandedTimelineContent: React.FC<ExpandedTimelineContentProps> = ({
  decisions,
  nextDecisionTime
}) => {
  const [animationComplete, setAnimationComplete] = useState(false);
  
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3 }}
      onAnimationComplete={() => setAnimationComplete(true)}
      className="tw-bg-iron-950"
    >
      {/* Horizontal Timeline View */}
      <div className="tw-px-3 tw-py-4">
        <HorizontalTimeline 
          decisions={decisions} 
          nextDecisionTime={nextDecisionTime}
          animationComplete={animationComplete}
        />
      </div>
    </motion.div>
  );
};

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ApiWave } from "../../../generated/models/ApiWave";
import { useDecisionPoints } from "../../../hooks/waves/useDecisionPoints";
import { AnimatePresence } from "framer-motion";
import { TimelineToggleHeader } from "./time/TimelineToggleHeader";
import { ExpandedTimelineContent } from "./time/ExpandedTimelineContent";
import { CompactDroppingPhaseCard } from "./time/CompactDroppingPhaseCard";
import { CompactVotingPhaseCard } from "./time/CompactVotingPhaseCard";
import { useWave } from "../../../hooks/useWave";
import { Time } from "../../../helpers/time";

interface WaveLeaderboardTimeProps {
  readonly wave: ApiWave;
}

/**
 * Component for displaying wave time information focusing on next winner announcement
 * in a compact format with expandable timeline
 */
const AUTO_EXPAND_LIMIT = 5;

export const WaveLeaderboardTime: React.FC<WaveLeaderboardTimeProps> = ({
  wave,
}) => {
  // Using decision points hooks
  const {
    allDecisions,
    hasMorePast,
    hasMoreFuture,
    loadMorePast,
    loadMoreFuture,
    remainingPastCount,
    remainingFutureCount,
  } = useDecisionPoints(wave, {
    initialPastWindow: 4,
    initialFutureWindow: 20,
  });
  const {
    decisions: { multiDecision },
    pauses: { showPause, filterDecisionsDuringPauses },
  } = useWave(wave);

  // Track expanded/collapsed state for decjusision details
  const [isDecisionDetailsOpen, setIsDecisionDetailsOpen] =
    useState<boolean>(false);
  const [autoExpandFutureAttempts, setAutoExpandFutureAttempts] =
    useState<number>(0);
  const [timelineFocus, setTimelineFocus] = useState<"start" | "end" | null>(
    null
  );

  useEffect(() => {
    if (!isDecisionDetailsOpen && timelineFocus !== null) {
      setTimelineFocus(null);
    }
  }, [isDecisionDetailsOpen, timelineFocus]);

  // Filter out decisions that occur during pause periods using the helper from useWave
  const filteredDecisions = useMemo(() => {
    // Convert DecisionPoint[] to ApiWaveDecision[] format for the filter function
    const decisionsAsApiFormat = allDecisions.map(
      (decision) =>
        ({
          decision_time: decision.timestamp,
          // Add other required fields if needed
        } as any)
    );

    // Apply the filter
    const filtered = filterDecisionsDuringPauses(decisionsAsApiFormat);

    // Convert back to DecisionPoint[] format
    return allDecisions.filter((decision) =>
      filtered.some((f) => f.decision_time === decision.timestamp)
    );
  }, [allDecisions, filterDecisionsDuringPauses]);

  // Get the next valid decision time (excluding paused decisions)
  const nextDecisionTime =
    filteredDecisions.find(
      (decision) => decision.timestamp > Time.currentMillis()
    )?.timestamp ?? null;

  // Ensure we have at least one upcoming decision available for countdowns
  useEffect(() => {
    const now = Time.currentMillis();
    const hasUpcoming = filteredDecisions.some(
      (decision) => decision.timestamp > now
    );

    if (hasUpcoming) {
      if (autoExpandFutureAttempts !== 0) {
        setAutoExpandFutureAttempts(0);
      }
      return;
    }

    if (hasMoreFuture && autoExpandFutureAttempts < AUTO_EXPAND_LIMIT) {
      setAutoExpandFutureAttempts((prev) => prev + 1);
      loadMoreFuture();
      return;
    }

    if (!hasMoreFuture && autoExpandFutureAttempts !== 0) {
      setAutoExpandFutureAttempts(0);
    }
  }, [
    filteredDecisions,
    hasMoreFuture,
    loadMoreFuture,
    autoExpandFutureAttempts,
  ]);

  const handleLoadMorePast = () => {
    if (hasMorePast) {
      setTimelineFocus("start");
      loadMorePast();
    }
  };

  const handleLoadMoreFuture = () => {
    if (hasMoreFuture) {
      setTimelineFocus("end");
      loadMoreFuture();
    }
  };

  return (
    <div className="tw-mb-2 lg:tw-mb-4">
      {multiDecision ? (
        // For multi-decision and memes waves: Show expandable timeline
        <div className="tw-rounded-lg tw-bg-iron-950 tw-overflow-hidden">
          {/* Timeline header with title and countdown */}
          <TimelineToggleHeader
            isOpen={isDecisionDetailsOpen}
            setIsOpen={setIsDecisionDetailsOpen}
            nextDecisionTime={nextDecisionTime}
            isPaused={!!showPause(nextDecisionTime)}
            currentPause={showPause(nextDecisionTime)}
            wave={wave}
          />

          {/* Expandable timeline section */}
          <AnimatePresence>
            {isDecisionDetailsOpen && (
              <ExpandedTimelineContent
                decisions={filteredDecisions}
                nextDecisionTime={nextDecisionTime}
                onLoadMorePast={hasMorePast ? handleLoadMorePast : undefined}
                onLoadMoreFuture={hasMoreFuture ? handleLoadMoreFuture : undefined}
                hasMorePast={hasMorePast}
                hasMoreFuture={hasMoreFuture}
                remainingPastCount={remainingPastCount}
                remainingFutureCount={remainingFutureCount}
                focus={timelineFocus}
                onFocusHandled={() => setTimelineFocus(null)}
              />
            )}
          </AnimatePresence>
        </div>
      ) : (
        // For regular waves: Show phase cards directly in the header
        <div className="tw-rounded-lg tw-bg-iron-950 tw-px-3 tw-py-2 tw-overflow-hidden">
          <div className="tw-flex tw-items-center tw-gap-2">
            <CompactDroppingPhaseCard wave={wave} />
            <CompactVotingPhaseCard wave={wave} />
          </div>
        </div>
      )}
    </div>
  );
};

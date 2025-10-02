"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ApiWave } from "@/generated/models/ApiWave";
import { useDecisionPoints } from "@/hooks/waves/useDecisionPoints";
import { AnimatePresence } from "framer-motion";
import { TimelineToggleHeader } from "./time/TimelineToggleHeader";
import { ExpandedTimelineContent } from "./time/ExpandedTimelineContent";
import { CompactDroppingPhaseCard } from "./time/CompactDroppingPhaseCard";
import { CompactVotingPhaseCard } from "./time/CompactVotingPhaseCard";
import { useWave } from "@/hooks/useWave";
import { Time } from "@/helpers/time";

interface WaveLeaderboardTimeProps {
  readonly wave: ApiWave;
}

const AUTO_EXPAND_LIMIT = 5;

export const WaveLeaderboardTime: React.FC<WaveLeaderboardTimeProps> = ({
  wave,
}) => {
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

  const filteredDecisions = useMemo(() => {
    type PauseDecisionLike = { decision_time: number };

    const decisionsAsApiFormat: PauseDecisionLike[] = allDecisions.map(
      (decision): PauseDecisionLike => ({
        decision_time: decision.timestamp,
      })
    );

    const filtered = filterDecisionsDuringPauses(decisionsAsApiFormat);
    const allowedDecisionTimes = new Set<number>(
      filtered.map((filteredDecision) => filteredDecision.decision_time)
    );

    return allDecisions.filter((decision) =>
      allowedDecisionTimes.has(decision.timestamp)
    );
  }, [allDecisions, filterDecisionsDuringPauses]);

  const nextDecisionTime =
    filteredDecisions.find(
      (decision) => decision.timestamp > Time.currentMillis()
    )?.timestamp ?? null;

  useEffect(() => {
    if (nextDecisionTime !== null) {
      if (autoExpandFutureAttempts !== 0) {
        setAutoExpandFutureAttempts(0);
      }
      return;
    }

    if (!hasMoreFuture) {
      if (autoExpandFutureAttempts !== 0) {
        setAutoExpandFutureAttempts(0);
      }
      return;
    }

    if (autoExpandFutureAttempts >= AUTO_EXPAND_LIMIT) {
      return;
    }

    const timeoutId = globalThis.setTimeout(() => {
      setAutoExpandFutureAttempts((prev) => prev + 1);
      loadMoreFuture();
    }, 50);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [
    nextDecisionTime,
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

  const onTimelineFocusHandled = useCallback(() => {
    setTimelineFocus(null);
  }, []);

  return (
    <div className="tw-mb-2 lg:tw-mb-4">
      {multiDecision ? (
        <div className="tw-rounded-lg tw-bg-iron-950 tw-overflow-hidden">
          {(() => {
            const currentPause = showPause(nextDecisionTime);

            return (
              <TimelineToggleHeader
                isOpen={isDecisionDetailsOpen}
                setIsOpen={setIsDecisionDetailsOpen}
                nextDecisionTime={nextDecisionTime}
                isPaused={Boolean(currentPause)}
                currentPause={currentPause}
                wave={wave}
              />
            );
          })()}

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
                onFocusHandled={onTimelineFocusHandled}
              />
            )}
          </AnimatePresence>
        </div>
      ) : (
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

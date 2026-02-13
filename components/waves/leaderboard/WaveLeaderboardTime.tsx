"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ApiWave } from "@/generated/models/ApiWave";
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
    isCurationWave,
    pauses: { showPause, filterDecisionsDuringPauses },
  } = useWave(wave);

  const [isDecisionDetailsOpen, setIsDecisionDetailsOpen] =
    useState<boolean>(false);
  const autoExpandFutureAttemptsRef = useRef(0);
  const [timelineFocus, setTimelineFocus] = useState<"start" | "end" | null>(
    null
  );

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
      autoExpandFutureAttemptsRef.current = 0;
      return;
    }

    if (!hasMoreFuture) {
      autoExpandFutureAttemptsRef.current = 0;
      return;
    }

    if (autoExpandFutureAttemptsRef.current >= AUTO_EXPAND_LIMIT) {
      return;
    }

    let timeoutId: ReturnType<typeof globalThis.setTimeout> | null = null;
    let isCancelled = false;

    const tick = () => {
      if (isCancelled) {
        return;
      }

      if (autoExpandFutureAttemptsRef.current >= AUTO_EXPAND_LIMIT) {
        return;
      }

      autoExpandFutureAttemptsRef.current += 1;
      loadMoreFuture();
      timeoutId = globalThis.setTimeout(tick, 50);
    };

    timeoutId = globalThis.setTimeout(tick, 50);

    return () => {
      isCancelled = true;
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    };
  }, [
    nextDecisionTime,
    hasMoreFuture,
    loadMoreFuture,
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

  const handleDecisionDetailsOpenChange = useCallback((isOpen: boolean) => {
    setIsDecisionDetailsOpen(isOpen);
    if (!isOpen) {
      setTimelineFocus(null);
    }
  }, []);

  return (
    <div>
      {multiDecision ? (
        <div className="tw-mt-2 tw-overflow-hidden tw-rounded-lg tw-bg-iron-950 md:tw-mt-4">
          {(() => {
            const currentPause = showPause(nextDecisionTime);

            return (
              <TimelineToggleHeader
                isOpen={isDecisionDetailsOpen}
                setIsOpen={handleDecisionDetailsOpenChange}
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
                onLoadMoreFuture={
                  hasMoreFuture ? handleLoadMoreFuture : undefined
                }
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
        !isCurationWave && (
          <div className="tw-overflow-hidden tw-rounded-lg tw-bg-iron-950 tw-px-3 tw-py-2">
            <div className="tw-flex tw-items-center tw-gap-2">
              <CompactDroppingPhaseCard wave={wave} />
              <CompactVotingPhaseCard wave={wave} />
            </div>
          </div>
        )
      )}
    </div>
  );
};

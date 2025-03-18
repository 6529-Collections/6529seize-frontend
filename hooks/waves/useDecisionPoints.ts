import { useState, useEffect } from "react";
import { ApiWave } from "../../generated/models/ApiWave";
import { Time } from "../../helpers/time";
import { DecisionPoint } from "../../helpers/waves/time.types";
import { TimeLeft, calculateTimeLeft, isTimeZero } from "../../helpers/waves/time.utils";

/**
 * Hook to manage decision points and time tracking for multi-decision waves
 */
export const useDecisionPoints = (wave: ApiWave) => {
  // Check for multi-decision wave
  const isMultiDecisionWave =
    !!wave.wave.decisions_strategy &&
    wave.wave.decisions_strategy.subsequent_decisions.length > 0;

  // Check for rolling wave
  const isRollingWave =
    isMultiDecisionWave && !!wave.wave.decisions_strategy?.is_rolling;



  // Track next decision point time for multi-decision waves
  const [nextDecisionTime, setNextDecisionTime] = useState<number | null>(
    wave.wave.next_decision_time || null
  );

  // Track all decision points for multi-decision waves (past and upcoming)
  const [allDecisions, setAllDecisions] = useState<DecisionPoint[]>([]);
  
  // Track upcoming decision points for multi-decision waves
  const [upcomingDecisions, setUpcomingDecisions] = useState<DecisionPoint[]>(
    []
  );

  // Current cycle count for rolling waves
  const [currentCycle, setCurrentCycle] = useState<number>(1);

  // Track time left until next decision for multi-decision waves
  const [nextDecisionTimeLeft, setNextDecisionTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Calculate upcoming decision points for multi-decision waves
  useEffect(() => {
    if (isMultiDecisionWave && wave.wave.decisions_strategy) {
      const strategy = wave.wave.decisions_strategy;
      const firstDecisionTime = strategy.first_decision_time;
      const subsequentDecisions = strategy.subsequent_decisions;

      // Calculate future decision points
      const decisions: DecisionPoint[] = [];

      // Add first decision point
      decisions.push({
        id: 1,
        name: "First Decision",
        timestamp: firstDecisionTime,
      });

      // Add subsequent decision points
      let currentTime = firstDecisionTime;
      for (let i = 0; i < subsequentDecisions.length; i++) {
        currentTime += subsequentDecisions[i];
        decisions.push({
          id: i + 2,
          name: `Decision ${i + 2}`,
          timestamp: currentTime,
        });
      }

      // For rolling waves, calculate additional cycles if needed
      if (isRollingWave && subsequentDecisions.length > 0) {
        const cycleStartTime = currentTime;

        // Add 2 more cycles for display purposes
        for (let cycle = 2; cycle <= 3; cycle++) {
          for (let i = 0; i < subsequentDecisions.length; i++) {
            currentTime += subsequentDecisions[i];
            decisions.push({
              id: cycle * subsequentDecisions.length + i + 1,
              name: `Cycle ${cycle}, Decision ${i + 1}`,
              timestamp: currentTime,
            });
          }
        }
      }

      // Mark decisions as past or future
      const now = Time.currentMillis();
      
      // Store all decisions with status indicator
      const decisionsWithStatus = decisions.map(d => ({
        ...d,
        isPast: d.timestamp <= now
      }));
      
      // Store all decisions for the timeline
      setAllDecisions(decisionsWithStatus);
      
      // Filter to get only future decisions
      const futureDecisions = decisionsWithStatus.filter((d) => !d.isPast);

      // Calculate current cycle for rolling waves
      if (isRollingWave && decisions.length > 0) {
        const passedDecisions = decisionsWithStatus.filter(d => d.isPast).length;
        const decisionsPerCycle = subsequentDecisions.length + 1; // First + subsequent
        const currentCycleNumber =
          Math.floor(passedDecisions / decisionsPerCycle) + 1;
        setCurrentCycle(currentCycleNumber);
      }

      setUpcomingDecisions(futureDecisions.slice(0, 3)); // Store up to 3 future decision points

      // Set the next decision time
      if (futureDecisions.length > 0) {
        setNextDecisionTime(futureDecisions[0].timestamp);
      } else {
        // No future decisions but we still want to show the timeline
        setNextDecisionTime(null);
      }
    }
  }, [wave, isMultiDecisionWave, isRollingWave]);

  // Update next decision time countdown for multi-decision waves
  useEffect(() => {
    if (isMultiDecisionWave && nextDecisionTime) {
      const updateNextDecisionTime = () => {
        const timeLeft = calculateTimeLeft(nextDecisionTime);
        setNextDecisionTimeLeft(timeLeft);

        // If the next decision time has passed, recalculate upcoming decisions
        if (isTimeZero(timeLeft)) {
          // We'd typically fetch the updated wave data from the API here
          // For now, we'll just shift our upcoming decisions
          if (upcomingDecisions.length > 1) {
            setNextDecisionTime(upcomingDecisions[1].timestamp);
            setUpcomingDecisions(upcomingDecisions.slice(1));

            if (isRollingWave) {
              // For rolling waves, we need to calculate the next cycle
              const newCycle =
                currentCycle +
                (upcomingDecisions[0].id %
                  wave.wave.decisions_strategy!.subsequent_decisions.length ===
                0
                  ? 1
                  : 0);
              setCurrentCycle(newCycle);
            }
          }
        }
      };

      updateNextDecisionTime();
      const decisionTimer = setInterval(updateNextDecisionTime, 1000);

      return () => clearInterval(decisionTimer);
    }
  }, [
    isMultiDecisionWave,
    nextDecisionTime,
    upcomingDecisions,
    isRollingWave,
    currentCycle,
    wave,
  ]);

  return {
    nextDecisionTime,
    upcomingDecisions,
    allDecisions,
    nextDecisionTimeLeft,
  };
};

import { useState, useEffect } from "react";
import { ApiWave } from "../generated/models/ApiWave";
import { Time } from "../helpers/time";
import { TimeLeft, calculateTimeLeft } from "../helpers/waves/time.utils";
import { PhaseState } from "./useWave";

/**
 * Timer results interface
 */
export interface WaveTimersResult {
  // Participation time information
  participation: {
    phase: PhaseState;
    timeLeft: TimeLeft;
    isUpcoming: boolean;
    isInProgress: boolean;
    isCompleted: boolean;
  };
  
  // Voting time information
  voting: {
    phase: PhaseState;
    timeLeft: TimeLeft;
    isUpcoming: boolean;
    isInProgress: boolean;
    isCompleted: boolean;
  };
}

/**
 * Calculates the timestamp of the last decision point in a wave.
 * This considers the wave type (single decision, multi-decision, or rolling)
 * and determines when voting will actually end.
 */
function calculateLastDecisionTime(wave: ApiWave | null | undefined): number {
  if (!wave) return 0;

  // Get basic decision strategy data
  const firstDecisionTime = wave.wave.decisions_strategy?.first_decision_time;
  const subsequentDecisions =
    wave.wave.decisions_strategy?.subsequent_decisions || [];
  const isRolling = wave.wave.decisions_strategy?.is_rolling || false;
  const votingEndTime = wave.voting.period?.max || Time.currentMillis();

  // If no first decision time is set, use the voting end time
  if (!firstDecisionTime) return votingEndTime;

  // Case 1: Single decision wave (no subsequent decisions)
  if (subsequentDecisions.length === 0) {
    // For single decision waves, the end time is the first decision time
    // But make sure it's not after the voting end time
    return Math.min(firstDecisionTime, votingEndTime);
  }

  // Case 2: Multi-decision waves (fixed number of decisions)
  if (!isRolling) {
    // Calculate the last decision time by adding all intervals
    let lastDecisionTime = firstDecisionTime;
    for (const interval of subsequentDecisions) {
      lastDecisionTime += interval;
    }
    // But make sure it's not after the voting end time
    return Math.min(lastDecisionTime, votingEndTime);
  }

  // Case 3: Rolling waves (decisions repeat until end time)
  // For rolling waves, we need to calculate how many decision cycles
  // will occur before the voting end time

  // Calculate the total length of one decision cycle
  const cycleLength = subsequentDecisions.reduce(
    (sum, interval) => sum + interval,
    0
  );

  // If the first decision is after the end time, there are no decisions
  if (firstDecisionTime > votingEndTime) {
    return votingEndTime;
  }

  // Calculate time remaining after first decision
  const timeRemainingAfterFirst = votingEndTime - firstDecisionTime;

  // If there's no complete cycle, calculate the last decision within this partial cycle
  if (timeRemainingAfterFirst <= 0) {
    return firstDecisionTime;
  }

  // Calculate complete cycles that fit within the remaining time
  const completeCycles = Math.floor(timeRemainingAfterFirst / cycleLength);

  // Calculate time for partial cycle
  const remainingTime = timeRemainingAfterFirst % cycleLength;

  // Start with the time after all complete cycles
  let lastDecisionTime = firstDecisionTime + completeCycles * cycleLength;

  // Process partial cycle - find the last decision that fits
  let accumulatedTime = 0;
  for (const interval of subsequentDecisions) {
    accumulatedTime += interval;
    if (accumulatedTime <= remainingTime) {
      lastDecisionTime += interval;
    } else {
      break;
    }
  }

  return lastDecisionTime;
}

/**
 * Hook for handling timers in waves.
 * 
 * This hook is designed to be used separately from useWave to control interval timers.
 * Timers are always active when this hook is used.
 * 
 * @param wave The wave object
 * @returns Timer states
 */
export function useWaveTimers(
  wave: ApiWave | null | undefined
): WaveTimersResult {
  // Extract time period boundaries or default to current time
  const participationStartTime =
    wave?.participation.period?.min ?? Time.currentMillis();
  const participationEndTime =
    wave?.participation.period?.max ?? Time.currentMillis();
  const votingStartTime = wave?.voting.period?.min ?? Time.currentMillis();
  
  // Calculate the actual voting end time
  const actualVotingEndTime = wave ? calculateLastDecisionTime(wave) : Time.currentMillis();

  // State for participation phase
  const [participationPhase, setParticipationPhase] =
    useState<PhaseState>("UPCOMING");
  const [participationTimeLeft, setParticipationTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // State for voting phase
  const [votingTimePhase, setVotingTimePhase] =
    useState<PhaseState>("UPCOMING");
  const [votingTimeLeft, setVotingTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Helper function for one-time calculation of participation time state
  const calculateParticipationTimeState = (): {
    phase: PhaseState;
    timeLeft: TimeLeft;
  } => {
    const now = Time.currentMillis();

    // Determine phase state
    let newPhaseState: PhaseState;
    if (participationStartTime > now) {
      newPhaseState = "UPCOMING";
    } else if (participationEndTime < now) {
      newPhaseState = "COMPLETED";
    } else {
      newPhaseState = "IN_PROGRESS";
    }

    // Calculate time left
    let timeLeft: TimeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };
    if (newPhaseState !== "COMPLETED") {
      const targetTime =
        newPhaseState === "UPCOMING"
          ? participationStartTime
          : participationEndTime;
      timeLeft = calculateTimeLeft(targetTime);
    }

    return { phase: newPhaseState, timeLeft };
  };

  // Helper function for one-time calculation of voting time state
  const calculateVotingTimeState = (): {
    phase: PhaseState;
    timeLeft: TimeLeft;
  } => {
    const now = Time.currentMillis();

    // Determine phase state
    let newPhaseState: PhaseState;
    if (votingStartTime > now) {
      newPhaseState = "UPCOMING";
    } else if (actualVotingEndTime < now) {
      newPhaseState = "COMPLETED";
    } else {
      newPhaseState = "IN_PROGRESS";
    }

    // Calculate time left
    let timeLeft: TimeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };
    if (newPhaseState !== "COMPLETED") {
      const targetTime =
        newPhaseState === "UPCOMING" ? votingStartTime : actualVotingEndTime;
      timeLeft = calculateTimeLeft(targetTime);
    }

    return { phase: newPhaseState, timeLeft };
  };

  // Initial calculation and setup of timers
  useEffect(() => {
    if (!wave) return;
    
    // Do initial calculations
    const { phase: participationPhaseState, timeLeft: participationTimeLeftState } = calculateParticipationTimeState();
    setParticipationPhase(participationPhaseState);
    setParticipationTimeLeft(participationTimeLeftState);
    
    const { phase: votingPhaseState, timeLeft: votingTimeLeftState } = calculateVotingTimeState();
    setVotingTimePhase(votingPhaseState);
    setVotingTimeLeft(votingTimeLeftState);
    
    // Set up intervals
    const updateParticipationTime = () => {
      const { phase, timeLeft } = calculateParticipationTimeState();
      setParticipationPhase(phase);
      setParticipationTimeLeft(timeLeft);
    };
    
    const updateVotingTime = () => {
      const { phase, timeLeft } = calculateVotingTimeState();
      setVotingTimePhase(phase);
      setVotingTimeLeft(timeLeft);
    };
    
    const participationTimer = setInterval(updateParticipationTime, 1000);
    const votingTimer = setInterval(updateVotingTime, 1000);
    
    // Clean up intervals on unmount
    return () => {
      clearInterval(participationTimer);
      clearInterval(votingTimer);
    };
  }, [
    wave,
    participationStartTime,
    participationEndTime,
    votingStartTime,
    actualVotingEndTime,
  ]);

  return {
    participation: {
      phase: participationPhase,
      timeLeft: participationTimeLeft,
      isUpcoming: participationPhase === "UPCOMING",
      isInProgress: participationPhase === "IN_PROGRESS",
      isCompleted: participationPhase === "COMPLETED",
    },
    voting: {
      phase: votingTimePhase,
      timeLeft: votingTimeLeft,
      isUpcoming: votingTimePhase === "UPCOMING",
      isInProgress: votingTimePhase === "IN_PROGRESS",
      isCompleted: votingTimePhase === "COMPLETED",
    },
  };
}
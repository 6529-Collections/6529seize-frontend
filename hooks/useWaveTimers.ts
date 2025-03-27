import { useState, useEffect } from "react";
import { ApiWave } from "../generated/models/ApiWave";
import { Time } from "../helpers/time";
import {
  TimeLeft,
  calculateTimeLeft,
  calculateLastDecisionTime,
  FALLBACK_START_TIME,
  FALLBACK_END_TIME,
} from "../helpers/waves/time.utils";

export type PhaseState = "UPCOMING" | "IN_PROGRESS" | "COMPLETED";

/**
 * Timer results interface
 */
export interface WaveTimersResult {
  // Participation time information
  participation: {
    timeLeft: TimeLeft;
    isUpcoming: boolean;
    isInProgress: boolean;
    isCompleted: boolean;
  };

  // Voting time information
  voting: {
    timeLeft: TimeLeft;
    isUpcoming: boolean;
    isInProgress: boolean;
    isCompleted: boolean;
  };

  // Decisions information
  decisions: {
    firstDecisionDone: boolean;
  };
}

// Using the shared constants from time.utils.ts

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
  // Extract time period boundaries with stable fallback values
  const participationStartTime =
    wave?.participation.period?.min ?? FALLBACK_START_TIME;
  const participationEndTime =
    wave?.participation.period?.max ?? FALLBACK_END_TIME;
  const votingStartTime = wave?.voting.period?.min ?? FALLBACK_START_TIME;

  // Calculate the actual voting end time with stable fallback
  const actualVotingEndTime = wave
    ? calculateLastDecisionTime(wave)
    : FALLBACK_END_TIME;


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

  // State for first decision status
  const [isFirstDecisionDone, setIsFirstDecisionDone] =
    useState<boolean>(false);

  // Helper function for one-time calculation of participation time state
  const calculateParticipationTimeState = (): {
    phase: PhaseState;
    timeLeft: TimeLeft;
  } => {
    const now = Time.currentMillis(); // This is ok here as it's only used inside the timer callback

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
    const now = Time.currentMillis(); // This is ok here as it's only used inside the timer callback

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

  // Helper function to determine if first decision is done
  const calculateFirstDecisionStatus = (): boolean => {
    const now = Time.currentMillis(); // This is ok here as it's only used within the timer
    const firstDecisionTime =
      wave?.wave.decisions_strategy?.first_decision_time;

    // If there's no first decision time, consider it not done
    if (!firstDecisionTime) {
      return false;
    }

    // The first decision is done if the current time is past the first decision time
    return now >= firstDecisionTime;
  };

  // Initial calculation and setup of timers
  useEffect(() => {
    if (!wave) return;

    // Do initial calculations
    const {
      phase: participationPhaseState,
      timeLeft: participationTimeLeftState,
    } = calculateParticipationTimeState();
    setParticipationPhase(participationPhaseState);
    setParticipationTimeLeft(participationTimeLeftState);

    const { phase: votingPhaseState, timeLeft: votingTimeLeftState } =
      calculateVotingTimeState();
    setVotingTimePhase(votingPhaseState);
    setVotingTimeLeft(votingTimeLeftState);

    // Calculate initial first decision status
    setIsFirstDecisionDone(calculateFirstDecisionStatus());

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

    const updateFirstDecisionStatus = () => {
      const firstDecisionDone = calculateFirstDecisionStatus();
      setIsFirstDecisionDone(firstDecisionDone);

      // If first decision is done, clear this timer
      return firstDecisionDone;
    };

    const participationTimer = setInterval(updateParticipationTime, 1000);
    const votingTimer = setInterval(updateVotingTime, 1000);

    // Only set up first decision timer if not already done
    let firstDecisionTimer: NodeJS.Timeout | null = null;
    if (!calculateFirstDecisionStatus()) {
      firstDecisionTimer = setInterval(() => {
        if (updateFirstDecisionStatus()) {
          // Clear timer once first decision is done
          if (firstDecisionTimer) {
            clearInterval(firstDecisionTimer);
            firstDecisionTimer = null;
          }
        }
      }, 1000);
    }

    // Clean up intervals on unmount
    return () => {
      clearInterval(participationTimer);
      clearInterval(votingTimer);
      if (firstDecisionTimer) {
        clearInterval(firstDecisionTimer);
      }
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
      timeLeft: participationTimeLeft,
      isUpcoming: participationPhase === "UPCOMING",
      isInProgress: participationPhase === "IN_PROGRESS",
      isCompleted: participationPhase === "COMPLETED",
    },
    voting: {
      timeLeft: votingTimeLeft,
      isUpcoming: votingTimePhase === "UPCOMING",
      isInProgress: votingTimePhase === "IN_PROGRESS",
      isCompleted: votingTimePhase === "COMPLETED",
    },
    decisions: {
      firstDecisionDone: isFirstDecisionDone,
    },
  };
}

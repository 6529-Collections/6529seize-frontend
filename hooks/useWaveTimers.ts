import { useState, useEffect } from "react";
import { ApiWave } from "../generated/models/ApiWave";
import { Time } from "../helpers/time";
import { TimeLeft, calculateTimeLeft, calculateLastDecisionTime } from "../helpers/waves/time.utils";


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
  };
}

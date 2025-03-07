import { useState, useEffect, useMemo } from "react";
import { ApiWave } from "../generated/models/ApiWave";
import { WaveVotingState } from "./useWaveState";
import { Time } from "../helpers/time";
import { WaveLeaderboardTimeState } from "../helpers/waves/time.types";
import { TimeLeft, calculateTimeLeft } from "../helpers/waves/time.utils";

/**
 * Possible phases of voting in a wave
 */
export type VotingPhase = "NOT_STARTED" | "ONGOING" | "ENDED";

/**
 * Possible types of waves
 */
export type WaveType = "DROPS" | "CHAT";

/**
 * Phase state for participation and voting
 */
export type PhaseState = "UPCOMING" | "IN_PROGRESS" | "COMPLETED";

/**
 * Calculates the timestamp of the last decision point in a wave.
 * This considers the wave type (single decision, multi-decision, or rolling) 
 * and determines when voting will actually end.
 */
function calculateLastDecisionTime(wave: ApiWave | null | undefined): number {
  if (!wave) return 0;
  
  // Get basic decision strategy data
  const firstDecisionTime = wave.wave.decisions_strategy?.first_decision_time;
  const subsequentDecisions = wave.wave.decisions_strategy?.subsequent_decisions || [];
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
  const cycleLength = subsequentDecisions.reduce((sum, interval) => sum + interval, 0);
  
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
  let lastDecisionTime = firstDecisionTime + (completeCycles * cycleLength);
  
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
 * Configuration options for useWave hook
 */
export interface UseWaveOptions {
  /** Enable all timers (participation and voting) */
  enableTimers?: boolean;
  /** Enable participation timer specifically */
  enableParticipationTimer?: boolean;
  /** Enable voting timer specifically */
  enableVotingTimer?: boolean;
}

/**
 * Unified hook for wave data and functionality.
 * This will gradually replace useWaveState, useWaveTimeState, and useDecisionPoints.
 * 
 * @param wave The wave to analyze
 * @param options Configuration options for the hook
 * @returns Object containing wave data and functionality
 */
export function useWave(wave: ApiWave | null | undefined, options?: UseWaveOptions) {
  // Set default options if not provided
  const defaultOptions: UseWaveOptions = {
    enableTimers: true,
    enableParticipationTimer: true,
    enableVotingTimer: true
  };
  
  const opts = {
    ...defaultOptions,
    ...options
  };
  
  // If enableTimers is explicitly set to false, it overrides the individual timer settings
  const enableParticipationTimer = opts.enableTimers !== false && opts.enableParticipationTimer !== false;
  const enableVotingTimer = opts.enableTimers !== false && opts.enableVotingTimer !== false;
  
  // Basic state information - internally using the enum for compatibility
  const [votingPhaseInternal, setVotingPhaseInternal] = useState<WaveVotingState>(WaveVotingState.NOT_STARTED);
  
  // --- useWaveTimeState integration - START ---
  
  // Extract time period boundaries or default to current time
  const participationStartTime = wave?.participation.period?.min ?? Time.currentMillis();
  const participationEndTime = wave?.participation.period?.max ?? Time.currentMillis();
  const votingStartTime = wave?.voting.period?.min ?? Time.currentMillis();
  const nominalVotingEndTime = wave?.voting.period?.max ?? Time.currentMillis();
  
  // Calculate the actual voting end time based on decision strategy
  const actualVotingEndTime = useMemo(() => calculateLastDecisionTime(wave), [
    wave?.wave.decisions_strategy?.first_decision_time,
    wave?.wave.decisions_strategy?.subsequent_decisions,
    wave?.wave.decisions_strategy?.is_rolling,
    nominalVotingEndTime
  ]);
  
  // State for participation phase
  const [participationPhase, setParticipationPhase] = useState<PhaseState>("UPCOMING");
  const [participationTimeLeft, setParticipationTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  
  // State for voting phase from useWaveTimeState
  const [votingTimePhase, setVotingTimePhase] = useState<PhaseState>("UPCOMING");
  const [votingTimeLeft, setVotingTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  
  // Helper function to map internal enum values to our friendly types
  const mapVotingPhase = (state: WaveVotingState): VotingPhase => {
    switch (state) {
      case WaveVotingState.NOT_STARTED: return "NOT_STARTED";
      case WaveVotingState.ONGOING: return "ONGOING";
      case WaveVotingState.ENDED: return "ENDED";
      default: return "NOT_STARTED";
    }
  };
  
  const mapTimeState = (state: PhaseState): WaveLeaderboardTimeState => {
    switch (state) {
      case "UPCOMING": return WaveLeaderboardTimeState.UPCOMING;
      case "IN_PROGRESS": return WaveLeaderboardTimeState.IN_PROGRESS;
      case "COMPLETED": return WaveLeaderboardTimeState.COMPLETED;
      default: return WaveLeaderboardTimeState.UPCOMING;
    }
  };
  
  // Determine basic wave properties - these don't need to be in state
  const waveType: WaveType = wave?.wave.type !== "CHAT" ? "DROPS" : "CHAT";
  const isRolling = wave?.wave.decisions_strategy?.is_rolling || false;
  const hasMultipleDecisions = 
    !!wave?.wave.decisions_strategy?.subsequent_decisions &&
    wave.wave.decisions_strategy.subsequent_decisions.length > 0;
  
  // First decision time and related info
  const firstDecisionTime = wave?.wave.decisions_strategy?.first_decision_time || null;
  const hasFirstDecisionPassed = firstDecisionTime ? Time.currentMillis() >= firstDecisionTime : false;
  
  // Calculate voting state based on wave's voting period (from useWaveState)
  useEffect(() => {
    if (!wave) {
      setVotingPhaseInternal(WaveVotingState.NOT_STARTED);
      return;
    }
    
    const now = Time.currentMillis();
    const minTime = wave.voting.period?.min || null;
    const maxTime = wave.voting.period?.max || null;
    
    // Determine voting state
    let newVotingPhase: WaveVotingState;
    
    if (!minTime && !maxTime) {
      newVotingPhase = WaveVotingState.ONGOING;
    } else if (!minTime && maxTime !== null) {
      newVotingPhase = now <= maxTime ? WaveVotingState.ONGOING : WaveVotingState.ENDED;
    } else if (minTime !== null && !maxTime) {
      newVotingPhase = now < minTime ? WaveVotingState.NOT_STARTED : WaveVotingState.ONGOING;
    } else if (minTime !== null && maxTime !== null) {
      if (now < minTime) {
        newVotingPhase = WaveVotingState.NOT_STARTED;
      } else if (now <= maxTime) {
        newVotingPhase = WaveVotingState.ONGOING;
      } else {
        newVotingPhase = WaveVotingState.ENDED;
      }
    } else {
      newVotingPhase = WaveVotingState.NOT_STARTED;
    }
    
    setVotingPhaseInternal(newVotingPhase);
  }, [wave]);
  
  // Helper function for one-time calculation of participation time state
  const calculateParticipationTimeState = (): { 
    phase: PhaseState, 
    timeLeft: TimeLeft 
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
      const targetTime = newPhaseState === "UPCOMING" ? participationStartTime : participationEndTime;
      timeLeft = calculateTimeLeft(targetTime);
    }
    
    return { phase: newPhaseState, timeLeft };
  };
  
  // Helper function for one-time calculation of voting time state
  const calculateVotingTimeState = (): {
    phase: PhaseState,
    timeLeft: TimeLeft
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
      const targetTime = newPhaseState === "UPCOMING" ? votingStartTime : actualVotingEndTime;
      timeLeft = calculateTimeLeft(targetTime);
    }
    
    return { phase: newPhaseState, timeLeft };
  };
  
  // Initial calculation of time states without timers
  useEffect(() => {
    if (!wave) return;
    
    // Initial calculations if timers are disabled
    if (!enableParticipationTimer) {
      const { phase, timeLeft } = calculateParticipationTimeState();
      setParticipationPhase(phase);
      setParticipationTimeLeft(timeLeft);
    }
    
    if (!enableVotingTimer) {
      const { phase, timeLeft } = calculateVotingTimeState();
      setVotingTimePhase(phase);
      setVotingTimeLeft(timeLeft);
    }
  }, [wave, enableParticipationTimer, enableVotingTimer, participationStartTime, participationEndTime, votingStartTime, actualVotingEndTime]);
  
  // Update participation phase and time left (from useWaveTimeState)
  useEffect(() => {
    if (!wave || !enableParticipationTimer) return;
    
    const updateParticipationTime = () => {
      const { phase, timeLeft } = calculateParticipationTimeState();
      setParticipationPhase(phase);
      setParticipationTimeLeft(timeLeft);
    };
    
    updateParticipationTime();
    const timer = setInterval(updateParticipationTime, 1000);
    
    return () => clearInterval(timer);
  }, [wave, enableParticipationTimer, participationStartTime, participationEndTime]);
  
  // Update voting time phase and time left (from useWaveTimeState)
  useEffect(() => {
    if (!wave || !enableVotingTimer) return;
    
    const updateVotingTime = () => {
      const { phase, timeLeft } = calculateVotingTimeState();
      setVotingTimePhase(phase);
      setVotingTimeLeft(timeLeft);
    };
    
    updateVotingTime();
    const timer = setInterval(updateVotingTime, 1000);
    
    return () => clearInterval(timer);
  }, [wave, enableVotingTimer, votingStartTime, actualVotingEndTime]);
  
  // --- useWaveTimeState integration - END ---
  
  // Convert internal enum to our friendly type
  const votingPhase = mapVotingPhase(votingPhaseInternal);
  
  // Return organized wave information with better naming
  return {
    // Group voting-related properties
    voting: {
      // High-level voting phase
      phase: votingPhase,
      hasStarted: votingPhase !== "NOT_STARTED",
      isActive: votingPhase === "ONGOING",
      hasEnded: votingPhase === "ENDED",
      
      // Detailed time information (from useWaveTimeState)
      time: {
        phase: votingTimePhase,
        timeLeft: votingTimeLeft,
        startTime: votingStartTime,
        endTime: actualVotingEndTime, // Using the calculated end time
        nominalEndTime: nominalVotingEndTime, // Keep the original end time for reference
        isUpcoming: votingTimePhase === "UPCOMING",
        isInProgress: votingTimePhase === "IN_PROGRESS",
        isCompleted: votingTimePhase === "COMPLETED",
      },
    },
    
    // Group participation-related properties
    participation: {
      phase: participationPhase,
      timeLeft: participationTimeLeft,
      startTime: participationStartTime,
      endTime: participationEndTime,
      isUpcoming: participationPhase === "UPCOMING",
      isInProgress: participationPhase === "IN_PROGRESS",
      isCompleted: participationPhase === "COMPLETED",
    },
    
    // Group wave type properties
    wave: {
      type: waveType,
      hasMultipleDecisions,
    },
    
    // Group decision-related properties
    decisions: {
      firstTime: firstDecisionTime,
      hasFirstPassed: hasFirstDecisionPassed,
      lastTime: actualVotingEndTime, // Include the last decision time here too
      // More decision properties will be added later
    }
  };
}
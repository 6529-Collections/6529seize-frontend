import { ApiWave } from "../generated/models/ApiWave";
import { ApiWaveType } from "../generated/models/ApiWaveType";

export enum WaveVotingState {
  NOT_STARTED = "NOT_STARTED",
  ONGOING = "ONGOING",
  ENDED = "ENDED",
}

interface UseWaveStateReturn {
  readonly votingState: WaveVotingState;
  readonly isDropsWave: boolean;
  readonly hasFirstDecisionPassed: boolean;
  readonly firstDecisionTime: number | null;
  readonly decisionTimes: number[];
  readonly isRollingWave: boolean;
}

// Calculate the voting state based on wave's voting period
function calculateVotingState(wave?: ApiWave): WaveVotingState {
  if (!wave) {
    return WaveVotingState.NOT_STARTED;
  }

  const now = Date.now();
  const minTime = wave.voting.period?.min
    ? new Date(wave.voting.period.min).getTime()
    : null;
  const maxTime = wave.voting.period?.max
    ? new Date(wave.voting.period.max).getTime()
    : null;

  // No timestamps set - always ongoing
  if (!minTime && !maxTime) {
    return WaveVotingState.ONGOING;
  }

  // Only max time set - either ongoing or ended
  if (!minTime && maxTime !== null) {
    return now <= maxTime ? WaveVotingState.ONGOING : WaveVotingState.ENDED;
  }

  // Only min time set - either not started or ongoing
  if (minTime !== null && !maxTime) {
    return now < minTime ? WaveVotingState.NOT_STARTED : WaveVotingState.ONGOING;
  }

  // Both times set - all states possible
  if (minTime !== null && now < minTime) {
    return WaveVotingState.NOT_STARTED;
  }
  if (maxTime !== null && now <= maxTime) {
    return WaveVotingState.ONGOING;
  }
  return WaveVotingState.ENDED;
}

// Helper to calculate decision times based on strategy
function calculateDecisionTimes(wave?: ApiWave): number[] {
  if (!wave?.wave.decisions_strategy?.first_decision_time) {
    return [];
  }
  
  const firstDecisionTime = wave.wave.decisions_strategy.first_decision_time;
  const subsequentDecisions = wave.wave.decisions_strategy.subsequent_decisions || [];
  
  const decisions = [firstDecisionTime];
  
  if (subsequentDecisions.length === 0) {
    return decisions;
  }
  
  let lastTime = firstDecisionTime;
  
  // Add subsequent decisions
  for (const interval of subsequentDecisions) {
    lastTime += interval;
    decisions.push(lastTime);
  }
  
  return decisions;
}

// Check if first decision time has passed
function hasDecisionPassed(firstDecisionTime: number | null): boolean {
  if (!firstDecisionTime) return false;
  return Date.now() >= firstDecisionTime;
}

// Main hook function - converted to pure function with NO React hooks!
export function useWaveState(wave?: ApiWave): UseWaveStateReturn {
  if (!wave) {
    return {
      votingState: WaveVotingState.NOT_STARTED,
      isDropsWave: false,
      hasFirstDecisionPassed: false,
      firstDecisionTime: null,
      decisionTimes: [],
      isRollingWave: false,
    };
  }
  
  // Calculate all needed values purely from the wave data
  const votingState = calculateVotingState(wave);
  const isDropsWave = wave.wave.type !== ApiWaveType.Chat;
  
  const firstDecisionTime = wave.wave.decisions_strategy
    ? wave.wave.decisions_strategy.first_decision_time
    : null;
    
  const decisionTimes = calculateDecisionTimes(wave);
  
  const isRollingWave = wave.wave.decisions_strategy
    ? wave.wave.decisions_strategy.is_rolling || false
    : false;
    
  const hasFirstDecisionPassed = hasDecisionPassed(firstDecisionTime);
  
  return {
    votingState,
    isDropsWave,
    hasFirstDecisionPassed,
    firstDecisionTime,
    decisionTimes,
    isRollingWave,
  };
}

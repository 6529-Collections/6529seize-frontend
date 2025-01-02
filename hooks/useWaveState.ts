import { ApiWave } from "../generated/models/ApiWave";
import { useState, useEffect } from "react";
import { ApiWaveType } from "../generated/models/ApiWaveType";

export enum WaveVotingState {
  NOT_STARTED = "NOT_STARTED",
  ONGOING = "ONGOING",
  ENDED = "ENDED",
}

interface UseWaveStateReturn {
  readonly votingState: WaveVotingState;
  readonly isDropsWave: boolean;
}

const calculateVotingState = (
  now: number,
  minTime: number | null,
  maxTime: number | null
): WaveVotingState => {
  // No timestamps set - always ongoing
  if (!minTime && !maxTime) {
    return WaveVotingState.ONGOING;
  }

  // Only max time set - either ongoing or ended
  if (!minTime && maxTime) {
    return now <= maxTime ? WaveVotingState.ONGOING : WaveVotingState.ENDED;
  }

  // Only min time set - either not started or ongoing
  if (minTime && !maxTime) {
    return now < minTime
      ? WaveVotingState.NOT_STARTED
      : WaveVotingState.ONGOING;
  }

  // Both times set - all states possible
  if (minTime && maxTime) {
    if (now < minTime) {
      return WaveVotingState.NOT_STARTED;
    }
    if (now <= maxTime) {
      return WaveVotingState.ONGOING;
    }
    return WaveVotingState.ENDED;
  }

  return WaveVotingState.ONGOING;
};

const calculateNextStateChangeTime = (
  now: number,
  minTime: number | null,
  maxTime: number | null,
  currentState: WaveVotingState
): number | null => {
  // If no timestamps, or already ended, no next change
  if ((!minTime && !maxTime) || currentState === WaveVotingState.ENDED) {
    return null;
  }

  // If not started, next change is at minTime
  if (currentState === WaveVotingState.NOT_STARTED && minTime) {
    return minTime;
  }

  // If ongoing, next change is at maxTime if it exists
  if (currentState === WaveVotingState.ONGOING && maxTime) {
    return maxTime;
  }

  return null;
};

export function useWaveState(wave: ApiWave): UseWaveStateReturn {
  const [votingState, setVotingState] = useState<WaveVotingState>(() => {
    const minTime = wave.voting.period?.min
      ? new Date(wave.voting.period.min).getTime()
      : null;
    const maxTime = wave.voting.period?.max
      ? new Date(wave.voting.period.max).getTime()
      : null;
    return calculateVotingState(Date.now(), minTime, maxTime);
  });

  useEffect(() => {
    const minTime = wave.voting.period?.min
      ? new Date(wave.voting.period.min).getTime()
      : null;
    const maxTime = wave.voting.period?.max
      ? new Date(wave.voting.period.max).getTime()
      : null;
    const now = Date.now();

    // Update current state
    const currentState = calculateVotingState(now, minTime, maxTime);
    setVotingState(currentState);

    // Calculate when the next state change should occur
    const nextChangeTime = calculateNextStateChangeTime(
      now,
      minTime,
      maxTime,
      currentState
    );

    // If there's a next state change, set up a timeout
    if (nextChangeTime) {
      const timeUntilChange = nextChangeTime - now;
      if (timeUntilChange > 0) {
        const timeout = setTimeout(() => {
          const newState = calculateVotingState(Date.now(), minTime, maxTime);
          setVotingState(newState);
        }, timeUntilChange);

        return () => clearTimeout(timeout);
      }
    }
  }, [wave.voting.period?.min, wave.voting.period?.max]);

  return {
    votingState,
    isDropsWave: wave.wave.type !== ApiWaveType.Chat,
  };
}

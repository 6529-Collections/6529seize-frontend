import { useState, useEffect } from "react";
import { ApiWave } from "../../generated/models/ApiWave";
import { Time } from "../../helpers/time";
import { TimeLeft, calculateTimeLeft } from "../../helpers/waves/time.utils";
import { WaveLeaderboardTimeState } from "../../helpers/waves/time.types";

/**
 * Hook for managing wave time state (dropping and voting phases)
 */
export const useWaveTimeState = (wave: ApiWave) => {
  const participationPeriodMin =
    wave.participation.period?.min ?? Time.currentMillis();
  const participationPeriodMax =
    wave.participation.period?.max ?? Time.currentMillis();
  const votingPeriodMin = wave.voting.period?.min ?? Time.currentMillis();
  const votingPeriodMax = wave.voting.period?.max ?? Time.currentMillis();

  // State for dropping phase
  const [droppingTimeState, setDroppingTimeState] =
    useState<WaveLeaderboardTimeState>(getDroppingTimeState());
  const [droppingTimeLeft, setDroppingTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // State for voting phase
  const [votingTimeState, setVotingTimeState] =
    useState<WaveLeaderboardTimeState>(getVotingTimeState());
  const [votingTimeLeft, setVotingTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  /**
   * Get the current state of the dropping phase
   */
  function getDroppingTimeState(): WaveLeaderboardTimeState {
    if (!participationPeriodMin || !participationPeriodMax) {
      return WaveLeaderboardTimeState.UPCOMING;
    }
    if (participationPeriodMin > Time.currentMillis()) {
      return WaveLeaderboardTimeState.UPCOMING;
    }
    if (participationPeriodMax < Time.currentMillis()) {
      return WaveLeaderboardTimeState.COMPLETED;
    }
    return WaveLeaderboardTimeState.IN_PROGRESS;
  }

  /**
   * Get the current state of the voting phase
   */
  function getVotingTimeState(): WaveLeaderboardTimeState {
    if (!votingPeriodMin || !votingPeriodMax) {
      return WaveLeaderboardTimeState.UPCOMING;
    }
    if (votingPeriodMin > Time.currentMillis()) {
      return WaveLeaderboardTimeState.UPCOMING;
    }
    if (votingPeriodMax < Time.currentMillis()) {
      return WaveLeaderboardTimeState.COMPLETED;
    }
    return WaveLeaderboardTimeState.IN_PROGRESS;
  }

  // Update dropping phase timer
  useEffect(() => {
    const updateDroppingTime = () => {
      const now = Time.currentMillis();
      const start = participationPeriodMin ?? now;
      const end = participationPeriodMax ?? now;
      const state = getDroppingTimeState();
      setDroppingTimeState(state);

      let targetTime = 0;
      if (state === WaveLeaderboardTimeState.UPCOMING) {
        targetTime = start;
      } else if (state === WaveLeaderboardTimeState.IN_PROGRESS) {
        targetTime = end;
      } else {
        setDroppingTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
        });
        return;
      }

      setDroppingTimeLeft(calculateTimeLeft(targetTime));
    };

    updateDroppingTime();
    const droppingTimer = setInterval(updateDroppingTime, 1000);

    return () => clearInterval(droppingTimer);
  }, [participationPeriodMin, participationPeriodMax]);

  // Update voting phase timer
  useEffect(() => {
    const updateVotingTime = () => {
      const now = Time.currentMillis();
      const start = votingPeriodMin ?? now;
      const end = votingPeriodMax ?? now;
      const state = getVotingTimeState();
      setVotingTimeState(state);

      let targetTime = 0;
      if (state === WaveLeaderboardTimeState.UPCOMING) {
        targetTime = start;
      } else if (state === WaveLeaderboardTimeState.IN_PROGRESS) {
        targetTime = end;
      } else {
        setVotingTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
        });
        return;
      }

      setVotingTimeLeft(calculateTimeLeft(targetTime));
    };

    updateVotingTime();
    const votingTimer = setInterval(updateVotingTime, 1000);

    return () => clearInterval(votingTimer);
  }, [votingPeriodMin, votingPeriodMax]);

  return {
    // Dropping phase data
    droppingTimeState,
    droppingTimeLeft,
    participationPeriodMin,
    participationPeriodMax,
    
    // Voting phase data
    votingTimeState,
    votingTimeLeft,
    votingPeriodMin,
    votingPeriodMax,
  };
};
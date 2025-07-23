"use client"

import { useMemo } from "react";
import { ApiWave } from "../generated/models/ApiWave";
import { Time } from "../helpers/time";
import { calculateLastDecisionTime } from "../helpers/waves/time.utils";
import { useSeizeSettings } from "../contexts/SeizeSettingsContext";
import { ApiWaveDecisionPause } from "../generated/models/ApiWaveDecisionPause";
import { ApiWaveDecision } from "../generated/models/ApiWaveDecision";

/**
 * Possible states of a wave's submission period
 */
export enum SubmissionStatus {
  /** Submission period has not started yet */
  NOT_STARTED = "NOT_STARTED",
  /** Submission period is currently active */
  ACTIVE = "ACTIVE",
  /** Submission period has ended */
  ENDED = "ENDED",
}

/**
 * Type definition for the return value of useWave
 */
interface WaveInfo {
  voting: {
    startTime: number;
    endTime: number;
  };
  participation: {
    startTime: number;
    endTime: number;
    isEligible: boolean;
    status: SubmissionStatus;
    isWithinPeriod: boolean;
    hasReachedLimit: boolean;
    remainingSubmissions: number | null;
    maxSubmissions: number | null;
    currentSubmissions: number | null;
    canSubmitNow: boolean;
  };
  chat: {
    isEligible: boolean;
    isEnabled: boolean;
  };
  decisions: {
    multiDecision: boolean;
  };
  pauses: {
    isPaused: boolean;
    currentPause: ApiWaveDecisionPause | null;
    nextPause: ApiWaveDecisionPause | null;
    showPause: (nextDecisionTime: number | null) => ApiWaveDecisionPause | null;
    hasDecisionsBeforePause: (nextDecisionTime: number | null) => boolean;
    filterDecisionsDuringPauses: (decisions: ApiWaveDecision[]) => ApiWaveDecision[];
    getNextValidDecision: (decisions: ApiWaveDecision[]) => ApiWaveDecision | null;
    calculateMintingDate: (checkpointTime: number | null) => number | null;
  };
  isChatWave: boolean;
  isRankWave: boolean;
  isMemesWave: boolean;
  isDm: boolean;
}

/**
 * Calculates the submission status based on time windows
 */
function getSubmissionStatus(
  wave: ApiWave | null | undefined,
  now: number
): SubmissionStatus {
  if (!wave) return SubmissionStatus.NOT_STARTED;

  try {
    const start = wave.participation.period?.min ?? null;
    const end = wave.participation.period?.max ?? null;

    // No time restrictions
    if (start === null && end === null) {
      return SubmissionStatus.ACTIVE;
    }

    // Only end time exists
    if (start === null && end !== null) {
      return now <= end ? SubmissionStatus.ACTIVE : SubmissionStatus.ENDED;
    }

    // Only start time exists
    if (end === null && start !== null) {
      return now < start
        ? SubmissionStatus.NOT_STARTED
        : SubmissionStatus.ACTIVE;
    }

    // Both start and end times exist
    if (start !== null && end !== null) {
      if (now < start) return SubmissionStatus.NOT_STARTED;
      if (now > end) return SubmissionStatus.ENDED;
      return SubmissionStatus.ACTIVE;
    }
  } catch (error) {
    console.warn("Error determining submission status:", error);
  }

  // Default to NOT_STARTED if any error or unexpected condition
  return SubmissionStatus.NOT_STARTED;
}

/**
 * Hook that processes an ApiWave to provide derived properties and state
 * for participation eligibility, submission limits, voting periods,
 * and other wave-related information.
 *
 * @param wave The wave to process, or null/undefined if no wave is selected
 * @returns An object containing processed wave information and state
 */
export function useWave(wave: ApiWave | null | undefined): WaveInfo {
  // Current time for all timestamp comparisons (consistent throughout the hook)
  const now = useMemo(() => Time.currentMillis(), []);
  const { isMemesWave } = useSeizeSettings();

  // Calculate pause information
  const currentPause = useMemo(() => {
    if (!wave?.pauses || wave.pauses.length === 0) return null;
    
    // Pause times are already in milliseconds
    return wave.pauses.find((pause: ApiWaveDecisionPause) => 
      now >= pause.start_time && now <= pause.end_time
    ) || null;
  }, [wave?.pauses, now]);

  const isPaused = useMemo(() => {
    return currentPause !== null;
  }, [currentPause]);

  // Get the next upcoming pause
  const nextPause = useMemo(() => {
    if (!wave?.pauses || wave.pauses.length === 0) return null;
    
    const futurePauses = wave.pauses.filter((pause: ApiWaveDecisionPause) => 
      pause.start_time > now
    );
    
    if (futurePauses.length === 0) return null;
    
    // Return the earliest future pause
    return futurePauses.reduce((earliest: ApiWaveDecisionPause, current: ApiWaveDecisionPause) => 
      current.start_time < earliest.start_time ? current : earliest
    , futurePauses[0]);
  }, [wave?.pauses, now]);

  // Helper function to check if a decision time falls within any pause period
  const isDecisionDuringPause = (decisionTime: number, pauses: ApiWaveDecisionPause[]): boolean => {
    return pauses.some(pause => 
      decisionTime >= pause.start_time && 
      decisionTime <= pause.end_time
    );
  };

  // Helper function to filter out decisions that occur during pause periods
  const filterDecisionsDuringPauses = useMemo(() => {
    return (decisions: ApiWaveDecision[]): ApiWaveDecision[] => {
      if (!wave?.pauses || wave.pauses.length === 0) return decisions;
      
      return decisions.filter(decision => 
        !isDecisionDuringPause(decision.decision_time, wave.pauses)
      );
    };
  }, [wave?.pauses]);

  // Helper function to get the next valid decision (not during a pause)
  const getNextValidDecision = useMemo(() => {
    return (decisions: ApiWaveDecision[]): ApiWaveDecision | null => {
      const filteredDecisions = filterDecisionsDuringPauses(decisions);
      const futureDecisions = filteredDecisions.filter(d => d.decision_time > now);
      
      if (futureDecisions.length === 0) return null;
      
      // Return the earliest future decision
      return futureDecisions.reduce((earliest, current) => 
        current.decision_time < earliest.decision_time ? current : earliest
      , futureDecisions[0]);
    };
  }, [filterDecisionsDuringPauses, now]);

  // Check if there are any decisions before the next pause
  const hasDecisionsBeforePause = useMemo(() => {
    return (nextDecisionTime: number | null): boolean => {
      if (!nextPause || !nextDecisionTime) return false;
      return nextDecisionTime < nextPause.start_time;
    };
  }, [nextPause]);

  // Get the pause to show (current if active, otherwise next if no decisions before it)
  const showPause = useMemo(() => {
    return (nextDecisionTime: number | null): ApiWaveDecisionPause | null => {
      // If currently paused, return current pause
      if (currentPause) return currentPause;
      
      // If there's a next pause and no decisions before it, return next pause
      if (nextPause && !hasDecisionsBeforePause(nextDecisionTime)) {
        return nextPause;
      }
      
      return null;
    };
  }, [currentPause, nextPause, hasDecisionsBeforePause]);

  // Calculate the minting date based on checkpoint date
  const calculateMintingDate = useMemo(() => {
    return (checkpointTime: number | null): number | null => {
      if (!checkpointTime) return null;
      
      const checkpointDate = new Date(checkpointTime);
      const dayOfWeek = checkpointDate.getUTCDay();
      
      // Calculate days until next minting day
      let daysToAdd: number;
      switch (dayOfWeek) {
        case 1: // Monday → Wednesday
          daysToAdd = 2;
          break;
        case 3: // Wednesday → Friday
          daysToAdd = 2;
          break;
        case 5: // Friday → Monday
          daysToAdd = 3;
          break;
        default:
          // For other days, find next Monday/Wednesday/Friday
          if (dayOfWeek === 0) { // Sunday → Monday
            daysToAdd = 1;
          } else if (dayOfWeek === 2) { // Tuesday → Wednesday
            daysToAdd = 1;
          } else if (dayOfWeek === 4) { // Thursday → Friday
            daysToAdd = 1;
          } else { // Saturday → Monday
            daysToAdd = 2;
          }
      }
      
      // Create new date and add days
      const mintingDate = new Date(checkpointTime);
      mintingDate.setUTCDate(mintingDate.getUTCDate() + daysToAdd);
      
      return mintingDate.getTime();
    };
  }, []);

  // Extract common wave properties that are used in multiple calculations
  const maxDropsCount = useMemo(
    () =>
      wave?.participation.no_of_applications_allowed_per_participant ?? null,
    [wave]
  );

  const identityDropsCount = useMemo(
    () => wave?.metrics.your_participation_drops_count ?? null,
    [wave]
  );

  // Extract time period boundaries with proper defaults
  const participationStartTime = useMemo(
    () => wave?.participation.period?.min ?? now,
    [wave, now]
  );

  const participationEndTime = useMemo(
    () => wave?.participation.period?.max ?? now,
    [wave, now]
  );

  const votingStartTime = useMemo(
    () => wave?.voting.period?.min ?? now,
    [wave, now]
  );

  const nominalVotingEndTime = useMemo(
    () => wave?.voting.period?.max ?? now,
    [wave, now]
  );

  // Calculate the actual voting end time based on decision strategy
  const actualVotingEndTime = useMemo(
    () => calculateLastDecisionTime(wave),
    [
      wave?.wave.decisions_strategy?.first_decision_time,
      wave?.wave.decisions_strategy?.subsequent_decisions,
      wave?.wave.decisions_strategy?.is_rolling,
      nominalVotingEndTime,
    ]
  );

  /**
   * Determine the current status of the submission period
   */
  const submissionStatus = useMemo(
    () => getSubmissionStatus(wave, now),
    [wave, now]
  );

  /**
   * Check if user has reached their maximum allowed submissions
   */
  const hasReachedSubmissionLimit = useMemo(() => {
    if (!wave) return false;

    try {
      return (
        maxDropsCount !== null &&
        identityDropsCount !== null &&
        identityDropsCount >= maxDropsCount
      );
    } catch (error) {
      console.warn("Error checking submission limit:", error);
      return false;
    }
  }, [wave, maxDropsCount, identityDropsCount]);

  /**
   * Calculate how many more submissions the user can make
   */
  const remainingSubmissions = useMemo(() => {
    if (!wave) return null;

    try {
      if (maxDropsCount === null || identityDropsCount === null) {
        return null;
      }

      return Math.max(0, maxDropsCount - identityDropsCount);
    } catch (error) {
      console.warn("Error calculating remaining submissions:", error);
      return null;
    }
  }, [wave, maxDropsCount, identityDropsCount]);

  /**
   * Flag indicating if the submission period is currently active
   */
  const isWithinSubmissionPeriod = useMemo(
    () => submissionStatus === SubmissionStatus.ACTIVE,
    [submissionStatus]
  );

  /**
   * Boolean indicating whether the user can create a submission right now,
   * considering all relevant factors
   */
  const canSubmitNow = useMemo(() => {
    if (!wave) return false;

    return (
      wave.participation.authenticated_user_eligible && // User is eligible
      isWithinSubmissionPeriod && // Within time window
      !hasReachedSubmissionLimit // Has not reached limit
    );
  }, [wave, isWithinSubmissionPeriod, hasReachedSubmissionLimit]);

  return {
    voting: {
      startTime: votingStartTime,
      endTime: actualVotingEndTime,
    },
    participation: {
      // Basic time properties
      startTime: participationStartTime,
      endTime: participationEndTime,

      // Eligibility and status
      isEligible: wave?.participation.authenticated_user_eligible ?? false,
      status: submissionStatus,
      isWithinPeriod: isWithinSubmissionPeriod,

      // Submission limits
      hasReachedLimit: hasReachedSubmissionLimit,
      remainingSubmissions,
      maxSubmissions: maxDropsCount,
      currentSubmissions: identityDropsCount,

      // Convenience aggregated property
      canSubmitNow,
    },
    chat: {
      isEligible: wave?.chat.authenticated_user_eligible ?? false,
      isEnabled: wave?.chat.enabled ?? false,
    },
    decisions: {
      multiDecision:
        !!wave?.wave.decisions_strategy?.subsequent_decisions.length,
    },
    pauses: {
      isPaused,
      currentPause,
      nextPause,
      showPause,
      hasDecisionsBeforePause,
      filterDecisionsDuringPauses,
      getNextValidDecision,
      calculateMintingDate,
    },
    // Wave type flags
    isChatWave: wave?.wave.type === "CHAT",
    isRankWave: wave?.wave.type === "RANK",
    isMemesWave: isMemesWave(wave?.id.toLowerCase()),
    isDm: !!wave?.chat?.scope?.group?.is_direct_message,
  };
}

import { useMemo } from "react";
import { ApiWave } from "../generated/models/ApiWave";
import { Time } from "../helpers/time";
import { calculateLastDecisionTime } from "../helpers/waves/time.utils";
import { useSeizeSettings } from "../contexts/SeizeSettingsContext";

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
  isChatWave: boolean;
  isRankWave: boolean;
  isMemesWave: boolean;
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
    // Wave type flags
    isChatWave: wave?.wave.type === "CHAT",
    isRankWave: wave?.wave.type === "RANK",
    isMemesWave: isMemesWave(wave?.id.toLowerCase()),
  };
}

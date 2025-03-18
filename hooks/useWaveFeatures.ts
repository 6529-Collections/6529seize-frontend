import { ApiWave } from "../generated/models/ApiWave";
import { ApiWaveType } from "../generated/models/ApiWaveType";
import { useMemo } from "react";
import { Time } from "../helpers/time";

export interface WaveFeatures {
  // Wave type features
  isRankingWave: boolean;
  isApprovalWave: boolean;
  isChatWave: boolean;
  
  // Voting features
  votingSignatureRequired: boolean;
  participationSignatureRequired: boolean;
  
  // Participation features
  hasMultipleSubmissionsLimit: boolean;
  maxSubmissionsPerParticipant: number | null;
  hasRequiredMetadata: boolean;
  hasRequiredMedia: boolean;
  
  // Chat feature
  chatEnabled: boolean;
  
  // State features
  isInSubmissionPhase: boolean;
  isInVotingPhase: boolean; 
  submissionEnded: boolean;
  votingEnded: boolean;
  
  // Decision features
  hasMultipleDecisions: boolean;
  firstDecisionPassed: boolean;
  
  // Time features
  lastDecisionTime: number;
  votingStartTime: number;
  submissionStartTime: number;
  submissionEndTime: number;
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
 * Hook that extracts and derives feature flags from a wave object
 * 
 * @param wave - The ApiWave object to extract features from
 * @returns An object containing feature flags and derived state
 * 
 * @example
 * ```
 * const { isRankingWave, chatEnabled, votingSignatureRequired, lastDecisionTime } = useWaveFeatures(wave);
 * 
 * if (isRankingWave && votingSignatureRequired) {
 *   // Show signature UI for ranking waves
 * }
 * 
 * // Use last decision time for countdown instead of voting.period.max
 * const timeUntilEnd = lastDecisionTime - now;
 * ```
 */
export function useWaveFeatures(wave?: ApiWave | null): WaveFeatures {
  return useMemo(() => {
    if (!wave) {
      return getDefaultFeatures();
    }
    
    const now = Time.currentMillis();
    const waveType = wave.wave.type;
    
    // Calculate time boundaries
    const submissionStartTime = wave.participation.period?.min || 0;
    const submissionEndTime = wave.participation.period?.max || 0;
    const votingStartTime = wave.voting.period?.min || 0;
    
    // Calculate the actual last decision time
    const lastDecisionTime = calculateLastDecisionTime(wave);
    
    // Calculate phase states - USING LAST DECISION TIME instead of voting.period.max
    const submissionStarted = submissionStartTime 
      ? now >= submissionStartTime 
      : true;
      
    const submissionEnded = submissionEndTime 
      ? now > submissionEndTime 
      : false;
      
    const votingStarted = votingStartTime 
      ? now >= votingStartTime 
      : true;
      
    // Use lastDecisionTime instead of wave.voting.period.max
    const votingEnded = now > lastDecisionTime;
      
    // Calculate decision-related features
    const decisionsStrategy = wave.wave.decisions_strategy;
    const hasMultipleDecisions = !!decisionsStrategy?.subsequent_decisions && 
                                decisionsStrategy.subsequent_decisions.length > 0;
    
    const firstDecisionTime = decisionsStrategy?.first_decision_time || 0;
    const firstDecisionPassed = firstDecisionTime ? now >= firstDecisionTime : false;
    
    return {
      // Wave type features
      isRankingWave: waveType === ApiWaveType.Rank,
      isApprovalWave: waveType === ApiWaveType.Approve,
      isChatWave: waveType === ApiWaveType.Chat,
      
      // Voting features
      votingSignatureRequired: wave.voting.signature_required,
      participationSignatureRequired: wave.participation.signature_required,
      
      // Participation features
      hasMultipleSubmissionsLimit: wave.participation.no_of_applications_allowed_per_participant !== null,
      maxSubmissionsPerParticipant: wave.participation.no_of_applications_allowed_per_participant,
      hasRequiredMetadata: wave.participation.required_metadata.length > 0,
      hasRequiredMedia: wave.participation.required_media.length > 0,
      
      // Chat feature
      chatEnabled: wave.chat.enabled,
      
      // State features
      isInSubmissionPhase: submissionStarted && !submissionEnded,
      isInVotingPhase: votingStarted && !votingEnded,
      submissionEnded,
      votingEnded,
      
      // Decision features
      hasMultipleDecisions,
      firstDecisionPassed,
      
      // Time features
      lastDecisionTime,
      votingStartTime,
      submissionStartTime,
      submissionEndTime,
    };
  }, [wave]);
}

// Default values when no wave is provided
function getDefaultFeatures(): WaveFeatures {
  return {
    isRankingWave: false,
    isApprovalWave: false,
    isChatWave: false,
    
    votingSignatureRequired: false,
    participationSignatureRequired: false,
    
    hasMultipleSubmissionsLimit: false,
    maxSubmissionsPerParticipant: null,
    hasRequiredMetadata: false,
    hasRequiredMedia: false,
    
    chatEnabled: false,
    
    isInSubmissionPhase: false,
    isInVotingPhase: false,
    submissionEnded: false,
    votingEnded: false,
    
    hasMultipleDecisions: false, 
    firstDecisionPassed: false,
    
    // Time features
    lastDecisionTime: 0,
    votingStartTime: 0,
    submissionStartTime: 0,
    submissionEndTime: 0,
  };
}

import { Time } from "../time";
import { ApiWave } from "../../generated/models/ApiWave";

// Constants for fallback values
export const FALLBACK_START_TIME = 0; // Use 0 (Jan 1, 1970) to indicate "started immediately"
export const FALLBACK_END_TIME = Number.MAX_SAFE_INTEGER; // Far future to indicate "no end date"

export interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/**
 * Calculates the time remaining until a target timestamp
 *
 * @param targetTime - Target timestamp in milliseconds
 * @returns TimeLeft object with days, hours, minutes, seconds
 */
export const calculateTimeLeft = (targetTime: number): TimeLeft => {
  const now = Time.currentMillis();
  const difference = targetTime - now;

  if (difference <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / (1000 * 60)) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
};

/**
 * Determines if all time components are zero
 *
 * @param timeLeft - TimeLeft object
 * @returns boolean - true if all values are zero
 */
const isTimeZero = (timeLeft: TimeLeft): boolean => {
  return (
    timeLeft.days === 0 &&
    timeLeft.hours === 0 &&
    timeLeft.minutes === 0 &&
    timeLeft.seconds === 0
  );
};

/**
 * Calculates the timestamp of the last decision point in a wave.
 * This considers the wave type (single decision, multi-decision, or rolling)
 * and determines when voting will actually end.
 */
export function calculateLastDecisionTime(
  wave: ApiWave | null | undefined
): number {
  if (!wave) return 0;

  // Get basic decision strategy data
  const firstDecisionTime = wave.wave.decisions_strategy?.first_decision_time;
  const subsequentDecisions =
    wave.wave.decisions_strategy?.subsequent_decisions || [];
  const isRolling = wave.wave.decisions_strategy?.is_rolling || false;
  // Use stable fallback value for missing end time
  const votingEndTime = wave.voting.period?.max ?? FALLBACK_END_TIME;

  // If no first decision time is set, use the voting end time
  if (!firstDecisionTime) {
    return votingEndTime;
  }

  // Case 1: Single decision wave (no subsequent decisions)
  if (subsequentDecisions.length === 0) {
    // For single decision waves, the end time is the first decision time
    // But make sure it's not after the voting end time
    const result = Math.min(firstDecisionTime, votingEndTime);
    return result;
  }

  // Case 2: Multi-decision waves (fixed number of decisions)
  if (!isRolling) {
    // Calculate the last decision time by adding all intervals
    let lastDecisionTime = firstDecisionTime;

    for (const interval of subsequentDecisions) {
      lastDecisionTime += interval;
    }

    // But make sure it's not after the voting end time
    const result = Math.min(lastDecisionTime, votingEndTime);
    return result;
  }

  // Case 3: Rolling waves (decisions repeat until end time)

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

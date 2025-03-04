import { CreateWaveDatesConfig } from "../../../../types/waves.types";

/**
 * Calculates all decision times based on firstDecisionTime and subsequentDecisions
 */
export const calculateDecisionTimes = (
  firstDecisionTime: number,
  subsequentDecisions: number[]
): number[] => {
  const decisions = [firstDecisionTime];
  
  // Add each subsequent decision time
  let currentTime = firstDecisionTime;
  for (const interval of subsequentDecisions) {
    currentTime += interval;
    decisions.push(currentTime);
  }
  
  return decisions;
};

/**
 * Calculates the end date based on decisions and rolling status
 */
export const calculateEndDate = (
  dates: CreateWaveDatesConfig
): number | null => {
  if (dates.isRolling) {
    // If rolling, end date is explicitly set by user
    return dates.endDate;
  } else {
    // If not rolling, end date is the last decision
    if (dates.subsequentDecisions.length === 0) {
      return dates.firstDecisionTime;
    }
    
    const decisions = calculateDecisionTimes(
      dates.firstDecisionTime, 
      dates.subsequentDecisions
    );
    return decisions[decisions.length - 1];
  }
};

/**
 * Validates that the date sequence is correct:
 * submission → voting → first decision
 */
export const validateDateSequence = (
  dates: CreateWaveDatesConfig
): string[] => {
  const errors = [];
  
  if (dates.votingStartDate < dates.submissionStartDate) {
    errors.push("Voting start date must be after submission start date");
  }
  
  if (dates.firstDecisionTime < dates.votingStartDate) {
    errors.push("First decision time must be after voting start date");
  }
  
  if (dates.isRolling && dates.subsequentDecisions.length === 0) {
    errors.push("Rolling mode requires at least one subsequent decision interval");
  }
  
  if (dates.isRolling && !dates.endDate) {
    errors.push("Rolling mode requires an end date");
  }
  
  return errors;
};

/**
 * Updates other dates when submission start date changes
 * to maintain valid sequence
 */
export const adjustDatesAfterSubmissionChange = (
  dates: CreateWaveDatesConfig, 
  newSubmissionStartDate: number
): CreateWaveDatesConfig => {
  const newDates = { ...dates, submissionStartDate: newSubmissionStartDate };
  
  // Ensure voting starts after submission
  if (dates.votingStartDate < newSubmissionStartDate) {
    newDates.votingStartDate = newSubmissionStartDate;
    
    // Ensure first decision is after voting
    if (dates.firstDecisionTime < newSubmissionStartDate) {
      newDates.firstDecisionTime = newSubmissionStartDate;
    }
  }
  
  return newDates;
};

/**
 * Formats a date for display
 */
export const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
};

/**
 * Generates decision point text
 */
export const generateDecisionPointText = (
  firstDecisionTime: number,
  subsequentDecisions: number[]
): string[] => {
  const decisionTimes = calculateDecisionTimes(firstDecisionTime, subsequentDecisions);
  return decisionTimes.map(time => formatDate(time));
};

/**
 * Convert milliseconds to time period for display
 */
export const msToTimePeriod = (ms: number): { value: number, unit: string } => {
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day;
  
  if (ms % month === 0 && ms >= month) {
    return { value: ms / month, unit: 'months' };
  } else if (ms % week === 0 && ms >= week) {
    return { value: ms / week, unit: 'weeks' };
  } else if (ms % day === 0 && ms >= day) {
    return { value: ms / day, unit: 'days' };
  } else if (ms % hour === 0 && ms >= hour) {
    return { value: ms / hour, unit: 'hours' };
  } else {
    return { value: ms / minute, unit: 'minutes' };
  }
};
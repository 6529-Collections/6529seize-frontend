import { Time } from "../time";

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
export const isTimeZero = (timeLeft: TimeLeft): boolean => {
  return (
    timeLeft.days === 0 &&
    timeLeft.hours === 0 &&
    timeLeft.minutes === 0 &&
    timeLeft.seconds === 0
  );
};
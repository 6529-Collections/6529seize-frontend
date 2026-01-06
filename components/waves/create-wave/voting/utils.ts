import type { TimeUnit} from './types';
import { MIN_MINUTES, MAX_MINUTES, MAX_HOURS } from './types';

/**
 * Converts a time value from its current unit to minutes
 * @param value - The numeric value to convert
 * @param unit - The current unit of the value
 * @returns The equivalent value in minutes
 */
export const convertToMinutes = (value: number, unit: TimeUnit): number => 
  unit === "minutes" ? value : value * 60;

/**
 * Converts a time value from minutes to the target unit
 * @param minutes - The value in minutes
 * @param toUnit - The target unit to convert to
 * @returns The equivalent value in the target unit
 */
export const convertFromMinutes = (minutes: number, toUnit: TimeUnit): number => 
  toUnit === "minutes" ? minutes : Math.floor(minutes / 60);

/**
 * Ensures a value is within the valid bounds for its unit
 * @param value - The numeric value to check
 * @param unit - The unit of the value
 * @returns A value guaranteed to be within valid bounds
 */
export const ensureValueInBounds = (value: number, unit: TimeUnit): number => {
  if (unit === "minutes") {
    return Math.max(MIN_MINUTES, Math.min(MAX_MINUTES, value));
  }
  return Math.max(1, Math.min(MAX_HOURS, value));
};
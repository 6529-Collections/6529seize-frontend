/**
 * Represents time units available for averaging interval
 */
export type TimeUnit = "minutes" | "hours";

/**
 * Configuration for time-weighted voting
 * Controls how votes are averaged over time
 */
// Match the config interface from the main wave types
import type { TimeWeightedVotingSettings } from "@/types/waves.types";

// Re-export TimeWeightedVotingSettings as TimeWeightedVotingConfig for backward compatibility
export type TimeWeightedVotingConfig = TimeWeightedVotingSettings;

// Constants for validation
export const MIN_MINUTES = 5;
export const MAX_HOURS = 24;
export const MAX_MINUTES = MAX_HOURS * 60;

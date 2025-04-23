/**
 * Types for Wave leaderboard time display components
 */

/**
 * Represents the phase type of the Wave
 */
enum WaveLeaderboardTimeType {
  DROPPING = "DROPPING",
  VOTING = "VOTING",
}

/**
 * Represents the current state of a Wave phase
 */
enum WaveLeaderboardTimeState {
  UPCOMING = "UPCOMING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
}

/**
 * Represents a decision point in a Wave timeline
 */
export interface DecisionPoint {
  id: number;
  name: string;
  timestamp: number;
}

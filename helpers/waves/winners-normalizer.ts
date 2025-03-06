import { ExtendedDrop } from "./drop.helpers";
import { WaveDecisionAward, WaveDecisionWinner } from "../../hooks/waves/useWaveDecisions";
import { ApiDrop } from "../../generated/models/ApiDrop";

// Normalized data structures for winner data
export interface NormalizedWinner {
  drop: ExtendedDrop;
  rank: number;
  voteCount?: number;
  awards?: WaveDecisionAward[];
}

export interface NormalizedDecisionPoint {
  id: string;
  date: Date;
  label: string;
  rank: number;
  winners: NormalizedWinner[];
}

/**
 * Normalizes leaderboard data (from useWaveDropsLeaderboard) into a standard format
 * @param drops Array of drops from leaderboard endpoint
 * @returns Normalized winner data
 */
export function normalizeLeaderboardData(drops: ExtendedDrop[]): NormalizedWinner[] {
  return drops.map((drop, index) => ({
    drop,
    rank: drop.rank || index + 1,
    voteCount: drop.vote_count,
  }));
}

/**
 * Creates a single normalized decision point from leaderboard data
 * @param drops Array of drops from leaderboard endpoint
 * @returns A normalized decision point
 */
export function createSingleDecisionPoint(drops: ExtendedDrop[]): NormalizedDecisionPoint {
  return {
    id: "single-decision",
    date: new Date(), // Current date as this is for display only
    label: "Winner Announcement",
    rank: 1,
    winners: normalizeLeaderboardData(drops),
  };
}

/**
 * Normalizes decision data (from useWaveDecisions) into a standard format
 * @param decisionPoints Array of decision points from decisions endpoint
 * @returns Array of normalized decision points
 */
export function normalizeDecisionPoints(
  decisionPoints: {
    id: string;
    date: Date;
    label: string;
    rank: number;
    decisionTime: number;
    winners: WaveDecisionWinner[];
  }[]
): NormalizedDecisionPoint[] {
  return decisionPoints.map((point) => ({
    id: point.id,
    date: point.date,
    label: point.label,
    rank: point.rank,
    winners: point.winners.map((winner) => ({
      drop: winner.drop as unknown as ExtendedDrop, // Type casting may need adjustment
      rank: winner.place,
      awards: winner.awards,
    })),
  }));
}
/**
 * Represents a decision point in a Wave timeline
 */
export interface DecisionPoint {
  id: string;
  name: string;
  timestamp: number;
  seriesIndex: number;
}

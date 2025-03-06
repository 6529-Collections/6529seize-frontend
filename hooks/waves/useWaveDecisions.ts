import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "../../components/react-query-wrapper/utils/query-keys";
import { commonApiFetch } from "../../services/api/common-api";
import { format } from "date-fns";
import { ApiWave } from "../../generated/models/ApiWave";

// This interface should match what comes back from the decisions endpoint
export interface WaveDecision {
  decision_time: number;
  winners: WaveDecisionWinner[];
}

export interface WaveDecisionWinner {
  place: number;
  awards: WaveDecisionAward[];
  drop: any; // Using 'any' for brevity, should be ApiDrop or similar
}

export interface WaveDecisionAward {
  type: string;
  subtype?: string;
  description: string;
  credit?: string;
  rep_category?: string;
  amount?: number;
}

// This is the model we'll use in the UI components
export interface DecisionPoint {
  id: string;
  date: Date;
  label: string;
  rank: number;
  decisionTime: number;
  winners: WaveDecisionWinner[];
}

interface UseWaveDecisionsProps {
  readonly wave: ApiWave;
  readonly enabled?: boolean;
}

export function useWaveDecisions({ wave, enabled = true }: UseWaveDecisionsProps) {
  const [decisionPoints, setDecisionPoints] = useState<DecisionPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { data, isError, error, refetch } = useQuery({
    queryKey: [QueryKey.WAVE_DECISIONS, { waveId: wave.id }],
    queryFn: async () => {
      return await commonApiFetch<{ data: WaveDecision[] }>({
        endpoint: `waves/${wave.id}/decisions`,
        params: {
          sort_direction: "DESC",
          sort: "decision_time",
          page: "1",
          page_size: "100"  // Fetch a reasonable amount, adjust as needed
        }
      });
    },
    enabled: enabled && !!wave.id,
    staleTime: 60000 // Adjust based on how frequently decisions update
  });

  useEffect(() => {
    if (data?.data) {
      // Transform the API data into our UI model
      const points: DecisionPoint[] = data.data.map((decision, index) => {
        const decisionDate = new Date(decision.decision_time);
        
        return {
          id: `decision-${decision.decision_time}`,
          date: decisionDate,
          label: `Winner Announcement ${index + 1}`,
          rank: index + 1,
          decisionTime: decision.decision_time,
          winners: decision.winners
        };
      });
      
      setDecisionPoints(points);
      setIsLoading(false);
    }
  }, [data]);

  // Helper to check if a decision point is in the future
  const isUpcoming = (point: DecisionPoint) => {
    return new Date(point.date) > new Date();
  };

  // Filter to show only past winners and sort them by rank
  const pastDecisionPoints = decisionPoints
    .filter(point => !isUpcoming(point))
    .sort((a, b) => b.rank - a.rank);

  return {
    decisionPoints: pastDecisionPoints,
    isLoading,
    isError,
    error,
    refetch
  };
}

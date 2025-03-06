import React, { useContext, useReducer, useEffect } from "react";
import { ApiWave } from "../../../generated/models/ApiWave";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { WaveWinnersDrops } from "./drops/WaveWinnersDrops";
import { WaveWinnersPodium } from "./podium/WaveWinnersPodium";
import { WaveRollingWinners } from "./WaveRollingWinners";
import { useDecisionPoints } from "../../../hooks/waves/useDecisionPoints";
import { useWaveDecisions } from "../../../hooks/waves/useWaveDecisions";
import { 
  createSingleDecisionPoint, 
  normalizeDecisionPoints,
  NormalizedDecisionPoint
} from "../../../helpers/waves/winners-normalizer";
import {
  useWaveDropsLeaderboard,
  WaveDropsLeaderboardSortBy,
  WaveDropsLeaderboardSortDirection,
} from "../../../hooks/useWaveDropsLeaderboard";
import { AuthContext } from "../../auth/Auth";

interface WaveWinnersProps {
  readonly wave: ApiWave;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

// Define state and action types
type State = {
  normalizedDecisionPoints: NormalizedDecisionPoint[];
  isLoading: boolean;
  dataProcessed: boolean;
};

type Action = 
  | { type: 'SET_MULTI_DECISION_POINTS', payload: NormalizedDecisionPoint[] }
  | { type: 'SET_SINGLE_DECISION_POINT', payload: NormalizedDecisionPoint }
  | { type: 'SET_EMPTY_DECISION_POINTS' }
  | { type: 'SET_PROCESSED', payload: boolean };

// Reducer function to handle state updates
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_MULTI_DECISION_POINTS':
      return { 
        ...state, 
        normalizedDecisionPoints: action.payload, 
        isLoading: false,
        dataProcessed: true
      };
    case 'SET_SINGLE_DECISION_POINT':
      return { 
        ...state, 
        normalizedDecisionPoints: [action.payload], 
        isLoading: false,
        dataProcessed: true
      };
    case 'SET_EMPTY_DECISION_POINTS':
      return { 
        ...state, 
        normalizedDecisionPoints: [], 
        isLoading: false,
        dataProcessed: true
      };
    case 'SET_PROCESSED':
      return { 
        ...state, 
        dataProcessed: action.payload
      };
    default:
      return state;
  }
}

export const WaveWinners: React.FC<WaveWinnersProps> = ({
  wave,
  onDropClick,
}) => {
  const { isMultiDecisionWave } = useDecisionPoints(wave);
  const { connectedProfile } = useContext(AuthContext);
  
  // Use reducer instead of multiple useState calls
  const [state, dispatch] = useReducer(reducer, {
    normalizedDecisionPoints: [],
    isLoading: true,
    dataProcessed: false
  });
  
  // Reset data processed flag when wave changes
  useEffect(() => {
    dispatch({ type: 'SET_PROCESSED', payload: false });
  }, [wave.id]);

  // Fetch data for single decision waves (using leaderboard)
  const { 
    drops: leaderboardDrops,
    isFetching: isLeaderboardFetching 
  } = useWaveDropsLeaderboard({
    waveId: wave.id,
    connectedProfileHandle: connectedProfile?.profile?.handle,
    reverse: false,
    dropsSortBy: WaveDropsLeaderboardSortBy.RANK,
    sortDirection: WaveDropsLeaderboardSortDirection.ASC,
    pollingEnabled: false,
    enabled: !isMultiDecisionWave
  });

  // Fetch data for multi-decision waves (using decisions endpoint)
  const {
    decisionPoints: apiDecisionPoints,
    isLoading: isDecisionsLoading,
  } = useWaveDecisions({
    wave,
    enabled: isMultiDecisionWave
  });

  // Process data for multi-decision waves
  useEffect(() => {
    // Skip if already processed or not applicable
    if (!isMultiDecisionWave || state.dataProcessed) return;
    
    // Only proceed when decision loading is complete
    if (isDecisionsLoading) return;
    
    if (apiDecisionPoints?.length > 0) {
      const normalized = normalizeDecisionPoints(apiDecisionPoints);
      dispatch({ type: 'SET_MULTI_DECISION_POINTS', payload: normalized });
    } else {
      dispatch({ type: 'SET_EMPTY_DECISION_POINTS' });
    }
  }, [isMultiDecisionWave, apiDecisionPoints, isDecisionsLoading, state.dataProcessed]);
  
  // Process data for single-decision waves
  useEffect(() => {
    // Skip if already processed or not applicable
    if (isMultiDecisionWave || state.dataProcessed) return;
    
    // Only proceed when leaderboard loading is complete
    if (isLeaderboardFetching) return;
    
    if (leaderboardDrops?.length > 0) {
      const singlePoint = createSingleDecisionPoint(leaderboardDrops);
      dispatch({ type: 'SET_SINGLE_DECISION_POINT', payload: singlePoint });
    } else {
      dispatch({ type: 'SET_EMPTY_DECISION_POINTS' });
    }
  }, [isMultiDecisionWave, leaderboardDrops, isLeaderboardFetching, state.dataProcessed]);

  return (
    <div className="tw-space-y-4 lg:tw-space-y-6 tw-px-2 sm:tw-px-4 md:tw-px-6 lg:tw-px-0">
      {isMultiDecisionWave ? (
        <WaveRollingWinners 
          wave={wave} 
          onDropClick={onDropClick} 
          decisionPoints={state.normalizedDecisionPoints}
        />
      ) : (
        <div className="tw-space-y-2 tw-mt-4 tw-pb-4 tw-max-h-[calc(100vh-200px)] tw-pr-2 tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300">
          <WaveWinnersPodium 
            wave={wave} 
            onDropClick={onDropClick} 
            normalizedWinners={state.normalizedDecisionPoints[0]?.winners || []}
            isLoading={state.isLoading}
          />
          <WaveWinnersDrops 
            wave={wave} 
            onDropClick={onDropClick} 
            normalizedWinners={state.normalizedDecisionPoints[0]?.winners || []}
            isLoading={state.isLoading}
            hasInfiniteLoading={!isMultiDecisionWave}
          />
        </div>
      )}
    </div>
  );
};

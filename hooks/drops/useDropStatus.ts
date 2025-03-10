import { ApiDrop } from "../../generated/models/ApiDrop";
import { ApiDropType } from "../../generated/models/ApiDropType";
import { ApiWave } from "../../generated/models/ApiWave";
import { useWaveState, WaveVotingState } from "../useWaveState";

export interface DropStatus {
  /**
   * Whether the drop is a winner
   */
  isWinner: boolean;
  
  /**
   * The ranking position of the winner (1st, 2nd, 3rd, etc.)
   * Will be undefined if the drop is not a winner
   */
  winningRank?: number;
  
  /**
   * Whether voting is currently allowed for this drop
   */
  isVotingAllowed: boolean;
}

/**
 * Hook to determine the status of a drop, particularly in the context of
 * rolling waves and decision points
 */
export function useDropStatus(drop: ApiDrop, wave: ApiWave | null): DropStatus {
  // If wave is null, return a default status
  if (!wave) {
    return {
      isWinner: false,
      isVotingAllowed: false
    };
  }

  // Get the voting state of the wave
  const { votingState } = useWaveState(wave);
  
  // Check if this is a winner drop
  const isWinner = drop.drop_type === ApiDropType.Winner;
  
  // Get the rank if available
  const winningRank = drop.rank;
  
  // Determine if voting is allowed
  // Voting is NOT allowed if:
  // 1. The drop is a winner already
  // 2. The wave's voting period has ended
  // 3. The drop's participation conditions are not met
  const isVotingAllowed = 
    !isWinner && 
    votingState === WaveVotingState.ONGOING &&
    drop.drop_type === ApiDropType.Participatory &&
    drop.wave.authenticated_user_eligible_to_vote;
  
  return {
    isWinner,
    ...(isWinner && winningRank ? { winningRank } : {}),
    isVotingAllowed
  };
}
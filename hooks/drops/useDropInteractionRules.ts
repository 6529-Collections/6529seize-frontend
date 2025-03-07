import { useContext } from "react";
import { AuthContext } from "../../components/auth/Auth";
import { ApiDrop } from "../../generated/models/ApiDrop";
import { ApiDropType } from "../../generated/models/ApiDropType";
import { DropVoteState } from "./types";

interface DropInteractionRules {
  canShowVote: boolean; // determines if voting UI should be visible
  canVote: boolean; // determines if voting is enabled
  voteState: DropVoteState; // reason for current vote state
  canDelete: boolean; // determines if delete is allowed
  isAuthor: boolean; // determines if current user is the author
  isWinner: boolean; // determines if drop is a winner
  winningRank?: number; // rank of the winning drop if applicable
}

/**
 * Hook to determine various interaction rules for a drop
 * @param drop The drop to check rules for
 * @returns Object containing boolean flags for different interaction possibilities
 */
export function useDropInteractionRules(drop: ApiDrop): DropInteractionRules {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);

  // Check if this is a winner drop
  const isWinner = drop.drop_type === ApiDropType.Winner;
  const winningRank = isWinner ? drop.rank : undefined;

  // Determine vote state in order of precedence
  const getVoteState = (): DropVoteState => {
    if (!connectedProfile) {
      return DropVoteState.NOT_LOGGED_IN;
    }
    if (!connectedProfile.profile?.handle) {
      return DropVoteState.NO_PROFILE;
    }
    if (activeProfileProxy) {
      return DropVoteState.PROXY;
    }

    // Check for winner state before other checks
    if (isWinner) {
      return DropVoteState.IS_WINNER;
    }

    if (drop.id.startsWith("temp-")) {
      return DropVoteState.CANT_VOTE;
    }
    if (
      (drop.drop_type === ApiDropType.Participatory &&
        !drop.wave.authenticated_user_eligible_to_vote) ||
      (drop.drop_type === ApiDropType.Chat &&
        !drop.wave.authenticated_user_eligible_to_chat)
    ) {
      return DropVoteState.CANT_VOTE;
    }

    if (!drop.context_profile_context?.max_rating) {
      return DropVoteState.NO_CREDIT;
    }

    return DropVoteState.CAN_VOTE;
  };

  const voteState = getVoteState();

  // Base rules that apply to all interactions
  const baseRules =
    !!connectedProfile?.profile?.handle && // must have profile
    !activeProfileProxy && // must not be using proxy
    !drop.id.startsWith("temp-"); // must not be temporary drop

  // Rules for showing vote UI - show only if none of these states are active
  // We DO NOT want to show the vote UI for winners anymore
  const canShowVote = ![
    DropVoteState.NOT_LOGGED_IN,
    DropVoteState.NO_PROFILE,
    DropVoteState.PROXY,
    DropVoteState.CANT_VOTE,
    DropVoteState.IS_WINNER, // Added IS_WINNER to hide voting UI for winner drops
  ].includes(voteState);

  // Can vote only if state is CAN_VOTE (not IS_WINNER or other states)
  const canVote = voteState === DropVoteState.CAN_VOTE;

  const isAuthor =
    !!connectedProfile?.profile?.handle &&
    connectedProfile.profile.handle === drop.author.handle;

  // Delete rules
  const canDelete = baseRules && isAuthor;

  return {
    canShowVote,
    canVote,
    voteState,
    canDelete,
    isAuthor,
    isWinner,
    ...(isWinner && winningRank ? { winningRank } : {}),
  };
}

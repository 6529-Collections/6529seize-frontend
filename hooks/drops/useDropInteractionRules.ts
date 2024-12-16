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
}

/**
 * Hook to determine various interaction rules for a drop
 * @param drop The drop to check rules for
 * @returns Object containing boolean flags for different interaction possibilities
 */
export function useDropInteractionRules(drop: ApiDrop): DropInteractionRules {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);

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

  // Rules for showing vote UI - show if it's not certain system states
  const canShowVote = ![
    DropVoteState.NOT_LOGGED_IN,
    DropVoteState.NO_PROFILE,
    DropVoteState.PROXY,
    DropVoteState.CANT_VOTE,
  ].includes(voteState);

  // Can vote only if state is CAN_VOTE
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
  };
}

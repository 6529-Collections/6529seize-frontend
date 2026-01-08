"use client";

import { useContext } from "react";
import { AuthContext } from "@/components/auth/Auth";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { DropVoteState } from "./types";
import { Time } from "@/helpers/time";

interface DropInteractionRules {
  canShowVote: boolean; // determines if voting UI should be visible
  canVote: boolean; // determines if voting is enabled
  voteState: DropVoteState; // reason for current vote state
  canDelete: boolean; // determines if delete is allowed
  isAuthor: boolean; // determines if current user is the author
  isWinner: boolean; // determines if drop is a winner
  isVotingEnded: boolean; // determines if the voting period has ended for this drop's wave
  winningRank?: number | undefined; // rank of the winning drop if applicable
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
  const winningRank = isWinner ? drop.winning_context?.place : undefined;

  // Determine vote state in order of precedence
  const getVoteState = (): DropVoteState => {
    if (!connectedProfile) {
      return DropVoteState.NOT_LOGGED_IN;
    }
    if (!connectedProfile.handle) {
      return DropVoteState.NO_PROFILE;
    }
    if (activeProfileProxy) {
      return DropVoteState.PROXY;
    }

    // Check for winner state before other checks
    if (isWinner) {
      return DropVoteState.IS_WINNER;
    }

    // Check if voting period has started or ended
    const now = Time.currentMillis();

    // Check if voting period hasn't started yet
    if (
      drop.drop_type !== ApiDropType.Chat &&
      drop.wave.voting_period_start &&
      now < drop.wave.voting_period_start
    ) {
      return DropVoteState.VOTING_NOT_STARTED;
    }

    // Check if voting period has ended
    if (
      drop.drop_type !== ApiDropType.Chat &&
      drop.wave.voting_period_end &&
      now > drop.wave.voting_period_end
    ) {
      return DropVoteState.VOTING_ENDED;
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
    !!connectedProfile?.handle && // must have profile
    !activeProfileProxy && // must not be using proxy
    !drop.id.startsWith("temp-"); // must not be temporary drop

  // Rules for showing vote UI - show only if none of these states are active
  // Hide voting UI in various cases
  const canShowVote = ![
    DropVoteState.NOT_LOGGED_IN,
    DropVoteState.NO_PROFILE,
    DropVoteState.PROXY,
    DropVoteState.CANT_VOTE,
    DropVoteState.IS_WINNER, // Hide for winner drops
    DropVoteState.VOTING_NOT_STARTED, // Hide when voting hasn't started yet
    DropVoteState.VOTING_ENDED, // Hide when voting period has ended
  ].includes(voteState);

  // Can vote only if state is CAN_VOTE (not IS_WINNER or other states)
  const canVote = voteState === DropVoteState.CAN_VOTE;

  const isAuthor =
    !!connectedProfile?.handle &&
    connectedProfile.handle === drop.author.handle;

  const isAdmin = drop.wave.authenticated_user_admin;
  const adminDropDeletionEnabled = drop.wave.admin_drop_deletion_enabled;
  const canDeleteAsAdmin = isAdmin && adminDropDeletionEnabled;
  // Delete rules
  const canDelete = baseRules && (isAuthor || canDeleteAsAdmin);

  // Check if voting has ended by comparing current time with voting period end time
  const now = Time.currentMillis();
  const isVotingEnded =
    drop.drop_type === ApiDropType.Participatory && drop.wave.voting_period_end
      ? now > drop.wave.voting_period_end
      : false;

  return {
    canShowVote,
    canVote,
    voteState,
    canDelete,
    isAuthor,
    isWinner,
    isVotingEnded,
    ...(isWinner && winningRank ? { winningRank } : {}),
  };
}

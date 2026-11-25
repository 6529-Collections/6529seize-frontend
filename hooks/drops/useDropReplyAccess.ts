"use client";

import { useAuth } from "@/components/auth/Auth";
import { isAuthResolving } from "@/components/auth/authResolution";
import { isAuthSessionForProfile } from "@/components/auth/auth-session-scope";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiWave } from "@/generated/models/ApiWave";
import { getWaveReplyEligibility } from "@/helpers/waves/wave-chat-replies.helpers";
import {
  isDropReplyEligible,
  isDropReplyTargetAvailable,
} from "@/helpers/waves/drop-reply-eligibility";
import type { DropClientDeliveryState } from "@/helpers/waves/drop.helpers";
import { useWaveEligibility } from "@/contexts/wave/WaveEligibilityContext";
import { useDropPrivileges } from "@/hooks/useDropPriviledges";
import { usePublicProfileModerationStatus } from "@/hooks/content-moderation/usePublicProfileModerationStatus";
import { useWaveData } from "@/hooks/useWaveData";
import { getWalletAddress } from "@/services/auth/auth.utils";
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

/** Drafting is permitted during slow mode, but never for a blocked actor. */
export function useDropReplyAccess(
  waveId: string,
  suppliedWave?: ApiWave,
  enabled = true
) {
  const auth = useAuth();
  const { address, hasValidWalletAuth, connectionState } =
    useSeizeConnectContext();
  const profileId = auth.connectedProfile?.id;
  const hasReplyingProfile = Boolean(
    enabled &&
    profileId &&
    auth.connectedProfile.handle?.trim() &&
    auth.isAuthenticated === true &&
    auth.isDirectProfileSession === true &&
    !auth.activeProfileProxy &&
    address &&
    hasValidWalletAuth === true &&
    !isAuthResolving(connectionState, auth.fetchingProfile)
  );
  const identityKey = JSON.stringify([
    address?.toLowerCase(),
    profileId,
    auth.activeProfileProxy?.id,
    auth.isDirectProfileSession,
    auth.isAuthenticated,
  ]);
  // Viewer eligibility must be confirmed for this actor, even when a shared
  // wave cache still contains the previous account's response during a switch.
  const waveQuery = useWaveData({
    waveId: hasReplyingProfile ? waveId : null,
    viewerKey: identityKey,
  });
  const wave = waveQuery.data;
  const moderation = usePublicProfileModerationStatus(
    hasReplyingProfile ? profileId : null
  );
  const chat = wave?.chat;
  const { getEligibility } = useWaveEligibility();
  const eligibility = getEligibility(waveId);
  const canChat = Boolean(
    chat?.authenticated_user_eligible &&
    eligibility?.authenticated_user_eligible_to_chat !== false
  );
  const canReplyToWave = Boolean(
    chat &&
    getWaveReplyEligibility(chat) &&
    (eligibility?.authenticated_user_eligible_to_reply ?? true)
  );
  const centralAccessKey = JSON.stringify([
    eligibility?.authenticated_user_eligible_to_chat,
    eligibility?.authenticated_user_eligible_to_reply,
  ]);
  const previousCentralAccess = useRef(centralAccessKey);
  const { refetch } = waveQuery;
  useEffect(() => {
    if (previousCentralAccess.current !== centralAccessKey) {
      previousCentralAccess.current = centralAccessKey;
      if (hasReplyingProfile) void refetch({ cancelRefetch: false });
    }
  }, [centralAccessKey, hasReplyingProfile, refetch]);
  const refreshAfterSlowMode = useCallback(() => {
    void refetch({ cancelRefetch: false });
  }, [refetch]);
  const { chatRestriction } = useDropPrivileges({
    isLoggedIn: hasReplyingProfile,
    isProxy: !auth.isDirectProfileSession || Boolean(auth.activeProfileProxy),
    canChat,
    canDrop: false,
    chatDisabled: chat?.enabled !== true,
    slowModeCooldownMs: chat?.slow_mode_cooldown_ms ?? null,
    nextDropAllowed: chat?.next_drop_allowed ?? null,
    submissionStarts: null,
    submissionEnds: null,
    maxDropsCount: null,
    identityDropsCount: null,
    onSlowModeCooldownExpired: refreshAfterSlowMode,
  });
  const eligibleToReply = isDropReplyEligible(
    {
      wave: {
        authenticated_user_eligible_to_chat: canChat,
        authenticated_user_eligible_to_reply: canReplyToWave,
      },
    },
    { authenticated_user_chat_restriction: chatRestriction }
  );
  const canReply = Boolean(
    hasReplyingProfile &&
    !moderation.isLoading &&
    !moderation.isSuspended &&
    chat?.enabled === true &&
    suppliedWave?.chat.enabled !== false &&
    !waveQuery.isError &&
    eligibleToReply
  );
  const currentAccess = useRef({ canReply, identityKey });
  useLayoutEffect(() => {
    currentAccess.current = { canReply, identityKey };
  }, [canReply, identityKey]);

  const canReplyToDrop = useCallback(
    (
      drop: Pick<ApiDrop, "id" | "wave"> & {
        readonly clientDeliveryState?: DropClientDeliveryState | undefined;
      }
    ): boolean =>
      currentAccess.current.canReply &&
      currentAccess.current.identityKey === identityKey &&
      isDropReplyTargetAvailable(drop, waveId) &&
      getWalletAddress()?.toLowerCase() === address?.toLowerCase() &&
      isAuthSessionForProfile({
        address: getWalletAddress(),
        profileId,
        proxyProfileId: null,
      }),
    [identityKey, profileId, waveId, address]
  );

  return { canReply, canReplyToDrop, identityKey };
}

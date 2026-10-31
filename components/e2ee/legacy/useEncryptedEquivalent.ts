"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import type { ApiWave } from "@/generated/models/ApiWave";
import { useE2ee } from "@/hooks/e2ee/useE2ee";
import type { E2eeConversation } from "@/lib/e2ee/types";
import { resolveDmParticipants } from "../plaintext/dmParticipants";

const PARTICIPANTS_STALE_MS = 5 * 60_000;

/**
 * The active encrypted chat whose members are exactly this DM's members,
 * or null. It needs the engine already loaded on this browser (an enrolled
 * device); otherwise there is nothing to compare and the DM stays writable.
 */
export function findEncryptedEquivalent(
  conversations: readonly E2eeConversation[],
  memberProfileIds: readonly string[]
): E2eeConversation | null {
  const wanted = new Set(memberProfileIds);
  if (wanted.size < 2) {
    return null;
  }
  const matches = conversations.filter(
    (conversation) =>
      conversation.status === "active" &&
      conversation.members.length === wanted.size &&
      conversation.members.every((member) => wanted.has(member.profileId))
  );
  // Prefer the most recently active match.
  return matches.sort((a, b) => b.updatedAt - a.updatedAt)[0] ?? null;
}

export function useEncryptedEquivalent(
  wave: ApiWave,
  enabled: boolean
): E2eeConversation | null {
  const queryClient = useQueryClient();
  const { conversations, profileId } = useE2ee();
  const hasActive = conversations.some((c) => c.status === "active");
  const { data: participants } = useQuery({
    queryKey: [QueryKey.LEGACY_DM_PARTICIPANTS, wave.id, profileId],
    queryFn: () => resolveDmParticipants(queryClient, wave, profileId),
    enabled: enabled && hasActive && profileId !== null,
    staleTime: PARTICIPANTS_STALE_MS,
  });
  return useMemo(() => {
    if (!enabled || !participants || !profileId) {
      return null;
    }
    return findEncryptedEquivalent(conversations, [
      profileId,
      ...participants.map((person) => person.profileId),
    ]);
  }, [conversations, enabled, participants, profileId]);
}

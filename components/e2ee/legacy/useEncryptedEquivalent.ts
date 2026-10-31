"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import type { ApiWave } from "@/generated/models/ApiWave";
import { useE2ee } from "@/hooks/e2ee/useE2ee";
import type { E2eeConversation } from "@/lib/e2ee/types";
import { findEncryptedEquivalent } from "./encryptedEquivalent";
import { resolveDmParticipants } from "../plaintext/dmParticipants";

const PARTICIPANTS_STALE_MS = 5 * 60_000;

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

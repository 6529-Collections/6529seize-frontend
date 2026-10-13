"use client";

import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";
import type {
  E2eeConversation,
  E2eeMember,
  E2eeMessage,
} from "@/lib/e2ee/types";
import { getE2eeProfileQueryOptions, toResolvedProfile } from "../e2eeProfiles";

/** Bounds lookups for very long histories with many former members. */
const MAX_FORMER_MEMBER_LOOKUPS = 50;

function addMessageProfileIds(ids: Set<string>, message: E2eeMessage): void {
  if (message.senderProfileId) {
    ids.add(message.senderProfileId);
  }
  if (message.notice?.actorProfileId) {
    ids.add(message.notice.actorProfileId);
  }
  for (const id of message.notice?.targetProfileIds ?? []) {
    ids.add(id);
  }
  for (const id of Object.values(message.reactions).flat()) {
    ids.add(id);
  }
}

function referencedProfileIds(messages: readonly E2eeMessage[]): Set<string> {
  const ids = new Set<string>();
  for (const message of messages) {
    addMessageProfileIds(ids, message);
  }
  return ids;
}

/**
 * Members for naming people in the timeline: the current members plus
 * people the timeline still mentions after they left or were removed (their
 * notices, earlier messages, reactions). Former members are resolved through
 * the same identity cache as the engine's profile lookups, so a name seen
 * while they were in the chat is reused, and "Unknown member" is shown only
 * when the profile really cannot be resolved.
 */
export function useE2eeDisplayMembers(
  conversation: E2eeConversation,
  messages: readonly E2eeMessage[]
): E2eeMember[] {
  const members = conversation.members;
  const missingKey = useMemo(() => {
    const current = new Set(members.map((member) => member.profileId));
    return [...referencedProfileIds(messages)]
      .filter((id) => !current.has(id))
      .sort((a, b) => a.localeCompare(b))
      .slice(0, MAX_FORMER_MEMBER_LOOKUPS)
      .join("\n");
  }, [members, messages]);
  const missing = useMemo(
    () => (missingKey ? missingKey.split("\n") : []),
    [missingKey]
  );

  const resolvedKey = useQueries({
    queries: missing.map((profileId) => getE2eeProfileQueryOptions(profileId)),
    combine: (results) =>
      JSON.stringify(
        results.map((result, index) => {
          const profileId = missing[index] ?? "";
          return result.data
            ? { profileId, ...toResolvedProfile(profileId, result.data) }
            : null;
        })
      ),
  });

  return useMemo(() => {
    const resolved = JSON.parse(resolvedKey) as ({
      profileId: string;
      handle: string | null;
      pfp: string | null;
      wallets: string[];
    } | null)[];
    const former: E2eeMember[] = [];
    for (const entry of resolved) {
      if (entry?.handle) {
        former.push({
          profileId: entry.profileId,
          handle: entry.handle,
          pfp: entry.pfp,
          wallets: entry.wallets,
          isAdmin: false,
          devices: [],
        });
      }
    }
    return former.length > 0 ? [...members, ...former] : members;
  }, [members, resolvedKey]);
}

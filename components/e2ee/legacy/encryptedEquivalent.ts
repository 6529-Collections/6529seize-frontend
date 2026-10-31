import type { E2eeConversation } from "@/lib/e2ee/types";

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

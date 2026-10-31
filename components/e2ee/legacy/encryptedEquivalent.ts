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
  // The most recently active match, without sorting in place.
  let best: E2eeConversation | null = null;
  for (const conversation of conversations) {
    const matches =
      conversation.status === "active" &&
      conversation.members.length === wanted.size &&
      conversation.members.every((member) => wanted.has(member.profileId));
    if (matches && (best === null || conversation.updatedAt > best.updatedAt)) {
      best = conversation;
    }
  }
  return best;
}

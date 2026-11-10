import type { E2eeConversation } from "./types";

interface DmIdentity {
  readonly kind: "dm" | "group";
  readonly admins: readonly string[];
  readonly members: readonly { readonly profileId: string | null }[];
}

/** The two participants a DM's `admins` names, or null when it is not a pair. */
export function getDmAdminPair(
  admins: readonly string[]
): ReadonlySet<string> | null {
  const pair = new Set(admins);
  return admins.length === 2 && pair.size === 2 ? pair : null;
}

/**
 * A direct conversation has exactly two participants. DM admins are the
 * original pair, even after a participant leaves; without a pair, the
 * current members must be exactly two. Either way it includes you, and no
 * member with a known profile is outside it.
 */
export function getDmPeerId(
  conversation: DmIdentity,
  selfProfileId: string | null
): string | null {
  if (conversation.kind !== "dm" || !selfProfileId) return null;
  const current = new Set(
    conversation.members.flatMap((member) =>
      member.profileId === null ? [] : [member.profileId]
    )
  );
  const pair = getDmAdminPair(conversation.admins) ?? current;
  if (pair.size !== 2 || !pair.has(selfProfileId)) return null;
  if ([...current].some((id) => !pair.has(id))) return null;
  return [...pair].find((id) => id !== selfProfileId) ?? null;
}

/** A one-person remainder of a DM cannot deliver messages to its old peer. */
export function isUsableDm(
  conversation: DmIdentity & Pick<E2eeConversation, "status" | "epoch">,
  selfProfileId: string | null
): boolean {
  const peer = getDmPeerId(conversation, selfProfileId);
  return (
    peer !== null &&
    conversation.status === "active" &&
    (conversation.epoch === 0 ||
      (conversation.members.some((member) => member.profileId === peer) &&
        conversation.members.some(
          (member) => member.profileId === selfProfileId
        )))
  );
}

/** Stable across insertion order and incoming traffic on different devices. */
export function compareDmSessions(
  a: E2eeConversation,
  b: E2eeConversation,
  selfProfileId: string | null
): number {
  const aActive = isUsableDm(a, selfProfileId);
  const bActive = isUsableDm(b, selfProfileId);
  if (aActive !== bActive) return aActive ? -1 : 1;
  if (!aActive && a.updatedAt !== b.updatedAt) return b.updatedAt - a.updatedAt;
  return a.g < b.g ? -1 : Number(a.g > b.g);
}

interface E2eeConversationThread {
  readonly key: string;
  readonly current: E2eeConversation;
  readonly sessions: readonly E2eeConversation[];
}

/** One list entry per DM peer. MLS groups and their histories stay intact. */
export function groupConversationThreads(
  conversations: readonly E2eeConversation[],
  selfProfileId: string | null
): E2eeConversationThread[] {
  const threads = new Map<string, E2eeConversation[]>();
  for (const conversation of conversations) {
    const peer = getDmPeerId(conversation, selfProfileId);
    const key = peer === null ? `group:${conversation.g}` : `dm:${peer}`;
    const sessions = threads.get(key) ?? [];
    sessions.push(conversation);
    threads.set(key, sessions);
  }
  return [...threads]
    .flatMap(([key, sessions]) => {
      sessions.sort((a, b) => compareDmSessions(a, b, selfProfileId));
      const current = sessions[0];
      return current ? [{ key, current, sessions }] : [];
    })
    .sort(
      (a, b) =>
        Math.max(...b.sessions.map((session) => session.updatedAt)) -
        Math.max(...a.sessions.map((session) => session.updatedAt))
    );
}

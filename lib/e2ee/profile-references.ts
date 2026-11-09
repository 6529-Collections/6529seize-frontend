import type { E2eeMessage } from "./types";

type ProfileReferences = Pick<
  E2eeMessage,
  "senderProfileId" | "notice" | "reactions"
>;

/** Only the bounded loaded timeline is inspected, never all saved history. */
export function referencedProfileIds(
  messages: Iterable<ProfileReferences>
): Set<string> {
  const ids = new Set<string>();
  for (const message of messages) {
    if (message.senderProfileId) ids.add(message.senderProfileId);
    if (message.notice?.actorProfileId) ids.add(message.notice.actorProfileId);
    for (const id of message.notice?.targetProfileIds ?? []) ids.add(id);
    for (const id of Object.values(message.reactions).flat()) ids.add(id);
  }
  return ids;
}

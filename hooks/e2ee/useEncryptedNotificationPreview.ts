"use client";

import { useAuth } from "@/components/auth/Auth";
import { useE2ee, useE2eeConversation } from "./useE2ee";

/** Plaintext comes exclusively from the current profile's local MLS store. */
export function useEncryptedNotificationPreview(
  group: string | null
): string | null {
  const { connectedProfile, activeProfileProxy } = useAuth();
  const encrypted = useE2ee();
  const profileId = connectedProfile?.id;
  const allowed =
    encrypted.status === "ready" &&
    activeProfileProxy === null &&
    encrypted.profileId === profileId;
  const { messages } = useE2eeConversation(allowed ? group : null);
  if (!allowed || !group) return null;
  const incoming = messages.filter(
    (message) =>
      message.kind === "message" &&
      !message.deleted &&
      !message.undecryptable &&
      !message.pending &&
      message.senderProfileId !== profileId
  );
  const preview = incoming.at(-1)?.text.slice(0, 240);
  return preview ?? null;
}

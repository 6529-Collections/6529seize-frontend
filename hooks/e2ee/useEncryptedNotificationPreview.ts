"use client";

import { useAuth } from "@/components/auth/Auth";
import { useE2ee, useE2eeConversation } from "./useE2ee";

/** Plaintext comes exclusively from the current profile's local MLS store. */
export function useEncryptedNotificationPreview(
  group: string | null,
  sequence?: number
): { preview: string | null; needsSetup: boolean } {
  const { connectedProfile, activeProfileProxy } = useAuth();
  const encrypted = useE2ee();
  const profileId = connectedProfile?.id;
  const allowed =
    encrypted.status === "ready" &&
    activeProfileProxy === null &&
    encrypted.profileId === profileId;
  const { messages } = useE2eeConversation(allowed ? group : null);
  const needsSetup =
    encrypted.status === "idle" || encrypted.status === "needs-enrollment";
  if (!allowed || !group) return { preview: null, needsSetup };
  const incoming = messages.filter(
    (message) =>
      message.kind === "message" &&
      !message.deleted &&
      !message.undecryptable &&
      !message.pending &&
      message.senderProfileId !== profileId &&
      (sequence === undefined || message.seq === sequence)
  );
  const preview = incoming.at(-1)?.text.slice(0, 240) ?? "";
  return { preview: preview === "" ? null : preview, needsSetup };
}

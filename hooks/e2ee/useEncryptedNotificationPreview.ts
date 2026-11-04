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
  const previewGroup = allowed && sequence !== undefined ? group : null;
  const { messages } = useE2eeConversation(previewGroup);
  const needsSetup =
    encrypted.status === "idle" || encrypted.status === "needs-enrollment";
  if (!previewGroup) return { preview: null, needsSetup };
  const incoming = messages.find(
    (message) =>
      message.seq === sequence &&
      message.kind === "message" &&
      !message.deleted &&
      !message.undecryptable &&
      !message.pending &&
      message.senderProfileId !== profileId
  );
  const preview = incoming?.text.slice(0, 240) ?? "";
  return { preview: preview === "" ? null : preview, needsSetup };
}

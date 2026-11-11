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
  const { conversation, messages } = useE2eeConversation(previewGroup);
  const needsSetup =
    encrypted.status === "idle" || encrypted.status === "needs-enrollment";
  if (!previewGroup) return { preview: null, needsSetup };

  // The saved summary can be available before the timeline loads. A timeline
  // entry for this sequence takes precedence even if it is deleted or locked.
  const savedMessage = conversation?.lastMessage;
  const incoming =
    messages.find((message) => message.seq === sequence) ??
    (savedMessage?.seq === sequence ? savedMessage : undefined);
  if (
    incoming?.kind !== "message" ||
    incoming.deleted ||
    incoming.undecryptable ||
    incoming.pending ||
    incoming.senderProfileId === profileId
  ) {
    return { preview: null, needsSetup };
  }
  // Clamp the rendered preview in the UI; cutting Markdown source can remove
  // closing delimiters and display formatting syntax as text.
  const preview = incoming.text;
  return { preview: preview === "" ? null : preview, needsSetup };
}

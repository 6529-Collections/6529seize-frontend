"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";
import {
  ENCRYPTED_MESSAGES_WAKE_PARAM,
  getEncryptedConversationRoute,
  getEncryptedMessagesRoute,
} from "@/helpers/navigation.helpers";
import { useE2ee } from "@/hooks/e2ee/useE2ee";
import type { E2eeConversation } from "@/lib/e2ee/types";
import { useMutedE2eeChats } from "../e2eeMutedChats";

/**
 * @api The one active, unmuted chat with unread messages, or null when there
 * are none or several (the list then shows which changed).
 */
export function pickWakeChat(
  conversations: readonly E2eeConversation[],
  muted: ReadonlySet<string>
): string | null {
  const unread = conversations.filter(
    (conversation) =>
      conversation.unread > 0 &&
      conversation.status === "active" &&
      !muted.has(conversation.g)
  );
  return unread.length === 1 ? (unread[0]?.g ?? null) : null;
}

/**
 * A phone push for encrypted messages carries no chat (D109 7.3), so it
 * opens `/messages/encrypted?wake=1`. Once this device has synced, the chat
 * that got the new message opens when it is the only one with unread
 * messages; otherwise the list stays (without the query). Decided on the
 * device, once per visit, and only while the list is still showing.
 */
export function useOpenWakeChat(): void {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { status, engine, profileId } = useE2ee();
  const muted = useMutedE2eeChats(profileId);
  const latestMuted = useRef(muted);
  const handled = useRef(false);
  const woke = searchParams.get(ENCRYPTED_MESSAGES_WAKE_PARAM) !== null;

  useLayoutEffect(() => {
    latestMuted.current = muted;
  }, [muted]);

  useEffect(() => {
    if (!woke || status !== "ready" || !engine || handled.current) {
      return;
    }
    handled.current = true;
    const listRoute = getEncryptedMessagesRoute();
    const open = () => {
      if (globalThis.location.pathname !== listRoute) {
        return;
      }
      const g = pickWakeChat(engine.getConversations(), latestMuted.current);
      router.replace(g === null ? listRoute : getEncryptedConversationRoute(g));
    };
    // Open whatever this device has even when the sync fails.
    void engine
      .sync()
      .catch(() => undefined)
      .then(open);
  }, [engine, router, status, woke]);
}

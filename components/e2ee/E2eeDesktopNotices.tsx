"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";
import {
  getEncryptedConversationIdFromPathname,
  getEncryptedConversationRoute,
} from "@/helpers/navigation.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { E2eeEngine } from "@/lib/e2ee/types";
import {
  collectE2eeDesktopNotices,
  e2eeNoticeId,
  getDesktopNotificationsBridge,
  type E2eeNoticeMarks,
} from "./e2eeDesktopNotifications";
import { useMutedE2eeChats } from "./e2eeMutedChats";

interface E2eeDesktopNoticesProps {
  readonly engine: E2eeEngine | null;
  readonly profileId: string | null;
  readonly wallet: string | null;
  readonly handle: string | null;
}

/**
 * 6529 Desktop: a native "New encrypted message" notification when a chat
 * gets a new message from someone else, unless the chat is muted or open in
 * the focused window. Renders nothing; does nothing outside the desktop app.
 */
export default function E2eeDesktopNotices({
  engine,
  profileId,
  wallet,
  handle,
}: E2eeDesktopNoticesProps) {
  const pathname = usePathname();
  const muted = useMutedE2eeChats(profileId);
  const locale = useBrowserLocale();
  const latest = useRef({ pathname, muted, locale });

  useLayoutEffect(() => {
    latest.current = { pathname, muted, locale };
  }, [pathname, muted, locale]);

  useEffect(() => {
    const bridge = getDesktopNotificationsBridge();
    if (!bridge || !engine || !profileId) {
      return;
    }
    let marks: E2eeNoticeMarks | null = null;
    const check = () => {
      if (engine.getStatus() !== "ready") {
        return;
      }
      const current = latest.current;
      const result = collectE2eeDesktopNotices({
        marks,
        conversations: engine.getConversations(),
        ownProfileId: profileId,
        muted: current.muted,
        focusedChat: document.hasFocus()
          ? getEncryptedConversationIdFromPathname(current.pathname)
          : null,
      });
      marks = result.marks;
      for (const notice of result.notices) {
        try {
          bridge.showNotification(
            e2eeNoticeId(notice),
            "",
            t(current.locale, "e2ee.desktopNotice.title"),
            t(current.locale, "e2ee.desktopNotice.body"),
            getEncryptedConversationRoute(notice.g),
            {
              targetAddress: wallet,
              targetProfileId: profileId,
              targetProfileHandle: handle,
            }
          );
        } catch {
          // A notification failure never affects the engine.
        }
      }
    };
    check();
    return engine.subscribe(check);
  }, [engine, profileId, wallet, handle]);

  return null;
}

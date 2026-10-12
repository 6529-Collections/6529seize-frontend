"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type {
  E2eeConversation,
  E2eeEngine,
  E2eeMessage,
} from "@/lib/e2ee/types";
import { getMemberName } from "../e2eeFormat";
import { getScrollBehavior } from "../e2eeMotion";
import { type E2eeMessageActions, E2eeMessageItem } from "./E2eeMessageItem";

const GROUP_WINDOW_MS = 5 * 60 * 1000;
const NEAR_BOTTOM_PX = 120;

const isGroupedWith = (
  previous: E2eeMessage | undefined,
  message: E2eeMessage
) =>
  previous?.kind === "message" &&
  message.kind === "message" &&
  previous.senderProfileId === message.senderProfileId &&
  message.reply === null &&
  Math.abs(message.ts - previous.ts) < GROUP_WINDOW_MS;

const getSequencedMax = (messages: readonly E2eeMessage[]): number => {
  let max = 0;
  for (const message of messages) {
    if (!message.pending && message.seq > max) {
      max = message.seq;
    }
  }
  return max;
};

/** "New message from X" for the newest incoming message after `afterSeq`. */
export function getIncomingAnnouncement({
  locale,
  messages,
  members,
  selfProfileId,
  afterSeq,
}: {
  readonly locale: SupportedLocale;
  readonly messages: readonly E2eeMessage[];
  readonly members: E2eeConversation["members"];
  readonly selfProfileId: string | null;
  readonly afterSeq: number;
}): string | null {
  let latest: E2eeMessage | null = null;
  for (const message of messages) {
    if (
      message.kind === "message" &&
      !message.pending &&
      message.seq > afterSeq &&
      message.senderProfileId !== selfProfileId
    ) {
      latest = message;
    }
  }
  if (!latest) {
    return null;
  }
  return t(locale, "e2ee.conversation.newMessage", {
    name: getMemberName(locale, members, latest.senderProfileId, selfProfileId),
  });
}

interface AnnouncementState {
  /** Highest sequenced message already considered; null before first load. */
  readonly seq: number | null;
  readonly text: string;
}

interface E2eeTimelineProps {
  readonly conversation: E2eeConversation;
  readonly messages: readonly E2eeMessage[];
  readonly engine: E2eeEngine;
  readonly selfProfileId: string | null;
  readonly canAct: boolean;
  readonly actions: E2eeMessageActions;
}

/**
 * Ascending timeline of messages and system notices. Keeps the view pinned
 * to the newest message while the reader is at the bottom, and announces
 * incoming messages (not the reader's own) through a polite live region.
 */
export function E2eeTimeline({
  conversation,
  messages,
  engine,
  selfProfileId,
  canAct,
  actions,
}: E2eeTimelineProps) {
  const locale = useBrowserLocale();
  const scrollRef = useRef<HTMLDivElement>(null);
  const nearBottomRef = useRef(true);
  const hasScrolledRef = useRef(false);
  const byId = useMemo(
    () => new Map(messages.map((message) => [message.id, message])),
    [messages]
  );

  // Announce only messages that arrive after the first render of this chat.
  const maxSeq = getSequencedMax(messages);
  const [announcement, setAnnouncement] = useState<AnnouncementState>({
    seq: null,
    text: "",
  });
  if (announcement.seq !== maxSeq) {
    const text =
      announcement.seq === null
        ? null
        : getIncomingAnnouncement({
            locale,
            messages,
            members: conversation.members,
            selfProfileId,
            afterSeq: announcement.seq,
          });
    setAnnouncement({ seq: maxSeq, text: text ?? announcement.text });
  }

  const lastMessage = messages.at(-1);
  const lastKey = lastMessage ? `${lastMessage.id}:${lastMessage.seq}` : "";

  useLayoutEffect(() => {
    const element = scrollRef.current;
    if (!element || !nearBottomRef.current || lastKey === "") {
      return;
    }
    element.scrollTo({
      top: element.scrollHeight,
      behavior: hasScrolledRef.current ? getScrollBehavior() : "auto",
    });
    hasScrolledRef.current = true;
  }, [lastKey]);

  const onScroll = () => {
    const element = scrollRef.current;
    if (!element) {
      return;
    }
    nearBottomRef.current =
      element.scrollHeight - element.scrollTop - element.clientHeight <
      NEAR_BOTTOM_PX;
  };

  return (
    <div
      ref={scrollRef}
      onScroll={onScroll}
      className="tw-min-h-0 tw-flex-1 tw-overflow-y-auto tw-overflow-x-hidden tw-overscroll-y-contain tw-py-2 tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500"
    >
      {messages.length === 0 ? (
        <p className="tw-m-0 tw-px-6 tw-py-12 tw-text-center tw-text-sm tw-text-iron-400">
          {t(locale, "e2ee.conversation.empty")}
        </p>
      ) : (
        <ol
          aria-label={t(locale, "e2ee.conversation.timelineLabel")}
          className="tw-m-0 tw-flex tw-list-none tw-flex-col tw-p-0"
        >
          {messages.map((message, index) => (
            <E2eeMessageItem
              key={message.id}
              message={message}
              conversation={conversation}
              engine={engine}
              selfProfileId={selfProfileId}
              replyTarget={
                message.reply ? (byId.get(message.reply) ?? null) : null
              }
              compact={isGroupedWith(messages[index - 1], message)}
              canAct={canAct}
              actions={actions}
            />
          ))}
        </ol>
      )}
      <p aria-live="polite" aria-atomic="true" className="tw-sr-only">
        {announcement.text}
      </p>
    </div>
  );
}

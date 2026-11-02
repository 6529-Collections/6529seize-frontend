"use client";

import { ArrowDownIcon } from "@heroicons/react/24/outline";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type {
  E2eeConversation,
  E2eeEngine,
  E2eeMessage,
} from "@/lib/e2ee/types";
import { getE2eeDayKey, getE2eeDayLabel, getMemberName } from "../e2eeFormat";
import { getScrollBehavior } from "../e2eeMotion";
import { E2eeConversationIntro } from "./E2eeConversationIntro";
import {
  type E2eeMessageActions,
  E2eeMessageItem,
  getMessageDomId,
} from "./E2eeMessageItem";
import { useE2eeDisplayMembers } from "./useE2eeDisplayMembers";

import { historyKey } from "@/lib/e2ee/history-order";
import { E2eeViewportRow } from "./E2eeViewportRow";

const GROUP_WINDOW_MS = 5 * 60 * 1000;
const NEAR_BOTTOM_PX = 120;

const isGroupedWith = (
  previous: E2eeMessage | undefined,
  message: E2eeMessage
) =>
  previous?.kind === "message" &&
  message.kind === "message" &&
  previous.senderProfileId === message.senderProfileId &&
  previous.imported?.authorProfileId === message.imported?.authorProfileId &&
  message.reply === null &&
  Math.abs(
    (message.imported?.createdAt ?? message.ts) -
      (previous.imported?.createdAt ?? previous.ts)
  ) < GROUP_WINDOW_MS;

const isOwnDeviceNotice = (
  message: E2eeMessage,
  selfProfileId: string | null
): boolean => {
  const notice = message.notice;
  if (
    message.kind !== "notice" ||
    !notice ||
    (notice.type !== "device_added" && notice.type !== "device_removed")
  ) {
    return false;
  }
  const owner = notice.targetProfileIds[0] ?? notice.actorProfileId;
  return selfProfileId !== null && owner === selfProfileId;
};

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
function getIncomingAnnouncement({
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

function DaySeparator({ label }: { readonly label: string }) {
  return (
    <li className="tw-flex tw-items-center tw-gap-3 tw-px-4 tw-pb-1 tw-pt-4">
      <span aria-hidden="true" className="tw-h-px tw-flex-1 tw-bg-iron-800" />
      <span className="tw-text-xs tw-font-medium tw-text-iron-400">
        {label}
      </span>
      <span aria-hidden="true" className="tw-h-px tw-flex-1 tw-bg-iron-800" />
    </li>
  );
}

interface E2eeTimelineProps {
  readonly conversation: E2eeConversation;
  readonly messages: readonly E2eeMessage[];
  readonly engine: E2eeEngine;
  readonly selfProfileId: string | null;
  readonly canAct: boolean;
  readonly actions: E2eeMessageActions;
  readonly jumpToId?: string | null;
}

/**
 * Ascending timeline of messages and system notices, opened by the chat's
 * intro and split by day. Keeps the view pinned to the newest message while
 * the reader is at the bottom (and after they send), offers a jump back down
 * when new messages arrive while they read history, and announces incoming
 * messages (not the reader's own) through a polite live region.
 */
export function E2eeTimeline({
  conversation,
  messages: allMessages,
  engine,
  selfProfileId,
  canAct,
  actions,
  jumpToId,
}: E2eeTimelineProps) {
  const locale = useBrowserLocale();
  // Your own device changes live in the new-device notice and Devices page.
  const messages = useMemo(
    () =>
      allMessages.filter(
        (message) => !isOwnDeviceNotice(message, selfProfileId)
      ),
    [allMessages, selfProfileId]
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const nearBottomRef = useRef(true);
  const hasScrolledRef = useRef(false);
  const anchorRef = useRef<{ id: string; top: number } | null>(null);

  useLayoutEffect(() => {
    if (!jumpToId) return;
    const element = document.getElementById(getMessageDomId(jumpToId));
    if (!element) return;
    anchorRef.current = null;
    nearBottomRef.current = false;
    element.scrollIntoView({ block: "center", behavior: "auto" });
    element.focus({ preventScroll: true });
  }, [jumpToId, messages]);
  const restoreAnchor = useCallback((): boolean => {
    const anchor = anchorRef.current;
    const element = scrollRef.current;
    if (!anchor || !element) return false;
    const row = [
      ...element.querySelectorAll<HTMLElement>("[data-e2ee-row]"),
    ].find((item) => item.dataset["e2eeRow"] === anchor.id);
    if (!row) return false;
    element.scrollBy({
      top: row.getBoundingClientRect().top - anchor.top,
      behavior: "auto",
    });
    return true;
  }, []);
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    const release = () => {
      anchorRef.current = null;
    };
    const events = ["wheel", "touchstart", "pointerdown", "keydown"];
    for (const event of events)
      element.addEventListener(event, release, { passive: true });
    return () => {
      for (const event of events) element.removeEventListener(event, release);
    };
  }, []);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState(false);
  const pagingRef = useRef(false);
  const latestLoaded =
    !conversation.lastMessage ||
    messages.some((message) => message.id === conversation.lastMessage?.id);
  const loadPage = async (direction: "older" | "newer" | "latest") => {
    if (!engine.loadHistory || pagingRef.current) return;
    const element = scrollRef.current;
    if (element && direction !== "latest") {
      const first = [
        ...element.querySelectorAll<HTMLElement>("[data-e2ee-row]"),
      ].find(
        (row) =>
          row.getBoundingClientRect().bottom >=
          element.getBoundingClientRect().top
      );
      if (first?.dataset["e2eeRow"])
        anchorRef.current = {
          id: first.dataset["e2eeRow"],
          top: first.getBoundingClientRect().top,
        };
    }
    if (direction !== "latest") nearBottomRef.current = false;
    pagingRef.current = true;
    setLoadingHistory(true);
    setHistoryError(false);
    try {
      const boundary = direction === "older" ? messages[0] : messages.at(-1);
      const key = boundary ? historyKey(boundary) : undefined;
      let options = {};
      if (direction !== "latest" && key)
        options = direction === "older" ? { before: key } : { after: key };
      await engine.loadHistory(conversation.g, options);
    } catch {
      setHistoryError(true);
    } finally {
      pagingRef.current = false;
      setLoadingHistory(false);
    }
  };
  useLayoutEffect(() => {
    restoreAnchor();
  }, [messages, restoreAnchor]);
  const byId = useMemo(
    () => new Map(messages.map((message) => [message.id, message])),
    [messages]
  );
  // People who left or were removed still get their names in the timeline.
  const members = useE2eeDisplayMembers(conversation, messages);
  const displayConversation = useMemo(
    () =>
      members === conversation.members
        ? conversation
        : { ...conversation, members },
    [conversation, members]
  );
  // Messages present at first render appear in place; later ones ease in.
  const [initialIds] = useState(
    () => new Set(messages.map((message) => message.id))
  );

  // Announce only messages that arrive after the first render of this chat.
  const maxSeq = Math.max(
    getSequencedMax(messages),
    conversation.lastMessage?.seq ?? 0
  );
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
            messages: conversation.lastMessage
              ? [...messages, conversation.lastMessage]
              : messages,
            members,
            selfProfileId,
            afterSeq: announcement.seq,
          });
    setAnnouncement({ seq: maxSeq, text: text ?? announcement.text });
  }

  const lastMessage = messages.at(-1);
  const lastKey = lastMessage ? `${lastMessage.id}:${lastMessage.seq}` : "";
  const lastIsOwnPending =
    lastMessage?.pending === true &&
    lastMessage.senderProfileId === selfProfileId;

  // "New messages" appears only when something arrives while reading history.
  const [atBottom, setAtBottom] = useState(true);
  const [seenKey, setSeenKey] = useState(lastKey);
  if (seenKey !== lastKey && (atBottom || lastIsOwnPending)) {
    setSeenKey(lastKey);
  }
  const hasUnseen = seenKey !== lastKey && !atBottom && !lastIsOwnPending;

  useLayoutEffect(() => {
    const element = scrollRef.current;
    if (!element || lastKey === "") {
      return;
    }
    if (!nearBottomRef.current && !lastIsOwnPending) {
      return;
    }
    element.scrollTo({
      top: element.scrollHeight,
      behavior: hasScrolledRef.current ? getScrollBehavior() : "auto",
    });
    hasScrolledRef.current = true;
  }, [lastKey, lastIsOwnPending]);

  const onScroll = () => {
    const element = scrollRef.current;
    if (!element) {
      return;
    }
    const near =
      latestLoaded &&
      element.scrollHeight - element.scrollTop - element.clientHeight <
        NEAR_BOTTOM_PX;
    nearBottomRef.current = near;
    setAtBottom(near);
  };

  const jumpToLatest = () => {
    anchorRef.current = null;
    if (!latestLoaded) {
      nearBottomRef.current = true;
      hasScrolledRef.current = false;
      void loadPage("latest");
      return;
    }
    const element = scrollRef.current;
    if (element) {
      element.scrollTo({
        top: element.scrollHeight,
        behavior: getScrollBehavior(),
      });
    }
    setSeenKey(lastKey);
  };

  // Late layout (decrypted images, reactions) must not push the newest
  // message out of view while the reader is at the bottom.
  useEffect(() => {
    const element = scrollRef.current;
    const content = element?.firstElementChild;
    if (!element || !content || typeof ResizeObserver === "undefined") {
      return;
    }
    const observer = new ResizeObserver(() => {
      if (nearBottomRef.current) {
        element.scrollTop = element.scrollHeight;
      }
    });
    observer.observe(content);
    // Banners and the composer growing also shrink the visible area.
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const items: ReactNode[] = [];
  let previousDay: string | null = null;
  messages.forEach((message, index) => {
    const day = getE2eeDayKey(message.ts);
    const newDay = day !== previousDay;
    if (newDay) {
      previousDay = day;
      items.push(
        <DaySeparator
          key={`day-${day}`}
          label={getE2eeDayLabel(locale, message.ts)}
        />
      );
    }
    items.push(
      <E2eeViewportRow
        key={message.id}
        messageId={message.id}
        scrollRef={scrollRef}
        restoreAnchor={restoreAnchor}
        forceVisible={message.id === jumpToId}
        estimate={message.attachments.length > 0 ? 400 : 96}
      >
        <E2eeMessageItem
          message={message}
          conversation={displayConversation}
          engine={engine}
          selfProfileId={selfProfileId}
          replyTarget={message.reply ? (byId.get(message.reply) ?? null) : null}
          compact={!newDay && isGroupedWith(messages[index - 1], message)}
          canAct={canAct}
          actions={actions}
          appear={!initialIds.has(message.id)}
        />
      </E2eeViewportRow>
    );
  });

  return (
    <div className="tw-relative tw-flex tw-min-h-0 tw-flex-1 tw-flex-col">
      <div
        ref={scrollRef}
        data-e2ee-scroll
        onScroll={onScroll}
        className="tw-[overflow-anchor:none] tw-min-h-0 tw-flex-1 tw-overflow-y-auto tw-overflow-x-hidden tw-overscroll-y-contain tw-pb-3 tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500"
      >
        <div>
          <E2eeConversationIntro
            conversation={displayConversation}
            selfProfileId={selfProfileId}
            empty={!messages.some((message) => message.kind === "message")}
          />
          {engine.loadHistory && messages.length > 0 ? (
            <button
              type="button"
              disabled={loadingHistory}
              className="tw-mx-auto tw-block tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-px-4 tw-py-2 tw-text-sm tw-text-iron-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
              onClick={() => {
                void loadPage("older");
              }}
            >
              {t(locale, "e2ee.conversation.older")}
            </button>
          ) : null}
          {historyError ? (
            <p role="alert">{t(locale, "e2ee.conversation.historyFailed")}</p>
          ) : null}
          {messages.length > 0 ? (
            <ol
              aria-label={t(locale, "e2ee.conversation.timelineLabel")}
              className="tw-m-0 tw-flex tw-list-none tw-flex-col tw-p-0"
            >
              {items}
            </ol>
          ) : null}
          {!latestLoaded && engine.loadHistory ? (
            <button
              type="button"
              disabled={loadingHistory}
              className="tw-mx-auto tw-block tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-px-4 tw-py-2 tw-text-sm tw-text-iron-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
              onClick={() => {
                void loadPage("newer");
              }}
            >
              {t(locale, "e2ee.conversation.newer")}
            </button>
          ) : null}
        </div>
        <p aria-live="polite" aria-atomic="true" className="tw-sr-only">
          {announcement.text}
        </p>
      </div>
      {hasUnseen || !latestLoaded ? (
        <button
          type="button"
          onClick={jumpToLatest}
          className="tw-absolute tw-bottom-3 tw-left-1/2 tw-flex tw-h-8 -tw-translate-x-1/2 tw-items-center tw-gap-1.5 tw-rounded-full tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900 tw-px-3 tw-text-xs tw-font-semibold tw-text-iron-100 tw-shadow-lg tw-shadow-black/40 hover:tw-bg-iron-800 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 motion-safe:tw-animate-sidebar-account-menu-in"
        >
          <ArrowDownIcon aria-hidden="true" className="tw-size-3.5" />
          {t(locale, "e2ee.conversation.jumpToLatest")}
        </button>
      ) : null}
    </div>
  );
}

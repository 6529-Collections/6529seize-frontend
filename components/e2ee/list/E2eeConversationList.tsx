"use client";

import { BellSlashIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState, type ReactNode } from "react";
import { useAuth } from "@/components/auth/Auth";
import { PinIcon } from "@/components/common/icons/PinIcon";
import IconButton from "@/components/utils/button/IconButton";
import useCapacitor from "@/hooks/useCapacitor";
import { PHONE_WAVES_LAYOUT_QUERY } from "@/constants/waves-layout";
import { runPhoneConversationEntryTransition } from "@/helpers/waves/wave-navigation-transition";
import {
  getEncryptedConversationRoute,
  getEncryptedMessagesRoute,
} from "@/helpers/navigation.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useDisplayTimeZone } from "@/hooks/useDisplayTimeZone";
import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t, tRich, type MessageKey } from "@/i18n/messages";
import type { DisplayTimeZone } from "@/lib/display-time-zone/displayTimeZone";
import { comparePinPositions } from "@/lib/e2ee/conversation-pins";
import { groupConversationThreads } from "@/lib/e2ee/dm-conversations";
import type { E2eeConversation, E2eeEngine } from "@/lib/e2ee/types";
import { E2eeEmojiProvider } from "../conversation/E2eeEmojiProvider";
import { E2eeEmojiText } from "../conversation/E2eeEmojiText";
import { E2eeMarkdown } from "../conversation/E2eeMarkdown";
import {
  formatE2eeTimestamp,
  getConversationTitle,
  getDmPeer,
  getMemberName,
  getMessagePreview,
  isUnpairedDm,
  tCount,
} from "../e2eeFormat";
import { useMutedE2eeChats } from "../e2eeMutedChats";
import { useE2eeContext } from "../E2eeContext";
import { E2eeAvatar } from "../ui/E2eeAvatar";
import { E2eePinSorting, useSortableChatPin } from "./E2eePinSorting";

const STATUS_KEYS: Partial<Record<E2eeConversation["status"], MessageKey>> = {
  invalid: "e2ee.list.status.invalid",
  left: "e2ee.list.status.left",
  removed: "e2ee.list.status.removed",
  restored: "e2ee.list.status.restored",
  superseded: "e2ee.list.status.superseded",
};

function ConversationAvatar({
  conversation,
  selfProfileId,
  title,
}: {
  readonly conversation: E2eeConversation;
  readonly selfProfileId: string | null;
  readonly title: string;
}) {
  const peer = getDmPeer(conversation, selfProfileId);
  if (
    peer ||
    (conversation.kind === "dm" && !isUnpairedDm(conversation, selfProfileId))
  ) {
    return (
      <E2eeAvatar
        pfp={peer?.pfp ?? null}
        name={peer?.handle ?? title}
        size="md"
      />
    );
  }
  const people = conversation.members
    .filter((member) => member.profileId !== selfProfileId)
    .map((member) => ({
      key: member.profileId,
      pfp: member.pfp,
      name: member.handle ?? title,
    }));
  // Two overlapping faces in the same 40 px slot as a DM avatar, so titles align.
  const [first, second] = people;
  return (
    <span
      aria-hidden="true"
      className="tw-relative tw-inline-flex tw-size-10 tw-flex-shrink-0"
    >
      {first ? (
        <span className="tw-absolute tw-left-0 tw-top-0 tw-flex">
          <E2eeAvatar pfp={first.pfp} name={first.name} size="duo" />
        </span>
      ) : null}
      {second ? (
        <span className="tw-absolute tw-bottom-0 tw-right-0 tw-flex">
          <E2eeAvatar
            pfp={second.pfp}
            name={second.name}
            size="duo"
            className="tw-ring-2 tw-ring-black"
          />
        </span>
      ) : null}
    </span>
  );
}

/** Groups and your own last message say who wrote it, like "carol: …". */
function getRowPreview(
  locale: SupportedLocale,
  conversation: E2eeConversation,
  selfProfileId: string | null
): ReactNode {
  const message = conversation.lastMessage;
  const preview =
    message?.kind === "message" &&
    !message.deleted &&
    !message.undecryptable &&
    message.text.trim() ? (
      <E2eeMarkdown
        key="preview"
        text={message.text}
        messageId={message.id}
        members={conversation.members}
        mentions={message.mentions}
        selfProfileId={selfProfileId}
        inlinePreview
      />
    ) : (
      <E2eeEmojiText
        key="preview"
        text={getMessagePreview(
          locale,
          message,
          conversation.members,
          selfProfileId
        )}
        size="sm"
      />
    );
  if (
    message?.kind !== "message" ||
    message.deleted ||
    message.undecryptable ||
    (conversation.kind !== "group" &&
      !isUnpairedDm(conversation, selfProfileId) &&
      message.senderProfileId !== selfProfileId)
  ) {
    return preview;
  }
  return tRich<ReactNode>(locale, "e2ee.list.preview.from", {
    name: getMemberName(
      locale,
      conversation.members,
      message.senderProfileId,
      selfProfileId
    ),
    text: preview,
  });
}

function UnreadBadges({
  locale,
  conversation,
}: {
  readonly locale: SupportedLocale;
  readonly conversation: E2eeConversation;
}) {
  return (
    <>
      {conversation.mentions > 0 ? (
        <span className="tw-flex tw-h-5 tw-min-w-5 tw-items-center tw-justify-center tw-rounded-full tw-bg-primary-500 tw-px-1 tw-text-[11px] tw-font-semibold tw-text-white">
          <span aria-hidden="true">@</span>
          <span className="tw-sr-only">
            {tCount(
              locale,
              {
                one: "e2ee.list.mentions.one",
                other: "e2ee.list.mentions.other",
              },
              conversation.mentions
            )}
          </span>
        </span>
      ) : null}
      {conversation.unread > 0 ? (
        <span className="tw-flex tw-h-5 tw-min-w-5 tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-200 tw-px-1.5 tw-text-[11px] tw-font-semibold tw-text-iron-950">
          <span aria-hidden="true">
            {formatInteger(locale, conversation.unread)}
          </span>
          <span className="tw-sr-only">
            {tCount(
              locale,
              {
                one: "e2ee.list.unread.one",
                other: "e2ee.list.unread.other",
              },
              conversation.unread
            )}
          </span>
        </span>
      ) : null}
    </>
  );
}

interface E2eeConversationRowProps {
  readonly conversation: E2eeConversation;
  readonly pinGroup: string;
  readonly threadKey: string;
  readonly sortable: boolean;
  readonly selfProfileId: string | null;
  readonly active: boolean;
  readonly collapsed: boolean;
  /** Muted on this device: a muted mark instead of unread badges. */
  readonly muted: boolean;
  /** The display time zone for the last-activity time. */
  readonly zone: DisplayTimeZone;
}

function MutedMark({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <span className="tw-flex tw-flex-shrink-0 tw-items-center tw-text-iron-500">
      <BellSlashIcon aria-hidden="true" className="tw-size-4" />
      <span className="tw-sr-only">{t(locale, "e2ee.list.muted")}</span>
    </span>
  );
}

function ConversationPinButton({
  engine,
  group,
  title,
  pinned,
  collapsed,
  locale,
}: {
  readonly engine: E2eeEngine;
  readonly group: string;
  readonly title: string;
  readonly pinned: boolean;
  readonly collapsed: boolean;
  readonly locale: SupportedLocale;
}) {
  const { setToast } = useAuth();
  const [pending, setPending] = useState(false);

  const togglePin = async () => {
    if (pending) return;
    setPending(true);
    try {
      await engine.setConversationPinned(group, !pinned);
    } catch {
      setToast({ type: "error", message: t(locale, "e2ee.info.pinFailed") });
    } finally {
      setPending(false);
    }
  };

  const position = collapsed
    ? "tw-absolute tw-bottom-1 tw-right-1"
    : "tw-relative tw-z-10 touch-only:tw-size-11";
  const reveal =
    pinned || pending
      ? ""
      : "tw-pointer-events-none tw-opacity-0 desktop-hover:group-hover/conversation:tw-pointer-events-auto desktop-hover:group-hover/conversation:tw-opacity-100 focus-visible:tw-pointer-events-auto focus-visible:tw-opacity-100 touch-only:tw-pointer-events-auto touch-only:tw-opacity-100";

  return (
    <IconButton
      size={collapsed ? 24 : 28}
      variant={collapsed ? "surface" : "ghost"}
      shape={collapsed ? "circle" : "compact"}
      aria-label={t(locale, "e2ee.list.pinChat", { title })}
      aria-pressed={pinned}
      aria-disabled={pending || undefined}
      pending={pending}
      title={t(locale, pinned ? "e2ee.info.unpin" : "e2ee.info.pin")}
      className={`${position} ${reveal}`}
      onClick={() => void togglePin()}
    >
      <PinIcon
        className={`${collapsed ? "tw-size-3" : "tw-size-3.5"} ${pinned ? "tw-rotate-[-45deg]" : ""}`}
        filled={pinned}
      />
    </IconButton>
  );
}

function E2eeConversationRow({
  conversation,
  pinGroup,
  threadKey,
  sortable,
  selfProfileId,
  active,
  collapsed,
  muted,
  zone,
}: E2eeConversationRowProps) {
  const locale = useBrowserLocale();
  const timestampId = useId();
  const { engine } = useE2eeContext();
  const { rowProps, linkProps, isDragging } = useSortableChatPin(
    threadKey,
    sortable
  );
  const router = useRouter();
  const { isCapacitor, isIos } = useCapacitor();
  const title = getConversationTitle(locale, conversation, selfProfileId);
  const statusKey = STATUS_KEYS[conversation.status];
  const pinned = conversation.pinned === true;
  const href = active
    ? getEncryptedMessagesRoute()
    : getEncryptedConversationRoute(conversation.g);
  const hasUnread =
    !muted && (conversation.unread > 0 || conversation.mentions > 0);
  const rowClass = active
    ? "tw-bg-iron-900 tw-text-iron-50"
    : "tw-text-iron-200 desktop-hover:group-hover/conversation:tw-bg-iron-900/60";
  const dragClass = sortable
    ? "tw-select-none [-webkit-touch-callout:none] motion-reduce:tw-!transition-none"
    : "";
  const draggedClass = isDragging ? "tw-z-20 tw-bg-iron-950" : "";
  const instructionsId = linkProps?.["aria-describedby"];
  const pinButton = engine ? (
    <ConversationPinButton
      engine={engine}
      group={pinGroup}
      title={title}
      pinned={pinned}
      collapsed={collapsed}
      locale={locale}
    />
  ) : null;
  const handleNavigate = (event: { preventDefault: () => void }) => {
    if (
      active ||
      (isCapacitor && !isIos) ||
      !window.matchMedia(PHONE_WAVES_LAYOUT_QUERY).matches ||
      !["/messages", getEncryptedMessagesRoute()].includes(
        window.location.pathname
      )
    )
      return;
    event.preventDefault();
    runPhoneConversationEntryTransition(href, () =>
      router.push(href, { scroll: false })
    );
  };

  if (collapsed) {
    return (
      <li
        {...rowProps}
        className={`tw-group/conversation tw-relative ${dragClass} ${draggedClass}`}
      >
        <Link
          {...linkProps}
          href={href}
          onNavigate={handleNavigate}
          aria-current={active ? "page" : undefined}
          aria-label={
            pinned ? t(locale, "e2ee.list.pinnedChat", { title }) : title
          }
          title={title}
          className={`tw-relative tw-flex tw-justify-center tw-rounded-lg tw-p-2 tw-no-underline focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 ${rowClass}`}
        >
          <ConversationAvatar
            conversation={conversation}
            selfProfileId={selfProfileId}
            title={title}
          />
          {!muted && (conversation.unread > 0 || conversation.mentions > 0) ? (
            <span
              aria-hidden="true"
              className="tw-absolute tw-right-1.5 tw-top-1.5 tw-size-2.5 tw-rounded-full tw-bg-primary-400"
            />
          ) : null}
        </Link>
        {pinButton}
      </li>
    );
  }

  return (
    <li
      {...rowProps}
      className={`tw-group/conversation tw-relative tw-isolate tw-flex tw-min-w-0 tw-items-center tw-gap-2 tw-rounded-lg tw-px-3 tw-transition-colors ${rowClass} ${dragClass} ${draggedClass}`}
    >
      <Link
        {...linkProps}
        href={href}
        onNavigate={handleNavigate}
        aria-current={active ? "page" : undefined}
        aria-describedby={
          instructionsId ? `${timestampId} ${instructionsId}` : timestampId
        }
        className="tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-gap-3 tw-py-2 tw-text-inherit tw-no-underline before:tw-absolute before:tw-inset-0 before:tw-z-[5] before:tw-rounded-lg before:tw-content-[''] focus-visible:tw-outline-none focus-visible:before:tw-ring-2 focus-visible:before:tw-ring-inset focus-visible:before:tw-ring-primary-400"
      >
        <ConversationAvatar
          conversation={conversation}
          selfProfileId={selfProfileId}
          title={title}
        />
        <span className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col">
          <span
            className={`tw-truncate tw-text-sm ${
              hasUnread ? "tw-font-bold tw-text-iron-50" : "tw-font-semibold"
            }`}
          >
            {title}
          </span>
          {pinned ? (
            <span className="tw-sr-only">{t(locale, "e2ee.list.pinned")}</span>
          ) : null}
          <span className="tw-flex tw-min-w-0 tw-items-center tw-gap-2">
            <span
              className={`tw-min-w-0 tw-flex-1 tw-truncate tw-text-xs ${
                hasUnread ? "tw-text-iron-200" : "tw-text-iron-400"
              }`}
            >
              {getRowPreview(locale, conversation, selfProfileId)}
            </span>
            {statusKey ? (
              <span className="tw-flex-shrink-0 tw-rounded-full tw-bg-iron-800 tw-px-2 tw-py-0.5 tw-text-[11px] tw-text-iron-300">
                {t(locale, statusKey)}
              </span>
            ) : null}
            {muted ? (
              <MutedMark locale={locale} />
            ) : (
              <UnreadBadges locale={locale} conversation={conversation} />
            )}
          </span>
        </span>
      </Link>
      {pinButton}
      <time
        id={timestampId}
        dateTime={new Date(conversation.updatedAt).toISOString()}
        className={`tw-shrink-0 tw-whitespace-nowrap tw-text-xs ${
          hasUnread ? "tw-font-medium tw-text-primary-300" : "tw-text-iron-500"
        }`}
      >
        {formatE2eeTimestamp(locale, conversation.updatedAt, { zone })}
      </time>
    </li>
  );
}

interface E2eeConversationListProps {
  readonly conversations: readonly E2eeConversation[];
  readonly selfProfileId: string | null;
  readonly activeGroup?: string | null | undefined;
  readonly collapsed?: boolean | undefined;
  readonly limit?: number | undefined;
  readonly label: string;
}

export function E2eeConversationList({
  conversations,
  selfProfileId,
  activeGroup = null,
  collapsed = false,
  limit,
  label,
}: E2eeConversationListProps) {
  const muted = useMutedE2eeChats(selfProfileId);
  const zone = useDisplayTimeZone();
  const { engine } = useE2eeContext();
  const threads = groupConversationThreads(conversations, selfProfileId).sort(
    (a, b) => {
      if (a.current.pinned && b.current.pinned) {
        return comparePinPositions(
          a.current.pinPosition,
          b.current.pinPosition,
          a.key,
          b.key
        );
      }
      return (
        Number(b.current.pinned === true) - Number(a.current.pinned === true)
      );
    }
  );
  const visible = limit === undefined ? threads : threads.slice(0, limit);
  const pinKeys = visible.flatMap(({ current, key }) =>
    current.pinned ? [key] : []
  );
  return (
    <E2eeEmojiProvider>
      <E2eePinSorting pins={pinKeys}>
        <ul
          aria-label={label}
          className="tw-m-0 tw-flex tw-list-none tw-flex-col tw-gap-0.5 tw-p-0"
        >
          {visible.map((thread) => {
            const activeSessions = thread.sessions.filter(
              (session) => session.status === "active"
            );
            const countedSessions =
              activeSessions.length > 0 ? activeSessions : [thread.current];
            const unmuted = countedSessions.filter(
              (session) => !muted.has(session.g)
            );
            const incoming = unmuted
              .filter((session) => session.unread > 0 || session.mentions > 0)
              .sort((a, b) => b.updatedAt - a.updatedAt)[0];
            const target = incoming ?? unmuted[0] ?? thread.current;
            const conversation = {
              ...target,
              pinned: thread.current.pinned === true,
              unread: unmuted.reduce((sum, session) => sum + session.unread, 0),
              mentions: unmuted.reduce(
                (sum, session) => sum + session.mentions,
                0
              ),
            };
            return (
              <E2eeConversationRow
                key={thread.key}
                conversation={conversation}
                pinGroup={thread.current.g}
                threadKey={thread.key}
                sortable={
                  Boolean(engine) &&
                  pinKeys.length > 1 &&
                  thread.current.pinned === true
                }
                selfProfileId={selfProfileId}
                active={thread.sessions.some(
                  (session) => session.g === activeGroup
                )}
                collapsed={collapsed}
                muted={unmuted.length === 0}
                zone={zone}
              />
            );
          })}
        </ul>
      </E2eePinSorting>
    </E2eeEmojiProvider>
  );
}

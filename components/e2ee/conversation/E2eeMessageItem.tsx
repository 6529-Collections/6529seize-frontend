"use client";

import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import {
  ArrowUturnLeftIcon,
  BellIcon,
  BellSlashIcon,
  ChatBubbleLeftEllipsisIcon,
  EllipsisHorizontalIcon,
  ExclamationTriangleIcon,
  FlagIcon,
  NoSymbolIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { memo, type ReactNode, useEffect, useState } from "react";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger, formatList } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type {
  E2eeConversation,
  E2eeEngine,
  E2eeMessage,
} from "@/lib/e2ee/types";
import {
  findMember,
  formatE2eeDateTime,
  formatE2eeTimestamp,
  getDmPeer,
  getMemberName,
  getNoticeText,
} from "../e2eeFormat";
import { E2eeAvatar } from "../ui/E2eeAvatar";
import { E2eeAttachmentView } from "./E2eeAttachmentView";
import { splitLinks } from "./e2eeLinks";
import {
  E2eeImportedNote,
  importedAuthor,
  importedAuthorName,
} from "./E2eeImportedNote";
import { splitMentions } from "./e2eeMentions";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "🔥", "👀", "🎉"] as const;

export const getMessageDomId = (id: string) => `e2ee-message-${id}`;

const REPLY_SNIPPET_MAX = 80;

export interface E2eeMessageActions {
  readonly onReply: (message: E2eeMessage) => void;
  readonly onEdit: (message: E2eeMessage) => void;
  readonly onDelete: (message: E2eeMessage) => void;
  readonly onReport: (message: E2eeMessage) => void;
  /** Block the sender (Block, mute and DM settings come before Report). */
  readonly onBlock: (message: E2eeMessage) => void;
  readonly onToggleMute: () => void;
  /** Whether this chat is muted on this device. */
  readonly muted: boolean;
  readonly onReact: (
    message: E2eeMessage,
    reaction: string,
    on: boolean
  ) => void;
  readonly onJumpTo: (id: string) => void;
}

interface E2eeMessageItemProps {
  readonly message: E2eeMessage;
  readonly conversation: E2eeConversation;
  readonly engine: E2eeEngine;
  readonly selfProfileId: string | null;
  readonly replyTarget: E2eeMessage | null;
  readonly compact: boolean;
  readonly canAct: boolean;
  readonly actions: E2eeMessageActions;
  /** Arrived after the chat was opened: ease in (respects reduced motion). */
  readonly appear?: boolean | undefined;
}

function MessageBody({
  message,
  conversation,
  selfProfileId,
  senderName,
}: {
  readonly message: E2eeMessage;
  readonly conversation: E2eeConversation;
  readonly selfProfileId: string | null;
  readonly senderName: string;
}) {
  const locale = useBrowserLocale();
  if (message.undecryptable) {
    return (
      <div className="tw-inline-flex tw-max-w-md tw-items-start tw-gap-2 tw-rounded-lg tw-border tw-border-dashed tw-border-iron-700 tw-px-3 tw-py-2">
        <ExclamationTriangleIcon
          aria-hidden="true"
          className="tw-mt-0.5 tw-size-4 tw-flex-shrink-0 tw-text-iron-400"
        />
        <div className="tw-min-w-0">
          <p className="tw-m-0 tw-text-sm tw-text-iron-300">
            {t(locale, "e2ee.message.undecryptable")}
          </p>
          <p className="tw-m-0 tw-mt-0.5 tw-text-xs tw-text-iron-500">
            {t(locale, "e2ee.message.undecryptableHint", { name: senderName })}
          </p>
        </div>
      </div>
    );
  }
  if (message.deleted) {
    return (
      <p className="tw-m-0 tw-text-sm tw-italic tw-text-iron-500">
        {t(locale, "e2ee.message.deleted")}
      </p>
    );
  }
  if (!message.text) {
    return null;
  }
  const segments = splitMentions(
    message.text,
    conversation.members,
    message.mentions
  );
  return (
    <p className="tw-m-0 tw-whitespace-pre-wrap tw-break-words tw-text-sm tw-leading-6 tw-text-iron-100">
      {segments.flatMap((segment) =>
        segment.kind === "mention" ? (
          <span
            key={segment.start}
            className={`tw-rounded tw-px-0.5 tw-font-semibold ${
              segment.profileId === selfProfileId
                ? "tw-bg-primary-500/25 tw-text-primary-300"
                : "tw-text-primary-300"
            }`}
          >
            {segment.value}
          </span>
        ) : (
          splitLinks(segment.value, segment.start).map((part) =>
            part.kind === "link" ? (
              <a
                key={part.start}
                href={part.href}
                target="_blank"
                rel="noopener noreferrer nofollow ugc"
                className="tw-break-all tw-text-primary-300 tw-underline tw-decoration-primary-300/40 tw-underline-offset-2 hover:tw-decoration-primary-300 focus-visible:tw-rounded focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
              >
                {part.value}
              </a>
            ) : (
              <span key={part.start}>{part.value}</span>
            )
          )
        )
      )}
    </p>
  );
}

function ReplyPreview({
  replyId,
  target,
  conversation,
  selfProfileId,
  onJumpTo,
}: {
  readonly replyId: string;
  readonly target: E2eeMessage | null;
  readonly conversation: E2eeConversation;
  readonly selfProfileId: string | null;
  readonly onJumpTo: (id: string) => void;
}) {
  const locale = useBrowserLocale();
  if (!target) {
    return (
      <p className="tw-m-0 tw-mb-1 tw-border-y-0 tw-border-l-2 tw-border-r-0 tw-border-solid tw-border-iron-700 tw-pl-2 tw-text-xs tw-italic tw-text-iron-500">
        {t(locale, "e2ee.message.replyUnavailable")}
      </p>
    );
  }
  const name = getMemberName(
    locale,
    conversation.members,
    target.senderProfileId,
    selfProfileId
  );
  let snippet = target.text.replaceAll(/\s+/g, " ").trim();
  if (target.deleted) {
    snippet = t(locale, "e2ee.message.deleted");
  } else if (target.undecryptable) {
    snippet = t(locale, "e2ee.message.undecryptable");
  } else if (snippet.length > REPLY_SNIPPET_MAX) {
    snippet = `${snippet.slice(0, REPLY_SNIPPET_MAX)}…`;
  }
  return (
    <button
      type="button"
      onClick={() => onJumpTo(replyId)}
      className="tw-mb-1 tw-flex tw-w-full tw-min-w-0 tw-flex-col tw-items-start tw-rounded tw-border-y-0 tw-border-l-2 tw-border-r-0 tw-border-solid tw-border-iron-600 tw-bg-transparent tw-py-0.5 tw-pl-2 tw-text-left focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
    >
      <span className="tw-text-xs tw-font-semibold tw-text-iron-300">
        {t(locale, "e2ee.message.replyTo", { name })}
      </span>
      <span className="tw-w-full tw-truncate tw-text-xs tw-text-iron-400">
        {snippet}
      </span>
    </button>
  );
}

function Reactions({
  message,
  conversation,
  selfProfileId,
  canAct,
  onReact,
}: {
  readonly message: E2eeMessage;
  readonly conversation: E2eeConversation;
  readonly selfProfileId: string | null;
  readonly canAct: boolean;
  readonly onReact: (reaction: string, on: boolean) => void;
}) {
  const locale = useBrowserLocale();
  const entries = Object.entries(message.reactions).filter(
    ([, profileIds]) => profileIds.length > 0
  );
  if (entries.length === 0) {
    return null;
  }
  return (
    <ul
      aria-label={t(locale, "e2ee.message.reactions")}
      className="tw-m-0 tw-mt-1 tw-flex tw-list-none tw-flex-wrap tw-gap-1 tw-p-0"
    >
      {entries.map(([reaction, profileIds]) => {
        const mine =
          selfProfileId !== null && profileIds.includes(selfProfileId);
        const names = formatList(
          locale,
          profileIds.map((id) =>
            getMemberName(locale, conversation.members, id, selfProfileId)
          )
        );
        return (
          <li key={reaction}>
            <button
              type="button"
              disabled={!canAct}
              aria-pressed={mine}
              onClick={() => onReact(reaction, !mine)}
              aria-label={t(locale, "e2ee.message.reactionSummary", {
                reaction,
                count: formatInteger(locale, profileIds.length),
                names,
              })}
              className={`tw-inline-flex tw-h-7 tw-items-center tw-gap-1 tw-rounded-full tw-border tw-border-solid tw-px-2 tw-text-xs focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 disabled:tw-cursor-default ${
                mine
                  ? "tw-text-primary-200 tw-border-primary-400/60 tw-bg-primary-500/15"
                  : "tw-border-iron-700 tw-bg-iron-900 tw-text-iron-200 hover:tw-border-iron-600"
              }`}
            >
              <span aria-hidden="true">{reaction}</span>
              <span aria-hidden="true">
                {formatInteger(locale, profileIds.length)}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function ActionMenuItem({
  onClick,
  icon,
  children,
  tone = "default",
}: {
  readonly onClick: () => void;
  readonly icon: ReactNode;
  readonly children: ReactNode;
  readonly tone?: "default" | "danger" | undefined;
}) {
  return (
    <MenuItem>
      <button
        type="button"
        onClick={onClick}
        className={`tw-flex tw-w-full tw-items-center tw-gap-2 tw-rounded-md tw-border-0 tw-bg-transparent tw-px-3 tw-py-2 tw-text-left tw-text-sm data-[focus]:tw-bg-iron-800 data-[focus]:tw-ring-2 data-[focus]:tw-ring-inset data-[focus]:tw-ring-primary-400 ${
          tone === "danger" ? "tw-text-rose-300" : "tw-text-iron-100"
        }`}
      >
        {icon}
        {children}
      </button>
    </MenuItem>
  );
}

const MENU_ITEM_CLASS =
  "tw-flex tw-w-full tw-items-center tw-gap-2 tw-rounded-md tw-border-0 tw-bg-transparent tw-px-3 tw-py-2 tw-text-left tw-text-sm tw-text-iron-100 tw-no-underline data-[focus]:tw-bg-iron-800 data-[focus]:tw-ring-2 data-[focus]:tw-ring-inset data-[focus]:tw-ring-primary-400";

/**
 * Everyday tools for someone else's message: mute, block and who can
 * message you come first; reporting is for severe or illegal harm only.
 */
function SafetyMenuItems({
  message,
  senderName,
  actions,
  iconClass,
}: {
  readonly message: E2eeMessage;
  readonly senderName: string;
  readonly actions: E2eeMessageActions;
  readonly iconClass: string;
}) {
  const locale = useBrowserLocale();
  return (
    <>
      <ActionMenuItem
        onClick={actions.onToggleMute}
        icon={
          actions.muted ? (
            <BellIcon aria-hidden="true" className={iconClass} />
          ) : (
            <BellSlashIcon aria-hidden="true" className={iconClass} />
          )
        }
      >
        {t(locale, actions.muted ? "e2ee.message.unmute" : "e2ee.message.mute")}
      </ActionMenuItem>
      {message.senderProfileId ? (
        <ActionMenuItem
          onClick={() => actions.onBlock(message)}
          icon={<NoSymbolIcon aria-hidden="true" className={iconClass} />}
        >
          {t(locale, "e2ee.message.block", { name: senderName })}
        </ActionMenuItem>
      ) : null}
      <MenuItem>
        <Link href="/preferences" className={MENU_ITEM_CLASS}>
          <ChatBubbleLeftEllipsisIcon
            aria-hidden="true"
            className={iconClass}
          />
          {t(locale, "e2ee.message.messageSettings")}
        </Link>
      </MenuItem>
      <ActionMenuItem
        tone="danger"
        onClick={() => actions.onReport(message)}
        icon={<FlagIcon aria-hidden="true" className={iconClass} />}
      >
        {t(locale, "e2ee.message.report")}
      </ActionMenuItem>
    </>
  );
}

function MessageActionsMenu({
  message,
  isOwn,
  selfProfileId,
  senderName,
  actions,
}: {
  readonly message: E2eeMessage;
  readonly isOwn: boolean;
  readonly selfProfileId: string | null;
  readonly senderName: string;
  readonly actions: E2eeMessageActions;
}) {
  const locale = useBrowserLocale();
  const iconClass = "tw-size-4 tw-flex-shrink-0";
  return (
    <Menu>
      <MenuButton
        aria-label={t(locale, "e2ee.message.actions")}
        className="tw-flex tw-size-8 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-text-iron-300 tw-opacity-100 tw-transition-opacity data-[open]:tw-opacity-100 hover:tw-text-iron-50 focus-visible:tw-opacity-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 desktop-hover:tw-opacity-0 desktop-hover:group-focus-within:tw-opacity-100 desktop-hover:group-hover:tw-opacity-100 touch-only:-tw-mr-2 touch-only:-tw-mt-2 touch-only:tw-size-11 touch-only:tw-bg-transparent touch-only:tw-text-iron-500 touch-only:tw-opacity-100"
      >
        <EllipsisHorizontalIcon aria-hidden="true" className="tw-size-5" />
      </MenuButton>
      <MenuItems
        anchor="bottom end"
        className="tailwind-scope tw-z-[1001] tw-mt-1 tw-w-56 tw-rounded-xl tw-bg-iron-950 tw-p-1.5 tw-shadow-2xl tw-ring-1 tw-ring-iron-700/80 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
      >
        <div className="tw-flex tw-justify-between tw-gap-1 tw-px-1 tw-pb-1">
          {QUICK_REACTIONS.map((reaction) => {
            const mine =
              selfProfileId !== null &&
              (message.reactions[reaction] ?? []).includes(selfProfileId);
            return (
              <MenuItem key={reaction}>
                <button
                  type="button"
                  onClick={() => actions.onReact(message, reaction, !mine)}
                  aria-pressed={mine}
                  aria-label={t(locale, "e2ee.message.reactWith", { reaction })}
                  className={`tw-flex tw-size-8 tw-items-center tw-justify-center tw-rounded-md tw-border-0 tw-bg-transparent tw-text-base data-[focus]:tw-bg-iron-800 data-[focus]:tw-ring-2 data-[focus]:tw-ring-inset data-[focus]:tw-ring-primary-400 ${
                    mine ? "tw-ring-1 tw-ring-iron-700" : ""
                  }`}
                >
                  <span aria-hidden="true">{reaction}</span>
                </button>
              </MenuItem>
            );
          })}
        </div>
        <ActionMenuItem
          onClick={() => actions.onReply(message)}
          icon={<ArrowUturnLeftIcon aria-hidden="true" className={iconClass} />}
        >
          {t(locale, "e2ee.message.reply")}
        </ActionMenuItem>
        {isOwn ? (
          <>
            <ActionMenuItem
              onClick={() => actions.onEdit(message)}
              icon={
                <PencilSquareIcon aria-hidden="true" className={iconClass} />
              }
            >
              {t(locale, "e2ee.message.edit")}
            </ActionMenuItem>
            <ActionMenuItem
              tone="danger"
              onClick={() => actions.onDelete(message)}
              icon={<TrashIcon aria-hidden="true" className={iconClass} />}
            >
              {t(locale, "e2ee.message.delete")}
            </ActionMenuItem>
          </>
        ) : (
          <SafetyMenuItems
            message={message}
            senderName={senderName}
            actions={actions}
            iconClass={iconClass}
          />
        )}
      </MenuItems>
    </Menu>
  );
}

function NoticeItem({
  message,
  conversation,
  selfProfileId,
}: {
  readonly message: E2eeMessage;
  readonly conversation: E2eeConversation;
  readonly selfProfileId: string | null;
}) {
  const locale = useBrowserLocale();
  return (
    <li
      id={getMessageDomId(message.id)}
      className="tw-flex tw-justify-center tw-px-4 tw-py-1.5"
    >
      <p className="tw-m-0 tw-rounded-full tw-bg-iron-900 tw-px-3 tw-py-1 tw-text-center tw-text-xs tw-text-iron-400">
        {getNoticeText(locale, message, conversation.members, selfProfileId)}
        <span className="tw-sr-only">
          {" "}
          {formatE2eeDateTime(locale, message.serverTs)}
        </span>
      </p>
    </li>
  );
}

/** After this long unsequenced, "Sending…" says the engine is still retrying. */
const SLOW_SEND_MS = 10_000;

/**
 * True once a pending message has waited longer than SLOW_SEND_MS. `ts` is
 * the sender's own clock at send time (the local echo), so no server skew
 * applies. The latch is keyed by id and send time: a new send, or the
 * message leaving the outbox, resets it.
 */
function useSlowPending(message: E2eeMessage): boolean {
  const sendKey = `${message.id}:${message.ts}`;
  const [slowKey, setSlowKey] = useState<string | null>(null);
  useEffect(() => {
    if (!message.pending) {
      return;
    }
    const wait = Math.max(0, SLOW_SEND_MS - (Date.now() - message.ts));
    const timer = globalThis.setTimeout(() => setSlowKey(sendKey), wait);
    return () => globalThis.clearTimeout(timer);
  }, [message.pending, message.ts, sendKey]);
  return message.pending && slowKey === sendKey;
}

function MessageMarkers({ message }: { readonly message: E2eeMessage }) {
  const locale = useBrowserLocale();
  const slow = useSlowPending(message);
  return (
    <>
      {message.imported ? <E2eeImportedNote.Badge /> : null}
      {message.editedAt !== null && !message.deleted ? (
        <span className="tw-text-xs tw-text-iron-500">
          ({t(locale, "e2ee.message.edited")})
        </span>
      ) : null}
      {message.pending ? (
        <span
          className={`tw-text-xs ${slow ? "tw-text-amber-200" : "tw-text-iron-400"}`}
        >
          {t(
            locale,
            slow ? "e2ee.message.pendingSlow" : "e2ee.message.pending"
          )}
        </span>
      ) : null}
      {!message.sigOk && !message.undecryptable && !message.pending ? (
        <span className="tw-inline-flex tw-items-center tw-gap-1 tw-text-xs tw-text-amber-200">
          <ExclamationTriangleIcon aria-hidden="true" className="tw-size-3.5" />
          {t(locale, "e2ee.message.unverified")}
        </span>
      ) : null}
    </>
  );
}

const hasMarkers = (message: E2eeMessage) =>
  message.imported !== undefined ||
  (message.editedAt !== null && !message.deleted) ||
  message.pending ||
  (!message.sigOk && !message.undecryptable);

/**
 * Sender, time and state markers. Grouped (compact) rows keep the sender
 * for screen readers; their edited / sending / unverified states render
 * under the text instead (CompactMarkers), next to what they describe.
 */
function MessageMeta({
  message,
  name,
  compact,
}: {
  readonly message: E2eeMessage;
  readonly name: string;
  readonly compact: boolean;
}) {
  const locale = useBrowserLocale();
  // Imported history shows its original time (claimed by the server copy).
  const shownTs = message.imported?.createdAt ?? message.ts;
  if (compact) {
    return <span className="tw-sr-only">{name}</span>;
  }
  return (
    <div className="tw-flex tw-flex-wrap tw-items-baseline tw-gap-x-2">
      <span className="tw-text-sm tw-font-semibold tw-text-iron-50">
        {name}
      </span>
      <time
        dateTime={new Date(shownTs).toISOString()}
        title={formatE2eeDateTime(locale, shownTs)}
        className="tw-text-xs tw-text-iron-500"
      >
        {formatE2eeTimestamp(locale, shownTs)}
      </time>
      <MessageMarkers message={message} />
    </div>
  );
}

function getMessageRowClassName(
  compact: boolean,
  pending: boolean,
  appear: boolean
): string {
  return `tw-group tw-relative tw-flex tw-gap-3 tw-px-4 focus:tw-bg-iron-900/60 focus:tw-outline-none desktop-hover:hover:tw-bg-iron-950 ${
    compact ? "tw-py-0.5" : "tw-pb-0.5 tw-pt-3"
  } ${pending ? "tw-opacity-70" : ""} ${
    appear ? "motion-safe:tw-animate-sidebar-account-menu-in" : ""
  }`;
}

/**
 * Who a message row names. Imported history keeps its original author (the
 * importer is the sender) when that author is in this chat, else "Unknown";
 * an unreadable message still names its sender when the chat makes it clear.
 */
function getMessageNames(
  locale: SupportedLocale,
  conversation: E2eeConversation,
  message: E2eeMessage,
  selfProfileId: string | null
) {
  const author = message.imported
    ? importedAuthor(conversation.members, message.imported, selfProfileId)
    : undefined;
  const sender =
    author === undefined
      ? findMember(conversation.members, message.senderProfileId)
      : (author?.member ?? null);
  const senderName = getMemberName(
    locale,
    conversation.members,
    message.senderProfileId,
    selfProfileId
  );
  const name =
    author === undefined
      ? senderName
      : importedAuthorName(locale, author, selfProfileId);
  const shownName =
    message.undecryptable && !sender
      ? (getDmPeer(conversation, selfProfileId)?.handle ??
        t(locale, "e2ee.message.undecryptableSender"))
      : name;
  const importerName =
    selfProfileId !== null && message.senderProfileId === selfProfileId
      ? t(locale, "e2ee.youObject")
      : senderName;
  return { sender, senderName, shownName, importerName };
}

function E2eeMessageItemComponent({
  message,
  conversation,
  engine,
  selfProfileId,
  replyTarget,
  compact,
  canAct,
  actions,
  appear = false,
}: E2eeMessageItemProps) {
  const locale = useBrowserLocale();
  if (message.kind === "notice") {
    return (
      <NoticeItem
        message={message}
        conversation={conversation}
        selfProfileId={selfProfileId}
      />
    );
  }
  const { sender, senderName, shownName, importerName } = getMessageNames(
    locale,
    conversation,
    message,
    selfProfileId
  );
  const isOwn =
    selfProfileId !== null && message.senderProfileId === selfProfileId;
  const showActions =
    canAct && !message.deleted && !message.undecryptable && !message.pending;

  return (
    <li
      id={getMessageDomId(message.id)}
      tabIndex={-1}
      className={getMessageRowClassName(compact, message.pending, appear)}
    >
      <div className="tw-w-9 tw-flex-shrink-0">
        {compact ? null : (
          <E2eeAvatar pfp={sender?.pfp ?? null} name={shownName} size="sm" />
        )}
      </div>
      <div
        className={`tw-min-w-0 tw-flex-1 ${showActions ? "touch-only:tw-pr-8" : ""}`}
      >
        <MessageMeta message={message} name={shownName} compact={compact} />
        {message.reply ? (
          <ReplyPreview
            replyId={message.reply}
            target={replyTarget}
            conversation={conversation}
            selfProfileId={selfProfileId}
            onJumpTo={actions.onJumpTo}
          />
        ) : null}
        <MessageBody
          message={message}
          conversation={conversation}
          selfProfileId={selfProfileId}
          senderName={shownName}
        />
        {message.imported && !message.deleted ? (
          <E2eeImportedNote
            imported={message.imported}
            importerName={importerName}
            showDetail={!compact}
          />
        ) : null}
        {!message.deleted &&
        !message.undecryptable &&
        message.attachments.length > 0 ? (
          <div className="tw-mt-1 tw-flex tw-flex-wrap tw-gap-2">
            {message.attachments.map((attachment) => (
              <E2eeAttachmentView
                key={attachment.blob}
                engine={engine}
                g={message.g}
                messageId={message.id}
                attachment={attachment}
              />
            ))}
          </div>
        ) : null}
        {compact && hasMarkers(message) ? (
          <div className="tw-flex tw-flex-wrap tw-items-baseline tw-gap-x-2">
            <MessageMarkers message={message} />
          </div>
        ) : null}
        <Reactions
          message={message}
          conversation={conversation}
          selfProfileId={selfProfileId}
          canAct={showActions}
          onReact={(reaction, on) => actions.onReact(message, reaction, on)}
        />
      </div>
      {showActions ? (
        <div className="tw-absolute tw-right-3 tw-top-1">
          <MessageActionsMenu
            message={message}
            isOwn={isOwn}
            selfProfileId={selfProfileId}
            senderName={senderName}
            actions={actions}
          />
        </div>
      ) : null}
    </li>
  );
}

export const E2eeMessageItem = memo(E2eeMessageItemComponent);

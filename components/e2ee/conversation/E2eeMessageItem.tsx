"use client";

import { useQuery } from "@tanstack/react-query";

import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { memo, useEffect, useState } from "react";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useSwipeToReply } from "@/hooks/useSwipeToReply";
import { SwipeReplyHint } from "@/components/waves/drops/SwipeReplyHint";
import { useDisplayTimeZone } from "@/hooks/useDisplayTimeZone";
import { formatInteger, formatList } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type {
  E2eeConversation,
  E2eeEngine,
  E2eeMessage,
  E2eeMember,
} from "@/lib/e2ee/types";
import {
  findMember,
  formatE2eeDateTime,
  formatE2eeTimestamp,
  getDmPeer,
  getMemberName,
  getNoticeText,
} from "../e2eeFormat";
import { E2eeMessageAvatar, E2eeMessageIdentity } from "./E2eeMessageIdentity";
import { E2eeImageGallery } from "./E2eeImageGallery";
import { E2eeAttachmentView } from "./E2eeAttachmentView";
import { E2eeMarkdown } from "./E2eeMarkdown";
import {
  E2eeImportedNote,
  importedAuthor,
  importedAuthorName,
} from "./E2eeImportedNote";
import {
  E2eeMessageActionsMenu,
  type E2eeMessageActions,
} from "./E2eeMessageActionsMenu";
import { E2eeEmojiText } from "./E2eeEmojiText";
import { E2eeUnsentNotice } from "./E2eeUnsentNotice";

export type { E2eeMessageActions } from "./E2eeMessageActionsMenu";

export const getMessageDomId = (id: string) => `e2ee-message-${id}`;

const REPLY_SNIPPET_MAX = 80;

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
  readonly inViewportRow?: boolean;
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
  return (
    <E2eeMarkdown
      text={message.text}
      messageId={message.id}
      members={conversation.members}
      mentions={message.mentions}
      selfProfileId={selfProfileId}
    />
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
              <span aria-hidden="true">
                <E2eeEmojiText text={reaction} />
              </span>
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

function NoticeItem({
  message,
  conversation,
  selfProfileId,
  inViewportRow,
}: {
  readonly message: E2eeMessage;
  readonly conversation: E2eeConversation;
  readonly selfProfileId: string | null;
  readonly inViewportRow: boolean;
}) {
  const locale = useBrowserLocale();
  const zone = useDisplayTimeZone();
  const Container = inViewportRow ? "div" : "li";
  return (
    <Container
      id={inViewportRow ? undefined : getMessageDomId(message.id)}
      className="tw-flex tw-justify-center tw-px-4 tw-py-1.5"
    >
      <p className="tw-m-0 tw-rounded-full tw-bg-iron-900 tw-px-3 tw-py-1 tw-text-center tw-text-xs tw-text-iron-400">
        {getNoticeText(locale, message, conversation.members, selfProfileId)}
        <span className="tw-sr-only">
          {" "}
          {formatE2eeDateTime(locale, message.serverTs, zone)}
        </span>
      </p>
    </Container>
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
  member,
  compact,
}: {
  readonly message: E2eeMessage;
  readonly name: string;
  readonly member: E2eeMember | null;
  readonly compact: boolean;
}) {
  const locale = useBrowserLocale();
  const zone = useDisplayTimeZone();
  // Imported history shows its original time (claimed by the server copy).
  const shownTs = message.imported?.createdAt ?? message.ts;
  if (compact) {
    return <span className="tw-sr-only">{name}</span>;
  }
  return (
    <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-1.5 tw-gap-y-1 tw-text-md tw-leading-5">
      <E2eeMessageIdentity
        member={member}
        fallbackName={name}
        messageId={message.id}
      />
      <span
        aria-hidden="true"
        className="tw-size-[3px] tw-flex-shrink-0 tw-rounded-full tw-bg-iron-700"
      />
      <time
        dateTime={new Date(shownTs).toISOString()}
        title={formatE2eeDateTime(locale, shownTs, zone)}
        className="tw-text-xs tw-text-iron-500"
      >
        {formatE2eeTimestamp(locale, shownTs, { zone })}
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
  return `tw-group tw-relative tw-flex tw-gap-3 tw-px-4 focus:tw-bg-iron-900/60 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-bg-iron-950 ${
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
  inViewportRow = false,
}: E2eeMessageItemProps) {
  const { data: storedReply, isFetching: replyLoading } = useQuery({
    queryKey: [
      "e2ee-reply",
      engine.getThisDevice()?.deviceKey,
      message.g,
      message.reply,
    ],
    queryFn: () =>
      message.reply
        ? (engine.getMessage?.(message.g, message.reply) ?? null)
        : null,
    enabled: Boolean(
      message.reply && !replyTarget && typeof engine.getMessage === "function"
    ),
    gcTime: 0,
  });
  const resolvedReply = replyTarget ?? storedReply ?? null;
  const locale = useBrowserLocale();
  const canSwipeReply =
    canAct &&
    selfProfileId !== null &&
    message.kind !== "notice" &&
    !message.deleted &&
    !message.undecryptable &&
    !message.pending &&
    !message.unsent;
  const { rootRef, contentRef, onTouchStart } = useSwipeToReply({
    enabled: canSwipeReply,
    canReply: canSwipeReply,
    scope: `${message.g}:${message.id}`,
    onReply: () => actions.onReply(message),
  });
  if (message.kind === "notice") {
    return (
      <NoticeItem
        message={message}
        conversation={conversation}
        selfProfileId={selfProfileId}
        inViewportRow={inViewportRow}
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
    selfProfileId !== null &&
    (canAct || !isOwn) &&
    !message.deleted &&
    !message.undecryptable &&
    !message.pending &&
    !message.unsent;

  const Container = inViewportRow ? "div" : "li";
  return (
    <Container
      id={inViewportRow ? undefined : getMessageDomId(message.id)}
      tabIndex={inViewportRow ? undefined : -1}
      className={getMessageRowClassName(compact, message.pending, appear)}
    >
      <div
        ref={rootRef}
        onTouchStart={onTouchStart}
        className="tw-relative tw-min-w-0 tw-flex-1"
      >
        {canSwipeReply && <SwipeReplyHint />}
        <div
          ref={contentRef}
          className="tw-relative tw-flex tw-gap-3 [[data-reply-swiping=true]_&]:tw-z-10"
          style={{ transform: "var(--message-swipe-transform, none)" }}
        >
          <div className="tw-w-10 tw-flex-shrink-0">
            {compact ? null : (
              <E2eeMessageAvatar member={sender} fallbackName={shownName} />
            )}
          </div>
          <div
            className={`tw-min-w-0 tw-flex-1 ${showActions ? "touch-only:tw-pr-8" : ""}`}
          >
            <MessageMeta
              message={message}
              name={shownName}
              member={sender}
              compact={compact}
            />
            {message.reply && !(replyLoading && !resolvedReply) ? (
              <ReplyPreview
                replyId={message.reply}
                target={resolvedReply}
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
              <E2eeImageGallery attachments={message.attachments}>
                <div className="tw-mt-1 tw-space-y-2">
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
              </E2eeImageGallery>
            ) : null}
            {message.unsent && isOwn ? (
              <E2eeUnsentNotice
                message={message}
                conversation={conversation}
                selfProfileId={selfProfileId}
                actions={actions}
              />
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
              canAct={canAct && showActions}
              onReact={(reaction, on) => actions.onReact(message, reaction, on)}
            />
          </div>
        </div>
      </div>
      {showActions ? (
        <div className="tw-absolute tw-right-3 tw-top-1">
          <E2eeMessageActionsMenu
            canAct={canAct}
            message={message}
            isOwn={isOwn}
            selfProfileId={selfProfileId}
            senderName={senderName}
            actions={actions}
          />
        </div>
      ) : null}
    </Container>
  );
}

export const E2eeMessageItem = memo(E2eeMessageItemComponent);

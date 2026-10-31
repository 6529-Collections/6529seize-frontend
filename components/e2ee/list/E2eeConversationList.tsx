"use client";

import { BellSlashIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { getEncryptedConversationRoute } from "@/helpers/navigation.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import type { E2eeConversation } from "@/lib/e2ee/types";
import {
  formatE2eeTimestamp,
  getConversationTitle,
  getDmPeer,
  getMemberName,
  getMessagePreview,
  tCount,
} from "../e2eeFormat";
import { useMutedE2eeChats } from "../e2eeMutedChats";
import { E2eeAvatar } from "../ui/E2eeAvatar";

const STATUS_KEYS: Partial<Record<E2eeConversation["status"], MessageKey>> = {
  invalid: "e2ee.list.status.invalid",
  left: "e2ee.list.status.left",
  removed: "e2ee.list.status.removed",
  restored: "e2ee.list.status.restored",
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
  if (peer || conversation.kind === "dm") {
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
): string {
  const message = conversation.lastMessage;
  const preview = getMessagePreview(
    locale,
    message,
    conversation.members,
    selfProfileId
  );
  if (
    message?.kind !== "message" ||
    message.deleted ||
    message.undecryptable ||
    (conversation.kind !== "group" && message.senderProfileId !== selfProfileId)
  ) {
    return preview;
  }
  return t(locale, "e2ee.list.preview.from", {
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
  readonly selfProfileId: string | null;
  readonly active: boolean;
  readonly collapsed: boolean;
  /** Muted on this device: a muted mark instead of unread badges. */
  readonly muted: boolean;
}

function MutedMark({ locale }: { readonly locale: SupportedLocale }) {
  return (
    <span className="tw-flex tw-flex-shrink-0 tw-items-center tw-text-iron-500">
      <BellSlashIcon aria-hidden="true" className="tw-size-4" />
      <span className="tw-sr-only">{t(locale, "e2ee.list.muted")}</span>
    </span>
  );
}

function E2eeConversationRow({
  conversation,
  selfProfileId,
  active,
  collapsed,
  muted,
}: E2eeConversationRowProps) {
  const locale = useBrowserLocale();
  const title = getConversationTitle(locale, conversation, selfProfileId);
  const statusKey = STATUS_KEYS[conversation.status];
  const href = getEncryptedConversationRoute(conversation.g);
  const hasUnread =
    !muted && (conversation.unread > 0 || conversation.mentions > 0);
  const rowClass = active
    ? "tw-bg-iron-900 tw-text-iron-50"
    : "tw-text-iron-200 desktop-hover:hover:tw-bg-iron-900/60";

  if (collapsed) {
    return (
      <li>
        <Link
          href={href}
          aria-current={active ? "page" : undefined}
          aria-label={title}
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
      </li>
    );
  }

  return (
    <li>
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={`tw-flex tw-min-w-0 tw-items-center tw-gap-3 tw-rounded-lg tw-px-3 tw-py-2 tw-no-underline tw-transition-colors focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 ${rowClass}`}
      >
        <ConversationAvatar
          conversation={conversation}
          selfProfileId={selfProfileId}
          title={title}
        />
        <span className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col">
          <span className="tw-flex tw-min-w-0 tw-items-baseline tw-gap-2">
            <span
              className={`tw-min-w-0 tw-flex-1 tw-truncate tw-text-sm ${
                hasUnread ? "tw-font-bold tw-text-iron-50" : "tw-font-semibold"
              }`}
            >
              {title}
            </span>
            <span
              className={`tw-flex-shrink-0 tw-text-xs ${
                hasUnread
                  ? "tw-font-medium tw-text-primary-300"
                  : "tw-text-iron-500"
              }`}
            >
              {formatE2eeTimestamp(locale, conversation.updatedAt)}
            </span>
          </span>
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
  const visible =
    limit === undefined ? conversations : conversations.slice(0, limit);
  return (
    <ul
      aria-label={label}
      className="tw-m-0 tw-flex tw-list-none tw-flex-col tw-gap-0.5 tw-p-0"
    >
      {visible.map((conversation) => (
        <E2eeConversationRow
          key={conversation.g}
          conversation={conversation}
          selfProfileId={selfProfileId}
          active={conversation.g === activeGroup}
          collapsed={collapsed}
          muted={muted.has(conversation.g)}
        />
      ))}
    </ul>
  );
}

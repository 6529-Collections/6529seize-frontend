import { getAddress, isAddress } from "viem";
import { shortenAddress } from "@/helpers/address.helpers";
import {
  formatDate,
  formatInteger,
  formatList,
  formatTime,
  selectPluralCategory,
} from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import type {
  E2eeConversation,
  E2eeMember,
  E2eeMessage,
} from "@/lib/e2ee/types";

interface PluralKeys {
  readonly one: MessageKey;
  readonly other: MessageKey;
}

/** Plural-aware count copy with a locale-formatted `{count}`. */
export function tCount(
  locale: SupportedLocale,
  keys: PluralKeys,
  count: number,
  params: Record<string, string | number> = {}
): string {
  const key =
    selectPluralCategory(locale, count) === "one" ? keys.one : keys.other;
  return t(locale, key, { ...params, count: formatInteger(locale, count) });
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Short checksummed wallet ("0xAbCd…1234"); empty for a non-address. */
export function formatE2eeWallet(wallet: string | null | undefined): string {
  if (!wallet || !isAddress(wallet, { strict: false })) {
    return "";
  }
  return shortenAddress(getAddress(wallet));
}

/** The signing wallets a device notice carries (comma separated). */
function formatNoticeWallets(
  locale: SupportedLocale,
  detail: string | undefined
): string {
  const wallets = [
    ...new Set(
      (detail ?? "")
        .split(",")
        .map((wallet) => formatE2eeWallet(wallet.trim()))
        .filter((wallet) => wallet.length > 0)
    ),
  ];
  return wallets.length > 0 ? formatList(locale, wallets) : "";
}

/** Compact timestamp: time today, day and month this year, full date otherwise. */
export function formatE2eeTimestamp(
  locale: SupportedLocale,
  ms: number,
  now: number = Date.now()
): string {
  const date = new Date(ms);
  const today = new Date(now);
  if (
    date.toDateString() === today.toDateString() &&
    Math.abs(now - ms) < DAY_MS
  ) {
    return formatTime(locale, ms);
  }
  if (date.getFullYear() === today.getFullYear()) {
    return formatDate(locale, ms, { day: "numeric", month: "short" });
  }
  return formatDate(locale, ms);
}

/**
 * Local calendar day of `ms`, for grouping a timeline by day. Day helpers use
 * the viewer's time zone, so they run only in the client timeline, which
 * renders after the engine starts in the browser (never during SSR).
 */
export function getE2eeDayKey(ms: number): string {
  const date = new Date(ms);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

const startOfLocalDay = (ms: number): number => {
  const date = new Date(ms);
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  ).getTime();
};

/** Day separator label: Today, Yesterday, a weekday this week, else a date. */
export function getE2eeDayLabel(
  locale: SupportedLocale,
  ms: number,
  now: number = Date.now()
): string {
  const days = Math.round(
    (startOfLocalDay(now) - startOfLocalDay(ms)) / DAY_MS
  );
  if (days === 0) {
    return t(locale, "e2ee.conversation.day.today");
  }
  if (days === 1) {
    return t(locale, "e2ee.conversation.day.yesterday");
  }
  if (days > 1 && days < 7) {
    return formatDate(locale, ms, { weekday: "long" });
  }
  return formatDate(locale, ms, { dateStyle: "medium" });
}

export function formatE2eeDateTime(
  locale: SupportedLocale,
  ms: number
): string {
  return formatDate(locale, ms, { dateStyle: "medium", timeStyle: "short" });
}

export function findMember(
  members: readonly E2eeMember[],
  profileId: string | null
): E2eeMember | null {
  if (!profileId) {
    return null;
  }
  return members.find((member) => member.profileId === profileId) ?? null;
}

/** Display name for a profile in a chat ("You" for the viewer). */
export function getMemberName(
  locale: SupportedLocale,
  members: readonly E2eeMember[],
  profileId: string | null,
  selfProfileId: string | null
): string {
  if (profileId && profileId === selfProfileId) {
    return t(locale, "e2ee.you");
  }
  const handle = findMember(members, profileId)?.handle;
  return handle ?? t(locale, "e2ee.unknownMember");
}

const TITLE_NAME_LIMIT = 3;

/** Chat title: the group name, else the other people's handles. */
export function getConversationTitle(
  locale: SupportedLocale,
  conversation: E2eeConversation,
  selfProfileId: string | null
): string {
  if (conversation.kind === "group" && conversation.name) {
    return conversation.name;
  }
  const others = conversation.members.filter(
    (member) => member.profileId !== selfProfileId
  );
  if (others.length === 0) {
    return t(locale, "e2ee.you");
  }
  const names = others.map(
    (member) => member.handle ?? t(locale, "e2ee.unknownMember")
  );
  if (names.length <= TITLE_NAME_LIMIT) {
    return formatList(locale, names);
  }
  return t(locale, "e2ee.conversation.titleMore", {
    names: formatList(locale, names.slice(0, TITLE_NAME_LIMIT), {
      style: "narrow",
      type: "unit",
    }),
    count: formatInteger(locale, names.length - TITLE_NAME_LIMIT),
  });
}

/** The other member of a DM, or null for groups. */
export function getDmPeer(
  conversation: E2eeConversation,
  selfProfileId: string | null
): E2eeMember | null {
  if (conversation.kind !== "dm") {
    return null;
  }
  return (
    conversation.members.find((member) => member.profileId !== selfProfileId) ??
    null
  );
}

const NOTICE_NAME_FALLBACK: MessageKey = "e2ee.someone";

function noticeNames(
  locale: SupportedLocale,
  members: readonly E2eeMember[],
  profileIds: readonly string[],
  selfProfileId: string | null,
  /** Mid-sentence objects read "alice removed you", not "removed You". */
  asObject = false
): string {
  if (profileIds.length === 0) {
    return t(locale, NOTICE_NAME_FALLBACK);
  }
  return formatList(
    locale,
    profileIds.map((id) =>
      asObject && id === selfProfileId
        ? t(locale, "e2ee.youObject")
        : getMemberName(locale, members, id, selfProfileId)
    )
  );
}

/** Timeline copy for a system notice (contract 8.6). */
export function getNoticeText(
  locale: SupportedLocale,
  message: E2eeMessage,
  members: readonly E2eeMember[],
  selfProfileId: string | null
): string {
  const notice = message.notice;
  if (!notice) {
    return "";
  }
  const actorId = notice.actorProfileId;
  const actor = actorId
    ? getMemberName(locale, members, actorId, selfProfileId)
    : t(locale, NOTICE_NAME_FALLBACK);
  const targets = noticeNames(
    locale,
    members,
    notice.targetProfileIds,
    selfProfileId
  );
  const objects = noticeNames(
    locale,
    members,
    notice.targetProfileIds,
    selfProfileId,
    true
  );
  const owner = notice.targetProfileIds[0] ?? actorId;
  const ownerName = owner
    ? getMemberName(locale, members, owner, selfProfileId)
    : t(locale, NOTICE_NAME_FALLBACK);

  switch (notice.type) {
    case "created":
      return t(locale, "e2ee.notice.created", { actor });
    case "joined":
      return actorId && !notice.targetProfileIds.includes(actorId)
        ? t(locale, "e2ee.notice.added", { actor, targets: objects })
        : t(locale, "e2ee.notice.joined", { targets });
    case "left":
      return t(locale, "e2ee.notice.left", {
        actor: actorId ? actor : targets,
      });
    case "removed":
      return actorId
        ? t(locale, "e2ee.notice.removed", { actor, targets: objects })
        : t(locale, "e2ee.notice.removedNoActor", { targets });
    case "device_added": {
      const wallet = formatNoticeWallets(locale, notice.detail);
      return wallet
        ? t(locale, "e2ee.notice.deviceAddedWallet", {
            name: ownerName,
            wallet,
          })
        : t(locale, "e2ee.notice.deviceAdded", { name: ownerName });
    }
    case "device_removed":
      return t(locale, "e2ee.notice.deviceRemoved", { name: ownerName });
    case "renamed":
      return notice.detail
        ? t(locale, "e2ee.notice.renamed", { actor, name: notice.detail })
        : t(locale, "e2ee.notice.renamedNoName", { actor });
    case "admins_changed":
      return t(locale, "e2ee.notice.adminsChanged", { actor });
    case "safety_code_changed":
      return t(locale, "e2ee.notice.safetyCodeChanged");
    default:
      return "";
  }
}

const PREVIEW_MAX_CHARS = 120;

/** One-line preview of a chat's last message for lists. */
export function getMessagePreview(
  locale: SupportedLocale,
  message: E2eeMessage | null,
  members: readonly E2eeMember[],
  selfProfileId: string | null
): string {
  if (!message) {
    return t(locale, "e2ee.list.preview.none");
  }
  if (message.kind === "notice") {
    return getNoticeText(locale, message, members, selfProfileId);
  }
  if (message.undecryptable) {
    return t(locale, "e2ee.list.preview.undecryptable");
  }
  if (message.deleted) {
    return t(locale, "e2ee.list.preview.deleted");
  }
  const text = message.text.replaceAll(/\s+/g, " ").trim();
  if (text.length > 0) {
    return text.length > PREVIEW_MAX_CHARS
      ? `${text.slice(0, PREVIEW_MAX_CHARS)}…`
      : text;
  }
  if (message.attachments.length > 0) {
    return t(locale, "e2ee.list.preview.attachment");
  }
  return t(locale, "e2ee.list.preview.none");
}

/** "abcd efgh ijkl mnop" from the engine, normalized to 4 groups of 4. */
export function formatSafetyCode(code: string): string[] {
  const compact = code.replaceAll(/[^0-9a-f]/gi, "").toLowerCase();
  const groups: string[] = [];
  for (let index = 0; index < compact.length; index += 4) {
    groups.push(compact.slice(index, index + 4));
  }
  return groups;
}

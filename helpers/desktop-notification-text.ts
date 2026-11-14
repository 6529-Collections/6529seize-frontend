import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiNotification } from "@/generated/models/ApiNotification";
import { ApiNotificationCause } from "@/generated/models/ApiNotificationCause";
import { markdownToPlainText } from "@/helpers/waves/waveDescriptionPreview";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

/**
 * The text of a 6529 Desktop system notification for one API notification.
 * Everything is plain text: the OS shows it verbatim and never renders HTML.
 */
interface DesktopNotificationContent {
  readonly title: string;
  readonly body: string;
  /** Same-origin path the notification opens. */
  readonly redirectPath: string;
  /** A custom reaction's image, shown instead of the sender's picture. */
  readonly iconUrl?: string | undefined;
}

interface DesktopNotificationEmoji {
  readonly findNativeEmoji: (
    emojiId: string
  ) => { readonly skins: readonly { readonly native: string }[] } | null;
  readonly findCustomEmoji: (
    emojiId: string
  ) => { readonly skins: readonly { readonly src: string }[] } | null;
}

// The API's limit for one drop part; longer historical content is skipped
// rather than cut, so a cut can never expose part of a link.
const DROP_PART_MAX_LENGTH = 25_000;
const MEDIA_EXTENSION =
  /\.(png|jpe?g|gif|webp|mp4|mov|qt|avi|mp3|mpeg|ogg|wav|aac|glb|pdf|csv)$/i;
const NATIVE_EMOJI = /[\p{Emoji_Presentation}\p{Extended_Pictographic}️]/u;
const SHORTCODE = /:([a-z0-9_+-]+):/gi;
const MENTION = /@\[(.+?)\]/g;
const NOTIFICATIONS_PATH = "/notifications";

const isMediaUrl = (url: string): boolean =>
  MEDIA_EXTENSION.test(url.split(/[?#]/, 1)[0] ?? "");

const getEmojiIdCandidates = (reaction: string): string[] => {
  const rawId = reaction.trim().replaceAll(":", "");
  const underscored = rawId.replaceAll("-", "_").replaceAll(" ", "_");
  const hyphenated = rawId.replaceAll("_", "-").replaceAll(" ", "-");
  return [...new Set([rawId, underscored, hyphenated].filter(Boolean))];
};

/** Replace `:shortcode:` emoji and `@[handle]` mentions with plain text. */
const toPlainNotificationText = (
  text: string,
  emoji: DesktopNotificationEmoji
): string =>
  text
    .replace(MENTION, "@$1")
    .replace(
      SHORTCODE,
      (match, id: string) =>
        emoji.findNativeEmoji(id)?.skins[0]?.native ?? match
    );

/** The first readable text of a drop, or its attachments, or a media label. */
export function getDesktopDropPreviewText(
  drop: Pick<ApiDrop, "parts"> | undefined,
  locale: SupportedLocale
): { readonly text: string; readonly literal: boolean } | null {
  const parts = drop?.parts ?? [];
  for (const part of parts) {
    const content = part.content ?? "";
    if (!content || content.length > DROP_PART_MAX_LENGTH) continue;
    const text = markdownToPlainText(content, {
      includeImageUrls: false,
      includeLinkDestinations: false,
      omitUrl: isMediaUrl,
    });
    if (text) return { text, literal: false };
  }
  const attachments = parts.flatMap((part) => part.attachments);
  if (attachments.length > 0) {
    return {
      text: attachments.map((attachment) => attachment.file_name).join(", "),
      literal: true,
    };
  }
  if (parts.some((part) => part.media.length > 0)) {
    return {
      text: t(locale, "desktopNotifications.mediaAttachment"),
      literal: true,
    };
  }
  return null;
}

const getWaveRedirect = (drop: ApiDrop | undefined): string => {
  const waveId = drop?.wave.id;
  if (!waveId) return NOTIFICATIONS_PATH;
  const isDirectMessage = drop.wave.admin_group_id?.startsWith("dm-") === true;
  const base = isDirectMessage
    ? `/messages?wave=${encodeURIComponent(waveId)}`
    : `/waves?wave=${encodeURIComponent(waveId)}`;
  return drop.serial_no ? `${base}&serialNo=${drop.serial_no}` : base;
};

const getContextNumber = (context: unknown, key: string): number | null => {
  if (typeof context !== "object" || context === null) return null;
  const value = (context as Record<string, unknown>)[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
};

const getContextString = (context: unknown, key: string): string | null => {
  if (typeof context !== "object" || context === null) return null;
  const value = (context as Record<string, unknown>)[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
};

interface Draft {
  readonly title: string;
  readonly body: string;
  readonly redirectPath: string;
  readonly iconUrl?: string | undefined;
  readonly literalBody?: boolean | undefined;
}

interface BuildContext {
  readonly notification: ApiNotification;
  readonly emoji: DesktopNotificationEmoji;
  readonly locale: SupportedLocale;
  readonly handle: string;
  readonly context: unknown;
  readonly ownProfilePath: string;
  readonly signed: (value: number) => string;
  readonly number: (value: number) => string;
  readonly dropDraft: (title: string, dropIndex?: number) => Draft;
}

const getReaction = (
  reaction: string,
  emoji: DesktopNotificationEmoji
): { readonly text: string; readonly iconUrl?: string } => {
  const trimmed = reaction.trim();
  if (NATIVE_EMOJI.test(trimmed)) return { text: trimmed };
  for (const id of getEmojiIdCandidates(trimmed)) {
    const native = emoji.findNativeEmoji(id)?.skins[0]?.native;
    if (native) return { text: native };
    const src = emoji.findCustomEmoji(id)?.skins[0]?.src;
    if (src) return { text: "", iconUrl: src };
  }
  const words = trimmed.replaceAll(":", "").replaceAll(/[-_]/g, " ");
  return { text: `'${words}'` };
};

const getScoreLabel = (
  ctx: BuildContext,
  isNic: boolean,
  category: string | null
): string => {
  if (isNic) return t(ctx.locale, "desktopNotifications.nicTitle");
  if (category) {
    return t(ctx.locale, "desktopNotifications.repTitleCategory", {
      category,
    });
  }
  return t(ctx.locale, "desktopNotifications.repTitle");
};

const buildScoreDraft = (ctx: BuildContext, isNic: boolean): Draft => {
  const amount = getContextNumber(ctx.context, "amount") ?? 0;
  const total = getContextNumber(ctx.context, "total") ?? 0;
  const category = isNic ? null : getContextString(ctx.context, "category");
  const marker = amount > 0 ? "🚀" : "💔";
  return {
    title: `${marker} ${getScoreLabel(ctx, isNic, category)}`,
    body: t(
      ctx.locale,
      isNic ? "desktopNotifications.nicBody" : "desktopNotifications.repBody",
      {
        handle: ctx.handle,
        amount: ctx.signed(amount),
        total: ctx.number(total),
      }
    ),
    redirectPath: ctx.ownProfilePath,
  };
};

const buildVoteDraft = (ctx: BuildContext): Draft | null => {
  const vote = getContextNumber(ctx.context, "vote");
  if (vote === null || vote === 0) return null;
  return ctx.dropDraft(
    t(ctx.locale, "desktopNotifications.rated", {
      handle: ctx.handle,
      vote: ctx.signed(vote),
    })
  );
};

const buildReactionDraft = (ctx: BuildContext): Draft | null => {
  const value = getContextString(ctx.context, "reaction");
  if (!value) return null;
  const reaction = getReaction(value, ctx.emoji);
  const title = reaction.text
    ? t(ctx.locale, "desktopNotifications.reacted", {
        handle: ctx.handle,
        reaction: reaction.text,
      })
    : t(ctx.locale, "desktopNotifications.reactedWithImage", {
        handle: ctx.handle,
      });
  return { ...ctx.dropDraft(title), iconUrl: reaction.iconUrl };
};

const getWaveName = (ctx: BuildContext): string =>
  ctx.notification.related_drops[0]?.wave.name ??
  t(ctx.locale, "desktopNotifications.someWave");

const buildWaveInviteDraft = (ctx: BuildContext): Draft => {
  const waveId =
    getContextString(ctx.context, "wave_id") ??
    ctx.notification.related_drops[0]?.wave.id;
  return {
    title: t(ctx.locale, "desktopNotifications.waveInvite", {
      handle: ctx.handle,
      wave: getWaveName(ctx),
    }),
    body: t(ctx.locale, "desktopNotifications.viewWave"),
    redirectPath: waveId
      ? `/waves?wave=${encodeURIComponent(waveId)}`
      : NOTIFICATIONS_PATH,
  };
};

const buildWaveDropDraft = (ctx: BuildContext): Draft => {
  const vote = getContextNumber(ctx.context, "vote");
  const wave = getWaveName(ctx);
  const title =
    vote === null || vote === 0
      ? t(ctx.locale, "desktopNotifications.waveDrop", {
          handle: ctx.handle,
          wave,
        })
      : t(ctx.locale, "desktopNotifications.waveDropRated", {
          handle: ctx.handle,
          vote: ctx.signed(vote),
          wave,
        });
  return ctx.dropDraft(title);
};

const buildFollowDraft = (ctx: BuildContext): Draft => {
  const followerHandle = ctx.notification.related_identity?.handle;
  return {
    title: t(ctx.locale, "desktopNotifications.followed", {
      handle: ctx.handle,
    }),
    body: t(ctx.locale, "desktopNotifications.viewProfile"),
    redirectPath: followerHandle
      ? `/${encodeURIComponent(followerHandle)}`
      : NOTIFICATIONS_PATH,
  };
};

const buildGenericDraft = (ctx: BuildContext): Draft => ({
  title: t(ctx.locale, "desktopNotifications.generic", { handle: ctx.handle }),
  body: t(ctx.locale, "desktopNotifications.viewNotification"),
  redirectPath: NOTIFICATIONS_PATH,
});

const dropMessage =
  (
    key:
      | "desktopNotifications.mentioned"
      | "desktopNotifications.quoted"
      | "desktopNotifications.replied"
      | "desktopNotifications.boosted",
    dropIndex = 0
  ) =>
  (ctx: BuildContext): Draft =>
    ctx.dropDraft(t(ctx.locale, key, { handle: ctx.handle }), dropIndex);

/** Causes with their own text; every other cause gets the generic text. */
const DRAFT_BUILDERS: Partial<
  Record<ApiNotificationCause, (ctx: BuildContext) => Draft | null>
> = {
  [ApiNotificationCause.IdentitySubscribed]: buildFollowDraft,
  [ApiNotificationCause.IdentityMentioned]: dropMessage(
    "desktopNotifications.mentioned"
  ),
  [ApiNotificationCause.IdentityNic]: (ctx) => buildScoreDraft(ctx, true),
  [ApiNotificationCause.IdentityRep]: (ctx) => buildScoreDraft(ctx, false),
  [ApiNotificationCause.DropQuoted]: dropMessage("desktopNotifications.quoted"),
  // A reply's own drop is the second related drop.
  [ApiNotificationCause.DropReplied]: dropMessage(
    "desktopNotifications.replied",
    1
  ),
  [ApiNotificationCause.DropVoted]: buildVoteDraft,
  [ApiNotificationCause.DropReacted]: buildReactionDraft,
  [ApiNotificationCause.DropBoosted]: dropMessage(
    "desktopNotifications.boosted"
  ),
  [ApiNotificationCause.WaveCreated]: buildWaveInviteDraft,
  [ApiNotificationCause.AllDrops]: buildWaveDropDraft,
  // The encrypted-chat code announces these itself, without the sender.
  [ApiNotificationCause.E2EeMessage]: () => null,
};

/**
 * Build the system notification for one API notification, or null when it
 * should not be shown (a zero vote, a reaction without a value, or an
 * encrypted message, which the encrypted-chat code announces on its own
 * without naming the sender).
 */
export function buildDesktopNotification(
  notification: ApiNotification,
  emoji: DesktopNotificationEmoji,
  locale: SupportedLocale,
  connectedProfileHandle: string | null
): DesktopNotificationContent | null {
  const viewDrop = t(locale, "desktopNotifications.viewDrop");
  const ctx: BuildContext = {
    notification,
    emoji,
    locale,
    handle:
      notification.related_identity?.handle ??
      t(locale, "desktopNotifications.someone"),
    context: notification.additional_context,
    ownProfilePath: connectedProfileHandle
      ? `/${encodeURIComponent(connectedProfileHandle)}`
      : NOTIFICATIONS_PATH,
    signed: (value) =>
      new Intl.NumberFormat(locale, { signDisplay: "exceptZero" }).format(
        value
      ),
    number: (value) => new Intl.NumberFormat(locale).format(value),
    dropDraft: (title, dropIndex = 0) => {
      const drop = notification.related_drops[dropIndex];
      const preview = getDesktopDropPreviewText(drop, locale);
      return {
        title,
        body: preview?.text ?? viewDrop,
        redirectPath: getWaveRedirect(drop),
        literalBody: preview?.literal ?? false,
      };
    },
  };
  const builder = DRAFT_BUILDERS[notification.cause] ?? buildGenericDraft;
  const draft = builder(ctx);
  if (!draft) return null;
  return {
    title: toPlainNotificationText(draft.title, emoji),
    // Attachment names and media labels stay literal.
    body: draft.literalBody
      ? draft.body
      : toPlainNotificationText(draft.body, emoji),
    redirectPath: draft.redirectPath,
    ...(draft.iconUrl === undefined ? {} : { iconUrl: draft.iconUrl }),
  };
}

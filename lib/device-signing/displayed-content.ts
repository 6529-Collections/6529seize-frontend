import type { ApiDrop } from "@/generated/models/ApiDrop";

/**
 * What a reader is shown of a drop, and how it compares with a signed post
 * or edit body.
 */

const sameId = (left: string, right: string): boolean =>
  left.toLowerCase() === right.toLowerCase();

/** A drop part another drop points at (a reply target or a quote). */
interface DisplayedDropRef {
  readonly dropId: string;
  readonly partId: number;
}

/**
 * What the reader is shown for the drop, compared with the signed body.
 * Media is identified by its URL (the server stores the signed URL and binds
 * an upload id to it), attachments by their ids. The server does not keep
 * the order media and attachments were signed in, so both are compared as
 * sets; parts are matched by their part id.
 */
export interface DisplayedDropContent {
  readonly title: string | null;
  /** The drop this one replies to, when the reader is shown one. */
  readonly replyToDropId: string | null;
  readonly parts: readonly {
    /** 1-based: the signed body's parts[partId - 1]. */
    readonly partId: number;
    readonly content: string | null;
    /** The quoted drop part, when the reader is shown one. */
    readonly quote: DisplayedDropRef | null;
    readonly media: readonly {
      readonly url: string;
      readonly uploadId: string | null;
    }[];
    readonly attachmentIds: readonly string[];
  }[];
  /**
   * The drop's part count when only its first parts are shown (some lists
   * load one part); null when every part is shown.
   */
  readonly totalParts: number | null;
}

const listOf = (value: unknown): readonly unknown[] =>
  Array.isArray(value) ? value : [];

type DisplayableDrop = Pick<ApiDrop, "title" | "parts"> &
  Partial<Pick<ApiDrop, "reply_to" | "parts_count">>;

/** Some read paths omit a part's media or attachments. */
const listOrEmpty = <T>(list: readonly T[] | undefined): readonly T[] =>
  list ?? [];

const toDisplayedRef = (
  ref: { readonly drop_id: string; readonly drop_part_id: number } | null
): DisplayedDropRef | null =>
  ref ? { dropId: ref.drop_id, partId: ref.drop_part_id } : null;

export const toDisplayedDropContent = (
  drop: DisplayableDrop
): DisplayedDropContent => ({
  title: drop.title ?? null,
  replyToDropId: drop.reply_to?.drop_id ?? null,
  parts: drop.parts.map((part, index) => ({
    partId: typeof part.part_id === "number" ? part.part_id : index + 1,
    content: part.content ?? null,
    quote: toDisplayedRef(part.quoted_drop ?? null),
    media: listOrEmpty(part.media).map((media) => ({
      url: media.url,
      uploadId: media.media_upload_id ?? null,
    })),
    attachmentIds: listOrEmpty(part.attachments).map(
      (attachment) => attachment.attachment_id
    ),
  })),
  totalParts:
    typeof drop.parts_count === "number" && drop.parts_count > drop.parts.length
      ? drop.parts_count
      : null,
});

const asText = (value: unknown): string =>
  typeof value === "string" ? value : "";

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** A signed `{ drop_id, drop_part_id }`, or null. */
function readSignedRef(value: unknown): DisplayedDropRef | null {
  if (!isRecord(value)) {
    return null;
  }
  const dropId = value["drop_id"];
  const partId = value["drop_part_id"];
  return typeof dropId === "string" && typeof partId === "number"
    ? { dropId, partId }
    : null;
}

/** A quote shown must be the one signed; a part shown without one shows nothing unsigned. */
const matchesShownQuote = (
  signed: unknown,
  shown: DisplayedDropRef | null
): boolean => {
  if (shown === null) {
    return true;
  }
  const quote = readSignedRef(signed);
  return (
    quote !== null &&
    sameId(quote.dropId, shown.dropId) &&
    quote.partId === shown.partId
  );
};

interface MediaIdentity {
  readonly url: string;
  readonly uploadId: string | null;
}

const compareText = (left: string, right: string): number =>
  left < right ? -1 : Number(left > right);

const byIdentity = (left: MediaIdentity, right: MediaIdentity): number =>
  compareText(left.url, right.url) ||
  compareText(left.uploadId ?? "", right.uploadId ?? "");

/** Signed media as identities, or null when one is malformed. */
function readSignedMedia(signed: readonly unknown[]): MediaIdentity[] | null {
  const media: MediaIdentity[] = [];
  for (const item of signed) {
    if (!isRecord(item) || typeof item["url"] !== "string") {
      return null;
    }
    const uploadId = item["media_upload_id"];
    media.push({
      url: item["url"],
      uploadId: typeof uploadId === "string" ? uploadId : null,
    });
  }
  return media;
}

/**
 * The same media, in any order (the server does not keep the signed
 * order); an upload id is compared when both sides name one.
 */
function matchesShownMedia(
  signed: readonly unknown[],
  shown: readonly MediaIdentity[]
): boolean {
  const signedMedia = readSignedMedia(signed);
  if (signedMedia?.length !== shown.length) {
    return false;
  }
  signedMedia.sort(byIdentity);
  const shownMedia = [...shown].sort(byIdentity);
  return signedMedia.every((media, index) => {
    const item = shownMedia[index];
    return (
      item?.url === media.url &&
      (media.uploadId === null ||
        item.uploadId === null ||
        media.uploadId === item.uploadId)
    );
  });
}

/** The same attachments, in any order. */
function matchesShownAttachments(
  signed: readonly unknown[],
  shown: readonly string[]
): boolean {
  const signedIds: string[] = [];
  for (const attachment of signed) {
    const id = isRecord(attachment) ? attachment["attachment_id"] : undefined;
    if (typeof id !== "string") {
      return false;
    }
    signedIds.push(id);
  }
  if (signedIds.length !== shown.length) {
    return false;
  }
  const shownIds = [...shown].sort(compareText);
  return signedIds
    .sort(compareText)
    .every((id, index) => id === shownIds[index]);
}

const matchesShownPart = (
  part: unknown,
  shown: DisplayedDropContent["parts"][number] | undefined
): boolean =>
  shown !== undefined &&
  isRecord(part) &&
  asText(part["content"]) === asText(shown.content) &&
  matchesShownQuote(part["quoted_drop"], shown.quote) &&
  matchesShownMedia(listOf(part["media"]), shown.media) &&
  matchesShownAttachments(listOf(part["attachments"]), shown.attachmentIds);

/** "partial": what is shown matches, but not every part of the post is shown. */
type DisplayedMatch = "match" | "partial" | "mismatch";

/**
 * How the parts shown compare with the signed parts: every part shown must
 * be the signed part with its part id. When fewer parts are loaded than the
 * post has, what is shown matches but the whole post was not compared
 * ("partial"), so it is reported neither as signed nor as a mismatch.
 */
function compareShownParts(
  signedParts: readonly unknown[],
  displayed: DisplayedDropContent
): DisplayedMatch {
  const partIds = new Set(displayed.parts.map((part) => part.partId));
  const everyShownPartSigned =
    partIds.size === displayed.parts.length &&
    displayed.parts.every((shown) =>
      matchesShownPart(signedParts[shown.partId - 1], shown)
    );
  if (!everyShownPartSigned) {
    return "mismatch";
  }
  if (
    displayed.totalParts !== null &&
    signedParts.length !== displayed.totalParts
  ) {
    // 6529.io says the post has another number of parts than was signed.
    return "mismatch";
  }
  return displayed.parts.length < signedParts.length ? "partial" : "match";
}

/** The reply target a post's body signs, or null for a post that is not a reply. */
export const signedReplyTarget = (
  body: Record<string, unknown>
): string | null => readSignedRef(body["reply_to"])?.dropId ?? null;

/**
 * Whether the signed post or edit body is what the reader is shown. A
 * post's body signs its reply target; an edit's does not, so an edited drop
 * shows its reply target against the original post when that is signed.
 */
export function compareDisplayed(
  body: unknown,
  isPost: boolean,
  displayed: DisplayedDropContent,
  replyTarget: string | null | undefined
): DisplayedMatch {
  if (!isRecord(body) || asText(body["title"]) !== asText(displayed.title)) {
    return "mismatch";
  }
  const signedTarget = isPost ? signedReplyTarget(body) : replyTarget;
  // A reply target shown must be the signed one. One left out (a deleted
  // target, for example) shows nothing unsigned.
  const replyMatches =
    displayed.replyToDropId === null ||
    signedTarget === undefined ||
    (signedTarget !== null && sameId(signedTarget, displayed.replyToDropId));
  return replyMatches
    ? compareShownParts(listOf(body["parts"]), displayed)
    : "mismatch";
}

import type { ApiDrop } from "@/generated/models/ApiDrop";

/**
 * What a reader is shown of a drop, and how it compares with a signed post
 * or edit body.
 *
 * The signed body is the request as the author's browser sent it; 6529.io
 * validates it and stores a normalized copy. Every comparison accepts each
 * form the server accepts for the same value:
 * - part ids (`drop_part_id` of a reply target or a quote) as integers or
 *   numeric strings ("1"), and a reply target without a part id;
 * - a title with surrounding whitespace, and an empty title, as no title;
 * - a missing or null content, quote, reply target, media or attachment
 *   list as none;
 * - a missing or null media upload id, and one the server did not link;
 * - drop, upload and attachment ids in any letter case;
 * - media and attachments in any order (the server reads them back in its
 *   own order).
 * A value the comparison cannot interpret is "unknown", never a mismatch:
 * only content that differs in substance is a mismatch.
 */

/** How a shown drop compares with the signed body, from best to worst. */
type DisplayedMatch =
  /** Everything shown is what was signed. */
  | "match"
  /** What is shown matches, but not every part of the post is shown. */
  | "partial"
  /** Part of the signed body could not be interpreted with certainty. */
  | "unknown"
  /** Something shown differs in substance from what was signed. */
  | "mismatch";

const MATCH_RANK: Readonly<Record<DisplayedMatch, number>> = {
  match: 0,
  partial: 1,
  unknown: 2,
  mismatch: 3,
};

/** The worst of several outcomes: a mismatch decides over an unknown. */
const worst = (...results: readonly DisplayedMatch[]): DisplayedMatch =>
  results.reduce(
    (current, result) =>
      MATCH_RANK[result] > MATCH_RANK[current] ? result : current,
    "match"
  );

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
 * an upload id to it), attachments by their ids; parts are matched by their
 * part id.
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

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Marks a signed value this module cannot interpret with certainty. */
const UNKNOWN = Symbol("unknown");
type Read<T> = T | typeof UNKNOWN;

const isAbsent = (value: unknown): value is null | undefined =>
  value === null || value === undefined;

/** Signed text: a string, or "" for none; anything else is unknown. */
function readText(value: unknown): Read<string> {
  if (isAbsent(value)) {
    return "";
  }
  return typeof value === "string" ? value : UNKNOWN;
}

/** A part id as the server reads it: an integer or a numeric string. */
function readPartId(value: unknown): Read<number> {
  if (typeof value === "number") {
    return Number.isInteger(value) ? value : UNKNOWN;
  }
  if (typeof value === "string" && /^\s*\+?\d+\s*$/.test(value)) {
    return Number(value);
  }
  return UNKNOWN;
}

/** A signed reference: null for none; a missing part id is null. */
function readSignedRef(
  value: unknown
): Read<{ readonly dropId: string; readonly partId: number | null } | null> {
  if (isAbsent(value)) {
    return null;
  }
  if (!isRecord(value) || typeof value["drop_id"] !== "string") {
    return UNKNOWN;
  }
  const rawPartId = value["drop_part_id"];
  const partId = isAbsent(rawPartId) ? null : readPartId(rawPartId);
  return partId === UNKNOWN ? UNKNOWN : { dropId: value["drop_id"], partId };
}

/** A signed list: an array, or [] for none; anything else is unknown. */
function readList(value: unknown): Read<readonly unknown[]> {
  if (isAbsent(value)) {
    return [];
  }
  return Array.isArray(value) ? value : UNKNOWN;
}

/** A quote shown must be the one signed; a part shown without one shows nothing unsigned. */
function compareQuote(
  signed: unknown,
  shown: DisplayedDropRef | null
): DisplayedMatch {
  if (shown === null) {
    return "match";
  }
  const quote = readSignedRef(signed);
  if (quote === UNKNOWN || quote?.partId === null) {
    return "unknown";
  }
  return quote !== null &&
    sameId(quote.dropId, shown.dropId) &&
    quote.partId === shown.partId
    ? "match"
    : "mismatch";
}

interface MediaIdentity {
  readonly url: string;
  readonly uploadId: string | null;
}

const compareText = (left: string, right: string): number =>
  left < right ? -1 : Number(left > right);

const byIdentity = (left: MediaIdentity, right: MediaIdentity): number =>
  compareText(left.url, right.url) ||
  compareText(
    (left.uploadId ?? "").toLowerCase(),
    (right.uploadId ?? "").toLowerCase()
  );

/** Signed media as identities. */
function readSignedMedia(value: unknown): Read<MediaIdentity[]> {
  const list = readList(value);
  if (list === UNKNOWN) {
    return UNKNOWN;
  }
  const media: MediaIdentity[] = [];
  for (const item of list) {
    if (!isRecord(item) || typeof item["url"] !== "string") {
      return UNKNOWN;
    }
    const uploadId = item["media_upload_id"];
    if (!isAbsent(uploadId) && typeof uploadId !== "string") {
      return UNKNOWN;
    }
    media.push({ url: item["url"], uploadId: uploadId ?? null });
  }
  return media;
}

/**
 * The same media, in any order; an upload id is compared when both sides
 * name one (the server may leave a signed upload id unlinked).
 */
function compareMedia(
  signed: unknown,
  shown: readonly MediaIdentity[]
): DisplayedMatch {
  const signedMedia = readSignedMedia(signed);
  if (signedMedia === UNKNOWN) {
    return "unknown";
  }
  if (signedMedia.length !== shown.length) {
    return "mismatch";
  }
  signedMedia.sort(byIdentity);
  const shownMedia = [...shown].sort(byIdentity);
  const same = signedMedia.every((media, index) => {
    const item = shownMedia[index];
    return (
      item?.url === media.url &&
      (media.uploadId === null ||
        item.uploadId === null ||
        sameId(media.uploadId, item.uploadId))
    );
  });
  return same ? "match" : "mismatch";
}

/** The same attachments, in any order and letter case. */
function compareAttachments(
  signed: unknown,
  shown: readonly string[]
): DisplayedMatch {
  const list = readList(signed);
  if (list === UNKNOWN) {
    return "unknown";
  }
  const signedIds: string[] = [];
  for (const attachment of list) {
    const id = isRecord(attachment) ? attachment["attachment_id"] : undefined;
    if (typeof id !== "string") {
      return "unknown";
    }
    signedIds.push(id.toLowerCase());
  }
  if (signedIds.length !== shown.length) {
    return "mismatch";
  }
  signedIds.sort(compareText);
  const shownIds = shown.map((id) => id.toLowerCase()).sort(compareText);
  return signedIds.every((id, index) => id === shownIds[index])
    ? "match"
    : "mismatch";
}

function compareContent(signed: unknown, shown: string | null): DisplayedMatch {
  const text = readText(signed);
  if (text === UNKNOWN) {
    return "unknown";
  }
  return text === (shown ?? "") ? "match" : "mismatch";
}

function comparePart(
  part: unknown,
  shown: DisplayedDropContent["parts"][number]
): DisplayedMatch {
  if (part === undefined) {
    // A part shown that the post never signed.
    return "mismatch";
  }
  if (!isRecord(part)) {
    return "unknown";
  }
  return worst(
    compareContent(part["content"], shown.content),
    compareQuote(part["quoted_drop"], shown.quote),
    compareMedia(part["media"], shown.media),
    compareAttachments(part["attachments"], shown.attachmentIds)
  );
}

/**
 * How the parts shown compare with the signed parts: every part shown must
 * be the signed part with its part id. When fewer parts are loaded than the
 * post has, what is shown matches but the whole post was not compared
 * ("partial"), so it is reported neither as signed nor as a mismatch.
 */
function compareShownParts(
  signed: unknown,
  displayed: DisplayedDropContent
): DisplayedMatch {
  const signedParts = readList(signed);
  if (signedParts === UNKNOWN) {
    return "unknown";
  }
  const partIds = new Set(displayed.parts.map((part) => part.partId));
  if (partIds.size !== displayed.parts.length) {
    return "unknown";
  }
  const shownParts = worst(
    ...displayed.parts.map((shown) =>
      comparePart(signedParts[shown.partId - 1], shown)
    )
  );
  if (shownParts !== "match") {
    return shownParts;
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

/** The server trims a title and stores an empty one as none. */
function compareTitle(signed: unknown, shown: string | null): DisplayedMatch {
  const title = readText(signed);
  if (title === UNKNOWN) {
    return "unknown";
  }
  return title.trim() === (shown ?? "").trim() ? "match" : "mismatch";
}

/**
 * The reply target a post's body signs: a drop id, null for a post that is
 * not a reply, or undefined when it cannot be interpreted.
 */
export function signedReplyTarget(
  body: Record<string, unknown>
): string | null | undefined {
  const ref = readSignedRef(body["reply_to"]);
  if (ref === UNKNOWN) {
    return undefined;
  }
  return ref?.dropId ?? null;
}

/** A reply target an edit's own body signs, when it names one. */
function editReplyTarget(body: Record<string, unknown>): string | undefined {
  const ref = readSignedRef(body["reply_to"]);
  return ref === UNKNOWN || ref === null ? undefined : ref.dropId;
}

/**
 * Whether the signed post or edit body is what the reader is shown. A
 * post's body signs its reply target. An edit's body normally does not, so
 * an edited drop shows its reply target against the original post's signed
 * body (`replyTarget`); without that body (an unsigned original, or one not
 * loaded) a reply target shown cannot be vouched for and is "unknown".
 */
export function compareDisplayed(
  body: unknown,
  isPost: boolean,
  displayed: DisplayedDropContent,
  replyTarget: string | null | undefined
): DisplayedMatch {
  if (!isRecord(body)) {
    return "unknown";
  }
  const signedTarget = isPost
    ? signedReplyTarget(body)
    : (editReplyTarget(body) ?? replyTarget);
  // A reply target shown must be the signed one. One left out (a deleted
  // target, for example) shows nothing unsigned.
  let reply: DisplayedMatch = "match";
  if (displayed.replyToDropId !== null) {
    if (signedTarget === undefined) {
      reply = "unknown";
    } else {
      reply =
        signedTarget !== null && sameId(signedTarget, displayed.replyToDropId)
          ? "match"
          : "mismatch";
    }
  }
  return worst(
    compareTitle(body["title"], displayed.title),
    reply,
    compareShownParts(body["parts"], displayed)
  );
}

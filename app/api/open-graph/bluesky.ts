import type { LinkPreviewResponse } from "@/services/api/link-preview-api";

const BLUESKY_HOSTS = new Set(["bsky.app", "www.bsky.app"]);
const BLUESKY_API_BASE = "https://public.api.bsky.app";
const BLUESKY_TIMEOUT_MS = 5_000;
const BLUESKY_POST_TTL_MS = 20 * 60 * 1_000;
const BLUESKY_PROFILE_TTL_MS = 24 * 60 * 60 * 1_000;
const BLUESKY_FEED_TTL_MS = BLUESKY_PROFILE_TTL_MS;
const BLUESKY_UNAVAILABLE_TTL_MS = 5 * 60 * 1_000;

const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const ALLOWED_IMAGE_PROTOCOLS = new Set(["http:", "https:"]);
const SENSITIVE_LABELS = new Set([
  "porn",
  "sexual",
  "sexual-content",
  "explicit",
  "nsfw",
  "nudity",
  "gore",
  "graphic-media",
  "violence",
  "spoiler",
]);

class BlueskyRequestError extends Error {
  readonly status: number;
  readonly body?: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export type BlueskyTarget =
  | {
      readonly kind: "post";
      readonly identifier: string;
      readonly rkey: string;
      readonly normalizedUrl: string;
    }
  | {
      readonly kind: "profile";
      readonly identifier: string;
      readonly normalizedUrl: string;
    }
  | {
      readonly kind: "feed";
      readonly identifier: string;
      readonly rkey: string;
      readonly normalizedUrl: string;
    };

export interface BlueskyPreviewResult {
  readonly data: LinkPreviewResponse;
  readonly ttlMs: number;
}

interface ResolveHandleResponse {
  readonly did?: string;
}

interface BlueskyLabel {
  readonly val?: string;
}

interface ThreadViewPost {
  readonly $type: "app.bsky.feed.defs#threadViewPost";
  readonly post?: BlueskyPostView;
  readonly parent?: ThreadViewPost | ThreadViewNotFound | ThreadViewBlocked;
}

interface ThreadViewNotFound {
  readonly $type: "app.bsky.feed.defs#notFoundPost";
}

interface ThreadViewBlocked {
  readonly $type: "app.bsky.feed.defs#blockedPost";
}

interface BlueskyPostView {
  readonly uri?: string;
  readonly cid?: string;
  readonly author?: BlueskyActorView;
  readonly record?: BlueskyPostRecord;
  readonly embed?: BlueskyEmbed;
  readonly likeCount?: number;
  readonly replyCount?: number;
  readonly repostCount?: number;
  readonly quoteCount?: number;
  readonly indexedAt?: string;
  readonly labels?: readonly BlueskyLabel[];
}

interface BlueskyActorView {
  readonly did?: string;
  readonly handle?: string;
  readonly displayName?: string;
  readonly avatar?: string;
}

interface BlueskyPostRecord {
  readonly $type?: string;
  readonly createdAt?: string;
  readonly text?: string;
  readonly reply?: {
    readonly parent?: {
      readonly uri?: string;
    };
  };
}

interface BlueskyEmbedBase {
  readonly $type?: string;
}

interface BlueskyImagesEmbed extends BlueskyEmbedBase {
  readonly $type: "app.bsky.embed.images#view";
  readonly images?: readonly {
    readonly thumb?: string;
    readonly fullsize?: string;
    readonly alt?: string;
  }[];
}

interface BlueskyExternalEmbed extends BlueskyEmbedBase {
  readonly $type: "app.bsky.embed.external#view";
  readonly external?: {
    readonly uri?: string;
    readonly title?: string;
    readonly description?: string;
    readonly thumb?: string;
  };
}

interface BlueskyRecordWithMediaEmbed extends BlueskyEmbedBase {
  readonly $type: "app.bsky.embed.recordWithMedia#view";
  readonly media?: BlueskyEmbed;
}

interface BlueskyQuoteEmbed extends BlueskyEmbedBase {
  readonly $type: "app.bsky.embed.record#view";
}

type BlueskyEmbed =
  | BlueskyImagesEmbed
  | BlueskyExternalEmbed
  | BlueskyRecordWithMediaEmbed
  | BlueskyQuoteEmbed
  | BlueskyEmbedBase;

interface BlueskyProfile {
  readonly did?: string;
  readonly handle?: string;
  readonly displayName?: string;
  readonly avatar?: string;
  readonly banner?: string;
  readonly description?: string;
  readonly followersCount?: number;
  readonly followsCount?: number;
  readonly postsCount?: number;
}

interface BlueskyFeedGenerator {
  readonly view?: {
    readonly uri?: string;
    readonly creator?: BlueskyActorView;
    readonly displayName?: string;
    readonly description?: string;
    readonly avatar?: string;
  };
}

function sanitizePlainText(value: unknown, maxLength = 700): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const normalized = trimmed
    .replace(/\r\n?/g, "\n")
    .replace(CONTROL_CHARACTERS, "")
    .trim();

  if (!normalized) {
    return undefined;
  }

  if (normalized.length > maxLength) {
    return `${normalized.slice(0, maxLength).trimEnd()}…`;
  }

  return normalized;
}

function proxyImageUrl(url: unknown): string | null {
  if (typeof url !== "string") {
    return null;
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  if (!ALLOWED_IMAGE_PROTOCOLS.has(parsed.protocol)) {
    return null;
  }

  return parsed.toString();
}

function extractLabels(labels: unknown): string[] {
  if (!Array.isArray(labels)) {
    return [];
  }

  const result: string[] = [];
  for (const entry of labels) {
    if (typeof entry === "string") {
      const sanitized = sanitizePlainText(entry, 100);
      if (sanitized) {
        result.push(sanitized.toLowerCase());
      }
      continue;
    }

    if (entry && typeof entry === "object") {
      const value = sanitizePlainText((entry as BlueskyLabel).val, 100);
      if (value) {
        result.push(value.toLowerCase());
      }
    }
  }

  return result;
}

function readCount(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.trunc(value));
}

function extractImages(
  embed: BlueskyEmbed | undefined,
  fallbackAlt: string
): Array<{
  readonly thumb: string;
  readonly fullsize: string;
  readonly alt: string;
}> {
  if (!embed || typeof embed !== "object") {
    return [];
  }

  switch (embed.$type) {
    case "app.bsky.embed.images#view": {
      const images = (embed as BlueskyImagesEmbed).images;
      if (!Array.isArray(images)) {
        return [];
      }

      const result: Array<{ thumb: string; fullsize: string; alt: string }> = [];
      for (const image of images) {
        if (!image) {
          continue;
        }

        const thumb = proxyImageUrl(image.thumb) ?? proxyImageUrl(image.fullsize);
        const fullsize = proxyImageUrl(image.fullsize) ?? proxyImageUrl(image.thumb);
        if (!thumb || !fullsize) {
          continue;
        }

        const alt =
          sanitizePlainText(image.alt, 280) ??
          (fallbackAlt ? `Image from ${fallbackAlt}` : "Bluesky image");
        result.push({ thumb, fullsize, alt });
      }
      return result;
    }
    case "app.bsky.embed.recordWithMedia#view": {
      return extractImages((embed as BlueskyRecordWithMediaEmbed).media, fallbackAlt);
    }
    default:
      return [];
  }
}

function extractExternal(embed: BlueskyEmbed | undefined):
  | {
      readonly uri: string;
      readonly title: string | null;
      readonly description: string | null;
      readonly thumb: string | null;
    }
  | null {
  if (!embed || typeof embed !== "object") {
    return null;
  }

  if (embed.$type === "app.bsky.embed.external#view") {
    const external = (embed as BlueskyExternalEmbed).external;
    if (!external) {
      return null;
    }

    const uri = sanitizePlainText(external.uri, 2_048);
    if (!uri) {
      return null;
    }

    return {
      uri,
      title: sanitizePlainText(external.title, 280) ?? null,
      description: sanitizePlainText(external.description, 700) ?? null,
      thumb: proxyImageUrl(external.thumb),
    };
  }

  if (embed.$type === "app.bsky.embed.recordWithMedia#view") {
    return extractExternal((embed as BlueskyRecordWithMediaEmbed).media);
  }

  return null;
}

async function fetchBlueskyJson<T>(
  method: string,
  params: Record<string, string>,
  { allowNotFound = false }: { allowNotFound?: boolean } = {}
): Promise<T | null> {
  const url = new URL(`/xrpc/${method}`, BLUESKY_API_BASE);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), BLUESKY_TIMEOUT_MS);

  try {
    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: { accept: "application/json" },
    });

    if (!response.ok) {
      let body: unknown;
      try {
        body = await response.json();
      } catch {
        body = undefined;
      }

      if (allowNotFound && response.status === 404) {
        return null;
      }

      throw new BlueskyRequestError(
        response.status,
        `Bluesky request failed with status ${response.status}`,
        body
      );
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

function buildNormalizedUrl(identifier: string, segments: readonly string[]): string {
  const encodedIdentifier = encodeURIComponent(identifier);
  const encodedSegments = segments.map((segment) => encodeURIComponent(segment));
  const pathname = ["", "profile", encodedIdentifier, ...encodedSegments].join("/");
  const normalized = new URL("https://bsky.app/");
  normalized.pathname = pathname;
  return normalized.toString();
}

function buildUnavailableResponse(target: BlueskyTarget, reason: string): BlueskyPreviewResult {
  const canonicalUrl = target.normalizedUrl;

  return {
    ttlMs: BLUESKY_UNAVAILABLE_TTL_MS,
    data: {
      requestUrl: canonicalUrl,
      url: canonicalUrl,
      canonicalUrl,
      type: "bluesky.unavailable",
      reason,
      targetKind: target.kind,
    },
  };
}
async function resolveDid(identifier: string): Promise<string | null> {
  if (identifier.startsWith("did:")) {
    return identifier;
  }

  const resolved = await fetchBlueskyJson<ResolveHandleResponse>(
    "com.atproto.identity.resolveHandle",
    { handle: identifier },
    { allowNotFound: true }
  );

  if (!resolved?.did) {
    return null;
  }

  return resolved.did;
}
async function fetchPostPreview(target: Extract<BlueskyTarget, { kind: "post" }>): Promise<BlueskyPreviewResult> {
  const did = await resolveDid(target.identifier);
  if (!did) {
    return buildUnavailableResponse(target, "unable_to_resolve_actor");
  }

  const uri = `at://${did}/app.bsky.feed.post/${target.rkey}`;
  let thread: { thread?: ThreadViewPost | ThreadViewNotFound | ThreadViewBlocked } | null;
  try {
    thread = await fetchBlueskyJson(
      "app.bsky.feed.getPostThread",
      { uri, depth: "1" },
      { allowNotFound: false }
    );
  } catch (error) {
    if (error instanceof BlueskyRequestError && error.status === 404) {
      return buildUnavailableResponse(target, "post_not_found");
    }
    throw error;
  }

  if (!thread?.thread || thread.thread.$type !== "app.bsky.feed.defs#threadViewPost") {
    return buildUnavailableResponse(target, "post_unavailable");
  }

  const post = thread.thread.post;
  if (!post) {
    return buildUnavailableResponse(target, "post_unavailable");
  }

  const author = post.author;
  const handle = sanitizePlainText(author?.handle, 100) ?? target.identifier;
  const displayName = sanitizePlainText(author?.displayName, 160) ?? null;
  const avatar = proxyImageUrl(author?.avatar);
  const text = sanitizePlainText(post.record?.text, 1_000) ?? "";
  const createdAt = sanitizePlainText(post.record?.createdAt ?? post.indexedAt, 64) ?? null;
  const labels = extractLabels(post.labels);
  const images = extractImages(post.embed, displayName ?? handle);
  const external = extractExternal(post.embed);

  let inReplyTo: { uri: string; authorHandle?: string | null } | null = null;
  const parent = thread.thread.parent;
  if (parent && parent.$type === "app.bsky.feed.defs#threadViewPost" && parent.post) {
    const parentHandle = sanitizePlainText(parent.post.author?.handle, 100);
    const parentUri = sanitizePlainText(parent.post.uri, 2_048);
    if (parentUri) {
      inReplyTo = { uri: parentUri, authorHandle: parentHandle ?? null };
    }
  } else if (post.record?.reply?.parent?.uri) {
    const replyUri = sanitizePlainText(post.record.reply.parent.uri, 2_048);
    if (replyUri) {
      inReplyTo = { uri: replyUri, authorHandle: null };
    }
  }

  const canonicalUrl = buildNormalizedUrl(handle, ["post", target.rkey]);

  return {
    ttlMs: BLUESKY_POST_TTL_MS,
    data: {
      requestUrl: target.normalizedUrl,
      url: canonicalUrl,
      canonicalUrl,
      type: "bluesky.post",
      post: {
        uri: sanitizePlainText(post.uri, 2_048) ?? uri,
        createdAt,
        text,
        author: {
          did: sanitizePlainText(author?.did, 256) ?? did,
          handle,
          displayName,
          avatar,
        },
        counts: {
          replies: readCount(post.replyCount),
          reposts: readCount(post.repostCount),
          likes: readCount(post.likeCount),
        },
        inReplyTo,
        images,
        external,
        labels,
      },
    },
  };
}
async function fetchProfilePreview(
  target: Extract<BlueskyTarget, { kind: "profile" }>
): Promise<BlueskyPreviewResult> {
  const profile = await fetchBlueskyJson<BlueskyProfile>(
    "app.bsky.actor.getProfile",
    { actor: target.identifier },
    { allowNotFound: true }
  );

  if (!profile) {
    return buildUnavailableResponse(target, "profile_not_found");
  }

  const handle = sanitizePlainText(profile.handle, 100) ?? target.identifier;
  const canonicalUrl = buildNormalizedUrl(handle, []);

  return {
    ttlMs: BLUESKY_PROFILE_TTL_MS,
    data: {
      requestUrl: target.normalizedUrl,
      url: canonicalUrl,
      canonicalUrl,
      type: "bluesky.profile",
      profile: {
        did: sanitizePlainText(profile.did, 256) ?? null,
        handle,
        displayName: sanitizePlainText(profile.displayName, 160) ?? null,
        avatar: proxyImageUrl(profile.avatar),
        banner: proxyImageUrl(profile.banner),
        description: sanitizePlainText(profile.description, 1_000) ?? null,
        counts: {
          followers: readCount(profile.followersCount),
          follows: readCount(profile.followsCount),
          posts: readCount(profile.postsCount),
        },
      },
    },
  };
}
async function fetchFeedPreview(target: Extract<BlueskyTarget, { kind: "feed" }>): Promise<BlueskyPreviewResult> {
  const did = await resolveDid(target.identifier);
  if (!did) {
    return buildUnavailableResponse(target, "unable_to_resolve_actor");
  }

  const feedUri = `at://${did}/app.bsky.feed.generator/${target.rkey}`;
  const feed = await fetchBlueskyJson<BlueskyFeedGenerator>(
    "app.bsky.feed.getFeedGenerator",
    { feed: feedUri },
    { allowNotFound: true }
  );

  if (!feed?.view) {
    return buildUnavailableResponse(target, "feed_not_found");
  }

  const creatorHandle =
    sanitizePlainText(feed.view.creator?.handle, 100) ?? target.identifier;
  const canonicalUrl = buildNormalizedUrl(creatorHandle, ["feed", target.rkey]);

  return {
    ttlMs: BLUESKY_FEED_TTL_MS,
    data: {
      requestUrl: target.normalizedUrl,
      url: canonicalUrl,
      canonicalUrl,
      type: "bluesky.feed",
      feed: {
        uri: sanitizePlainText(feed.view.uri, 2_048) ?? feedUri,
        creator: {
          did: sanitizePlainText(feed.view.creator?.did, 256) ?? did,
          handle: creatorHandle,
          displayName: sanitizePlainText(feed.view.creator?.displayName, 160) ?? null,
          avatar: proxyImageUrl(feed.view.creator?.avatar),
        },
        displayName: sanitizePlainText(feed.view.displayName, 160) ?? null,
        description: sanitizePlainText(feed.view.description, 1_000) ?? null,
        avatar: proxyImageUrl(feed.view.avatar),
      },
    },
  };
}
export function detectBlueskyTarget(url: URL): BlueskyTarget | null {
  const host = url.hostname.toLowerCase();
  if (!BLUESKY_HOSTS.has(host)) {
    return null;
  }

  const segments = url.pathname
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (segments.length < 2 || segments[0].toLowerCase() !== "profile") {
    return null;
  }

  const identifier = decodeURIComponent(segments[1]);
  if (!identifier) {
    return null;
  }

  if (segments.length === 2) {
    return {
      kind: "profile",
      identifier,
      normalizedUrl: buildNormalizedUrl(identifier, []),
    };
  }

  if (segments.length >= 4) {
    const mode = segments[2].toLowerCase();
    const rkey = decodeURIComponent(segments[3]);
    if (!rkey) {
      return null;
    }

    if (mode === "post") {
      return {
        kind: "post",
        identifier,
        rkey,
        normalizedUrl: buildNormalizedUrl(identifier, ["post", rkey]),
      };
    }

    if (mode === "feed") {
      return {
        kind: "feed",
        identifier,
        rkey,
        normalizedUrl: buildNormalizedUrl(identifier, ["feed", rkey]),
      };
    }
  }

  return null;
}
export async function fetchBlueskyPreview(
  target: BlueskyTarget
): Promise<BlueskyPreviewResult> {
  try {
    switch (target.kind) {
      case "post":
        return await fetchPostPreview(target);
      case "profile":
        return await fetchProfilePreview(target);
      case "feed":
        return await fetchFeedPreview(target);
      default:
        return buildUnavailableResponse(target, "unsupported_target");
    }
  } catch (error) {
    if (error instanceof BlueskyRequestError) {
      return buildUnavailableResponse(target, `bluesky_error_${error.status}`);
    }
    if (error instanceof Error && error.name === "AbortError") {
      return buildUnavailableResponse(target, "bluesky_timeout");
    }
    return buildUnavailableResponse(target, "bluesky_unknown_error");
  }
}

export function containsSensitiveLabels(labels: readonly string[] | undefined): boolean {
  if (!labels) {
    return false;
  }
  return labels.some((label) => SENSITIVE_LABELS.has(label));
}


import type {
  LinkPreviewResponse,
  TruthSocialAuthor,
  TruthSocialPostData,
  TruthSocialProfileData,
  TruthSocialPostImage,
} from "@/services/api/link-preview-api";

import {
  decodeHtmlEntities,
  extractAllMetaContent,
  extractCanonicalUrl,
  extractFirstMetaContent,
  extractTitleTag,
  resolveUrl,
} from "./utils";

const TRUTH_SOCIAL_DOMAINS = new Set(["truthsocial.com", "www.truthsocial.com"]);

const DESCRIPTION_KEYS = [
  "og:description",
  "twitter:description",
  "description",
] as const;

const TITLE_KEYS = ["og:title", "twitter:title", "title"] as const;

const IMAGE_KEYS = [
  "og:image",
  "og:image:url",
  "og:image:secure_url",
  "twitter:image",
  "twitter:image:src",
  "twitter:image0",
  "twitter:image:src:0",
] as const;

const PUBLISHED_KEYS = [
  "article:published_time",
  "og:updated_time",
  "og:published_time",
] as const;

const JSON_LD_PATTERN = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

const DEFAULT_IMAGE_PROXY_BASE =
  process.env.TRUTH_SOCIAL_IMAGE_PROXY_BASE ??
  process.env.IMAGE_PROXY_BASE_URL ??
  "https://images.6529.io/open-graph";

const MAX_POST_TEXT_LENGTH = 420;
const MAX_PROFILE_BIO_LENGTH = 560;

export const TRUTH_SOCIAL_POST_CACHE_TTL_MS = 20 * 60 * 1000; // 20 minutes
export const TRUTH_SOCIAL_PROFILE_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
export const TRUTH_SOCIAL_FETCH_TIMEOUT_MS = 3_000;
export const TRUTH_SOCIAL_BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export type TruthSocialTarget =
  | {
      readonly kind: "post";
      readonly handle: string;
      readonly postId: string;
      readonly canonicalUrl: string;
      readonly cacheKey: string;
    }
  | {
      readonly kind: "profile";
      readonly handle: string;
      readonly canonicalUrl: string;
      readonly cacheKey: string;
    };

interface TruthJsonLdCommon {
  readonly authorName?: string;
  readonly authorImage?: string;
  readonly datePublished?: string;
  readonly description?: string;
  readonly headline?: string;
  readonly imageUrls: readonly string[];
  readonly banner?: string;
  readonly bio?: string;
}

interface TruthJsonLdPost extends TruthJsonLdCommon {
  readonly articleBody?: string;
}

interface TruthJsonLdProfile extends TruthJsonLdCommon {
  readonly displayName?: string;
}

type JsonLike = Record<string, unknown>;

function normalizeHostname(hostname: string): string {
  return hostname.trim().toLowerCase();
}

function decodePathSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function sanitizeHandle(raw: string): string | null {
  const withoutAt = raw.replace(/^@+/, "");
  const trimmed = withoutAt.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed;
}

function buildCacheKey(canonicalUrl: string): string {
  return `truth:${canonicalUrl}`;
}

function canonicalizeUrl(handle: string, postId?: string): string {
  const encodedHandle = encodeURIComponent(handle);
  if (postId) {
    const encodedPostId = encodeURIComponent(postId);
    return `https://truthsocial.com/@${encodedHandle}/posts/${encodedPostId}`;
  }
  return `https://truthsocial.com/@${encodedHandle}`;
}

export function detectTruthSocialTarget(url: URL): TruthSocialTarget | null {
  const host = normalizeHostname(url.hostname);
  if (!TRUTH_SOCIAL_DOMAINS.has(host)) {
    return null;
  }

  const normalizedPath = url.pathname.replace(/\/+$/, "");
  const segments = normalizedPath.split("/").filter(Boolean);
  if (segments.length === 0) {
    return null;
  }

  const first = decodePathSegment(segments[0]);
  const handle = sanitizeHandle(first);
  if (!handle) {
    return null;
  }

  if (segments.length >= 3) {
    const second = decodePathSegment(segments[1]);
    const third = decodePathSegment(segments[2]);
    if (second.toLowerCase() === "posts" && third) {
      const postId = third.split(/[?#]/)[0];
      if (postId) {
        const canonicalUrl = canonicalizeUrl(handle, postId);
        return {
          kind: "post",
          handle,
          postId,
          canonicalUrl,
          cacheKey: buildCacheKey(canonicalUrl),
        };
      }
    }
  }

  if (segments.length === 1) {
    const canonicalUrl = canonicalizeUrl(handle);
    return {
      kind: "profile",
      handle,
      canonicalUrl,
      cacheKey: buildCacheKey(canonicalUrl),
    };
  }

  return null;
}

function sanitizeText(value: string | undefined | null, maxLength: number): string | null {
  if (!value) {
    return null;
  }

  const decoded = decodeHtmlEntities(value);
  const withoutTags = decoded.replace(/<[^>]*>/g, " ");
  const normalized = withoutTags.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim();
  if (!normalized) {
    return null;
  }

  if (normalized.length > maxLength) {
    return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
  }

  return normalized;
}

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    const protocol = parsed.protocol.toLowerCase();
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

function appendQueryParameter(base: string, param: string): string {
  if (base.includes("?")) {
    const hasTrailing = base.endsWith("?") || base.endsWith("&");
    return `${base}${hasTrailing ? "" : "&"}${param}`;
  }
  return `${base}?${param}`;
}

function proxyImageUrl(source: string | undefined, baseUrl: URL): string | null {
  if (!source) {
    return null;
  }

  const resolved = resolveUrl(baseUrl, source);
  if (!resolved) {
    return null;
  }

  if (!isHttpUrl(resolved)) {
    return null;
  }

  const encoded = encodeURIComponent(resolved);
  if (DEFAULT_IMAGE_PROXY_BASE.includes("{url}")) {
    return DEFAULT_IMAGE_PROXY_BASE.replace("{url}", encoded);
  }

  return appendQueryParameter(DEFAULT_IMAGE_PROXY_BASE, `url=${encoded}`);
}

function uniqueValues(values: readonly (string | null | undefined)[]): string[] {
  const seen = new Set<string>();
  for (const value of values) {
    if (!value) {
      continue;
    }
    if (!seen.has(value)) {
      seen.add(value);
    }
  }
  return Array.from(seen);
}

function extractJsonLdObjects(html: string): JsonLike[] {
  const objects: JsonLike[] = [];
  let match: RegExpExecArray | null;

  while ((match = JSON_LD_PATTERN.exec(html))) {
    const raw = match[1]?.trim();
    if (!raw) {
      continue;
    }

    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        for (const entry of parsed) {
          if (entry && typeof entry === "object") {
            objects.push(entry as JsonLike);
          }
        }
      } else if (parsed && typeof parsed === "object") {
        objects.push(parsed as JsonLike);
      }
    } catch {
      // ignore invalid JSON-LD blocks
    }
  }

  return objects;
}

function normalizeType(value: unknown): string[] {
  if (typeof value === "string") {
    return [value.toLowerCase()];
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry) => normalizeType(entry));
  }

  return [];
}

function readString(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  return undefined;
}

function extractImageUrlsFromValue(value: unknown): string[] {
  const results: string[] = [];

  const visit = (input: unknown) => {
    if (!input) {
      return;
    }

    if (typeof input === "string") {
      const trimmed = input.trim();
      if (trimmed) {
        results.push(trimmed);
      }
      return;
    }

    if (Array.isArray(input)) {
      for (const entry of input) {
        visit(entry);
      }
      return;
    }

    if (typeof input === "object") {
      const record = input as JsonLike;
      visit(record.url);
      visit(record.secure_url);
      visit(record.secureUrl);
      visit(record.src);
      visit(record.href);
      visit(record.image);
      visit(record.contentUrl);
      visit(record.content_url);
    }
  };

  visit(value);
  return results;
}

function extractPostJsonLd(objects: readonly JsonLike[]): TruthJsonLdPost | null {
  for (const object of objects) {
    const types = normalizeType(object["@type"]);
    if (!types.some((type) => type.includes("socialmediaposting") || type.includes("note"))) {
      continue;
    }

    const author = object.author as JsonLike | undefined;
    const bannerCandidate = readString(object.video);

    return {
      imageUrls: extractImageUrlsFromValue(object.image),
      authorName: readString(author?.name) ?? readString(object.creator),
      authorImage: readString(author?.image) ?? readString(author?.icon),
      datePublished: readString(object.datePublished) ?? readString(object.dateCreated),
      description: readString(object.description),
      headline: readString(object.headline),
      articleBody: readString(object.articleBody) ?? readString(object.text),
      banner: bannerCandidate,
    };
  }

  return null;
}

function extractProfileJsonLd(objects: readonly JsonLike[]): TruthJsonLdProfile | null {
  for (const object of objects) {
    const types = normalizeType(object["@type"]);
    if (!types.some((type) => type.includes("profile") || type.includes("person"))) {
      continue;
    }

    const imageUrls = extractImageUrlsFromValue(object.image);
    const authorImage = readString(object.image);
    const description = readString(object.description);
    const bannerCandidates = extractImageUrlsFromValue(object.bannerImage);
    const bannerFromField = readString((object as JsonLike).banner);
    const banner = bannerCandidates.length > 0 ? bannerCandidates[0] : bannerFromField;
    const bio = description ?? readString(object.about);
    const displayName = readString(object.name) ?? readString(object.alternateName);

    return {
      imageUrls,
      authorImage,
      banner,
      description,
      bio,
      displayName,
    };
  }

  return null;
}

function extractMetaImages(html: string, baseUrl: URL): string[] {
  const metaImages = extractAllMetaContent(html, IMAGE_KEYS)
    .map((value) => resolveUrl(baseUrl, value))
    .filter((value): value is string => Boolean(value));

  return uniqueValues(metaImages);
}

function extractPublishedTime(html: string): string | undefined {
  for (const key of PUBLISHED_KEYS) {
    const pattern = new RegExp(
      `<meta[^>]+(?:property|name)=['"]${key}['"][^>]*content=['"]([^'"]+)['"][^>]*>`,
      "i"
    );
    const match = pattern.exec(html);
    if (match && match[1]) {
      const value = match[1].trim();
      if (value) {
        return value;
      }
    }
  }
  return undefined;
}

function normalizeDisplayName(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const suffixes = ["on truth social", "on truthsocial", "| truth social"];
  for (const suffix of suffixes) {
    if (trimmed.toLowerCase().endsWith(suffix)) {
      return trimmed.slice(0, -suffix.length).trim();
    }
  }

  return trimmed;
}

function buildTruthSocialPost(
  target: Extract<TruthSocialTarget, { kind: "post" }>,
  html: string,
  baseUrl: URL
): TruthSocialPostData {
  const jsonLdObjects = extractJsonLdObjects(html);
  const jsonLd = extractPostJsonLd(jsonLdObjects);

  const description =
    extractFirstMetaContent(html, DESCRIPTION_KEYS) ??
    jsonLd?.description ??
    jsonLd?.articleBody ??
    undefined;

  const text = sanitizeText(description, MAX_POST_TEXT_LENGTH);
  const published = jsonLd?.datePublished ?? extractPublishedTime(html);
  const headline = extractFirstMetaContent(html, TITLE_KEYS) ?? jsonLd?.headline;

  const author: TruthSocialAuthor = {
    displayName: normalizeDisplayName(jsonLd?.authorName ?? headline),
    avatar: jsonLd?.authorImage ? proxyImageUrl(jsonLd.authorImage, baseUrl) : null,
  };

  const imageCandidates = uniqueValues([
    ...extractMetaImages(html, baseUrl),
    ...(jsonLd?.imageUrls ?? []).map((image) => resolveUrl(baseUrl, image) ?? image),
  ]);

  const proxiedImages = imageCandidates
    .map((image) => proxyImageUrl(image, baseUrl))
    .filter((image): image is string => Boolean(image))
    .slice(0, 4)
    .map<TruthSocialPostImage>((url) => ({
      url,
      alt: `Image from @${target.handle}'s post`,
    }));

  return {
    handle: target.handle,
    postId: target.postId,
    author,
    createdAt: published ?? null,
    text: text ?? null,
    images: proxiedImages,
  };
}

function buildTruthSocialProfile(
  target: Extract<TruthSocialTarget, { kind: "profile" }>,
  html: string,
  baseUrl: URL
): TruthSocialProfileData {
  const jsonLdObjects = extractJsonLdObjects(html);
  const jsonLd = extractProfileJsonLd(jsonLdObjects);

  const title = extractTitleTag(html) ?? extractFirstMetaContent(html, TITLE_KEYS);
  const description =
    extractFirstMetaContent(html, DESCRIPTION_KEYS) ??
    jsonLd?.bio ??
    jsonLd?.description ??
    undefined;

  const avatarCandidates = uniqueValues([
    ...(jsonLd?.imageUrls ?? []).map((image) => resolveUrl(baseUrl, image) ?? image),
    ...extractMetaImages(html, baseUrl),
  ]);

  const avatar = avatarCandidates
    .map((image) => proxyImageUrl(image, baseUrl))
    .find((image): image is string => Boolean(image)) ?? null;

  const bannerCandidates = uniqueValues([
    jsonLd?.banner ? resolveUrl(baseUrl, jsonLd.banner) ?? jsonLd.banner : undefined,
    extractFirstMetaContent(html, ["twitter:image:src", "twitter:image"]),
  ]);

  const banner = bannerCandidates
    .map((image) => proxyImageUrl(image, baseUrl))
    .find((image): image is string => Boolean(image)) ?? null;

  const bio = sanitizeText(description, MAX_PROFILE_BIO_LENGTH);
  const displayName = normalizeDisplayName(jsonLd?.displayName ?? title);

  return {
    handle: target.handle,
    displayName: displayName ?? null,
    avatar,
    banner,
    bio: bio ?? null,
  };
}

export function buildTruthSocialResponse(
  target: TruthSocialTarget,
  html: string,
  contentType: string | null,
  requestUrl: string
): LinkPreviewResponse {
  const baseUrl = new URL(target.canonicalUrl);
  const canonicalFromHtml = extractCanonicalUrl(html, baseUrl);
  const canonicalUrl = canonicalFromHtml ?? target.canonicalUrl;

  if (target.kind === "post") {
    const post = buildTruthSocialPost(target, html, baseUrl);
    return {
      type: "truth.post",
      canonicalUrl,
      requestUrl,
      url: canonicalUrl,
      contentType,
      post,
    };
  }

  const profile = buildTruthSocialProfile(target, html, baseUrl);
  return {
    type: "truth.profile",
    canonicalUrl,
    requestUrl,
    url: canonicalUrl,
    contentType,
    profile,
  };
}

export function buildTruthSocialUnavailableResponse(
  target: TruthSocialTarget,
  requestUrl: string
): LinkPreviewResponse {
  const canonicalUrl = target.canonicalUrl;

  if (target.kind === "post") {
    const post: TruthSocialPostData = {
      handle: target.handle,
      postId: target.postId,
      author: {},
      createdAt: null,
      text: null,
      images: [],
      unavailable: true,
    };

    return {
      type: "truth.post",
      canonicalUrl,
      requestUrl,
      url: canonicalUrl,
      post,
    };
  }

  const profile: TruthSocialProfileData = {
    handle: target.handle,
    displayName: null,
    avatar: null,
    banner: null,
    bio: null,
    unavailable: true,
  };

  return {
    type: "truth.profile",
    canonicalUrl,
    requestUrl,
    url: canonicalUrl,
    profile,
  };
}

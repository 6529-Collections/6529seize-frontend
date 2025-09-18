import type { LinkPreviewResponse } from "@/services/api/link-preview-api";
import type {
  WeiboBaseResponse,
  WeiboPostResponse,
  WeiboProfileResponse,
  WeiboTopicResponse,
  WeiboUnavailableResponse,
  WeiboVerificationBadge,
} from "@/types/weibo";

const TITLE_META_KEYS = ["og:title", "twitter:title", "title"] as const;
const DESCRIPTION_META_KEYS = [
  "og:description",
  "twitter:description",
  "description",
] as const;
const IMAGE_META_KEYS = [
  "og:image:secure_url",
  "og:image",
  "og:image:url",
  "twitter:image",
  "twitter:image:src",
] as const;
const CANONICAL_META_KEYS = ["og:url"] as const;
const PUBLISHED_META_KEYS = [
  "article:published_time",
  "og:published_time",
  "weibo:created_at",
  "article:modified_time",
] as const;

const WEIBO_HOSTS = new Set([
  "weibo.com",
  "www.weibo.com",
  "m.weibo.cn",
  "weibo.cn",
  "s.weibo.com",
]);

const ALLOWED_IMAGE_SUFFIXES = ["sinaimg.cn"];

const LOGIN_WALL_MARKERS = [
  "Sina Visitor System",
  "wbBotDetector",
  "passport.sinaimg.cn/js/fp",
  "need to open the Weibo app",
];

const HTML_ENTITY_MAP: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
};

const MAX_MEDIA_ITEMS = 4;

type MaybeUrl = URL | null;

type MaybeWeiboResponse =
  | (WeiboPostResponse & LinkPreviewResponse)
  | (WeiboProfileResponse & LinkPreviewResponse)
  | (WeiboTopicResponse & LinkPreviewResponse)
  | (WeiboUnavailableResponse & LinkPreviewResponse);

export interface BuildWeiboResponseParams {
  readonly originalUrl: URL;
  readonly finalUrl: string;
  readonly html: string;
  readonly contentType: string | null;
}

interface NormalizedWeiboResource {
  readonly type: "post" | "profile" | "topic";
  readonly canonicalUrl: string;
  readonly uid: string | null;
  readonly mid: string | null;
  readonly topicId: string | null;
  readonly keyword: string | null;
}

function decodeHtmlEntities(value: string): string {
  return value.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (_, entity: string) => {
    if (entity.startsWith("#x") || entity.startsWith("#X")) {
      const codePoint = Number.parseInt(entity.slice(2), 16);
      return Number.isNaN(codePoint) ? "" : String.fromCodePoint(codePoint);
    }
    if (entity.startsWith("#")) {
      const codePoint = Number.parseInt(entity.slice(1), 10);
      return Number.isNaN(codePoint) ? "" : String.fromCodePoint(codePoint);
    }
    return HTML_ENTITY_MAP[entity] ?? "";
  });
}

function sanitizeText(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const decoded = decodeHtmlEntities(value);
  const withoutTags = decoded.replace(/<[^>]+>/g, " ");
  const normalized = withoutTags.replace(/\s+/g, " ").trim();
  return normalized.length > 0 ? normalized : null;
}

function decodeKeyword(value: string | null): string | null {
  if (!value) {
    return null;
  }

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractMetaContent(
  html: string,
  keys: readonly string[],
  multiple = false
): string | undefined | string[] {
  const results = new Set<string>();

  for (const key of keys) {
    const pattern = new RegExp(
      `<meta[^>]+(?:property|name)=["']${key.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}["'][^>]*content=["']([^"']+)["'][^>]*>`,
      multiple ? "gi" : "i"
    );

    if (multiple) {
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(html))) {
        if (match[1]) {
          results.add(decodeHtmlEntities(match[1].trim()));
        }
      }
    } else {
      const match = pattern.exec(html);
      if (match && match[1]) {
        return decodeHtmlEntities(match[1].trim());
      }
    }
  }

  if (multiple) {
    return Array.from(results);
  }

  return undefined;
}

function resolveUrl(base: MaybeUrl, value: string | undefined): string | undefined {
  if (!base || !value) {
    return undefined;
  }

  try {
    return new URL(value, base).toString();
  } catch {
    return undefined;
  }
}

function safeParseUrl(input: string): MaybeUrl {
  try {
    return new URL(input);
  } catch {
    return null;
  }
}

function normalizeHost(hostname: string): string {
  return hostname.replace(/^www\./i, "").toLowerCase();
}

function cleanSearchParams(url: URL, keepKeys: readonly string[] = []): URL {
  if (url.searchParams.size === 0) {
    return url;
  }

  const next = new URL(url.toString());
  const keep = new Set(keepKeys.map((key) => key.toLowerCase()));

  for (const key of Array.from(next.searchParams.keys())) {
    if (!keep.has(key.toLowerCase())) {
      next.searchParams.delete(key);
    }
  }

  return next;
}

function normalizeWeiboResource(url: URL): NormalizedWeiboResource | null {
  const hostname = normalizeHost(url.hostname);
  const pathSegments = url.pathname.split("/").filter(Boolean);
  const protocol = url.protocol === "http:" ? "https:" : url.protocol;

  if (hostname === "s.weibo.com" && pathSegments[0] === "weibo") {
    const keyword = url.searchParams.get("q");
    const canonical = cleanSearchParams(
      new URL(`${protocol}//${hostname}/${pathSegments.join("/")}`),
      keyword ? ["q"] : []
    );

    if (keyword) {
      canonical.searchParams.set("q", keyword);
    }

    return {
      type: "topic",
      canonicalUrl: canonical.toString(),
      uid: null,
      mid: null,
      topicId: null,
      keyword,
    };
  }

  if (hostname === "m.weibo.cn") {
    if (pathSegments[0] === "status" || pathSegments[0] === "detail") {
      const mid = pathSegments[1] ?? null;
      if (!mid) {
        return null;
      }

      const canonical = new URL(`${protocol}//m.weibo.cn/status/${mid}`);
      return {
        type: "post",
        canonicalUrl: canonical.toString(),
        uid: null,
        mid,
        topicId: null,
        keyword: null,
      };
    }

    if (pathSegments[0] === "profile" || pathSegments[0] === "u") {
      const uid = pathSegments[1] ?? null;
      if (!uid) {
        return null;
      }

      const canonical = new URL(`${protocol}//m.weibo.cn/profile/${uid}`);
      return {
        type: "profile",
        canonicalUrl: canonical.toString(),
        uid,
        mid: null,
        topicId: null,
        keyword: null,
      };
    }
  }

  if (hostname === "weibo.com" || hostname === "weibo.cn") {
    if (pathSegments.length >= 2 && /^(?:u|n)$/.test(pathSegments[0])) {
      const uid = pathSegments[1];
      if (!uid) {
        return null;
      }
      const canonical = cleanSearchParams(
        new URL(`${protocol}//weibo.com/u/${uid}`)
      );

      return {
        type: "profile",
        canonicalUrl: canonical.toString(),
        uid,
        mid: null,
        topicId: null,
        keyword: null,
      };
    }

    if (pathSegments.length >= 2 && /^(\d+)$/.test(pathSegments[0])) {
      const uid = pathSegments[0];
      const mid = pathSegments[1];
      const canonical = cleanSearchParams(
        new URL(`${protocol}//weibo.com/${uid}/${mid}`)
      );
      return {
        type: "post",
        canonicalUrl: canonical.toString(),
        uid,
        mid,
        topicId: null,
        keyword: null,
      };
    }

    if (pathSegments.length === 1 && /^(\d+)$/.test(pathSegments[0])) {
      const uid = pathSegments[0];
      const canonical = cleanSearchParams(
        new URL(`${protocol}//weibo.com/${uid}`)
      );
      return {
        type: "profile",
        canonicalUrl: canonical.toString(),
        uid,
        mid: null,
        topicId: null,
        keyword: null,
      };
    }

    if (pathSegments.length >= 2 && pathSegments[0] === "p") {
      const topicSegment = pathSegments[1];
      if (topicSegment && topicSegment.startsWith("100808")) {
        const canonical = cleanSearchParams(
          new URL(`${protocol}//weibo.com/p/${topicSegment}`)
        );
        return {
          type: "topic",
          canonicalUrl: canonical.toString(),
          uid: null,
          mid: null,
          topicId: topicSegment.slice("100808".length) || topicSegment,
          keyword: null,
        };
      }
    }
  }

  return null;
}

function detectLoginWall(html: string): boolean {
  const normalized = html.slice(0, 4096);
  return LOGIN_WALL_MARKERS.some((marker) =>
    normalized.toLowerCase().includes(marker.toLowerCase())
  );
}

function extractJsonString(html: string, key: string): string | undefined {
  const escapedKey = escapeRegExp(key);
  const pattern = new RegExp(
    String.raw`"${escapedKey}"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"`,
    "i"
  );
  const match = pattern.exec(html);
  if (!match) {
    return undefined;
  }

  const raw = match[1];
  try {
    return JSON.parse(`"${raw}"`);
  } catch {
    return raw.replace(/\\"/g, '"').replace(/\\n/g, "\n");
  }
}

function parseVerificationBadge(raw: string | undefined): WeiboVerificationBadge {
  if (!raw) {
    return "none";
  }

  if (/enterprise|org|公司|企业/i.test(raw)) {
    return "enterprise";
  }

  if (/yellow|微特权|自媒体/i.test(raw)) {
    return "yellow";
  }

  if (/blue|官方|认证/i.test(raw)) {
    return "blue";
  }

  return "none";
}

function extractAuthorDisplayName(
  title: string | null | undefined
): string | null {
  if (!title) {
    return null;
  }

  const patterns = [
    /^(.*?)的微博/, // Chinese "'s Weibo"
    /^(.*?)·微博正文/,
    /^(.*?)在微博发布/,
    /^(.*?) on Weibo/i,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(title);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return title.trim() || null;
}

function shouldProxyImage(url: string | undefined): url is string {
  if (!url) {
    return false;
  }

  const parsed = safeParseUrl(url);
  if (!parsed) {
    return false;
  }

  const hostname = normalizeHost(parsed.hostname);
  return ALLOWED_IMAGE_SUFFIXES.some((suffix) => hostname.endsWith(suffix));
}

function proxyImageUrl(url: string | undefined): string | undefined {
  if (!shouldProxyImage(url)) {
    return undefined;
  }

  return `/api/open-graph/proxy-image?url=${encodeURIComponent(url)}`;
}

function buildPostResponse(
  base: WeiboBaseResponse,
  resource: NormalizedWeiboResource,
  html: string,
  metaTitle: string | null,
  metaDescription: string | null,
  metaCanonical: string | null,
  baseUrl: MaybeUrl,
  contentType: string | null
): MaybeWeiboResponse {
  const textRaw =
    sanitizeText(extractJsonString(html, "text_raw")) ??
    sanitizeText(metaDescription);
  const createdAtRaw =
    extractJsonString(html, "created_at") ??
    (extractMetaContent(html, PUBLISHED_META_KEYS) as string | undefined);
  const createdAt = createdAtRaw ? new Date(createdAtRaw) : null;
  const authorAvatar = proxyImageUrl(
    resolveUrl(baseUrl, extractJsonString(html, "profile_image_url"))
  );
  const authorName =
    sanitizeText(extractJsonString(html, "screen_name")) ??
    extractAuthorDisplayName(metaTitle);
  const verificationRaw = extractJsonString(html, "verified_reason");
  const proxiedImages = (extractMetaContent(
    html,
    IMAGE_META_KEYS,
    true
  ) as string[] | undefined)
    ?.map((src) => resolveUrl(baseUrl, src))
    .filter(Boolean)
    .map((src) => proxyImageUrl(src as string))
    .filter(Boolean)
    .slice(0, MAX_MEDIA_ITEMS) as string[] | undefined;

  const videoThumbnail = proxyImageUrl(
    resolveUrl(baseUrl, extractJsonString(html, "video_cover")) ??
      resolveUrl(baseUrl, extractJsonString(html, "page_pic"))
  );

  const canonicalUrl =
    metaCanonical ?? resource.canonicalUrl ?? base.canonicalUrl;

  const post: WeiboPostResponse["post"] = {
    uid: resource.uid,
    mid: resource.mid,
    author: {
      displayName: authorName,
      avatar: authorAvatar ?? null,
      verified: parseVerificationBadge(verificationRaw),
    },
    createdAt:
      createdAt && !Number.isNaN(createdAt.getTime())
        ? createdAt.toISOString()
        : null,
    text: textRaw ?? metaDescription ?? "",
    images: proxiedImages?.map((url) => ({
      url,
      alt: authorName ? `Image from Weibo post by ${authorName}` : "Image from Weibo post",
    })),
    video: {
      thumbnail: videoThumbnail ?? null,
    },
  };

  return {
    ...base,
    type: "weibo.post",
    canonicalUrl,
    post,
    contentType,
  };
}

function buildProfileResponse(
  base: WeiboBaseResponse,
  resource: NormalizedWeiboResource,
  html: string,
  metaTitle: string | null,
  metaDescription: string | null,
  metaCanonical: string | null,
  baseUrl: MaybeUrl,
  contentType: string | null
): MaybeWeiboResponse {
  const displayName =
    sanitizeText(extractJsonString(html, "screen_name")) ??
    sanitizeText(metaTitle);
  const avatar = proxyImageUrl(
    resolveUrl(baseUrl, extractJsonString(html, "profile_image_url")) ??
      resolveUrl(baseUrl, extractMetaContent(html, IMAGE_META_KEYS) as string | undefined)
  );
  const banner = proxyImageUrl(
    resolveUrl(baseUrl, extractJsonString(html, "cover_image_phone"))
  );
  const verificationRaw = extractJsonString(html, "verified_reason");
  const canonicalUrl =
    metaCanonical ?? resource.canonicalUrl ?? base.canonicalUrl;

  const profile: WeiboProfileResponse["profile"] = {
    uid: resource.uid,
    displayName,
    avatar: avatar ?? null,
    banner: banner ?? null,
    bio:
      sanitizeText(extractJsonString(html, "description")) ??
      sanitizeText(metaDescription),
    verified: parseVerificationBadge(verificationRaw),
  };

  return {
    ...base,
    type: "weibo.profile",
    canonicalUrl,
    profile,
    contentType,
  };
}

function buildTopicResponse(
  base: WeiboBaseResponse,
  resource: NormalizedWeiboResource,
  html: string,
  metaTitle: string | null,
  metaDescription: string | null,
  metaCanonical: string | null,
  baseUrl: MaybeUrl,
  contentType: string | null
): MaybeWeiboResponse {
  const title =
    sanitizeText(extractJsonString(html, "title_top")) ??
    sanitizeText(metaTitle) ??
    decodeKeyword(resource.keyword);
  const cover = proxyImageUrl(
    resolveUrl(baseUrl, extractJsonString(html, "pic")) ??
      resolveUrl(baseUrl, extractMetaContent(html, IMAGE_META_KEYS) as string | undefined)
  );
  const description =
    sanitizeText(extractJsonString(html, "desc")) ??
    sanitizeText(metaDescription);
  const canonicalUrl =
    metaCanonical ?? resource.canonicalUrl ?? base.canonicalUrl;

  const topic: WeiboTopicResponse["topic"] = {
    title,
    cover: cover ?? null,
    description,
  };

  return {
    ...base,
    type: "weibo.topic",
    canonicalUrl,
    topic,
    contentType,
  };
}

function buildUnavailableResponse(
  base: WeiboBaseResponse,
  resource: NormalizedWeiboResource,
  reason: WeiboUnavailableResponse["reason"],
  contentType: string | null
): MaybeWeiboResponse {
  return {
    ...base,
    type: "weibo.unavailable",
    canonicalUrl: resource.canonicalUrl ?? base.canonicalUrl,
    reason,
    contentType,
  };
}

function createBaseResponse(
  params: BuildWeiboResponseParams,
  resource: NormalizedWeiboResource
): WeiboBaseResponse & LinkPreviewResponse {
  return {
    requestUrl: params.originalUrl.toString(),
    url: resource.canonicalUrl,
    canonicalUrl: resource.canonicalUrl,
  };
}

export function buildWeiboResponse(
  params: BuildWeiboResponseParams
): LinkPreviewResponse | null {
  const finalUrl = safeParseUrl(params.finalUrl) ?? params.originalUrl;
  const finalHost = normalizeHost(finalUrl.hostname);

  if (!WEIBO_HOSTS.has(finalHost)) {
    const originalHost = normalizeHost(params.originalUrl.hostname);
    if (!WEIBO_HOSTS.has(originalHost)) {
      return null;
    }
  }

  const resource =
    normalizeWeiboResource(finalUrl) ??
    normalizeWeiboResource(params.originalUrl);

  if (!resource) {
    return null;
  }

  if (detectLoginWall(params.html)) {
    return buildUnavailableResponse(
      createBaseResponse(params, resource),
      resource,
      "login_required",
      params.contentType
    );
  }

  const metaTitle = sanitizeText(
    extractMetaContent(params.html, TITLE_META_KEYS) as string | undefined
  );
  const metaDescription = sanitizeText(
    extractMetaContent(params.html, DESCRIPTION_META_KEYS) as string | undefined
  );
  const metaCanonical = (extractMetaContent(
    params.html,
    CANONICAL_META_KEYS
  ) as string | undefined) ?? null;

  const baseUrl = safeParseUrl(metaCanonical ?? resource.canonicalUrl);
  const baseResponse = createBaseResponse(params, resource);

  switch (resource.type) {
    case "post":
      return (
        buildPostResponse(
          baseResponse,
          resource,
          params.html,
          metaTitle,
          metaDescription,
          metaCanonical,
          baseUrl,
          params.contentType
        ) ??
        buildUnavailableResponse(
          baseResponse,
          resource,
          "error",
          params.contentType
        )
      );
    case "profile":
      return (
        buildProfileResponse(
          baseResponse,
          resource,
          params.html,
          metaTitle,
          metaDescription,
          metaCanonical,
          baseUrl,
          params.contentType
        ) ??
        buildUnavailableResponse(
          baseResponse,
          resource,
          "error",
          params.contentType
        )
      );
    case "topic":
      return (
        buildTopicResponse(
          baseResponse,
          resource,
          params.html,
          metaTitle,
          metaDescription,
          metaCanonical,
          baseUrl,
          params.contentType
        ) ??
        buildUnavailableResponse(
          baseResponse,
          resource,
          "error",
          params.contentType
        )
      );
    default:
      return null;
  }
}

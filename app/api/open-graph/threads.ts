import type { LinkPreviewResponse } from "@/services/api/link-preview-api";

const THREADS_DOMAINS = new Set([
  "threads.net",
  "www.threads.net",
  "threads.com",
  "www.threads.com",
]);

const TRACKING_PARAM_PREFIXES = [
  "utm_",
  "ref_",
  "igshid",
  "fbclid",
  "gclid",
  "referrer",
  "refsrc",
  "ref_url",
];

const THREADS_USER_AGENT =
  "6529seize-threads-card/1.0 (+https://6529.io; Threads preview fetcher)";

const IMAGE_META_KEYS = [
  "og:image",
  "og:image:url",
  "og:image:secure_url",
  "twitter:image",
  "twitter:image:src",
];

const TITLE_META_KEYS = ["og:title", "twitter:title", "title"] as const;
const DESCRIPTION_META_KEYS = [
  "og:description",
  "twitter:description",
  "description",
] as const;
const URL_META_KEYS = ["og:url", "twitter:url"] as const;
const SITE_NAME_KEYS = ["og:site_name", "application-title", "application-name"] as const;

const HTML_ENTITY_REGEX = /&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g;

const IMAGE_PROTOCOL_WHITELIST = new Set(["http:", "https:"]);

export type ThreadsUnavailableReason =
  | "login_required"
  | "removed"
  | "rate_limited"
  | "error";

type ThreadsTarget =
  | {
      readonly type: "post";
      readonly handle: string;
      readonly postId: string;
    }
  | {
      readonly type: "profile";
      readonly handle: string;
    };

type ThreadsMeta = {
  readonly title?: string;
  readonly description?: string;
  readonly siteName?: string;
  readonly url?: string;
  readonly images: readonly string[];
};

type ThreadsOEmbedResponse = {
  readonly author_name?: string;
  readonly author_url?: string;
  readonly provider_name?: string;
  readonly thumbnail_url?: string;
  readonly title?: string;
  readonly html?: string;
  readonly width?: number;
  readonly height?: number;
};

type ThreadsOEmbedResult =
  | { readonly kind: "success"; readonly data: ThreadsOEmbedResponse }
  | { readonly kind: "unavailable"; readonly reason: ThreadsUnavailableReason }
  | { readonly kind: "skip" };

type ThreadsPreviewContext = {
  readonly originalUrl: URL;
  readonly finalUrl: URL;
  readonly html: string;
  readonly contentType: string | null;
};

type ThreadsPostPreview = LinkPreviewResponse & {
  readonly type: "threads.post";
  readonly canonicalUrl: string;
  readonly post: {
    readonly handle: string;
    readonly postId: string;
    readonly author: {
      readonly displayName: string | null;
      readonly profileUrl: string;
      readonly avatar: string | null;
    };
    readonly createdAt: string | null;
    readonly text: string | null;
    readonly images: ReadonlyArray<{ readonly url: string; readonly alt: string }>;
  };
};

type ThreadsProfilePreview = LinkPreviewResponse & {
  readonly type: "threads.profile";
  readonly canonicalUrl: string;
  readonly profile: {
    readonly handle: string;
    readonly displayName: string | null;
    readonly avatar: string | null;
    readonly banner: string | null;
    readonly bio: string | null;
  };
};

type ThreadsUnavailablePreview = LinkPreviewResponse & {
  readonly type: "threads.unavailable";
  readonly canonicalUrl: string;
  readonly reason: ThreadsUnavailableReason;
};

export type ThreadsPreviewResult =
  | ThreadsPostPreview
  | ThreadsProfilePreview
  | ThreadsUnavailablePreview;

const ESCAPE_HTML_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
};

function decodeHtmlEntities(value: string): string {
  return value.replace(HTML_ENTITY_REGEX, (_, entity: string) => {
    if (entity.startsWith("#x") || entity.startsWith("#X")) {
      const codePoint = parseInt(entity.slice(2), 16);
      return Number.isNaN(codePoint) ? "" : String.fromCodePoint(codePoint);
    }

    if (entity.startsWith("#")) {
      const codePoint = parseInt(entity.slice(1), 10);
      return Number.isNaN(codePoint) ? "" : String.fromCodePoint(codePoint);
    }

    return ESCAPE_HTML_ENTITIES[entity] ?? "";
  });
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, "");
}

function sanitizeText(value: string | undefined, maxLength = 500): string | null {
  if (!value) {
    return null;
  }

  const withoutHtml = stripHtml(decodeHtmlEntities(value));
  const normalized = withoutHtml.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return null;
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

function sanitizeHandle(value: string): string {
  return decodeURIComponent(value);
}

function sanitizePostId(value: string): string {
  return decodeURIComponent(value);
}

function isThreadsDomain(hostname: string): boolean {
  const lowerHost = hostname.toLowerCase();
  return THREADS_DOMAINS.has(lowerHost);
}

function cleanSearchParams(url: URL): void {
  const params = url.searchParams;
  const keys = Array.from(params.keys());

  for (const key of keys) {
    const lowerKey = key.toLowerCase();
    if (TRACKING_PARAM_PREFIXES.some((prefix) => lowerKey.startsWith(prefix))) {
      params.delete(key);
    }
  }

  url.search = params.toString();
}

function normalizeThreadsHost(hostname: string): string {
  const trimmed = hostname.replace(/^www\./i, "").toLowerCase();

  if (trimmed.endsWith("threads.net")) {
    return "threads.com";
  }

  return trimmed;
}

function buildCanonicalUrl(target: ThreadsTarget): string {
  const handleSegment = `@${encodeURIComponent(target.handle)}`;
  if (target.type === "post") {
    return `https://threads.com/${handleSegment}/post/${encodeURIComponent(target.postId)}`;
  }

  return `https://threads.com/${handleSegment}`;
}

function resolveUrl(base: URL, value: string): string | null {
  try {
    const resolved = new URL(value, base);
    if (!IMAGE_PROTOCOL_WHITELIST.has(resolved.protocol)) {
      return null;
    }
    resolved.hash = "";
    return resolved.toString();
  } catch {
    return null;
  }
}

function extractMetaContent(html: string, keys: readonly string[]): string | undefined {
  for (const key of keys) {
    const pattern = new RegExp(
      `<meta[^>]+(?:property|name)=[\"']${key.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}[\"'][^>]*content=[\"']([^\"']+)[\"'][^>]*>`,
      "i",
    );
    const match = pattern.exec(html);
    if (match && match[1]) {
      return decodeHtmlEntities(match[1].trim());
    }
  }

  return undefined;
}

function extractAllMetaContent(html: string, keys: readonly string[]): string[] {
  const urls = new Set<string>();

  for (const key of keys) {
    const pattern = new RegExp(
      `<meta[^>]+(?:property|name)=[\"']${key.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}[\"'][^>]*content=[\"']([^\"']+)[\"'][^>]*>`,
      "gi",
    );

    let match: RegExpExecArray | null;

    while ((match = pattern.exec(html))) {
      if (match[1]) {
        urls.add(decodeHtmlEntities(match[1].trim()));
      }
    }
  }

  return Array.from(urls);
}

function parseThreadsTarget(url: URL): ThreadsTarget | null {
  const host = normalizeThreadsHost(url.hostname);
  if (!host.endsWith("threads.com")) {
    return null;
  }

  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length === 0) {
    return null;
  }

  const [first, second, third] = segments;
  if (!first.startsWith("@")) {
    return null;
  }

  const handle = sanitizeHandle(first.slice(1));
  if (!handle) {
    return null;
  }

  if (second && second.toLowerCase() === "post" && third) {
    const postId = sanitizePostId(third);
    if (!postId) {
      return null;
    }
    return { type: "post", handle, postId };
  }

  if (segments.length === 1) {
    return { type: "profile", handle };
  }

  return null;
}

function extractMeta(html: string, baseUrl: URL): ThreadsMeta {
  const images = extractAllMetaContent(html, IMAGE_META_KEYS)
    .map((src) => resolveUrl(baseUrl, src))
    .filter((src): src is string => Boolean(src));

  return {
    title: extractMetaContent(html, TITLE_META_KEYS),
    description: extractMetaContent(html, DESCRIPTION_META_KEYS),
    siteName: extractMetaContent(html, SITE_NAME_KEYS),
    url: extractMetaContent(html, URL_META_KEYS),
    images,
  };
}

function isLoginWallMeta(meta: ThreadsMeta): boolean {
  const title = meta.title?.toLowerCase() ?? "";
  const description = meta.description?.toLowerCase() ?? "";
  const url = meta.url?.toLowerCase() ?? "";

  if (title.includes("log in") || title.includes("log into")) {
    return true;
  }

  if (description.includes("log in") || description.includes("log into")) {
    return true;
  }

  if (url && !url.includes("/@")) {
    if (url.endsWith("threads.com/") || url.endsWith("threads.net/")) {
      return true;
    }
    if (url.includes("login")) {
      return true;
    }
  }

  return false;
}

function extractDisplayName(
  candidate: string | undefined,
  handle: string,
  fallback?: string,
): string | null {
  const sanitized = sanitizeText(candidate ?? fallback ?? undefined, 150);
  if (!sanitized) {
    return null;
  }

  const handlePattern = new RegExp(`\\(@${handle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\)`, "i");
  const match = sanitized.match(handlePattern);

  if (match && typeof match.index === "number") {
    return sanitized.slice(0, match.index).replace(/[•\s]+$/g, "").trim() || null;
  }

  const bulletIndex = sanitized.indexOf("•");
  if (bulletIndex > 0) {
    return sanitized.slice(0, bulletIndex).trim() || null;
  }

  return sanitized;
}

function pickAvatar(meta: ThreadsMeta, oembed?: ThreadsOEmbedResponse): string | null {
  const firstImage = meta.images[0];
  if (firstImage) {
    return firstImage;
  }

  if (oembed?.thumbnail_url) {
    return oembed.thumbnail_url;
  }

  return null;
}

function buildPostImages(
  meta: ThreadsMeta,
  handle: string,
  oembed?: ThreadsOEmbedResponse,
): ReadonlyArray<{ readonly url: string; readonly alt: string }> {
  const imageSet = new Set<string>();

  if (oembed?.thumbnail_url) {
    const normalized = resolveUrl(new URL("https://threads.com"), oembed.thumbnail_url) ?? oembed.thumbnail_url;
    imageSet.add(normalized);
  }

  for (const url of meta.images.slice(1)) {
    imageSet.add(url);
  }

  const images = Array.from(imageSet).slice(0, 4);
  const alt = `Image from @${handle}'s Threads post`;
  return images.map((url) => ({ url, alt }));
}

function buildPostPreview(
  context: ThreadsPreviewContext,
  target: Extract<ThreadsTarget, { type: "post" }>,
  meta: ThreadsMeta,
  oembed?: ThreadsOEmbedResponse,
): ThreadsPostPreview {
  const canonicalUrl = buildCanonicalUrl(target);
  const authorProfileUrl = `https://threads.com/@${encodeURIComponent(target.handle)}`;

  const postText = sanitizeText(oembed?.title ?? meta.description);
  const authorDisplayName =
    extractDisplayName(oembed?.author_name, target.handle, meta.title) ?? null;
  const avatar = pickAvatar(meta, oembed);
  const images = buildPostImages(meta, target.handle, oembed);

  return {
    type: "threads.post",
    canonicalUrl,
    requestUrl: context.originalUrl.toString(),
    url: canonicalUrl,
    siteName: meta.siteName ?? "Threads",
    title: meta.title ?? null,
    description: postText,
    image: images[0] ? { url: images[0].url, secureUrl: images[0].url } : null,
    images: images.map((image) => ({ url: image.url, secureUrl: image.url })),
    favicons: [],
    mediaType: "article",
    contentType: context.contentType,
    favicon: null,
    post: {
      handle: target.handle,
      postId: target.postId,
      author: {
        displayName: authorDisplayName,
        profileUrl: authorProfileUrl,
        avatar: avatar ?? null,
      },
      createdAt: null,
      text: postText,
      images,
    },
  };
}

function buildProfilePreview(
  context: ThreadsPreviewContext,
  target: Extract<ThreadsTarget, { type: "profile" }>,
  meta: ThreadsMeta,
): ThreadsProfilePreview {
  const canonicalUrl = buildCanonicalUrl(target);

  return {
    type: "threads.profile",
    canonicalUrl,
    requestUrl: context.originalUrl.toString(),
    url: canonicalUrl,
    siteName: meta.siteName ?? "Threads",
    title: meta.title ?? null,
    description: meta.description ?? null,
    image: meta.images[0] ? { url: meta.images[0], secureUrl: meta.images[0] } : null,
    images: meta.images.map((url) => ({ url, secureUrl: url })),
    favicons: [],
    mediaType: "profile",
    contentType: context.contentType,
    favicon: null,
    profile: {
      handle: target.handle,
      displayName: extractDisplayName(meta.title, target.handle),
      avatar: meta.images[0] ?? null,
      banner: meta.images[1] ?? null,
      bio: sanitizeText(meta.description),
    },
  };
}

function buildUnavailablePreview(
  context: ThreadsPreviewContext,
  target: ThreadsTarget,
  reason: ThreadsUnavailableReason,
): ThreadsUnavailablePreview {
  const canonicalUrl = buildCanonicalUrl(target);

  return {
    type: "threads.unavailable",
    canonicalUrl,
    requestUrl: context.originalUrl.toString(),
    url: canonicalUrl,
    siteName: "Threads",
    title: null,
    description: null,
    image: null,
    images: [],
    favicons: [],
    mediaType: null,
    contentType: context.contentType,
    favicon: null,
    reason,
  };
}

function mapStatusToReason(status: number): ThreadsUnavailableReason {
  if (status === 401 || status === 403) {
    return "login_required";
  }
  if (status === 404) {
    return "removed";
  }
  if (status === 429) {
    return "rate_limited";
  }
  if (status >= 400 && status < 500) {
    return "error";
  }
  return "error";
}

async function fetchThreadsOEmbed(url: string): Promise<ThreadsOEmbedResult> {
  const token = process.env.THREADS_OEMBED_TOKEN;
  if (!token) {
    return { kind: "skip" };
  }

  const version = (process.env.THREADS_OEMBED_VERSION ?? "v17.0").trim();
  const endpoint = `https://graph.facebook.com/${version}/oembed_threads`;
  const params = new URLSearchParams({ url });
  params.set("access_token", token);
  const requestUrl = `${endpoint}?${params.toString()}`;

  try {
    const response = await fetch(requestUrl, {
      headers: { "user-agent": THREADS_USER_AGENT },
    });

    if (!response.ok) {
      const reason = mapStatusToReason(response.status);
      return { kind: "unavailable", reason };
    }

    const data = (await response.json()) as ThreadsOEmbedResponse;
    return { kind: "success", data };
  } catch {
    return { kind: "skip" };
  }
}

export async function getThreadsPreview(
  context: ThreadsPreviewContext,
): Promise<ThreadsPreviewResult | null> {
  if (!isThreadsDomain(context.finalUrl.hostname)) {
    return null;
  }

  const normalizedUrl = new URL(context.finalUrl.toString());
  normalizedUrl.hostname = normalizeThreadsHost(normalizedUrl.hostname);
  cleanSearchParams(normalizedUrl);
  normalizedUrl.hash = "";

  const target = parseThreadsTarget(normalizedUrl);
  if (!target) {
    return null;
  }

  const meta = extractMeta(context.html, normalizedUrl);

  if (isLoginWallMeta(meta)) {
    return buildUnavailablePreview(context, target, "login_required");
  }

  if (target.type === "post") {
    const oembed = await fetchThreadsOEmbed(buildCanonicalUrl(target));

    if (oembed.kind === "unavailable") {
      return buildUnavailablePreview(context, target, oembed.reason);
    }

    return buildPostPreview(context, target, meta, oembed.kind === "success" ? oembed.data : undefined);
  }

  return buildProfilePreview(context, target, meta);
}

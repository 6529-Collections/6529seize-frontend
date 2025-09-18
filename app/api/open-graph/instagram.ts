import type {
  InstagramPreviewResponse,
  InstagramPreviewStatus,
  InstagramResourceKind,
  LinkPreviewResponse,
} from "@/services/api/link-preview-api";

const INSTAGRAM_HOSTS = new Set([
  "instagram.com",
  "m.instagram.com",
  "www.instagram.com",
]);

const PASS_THROUGH_HOSTS = new Set(["l.instagram.com"]);

const DISALLOWED_PROFILE_SEGMENTS = new Set([
  "accounts",
  "explore",
  "reels",
  "directory",
  "tagged",
  "stories",
]);

const IMAGE_HOST_ALLOW_LIST = [
  /(?:^|\.)cdninstagram\.com$/i,
  /(?:^|\.)fbcdn\.net$/i,
  /(?:^|\.)instagram\.com$/i,
];

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const STALE_RETRY_MS = 5 * 60 * 1000;

interface NormalizedInstagramUrl {
  readonly canonicalUrl: string;
  readonly resource: InstagramResourceKind;
  readonly status: InstagramPreviewStatus;
  readonly username?: string | null;
}

interface InstagramHandlerResult {
  readonly status: number;
  readonly body: LinkPreviewResponse;
}

interface InstagramCacheEntry extends InstagramHandlerResult {
  expiresAt: number;
  ongoing?: Promise<InstagramHandlerResult>;
}

const instagramCache = new Map<string, InstagramCacheEntry>();

const CONTROL_CHARS_REGEXP = /[\u0000-\u001f\u007f]+/g;

const decodePassThroughTarget = (value: string): string => {
  let decoded = value.trim();
  if (!decoded) {
    return decoded;
  }

  for (let i = 0; i < 3; i += 1) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) {
        break;
      }
      decoded = next;
    } catch {
      break;
    }
  }

  return decoded;
};

const stripTrackingParameters = (url: URL): void => {
  const toDelete: string[] = [];
  url.searchParams.forEach((_, key) => {
    const lower = key.toLowerCase();
    if (
      lower.startsWith("utm_") ||
      lower === "igshid" ||
      lower === "__a" ||
      lower === "__d" ||
      lower === "fbclid"
    ) {
      toDelete.push(key);
    }
  });

  for (const key of toDelete) {
    url.searchParams.delete(key);
  }
};

const normalizeInstagramUrl = (
  initialUrl: URL,
  depth = 0
): NormalizedInstagramUrl | null => {
  if (depth > 3) {
    return null;
  }

  const host = initialUrl.hostname.replace(/^www\./i, "").toLowerCase();

  if (PASS_THROUGH_HOSTS.has(host)) {
    const param =
      initialUrl.searchParams.get("u") ?? initialUrl.searchParams.get("url");
    if (!param) {
      return null;
    }

    const decoded = decodePassThroughTarget(param);
    try {
      const resolved = new URL(decoded);
      return normalizeInstagramUrl(resolved, depth + 1);
    } catch {
      return null;
    }
  }

  if (!INSTAGRAM_HOSTS.has(host)) {
    return null;
  }

  const url = new URL(initialUrl.toString());
  url.hash = "";
  stripTrackingParameters(url);

  const pathname = url.pathname.replace(/\/+/g, "/");
  const trimmedPath = pathname.endsWith("/") ? pathname : `${pathname}/`;
  const segments = trimmedPath
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (segments.length === 0) {
    return null;
  }

  const [first, second, third] = segments;

  if (first === "stories" && second === "highlights" && third) {
    const canonicalUrl = `https://instagram.com/stories/highlights/${third}/`;
    return {
      canonicalUrl,
      resource: "highlight",
      status: "protected",
      username: null,
    };
  }

  if (first === "stories" && second && third) {
    const canonicalUrl = `https://instagram.com/stories/${second}/${third}/`;
    return {
      canonicalUrl,
      resource: "story",
      status: "protected",
      username: second,
    };
  }

  if (first === "p" && second) {
    const canonicalUrl = `https://instagram.com/p/${second}/`;
    return { canonicalUrl, resource: "post", status: "available", username: null };
  }

  if (first === "reel" && second) {
    const canonicalUrl = `https://instagram.com/reel/${second}/`;
    return { canonicalUrl, resource: "reel", status: "available", username: null };
  }

  if (first === "tv" && second) {
    const canonicalUrl = `https://instagram.com/tv/${second}/`;
    return { canonicalUrl, resource: "tv", status: "available", username: null };
  }

  if (segments.length === 1) {
    const username = segments[0];
    if (DISALLOWED_PROFILE_SEGMENTS.has(username.toLowerCase())) {
      return null;
    }

    const canonicalUrl = `https://instagram.com/${username}/`;
    return {
      canonicalUrl,
      resource: "profile",
      status: "available",
      username,
    };
  }

  return null;
};

const sanitizeDisplayString = (value: unknown, maxLength: number): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const cleaned = value.replace(CONTROL_CHARS_REGEXP, "").trim();
  if (!cleaned) {
    return null;
  }

  return cleaned.slice(0, maxLength);
};

const sanitizeAuthorUrl = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }

    const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();
    if (!host.endsWith("instagram.com")) {
      return null;
    }

    const path = parsed.pathname.replace(/\/+/g, "/");
    const normalizedPath = path.endsWith("/") ? path : `${path}/`;
    return `https://instagram.com${normalizedPath}`;
  } catch {
    return null;
  }
};

const sanitizeThumbnailUrl = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }

    if (parsed.protocol === "http:") {
      parsed.protocol = "https:";
    }

    const host = parsed.hostname.toLowerCase();
    const allowed = IMAGE_HOST_ALLOW_LIST.some((pattern) => pattern.test(host));
    if (!allowed) {
      return null;
    }

    parsed.hash = "";
    return parsed.toString();
  } catch {
    return null;
  }
};

const sanitizeDimension = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return null;
};

const sanitizeUploadDate = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.valueOf())) {
    return null;
  }

  return parsed.toISOString();
};

const sanitizeCaption = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const withLineBreaks = value
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\s*p\s*>/gi, "\n")
    .replace(/<\s*\/p\s*>/gi, "\n");
  const stripped = withLineBreaks.replace(/<[^>]+>/g, "");
  const cleaned = stripped
    .replace(CONTROL_CHARS_REGEXP, "")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!cleaned) {
    return null;
  }

  return cleaned.slice(0, 2000);
};

const extractUsernameFromUrl = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }

  try {
    const parsed = new URL(value);
    const segment = parsed.pathname
      .split("/")
      .map((part) => part.trim())
      .filter(Boolean)[0];
    return segment ?? null;
  } catch {
    return null;
  }
};

const getAccessToken = (): string | null => {
  const directToken = process.env.IG_OEMBED_GRAPH_TOKEN?.trim();
  if (directToken) {
    return directToken;
  }

  const appId = process.env.IG_OEMBED_APP_ID?.trim();
  const appSecret = process.env.IG_OEMBED_APP_SECRET?.trim();
  if (appId && appSecret) {
    return `${appId}|${appSecret}`;
  }

  return null;
};

const getGraphVersion = (): string => {
  const version = process.env.IG_OEMBED_GRAPH_VERSION?.trim();
  return version && /^v\d+\.\d+$/.test(version) ? version : "v20.0";
};

const buildInstagramPreview = (
  normalized: NormalizedInstagramUrl,
  payload: Record<string, unknown>
): InstagramPreviewResponse => {
  const authorName = sanitizeDisplayString(payload.author_name, 120);
  const authorUrl = sanitizeAuthorUrl(payload.author_url);
  const caption = sanitizeCaption(payload.title);
  const thumbnailUrl = sanitizeThumbnailUrl(payload.thumbnail_url);
  const thumbnailWidth = sanitizeDimension(payload.thumbnail_width);
  const thumbnailHeight = sanitizeDimension(payload.thumbnail_height);
  const uploadDate = sanitizeUploadDate(payload.upload_date);
  const fallbackName = sanitizeDisplayString(payload.author_name, 60);
  const cleanedFallback = fallbackName
    ? fallbackName.replace(/\s+/g, "").slice(0, 60) || null
    : null;
  const username =
    normalized.username ?? extractUsernameFromUrl(authorUrl) ?? cleanedFallback;

  return {
    canonicalUrl: normalized.canonicalUrl,
    resource: normalized.resource,
    status: "available",
    authorName,
    authorUrl,
    caption,
    thumbnailUrl,
    thumbnailWidth,
    thumbnailHeight,
    uploadDate,
    username,
  };
};

const createProtectedResponse = (
  normalized: NormalizedInstagramUrl
): InstagramHandlerResult => {
  const preview: InstagramPreviewResponse = {
    canonicalUrl: normalized.canonicalUrl,
    resource: normalized.resource,
    status: "protected",
    username: normalized.username ?? null,
  };

  return {
    status: 200,
    body: { instagram: preview },
  };
};

const createUnavailableResponse = (
  normalized: NormalizedInstagramUrl
): InstagramHandlerResult => {
  const preview: InstagramPreviewResponse = {
    canonicalUrl: normalized.canonicalUrl,
    resource: normalized.resource,
    status: "unavailable",
    username: normalized.username ?? null,
  };

  return {
    status: 404,
    body: { error: "unavailable", instagram: preview },
  };
};

const requestInstagramPreview = async (
  normalized: NormalizedInstagramUrl,
  token: string
): Promise<InstagramHandlerResult> => {
  const version = getGraphVersion();
  const endpoint = new URL(
    `https://graph.facebook.com/${version}/instagram_oembed`
  );
  endpoint.searchParams.set("url", normalized.canonicalUrl);
  endpoint.searchParams.set("access_token", token);

  const response = await fetch(endpoint.toString(), {
    headers: { Accept: "application/json" },
  });

  if (response.status >= 400 && response.status < 500) {
    return createUnavailableResponse(normalized);
  }

  if (!response.ok) {
    throw new Error(
      `Instagram oEmbed request failed with status ${response.status}`
    );
  }

  const payload = (await response.json()) as Record<string, unknown>;
  const preview = buildInstagramPreview(normalized, payload);

  return {
    status: 200,
    body: { instagram: preview },
  };
};

const fetchAndCache = async (
  normalized: NormalizedInstagramUrl,
  token: string
): Promise<InstagramHandlerResult> => {
  const result = await requestInstagramPreview(normalized, token);

  instagramCache.set(normalized.canonicalUrl, {
    ...result,
    expiresAt: Date.now() + TWENTY_FOUR_HOURS_MS,
  });

  return result;
};

export const __clearInstagramCacheForTests = (): void => {
  instagramCache.clear();
};

export async function handleInstagramRequest(
  url: URL
): Promise<InstagramHandlerResult | null> {
  const normalized = normalizeInstagramUrl(url);
  if (!normalized) {
    return null;
  }

  if (normalized.status === "protected") {
    return createProtectedResponse(normalized);
  }

  const token = getAccessToken();
  if (!token) {
    return null;
  }

  const cached = instagramCache.get(normalized.canonicalUrl);
  if (cached) {
    if (cached.expiresAt > Date.now()) {
      return { status: cached.status, body: cached.body };
    }

    if (cached.ongoing) {
      return cached.ongoing;
    }

    const revalidation = fetchAndCache(normalized, token).catch((error) => {
      instagramCache.set(normalized.canonicalUrl, {
        ...cached,
        expiresAt: Date.now() + STALE_RETRY_MS,
        ongoing: undefined,
      });
      throw error;
    });

    instagramCache.set(normalized.canonicalUrl, {
      ...cached,
      ongoing: revalidation,
    });

    void revalidation.catch(() => undefined);

    return { status: cached.status, body: cached.body };
  }

  try {
    const result = await fetchAndCache(normalized, token);
    return result;
  } catch (error) {
    instagramCache.delete(normalized.canonicalUrl);
    throw error;
  }
}

export type { NormalizedInstagramUrl };

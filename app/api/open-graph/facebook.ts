import type { LinkPreviewMedia, LinkPreviewResponse } from "@/services/api/link-preview-api";

const FACEBOOK_HOSTNAMES = new Set([
  "facebook.com",
  "m.facebook.com",
  "www.facebook.com",
  "mobile.facebook.com",
  "touch.facebook.com",
]);

const FACEBOOK_LOGIN_INDICATORS = [
  "log into facebook",
  "facebook helps you connect",
  "log in to facebook",
  "log in or sign up",
];

const FACEBOOK_REMOVED_INDICATORS = [
  "content isn't available",
  "link you followed may be broken",
  "content is currently unavailable",
];

type FacebookPreviewKind = "post" | "video" | "photo" | "page";

interface FacebookUrlMatch {
  readonly type: FacebookPreviewKind;
  readonly canonicalUrl: string;
  readonly ids?: Record<string, string>;
}

const FACEBOOK_CARD_IMAGE_ALT: Record<FacebookPreviewKind, string> = {
  post: "Image from Facebook post",
  video: "Image from Facebook video",
  photo: "Image from Facebook photo",
  page: "Image from Facebook page",
};

const FACEBOOK_REASON_LOGIN_REQUIRED = "login_required";
const FACEBOOK_REASON_REMOVED = "removed";

const sanitizeText = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > 0 ? normalized : null;
};

const sanitizeUrl = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = new URL(trimmed, "https://facebook.com/");
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
};

const mapImages = (
  kind: FacebookPreviewKind,
  image: LinkPreviewMedia | null | undefined,
  images: readonly LinkPreviewMedia[] | null | undefined
): readonly { url: string; alt: string }[] => {
  const allCandidates: LinkPreviewMedia[] = [];
  if (image) {
    allCandidates.push(image);
  }
  if (images && images.length > 0) {
    allCandidates.push(...images);
  }

  const seen = new Set<string>();
  const result: { url: string; alt: string }[] = [];

  for (const candidate of allCandidates) {
    const maybeUrl = sanitizeUrl(candidate?.url ?? candidate?.secureUrl);
    if (!maybeUrl || seen.has(maybeUrl)) {
      continue;
    }

    seen.add(maybeUrl);
    result.push({ url: maybeUrl, alt: FACEBOOK_CARD_IMAGE_ALT[kind] });

    if (result.length === 4) {
      break;
    }
  }

  return result;
};

const normalizeFacebookHost = (host: string): string => {
  const lower = host.toLowerCase();
  if (lower.endsWith(".facebook.com")) {
    return "facebook.com";
  }

  if (FACEBOOK_HOSTNAMES.has(lower)) {
    return "facebook.com";
  }

  return lower;
};

const stripTrackingParams = (
  params: URLSearchParams,
  allowedKeys: Set<string>
): string => {
  const next = new URLSearchParams();

  params.forEach((value, key) => {
    if (allowedKeys.has(key)) {
      next.append(key, value);
    }
  });

  const serialized = next.toString();
  return serialized ? `?${serialized}` : "";
};

const buildCanonicalUrl = (
  url: URL,
  allowedParams: Set<string>
): string => {
  const canonical = new URL(url.toString());
  canonical.protocol = "https:";
  canonical.hostname = normalizeFacebookHost(canonical.hostname);
  canonical.hash = "";
  canonical.search = stripTrackingParams(canonical.searchParams, allowedParams);
  const normalizedPath = canonical.pathname.replace(/\/+$/, "");
  canonical.pathname = normalizedPath.length > 0 ? normalizedPath : "/";

  // facebook likes to add trailing slashes inconsistently; ensure single slash between segments
  if (!canonical.pathname.startsWith("/")) {
    canonical.pathname = `/${canonical.pathname}`;
  }

  return canonical.toString();
};

const matchFacebookUrl = (url: URL): FacebookUrlMatch | null => {
  const host = normalizeFacebookHost(url.hostname);

  if (host !== "facebook.com") {
    return null;
  }

  const pathname = url.pathname.replace(/\/+$/, "");
  const segments = pathname.split("/").filter(Boolean);
  const search = url.searchParams;

  if (segments.length === 0) {
    return null;
  }

  if (segments[0] === "watch") {
    const videoId = search.get("v");
    if (!videoId) {
      return null;
    }
    return {
      type: "video",
      canonicalUrl: buildCanonicalUrl(url, new Set(["v"])),
      ids: { videoId },
    };
  }

  if (segments[0] === "photo.php") {
    const photoId = search.get("fbid");
    if (!photoId) {
      return null;
    }
    return {
      type: "photo",
      canonicalUrl: buildCanonicalUrl(url, new Set(["fbid"])),
      ids: { photoId },
    };
  }

  if (segments.length >= 2) {
    const [page, second] = segments;

    if (second === "posts" && segments.length >= 3) {
      const postId = segments[segments.length - 1];
      return {
        type: "post",
        canonicalUrl: buildCanonicalUrl(url, new Set()),
        ids: { page, postId },
      };
    }

    if (second === "videos" && segments.length >= 3) {
      const videoId = segments[segments.length - 1];
      return {
        type: "video",
        canonicalUrl: buildCanonicalUrl(url, new Set()),
        ids: { videoId, author: page },
      };
    }

    if (second === "photos" && segments.length >= 3) {
      const photoId = segments[segments.length - 1];
      return {
        type: "photo",
        canonicalUrl: buildCanonicalUrl(url, new Set()),
        ids: { photoId, author: page },
      };
    }
  }

  if (segments.length === 1) {
    const page = segments[0];
    if (!page.includes(".")) {
      return {
        type: "page",
        canonicalUrl: buildCanonicalUrl(
          new URL(`https://facebook.com/${page}`),
          new Set()
        ),
        ids: { page },
      };
    }
  }

  return null;
};

const hasLoginWall = (metadata: LinkPreviewResponse): boolean => {
  const candidates = [metadata.title, metadata.description];

  return candidates
    .map((candidate) => sanitizeText(candidate))
    .filter((value): value is string => Boolean(value))
    .some((value) => {
      const lower = value.toLowerCase();
      return FACEBOOK_LOGIN_INDICATORS.some((indicator) => lower.includes(indicator));
    });
};

const isContentRemoved = (metadata: LinkPreviewResponse): boolean => {
  const candidates = [metadata.title, metadata.description];

  return candidates
    .map((candidate) => sanitizeText(candidate))
    .filter((value): value is string => Boolean(value))
    .some((value) => {
      const lower = value.toLowerCase();
      return FACEBOOK_REMOVED_INDICATORS.some((indicator) => lower.includes(indicator));
    });
};

export const buildFacebookPreview = (
  finalUrl: URL,
  metadata: LinkPreviewResponse
): LinkPreviewResponse | null => {
  const match = matchFacebookUrl(finalUrl);
  if (!match) {
    return null;
  }

  if (hasLoginWall(metadata)) {
    return {
      ...metadata,
      type: "facebook.unavailable",
      canonicalUrl: match.canonicalUrl,
      reason: FACEBOOK_REASON_LOGIN_REQUIRED,
    } as LinkPreviewResponse;
  }

  if (isContentRemoved(metadata)) {
    return {
      ...metadata,
      type: "facebook.unavailable",
      canonicalUrl: match.canonicalUrl,
      reason: FACEBOOK_REASON_REMOVED,
    } as LinkPreviewResponse;
  }

  const canonicalUrl = match.canonicalUrl;
  const title = sanitizeText(metadata.title) ?? null;
  const description = sanitizeText(metadata.description) ?? null;

  if (match.type === "post") {
    const page = match.ids?.page ?? null;
    const postId = match.ids?.postId ?? null;
    const images = mapImages("post", metadata.image ?? null, metadata.images ?? null);
    const text = description ?? title;

    if (!text && images.length === 0) {
      return null;
    }

    return {
      ...metadata,
      type: "facebook.post",
      canonicalUrl,
      post: {
        page,
        postId,
        authorName: title,
        authorUrl: page ? `https://facebook.com/${page}` : null,
        createdAt: null,
        text: text ?? null,
        images,
      },
    } as LinkPreviewResponse;
  }

  if (match.type === "video") {
    const videoId = match.ids?.videoId ?? null;
    const authorPage = match.ids?.author ?? null;
    const images = mapImages("video", metadata.image ?? null, metadata.images ?? null);
    const thumbnail = images.length > 0 ? images[0]?.url ?? null : null;

    return {
      ...metadata,
      type: "facebook.video",
      canonicalUrl,
      video: {
        videoId,
        title,
        authorName: authorPage ?? metadata.siteName ?? null,
        authorUrl: authorPage
          ? `https://facebook.com/${authorPage}`
          : metadata.siteName
            ? `https://facebook.com/${metadata.siteName}`
            : null,
        thumbnail,
        duration: null,
      },
    } as LinkPreviewResponse;
  }

  if (match.type === "photo") {
    const photoId = match.ids?.photoId ?? null;
    const authorPage = match.ids?.author ?? null;
    const images = mapImages("photo", metadata.image ?? null, metadata.images ?? null);
    const image = images.length > 0 ? images[0]?.url ?? null : null;

    if (!image) {
      return null;
    }

    return {
      ...metadata,
      type: "facebook.photo",
      canonicalUrl,
      photo: {
        photoId,
        caption: description,
        authorName: authorPage ?? metadata.siteName ?? null,
        authorUrl: authorPage
          ? `https://facebook.com/${authorPage}`
          : metadata.siteName
            ? `https://facebook.com/${metadata.siteName}`
            : null,
        image,
      },
    } as LinkPreviewResponse;
  }

  if (match.type === "page") {
    const pageName = match.ids?.page ?? null;
    const images = mapImages("page", metadata.image ?? null, metadata.images ?? null);
    const avatar = images.length > 0 ? images[0]?.url ?? null : null;
    const banner = images.length > 1 ? images[1]?.url ?? null : null;

    return {
      ...metadata,
      type: "facebook.page",
      canonicalUrl,
      page: {
        name: title ?? pageName,
        about: description,
        avatar,
        banner,
      },
    } as LinkPreviewResponse;
  }

  return null;
};

export const shouldHandleFacebook = (url: URL): boolean => {
  const host = normalizeFacebookHost(url.hostname);
  if (host === "facebook.com") {
    return true;
  }

  if (host === "fb.watch") {
    return true;
  }

  if (host === "l.facebook.com" && url.pathname.startsWith("/l.php")) {
    const target = url.searchParams.get("u");
    if (!target) {
      return false;
    }

    try {
      const decoded = decodeURIComponent(target);
      const resolved = new URL(decoded);
      return shouldHandleFacebook(resolved);
    } catch {
      return false;
    }
  }

  return false;
};

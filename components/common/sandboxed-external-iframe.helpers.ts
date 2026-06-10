import {
  canonicalizeInteractiveMediaHostname,
  canonicalizeInteractiveMediaUrl,
  isInteractiveMediaAllowedHost,
} from "@/components/waves/memes/submission/constants/security";

const SAFE_EXTERNAL_PROTOCOL = "https:";
const SAFE_EXTERNAL_OPEN_FEATURES = "noopener,noreferrer";

function parseHttpsMetadataUrl(src: string): URL | null {
  const trimmedSrc = src.trim();

  if (!trimmedSrc) {
    return null;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmedSrc);
  } catch {
    return null;
  }

  if (parsedUrl.protocol !== SAFE_EXTERNAL_PROTOCOL) {
    return null;
  }

  if (parsedUrl.username || parsedUrl.password || parsedUrl.hash) {
    return null;
  }

  if (parsedUrl.port && parsedUrl.port !== "443") {
    return null;
  }

  const normalizedHostname = canonicalizeInteractiveMediaHostname(
    parsedUrl.hostname
  );
  if (!normalizedHostname) {
    return null;
  }

  parsedUrl.hostname = normalizedHostname;
  parsedUrl.port = "";
  parsedUrl.username = "";
  parsedUrl.password = "";
  parsedUrl.hash = "";

  return parsedUrl;
}

export function canonicalizeExternalMetadataUrl(src: string): string | null {
  return parseHttpsMetadataUrl(src)?.toString() ?? null;
}

export function canonicalizeExternalMetadataHtmlUrl(
  src: string
): string | null {
  const parsedUrl = parseHttpsMetadataUrl(src);

  if (!parsedUrl) {
    return null;
  }

  if (isInteractiveMediaAllowedHost(parsedUrl.hostname)) {
    return canonicalizeInteractiveMediaUrl(parsedUrl.toString());
  }

  return parsedUrl.toString();
}

export function openExternalMetadataUrl(src: string | null | undefined): void {
  if (!src) {
    return;
  }

  const canonicalUrl = canonicalizeExternalMetadataUrl(src);

  if (!canonicalUrl || typeof window === "undefined") {
    return;
  }

  window.open(canonicalUrl, "_blank", SAFE_EXTERNAL_OPEN_FEATURES);
}

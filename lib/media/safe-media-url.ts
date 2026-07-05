const SAFE_MEDIA_PROTOCOLS = new Set(["http:", "https:", "blob:"]);
const SAFE_DATA_MEDIA_PATTERN = /^data:(?:audio|image|video)\//i;
const URL_SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:/i;

function isRelativeUrl(value: string): boolean {
  return !value.startsWith("//") && !URL_SCHEME_PATTERN.test(value);
}

export function getSafeMediaSource(
  rawUrl: string | null | undefined
): string | null {
  const trimmedUrl = rawUrl?.trim();
  if (!trimmedUrl) {
    return null;
  }

  if (SAFE_DATA_MEDIA_PATTERN.test(trimmedUrl)) {
    return trimmedUrl;
  }

  if (isRelativeUrl(trimmedUrl)) {
    try {
      new URL(trimmedUrl, "https://6529.io");
      return trimmedUrl;
    } catch {
      return null;
    }
  }

  try {
    const parsedUrl = new URL(trimmedUrl);
    if (SAFE_MEDIA_PROTOCOLS.has(parsedUrl.protocol)) {
      return parsedUrl.toString();
    }
  } catch {
    return null;
  }

  return null;
}

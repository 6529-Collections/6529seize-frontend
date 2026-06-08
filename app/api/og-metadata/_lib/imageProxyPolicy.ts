export const OG_IMAGE_PROXY_MAX_BYTES = 50 * 1024 * 1024;

const normalizeHostname = (hostname: string): string => {
  let normalized = hostname.trim().toLowerCase();
  while (normalized.endsWith(".")) {
    normalized = normalized.slice(0, -1);
  }
  return normalized;
};

const isPrivateIpHostname = (hostname: string): boolean => {
  if (
    hostname === "0.0.0.0" ||
    hostname.startsWith("10.") ||
    hostname.startsWith("127.") ||
    hostname.startsWith("169.254.") ||
    hostname.startsWith("192.168.")
  ) {
    return true;
  }

  const private172Match = /^172\.(1[6-9]|2\d|3[01])\./.exec(hostname);
  return private172Match !== null;
};

const isClearlyLocalHostname = (hostname: string): boolean =>
  hostname === "localhost" ||
  hostname === "::1" ||
  hostname.endsWith(".localhost") ||
  hostname.endsWith(".local") ||
  isPrivateIpHostname(hostname);

export const isAllowedOgImageSourceUrl = (
  value: string | null | undefined
): boolean => {
  if (!value) {
    return false;
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }

  if (url.protocol !== "https:" || (url.port && url.port !== "443")) {
    return false;
  }

  const hostname = normalizeHostname(url.hostname);
  return !isClearlyLocalHostname(hostname);
};

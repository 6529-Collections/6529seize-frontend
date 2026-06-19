export const PROFILE_CMS_ASSET_PROXY_PATH = "/api/profile-cms/assets";

export const PROFILE_CMS_ASSET_PROXY_ALLOWED_HOSTS = [
  "d3lqz0a4bldqgf.cloudfront.net",
] as const;

export const PROFILE_CMS_ASSET_PROXY_ALLOWED_PATH_PREFIXES = [
  "/6529-emoji/",
  "/images/",
] as const;

export function isProfileCmsAssetProxyAllowedUrl(value: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }

  if (parsed.protocol !== "https:" || (parsed.port && parsed.port !== "443")) {
    return false;
  }

  const hostname = parsed.hostname.toLowerCase();
  const allowedHosts: readonly string[] = PROFILE_CMS_ASSET_PROXY_ALLOWED_HOSTS;
  if (!allowedHosts.includes(hostname)) {
    return false;
  }

  return PROFILE_CMS_ASSET_PROXY_ALLOWED_PATH_PREFIXES.some((prefix) =>
    parsed.pathname.startsWith(prefix)
  );
}

export function getProfileCmsAssetProxyUrl(value: string): string {
  if (!isProfileCmsAssetProxyAllowedUrl(value)) {
    return value;
  }

  return `${PROFILE_CMS_ASSET_PROXY_PATH}?url=${encodeURIComponent(value)}`;
}

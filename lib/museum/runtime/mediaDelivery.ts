const MUSEUM_MEDIA_PROXY_PATH = "/api/museum/media";

export const MUSEUM_MEDIA_PROXY_ALLOWED_HOSTS = [
  "d3lqz0a4bldqgf.cloudfront.net",
] as const;

const ACCESSION_DERIVATIVE_PATH =
  /^\/museum\/accessions\/6529NM\.\d{4}\.\d{3}\/6529NM-W-\d{4}\/[0-9a-f]{64}\/webp-v2-q82-m6-fixed-icc\/(?:640|1280|2400)\.webp$/u;

export function isMuseumMediaProxyAllowedUrl(value: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }

  if (
    parsed.protocol !== "https:" ||
    (parsed.port.length > 0 && parsed.port !== "443") ||
    parsed.username.length > 0 ||
    parsed.password.length > 0 ||
    parsed.search.length > 0 ||
    parsed.hash.length > 0
  ) {
    return false;
  }

  const allowedHosts: readonly string[] = MUSEUM_MEDIA_PROXY_ALLOWED_HOSTS;
  return (
    allowedHosts.includes(parsed.hostname.toLowerCase()) &&
    ACCESSION_DERIVATIVE_PATH.test(parsed.pathname)
  );
}

export function getMuseumMediaDeliveryUrl(value: string): string {
  if (!isMuseumMediaProxyAllowedUrl(value)) return value;
  return `${MUSEUM_MEDIA_PROXY_PATH}?url=${encodeURIComponent(value)}`;
}

export function getMuseumMediaDeliverySrcSet(
  value: string | undefined
): string | undefined {
  if (value === undefined) return undefined;
  // Governed derivative URLs cannot contain commas or query parameters, so
  // each comma is an unambiguous candidate boundary here.
  return value
    .split(",")
    .map((candidate) => {
      const trimmed = candidate.trim();
      const separator = trimmed.search(/[\t\n\f\r ]/u);
      if (separator < 1) return trimmed;
      const url = trimmed.slice(0, separator);
      const descriptor = trimmed.slice(separator).trim();
      if (descriptor.length === 0) return trimmed;
      return `${getMuseumMediaDeliveryUrl(url)} ${descriptor}`;
    })
    .join(", ");
}

const ARWEAVE_HOST = "arweave.net";
const FALLBACK_HOST = "ar-io.net";

export function isArweaveUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const h = u.hostname.toLowerCase();
    return h === ARWEAVE_HOST || h === "www." + ARWEAVE_HOST;
  } catch {
    return false;
  }
}

export function getArweaveFallbackUrl(url: string): string | null {
  if (!isArweaveUrl(url)) return null;
  try {
    const u = new URL(url);
    u.hostname = FALLBACK_HOST;
    u.host = FALLBACK_HOST + (u.port ? ":" + u.port : "");
    return u.toString();
  } catch {
    return null;
  }
}

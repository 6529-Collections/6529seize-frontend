/**
 * Where the public TDH feed is: 6529's daily comparison files and the Lean
 * proof manifest. Shared by the server loaders and the proxy's check of day
 * permalinks, so both read the same base URL.
 */

/** 6529's public TDH feed, written by the daily comparison job (D132). */
export const PUBLIC_TDH_FEED_BASE = "https://d379duzqnomz3w.cloudfront.net/";

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "[::1]"]);

type VerificationSource =
  | { readonly kind: "remote"; readonly base: URL }
  | { readonly kind: "invalid" };

/**
 * The feed's base URL: `base` when it is set (`NEXT_PUBLIC_TDH_VERIFICATION_BASE`)
 * and otherwise 6529's public feed. Only HTTPS is accepted, or plain HTTP on
 * a local host outside production, and never with credentials, a query or
 * a fragment.
 */
export function resolveVerificationSource(
  base: string | undefined,
  isProduction: boolean
): VerificationSource {
  const configured = base?.trim() ?? "";
  const trimmed = configured.length === 0 ? PUBLIC_TDH_FEED_BASE : configured;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return { kind: "invalid" };
  }
  const isLocalHttp =
    url.protocol === "http:" && LOCAL_HOSTNAMES.has(url.hostname);
  if (url.protocol !== "https:" && !(isLocalHttp && !isProduction)) {
    return { kind: "invalid" };
  }
  if (url.username || url.password || url.search || url.hash) {
    return { kind: "invalid" };
  }
  if (!url.pathname.endsWith("/")) {
    url.pathname = `${url.pathname}/`;
  }
  return { kind: "remote", base: url };
}

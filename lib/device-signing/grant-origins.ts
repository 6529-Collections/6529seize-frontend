import { getAppEnvironment } from "@/config/appEnvironment";
import { isDevLikeEnv } from "@/config/devAuth";
import { publicEnv } from "@/config/env";

/**
 * The places a device grant can say it was signed: the hosts that serve the
 * 6529 app and the names of the 6529 apps. One list for signed posts and
 * encrypted messages, sign-in grants and app grants.
 *
 * Other 6529.io subdomains, such as the IPFS and media gateways, serve
 * user-published pages, so a grant signed there could have been phished and
 * never counts.
 */

const PRODUCTION_SITE_HOST = "6529.io";
const STAGING_SITE_HOST = "staging.6529.io";

/**
 * App grant origins that are not a page host: 6529 Desktop signs its own
 * name. 6529 Mobile loads 6529.io, so its grants name that host.
 */
const APP_NAME_ORIGINS: ReadonlySet<string> = new Set(["6529 Desktop"]);

const LOCAL_HOSTNAMES: ReadonlySet<string> = new Set([
  "localhost",
  "127.0.0.1",
  "[::1]",
]);

/**
 * Whether this build serves production (its base URL is 6529.io). A build
 * without a readable base URL is treated as production, which accepts less.
 */
const isProductionBuild = (): boolean =>
  getAppEnvironment(publicEnv.BASE_ENDPOINT).isProduction;

/**
 * The site hosts this build accepts: 6529.io everywhere and staging.6529.io
 * outside production. Staging has its own accounts, so a grant signed there
 * never belongs to a production profile.
 */
const acceptedSiteHosts = (): readonly string[] =>
  isProductionBuild()
    ? [PRODUCTION_SITE_HOST]
    : [PRODUCTION_SITE_HOST, STAGING_SITE_HOST];

/**
 * The host a value names, or null unless it is exactly one bare host (no
 * scheme, path, query, fragment, user info, whitespace or empty label), so a
 * value such as "evil.example/x.6529.io" can never pass for a 6529 host.
 */
function toExactHost(value: string): URL | null {
  const lower = value.toLowerCase();
  if (lower.split(".").includes("")) {
    return null;
  }
  try {
    const url = new URL(`https://${lower}`);
    return url.host === lower ? url : null;
  } catch {
    return null;
  }
}

/** Local development hosts (any port), accepted only by dev and test builds. */
const isLocalDevHost = (url: URL): boolean =>
  isDevLikeEnv() &&
  (LOCAL_HOSTNAMES.has(url.hostname) ||
    url.hostname.endsWith(".localhost") ||
    url.hostname.endsWith(".test"));

/**
 * Whether a grant naming this host was signed on the 6529 app as this build
 * runs it: exactly 6529.io, or staging.6529.io outside production, without a
 * port. Development and test builds also accept local hosts.
 */
export function isRecognizedGrantHost(domain: string): boolean {
  const url = toExactHost(domain);
  if (url === null) {
    return false;
  }
  return acceptedSiteHosts().includes(url.host) || isLocalDevHost(url);
}

/**
 * Whether an app grant's `origin` is one a 6529 client produces: the name of
 * a 6529 app, or a host this build recognizes (the page host on the web and
 * in 6529 Mobile).
 */
export const isRecognizedAppGrantOrigin = (origin: string): boolean =>
  APP_NAME_ORIGINS.has(origin) || isRecognizedGrantHost(origin);

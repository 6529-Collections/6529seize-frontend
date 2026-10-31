import { ARWEAVE_GATEWAY_CSP_SOURCES } from "../lib/media/arweave-gateways";
import { getMediaResolverSource } from "../lib/media/decentralized-media";
import { IPFS_GATEWAY_CSP_SOURCES } from "../lib/media/ipfs-gateways";
import { SENTRY_INGEST_HOSTNAME_PATTERN } from "./sentryIngest";

function isLocalhostHostname(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "[::1]"
  );
}

// RFC1918 private ranges, so a dev server exposed on the LAN (e.g. testing
// from a phone) can reach a local API over plain http. Only consulted under
// the same dev-only flag as the localhost carve-out.
function isPrivateLanHostname(hostname: string): boolean {
  return (
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
    /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(hostname)
  );
}

function getConfiguredConnectSource(
  endpoint: string | undefined,
  allowInsecureLocalhost: boolean = false
): string {
  if (!endpoint) {
    return "";
  }

  try {
    const parsedUrl = new URL(endpoint);
    if (parsedUrl.protocol === "https:" || parsedUrl.protocol === "wss:") {
      return parsedUrl.origin;
    }

    if (
      allowInsecureLocalhost &&
      (parsedUrl.protocol === "http:" || parsedUrl.protocol === "ws:") &&
      (isLocalhostHostname(parsedUrl.hostname) ||
        isPrivateLanHostname(parsedUrl.hostname))
    ) {
      return parsedUrl.origin;
    }

    return "";
  } catch {
    return "";
  }
}

function getConfiguredIpfsGatewaySource(
  ipfsGatewayEndpoint: string | undefined
): string {
  return getConfiguredConnectSource(ipfsGatewayEndpoint);
}

// The DSN key, hostname and project id are validated so a malformed DSN can
// never inject extra directives or headers into the generated values. Only
// Sentry's hosted ingest hosts are accepted; the read-only E2E guard ignores
// CSP report POSTs to exactly those hosts (see config/sentryIngest.ts).
const SENTRY_PUBLIC_KEY_PATTERN = /^[A-Za-z0-9]{16,64}$/;
const SENTRY_PROJECT_PATH_PATTERN = /^\/(\d+)$/;
const CSP_REPORT_GROUP = "csp-endpoint";

// Browsers post CSP violation reports straight to Sentry's security endpoint,
// derived from the public DSN, so reporting does not depend on this app being
// reachable. Returns an empty string when the DSN is missing or unusable.
function getSentrySecurityReportEndpoint(dsn: string | undefined): string {
  if (!dsn) {
    return "";
  }

  try {
    const parsedUrl = new URL(dsn);
    const projectId = SENTRY_PROJECT_PATH_PATTERN.exec(parsedUrl.pathname)?.[1];
    if (
      parsedUrl.protocol !== "https:" ||
      parsedUrl.port !== "" ||
      !projectId ||
      !SENTRY_PUBLIC_KEY_PATTERN.test(parsedUrl.username) ||
      !SENTRY_INGEST_HOSTNAME_PATTERN.test(parsedUrl.hostname)
    ) {
      return "";
    }

    return `https://${parsedUrl.hostname}/api/${projectId}/security/?sentry_key=${parsedUrl.username}`;
  } catch {
    return "";
  }
}

function joinSources(sources: Array<string | false | undefined>): string {
  return sources.filter(Boolean).join(" ");
}

function cspDirective(
  name: string,
  sources: Array<string | false | undefined>
): string {
  return `${name} ${joinSources(sources)};`;
}

interface SecurityHeaderOptions {
  readonly allowInsecureLocalhostConnectSrc?: boolean | undefined;
  readonly allowUnsafeEval?: boolean | undefined;
  /**
   * Allow WebAssembly compilation (`'wasm-unsafe-eval'`) without allowing
   * JavaScript eval. Only the end-to-end encrypted messages build (D109)
   * needs it, for the MLS WebAssembly module.
   */
  readonly allowWasmUnsafeEval?: boolean | undefined;
  readonly webSocketEndpoint?: string | undefined;
  readonly sentryDsn?: string | undefined;
}

export function createSecurityHeaders(
  apiEndpoint: string | undefined = "",
  ipfsGatewayEndpoint: string | undefined = "",
  mediaResolverEndpoint: string | undefined = "",
  options: SecurityHeaderOptions = {}
) {
  const arweaveGatewaySources = ARWEAVE_GATEWAY_CSP_SOURCES;
  const configuredApiSource = getConfiguredConnectSource(
    apiEndpoint,
    options.allowInsecureLocalhostConnectSrc
  );
  const configuredWebSocketSource = getConfiguredConnectSource(
    options.webSocketEndpoint,
    options.allowInsecureLocalhostConnectSrc
  );
  const cspReportEndpoint = getSentrySecurityReportEndpoint(options.sentryDsn);
  const ipfsGatewaySources = IPFS_GATEWAY_CSP_SOURCES.join(" ");
  const mediaResolverSource = getMediaResolverSource(mediaResolverEndpoint);
  const configuredIpfsGatewaySource =
    getConfiguredIpfsGatewaySource(ipfsGatewayEndpoint);
  const connectSrc = [
    "'self'",
    "blob:",
    configuredApiSource,
    configuredWebSocketSource,
    // Wallet/RPC providers, presigned uploads, analytics, and user media probes
    // can resolve to many origins; keep this broad but HTTPS/WSS-only.
    "https:",
    "wss:",
    "https://registry.walletconnect.com/api/v2/wallets",
    "wss://*.bridge.walletconnect.org",
    "wss://*.walletconnect.com",
    "wss://www.walletlink.org/rpc",
    "https://explorer-api.walletconnect.com/v3/wallets",
    "https://www.googletagmanager.com",
    "https://*.google-analytics.com",
    "https://cloudflare-eth.com/",
    mediaResolverSource,
    ...arweaveGatewaySources,
    ipfsGatewaySources,
    "https://rpc.walletconnect.com/v1/",
    "https://sts.us-east-1.amazonaws.com",
    "https://sts.us-west-2.amazonaws.com",
  ];
  const imgSrc = [
    "'self'",
    "data:",
    "blob:",
    "ipfs:",
    // NFT, drop, and profile media are user-supplied and decentralized, so the
    // host set is intentionally open while still excluding plain HTTP.
    "https:",
    "https://artblocks.io",
    "https://*.artblocks.io",
  ];
  const mediaSrc = [
    "'self'",
    "blob:",
    // Authorized passive artwork previews use the two private archive buckets.
    "https://6529-artwork-documentation-987989283142-eu-west-1.s3.eu-west-1.amazonaws.com",
    "https://6529-artwork-documentation-987989283142-us-east-1.s3.us-east-1.amazonaws.com",
    "https://*.cloudfront.net",
    "https://videos.files.wordpress.com",
    mediaResolverSource,
    ...arweaveGatewaySources,
    ipfsGatewaySources,
    configuredIpfsGatewaySource,
    "https://*.twimg.com",
    "https://artblocks.io",
    "https://*.artblocks.io",
  ];
  const frameSrc = [
    "'self'",
    mediaResolverSource,
    "https://ipfs.io",
    "https://ipfs.io/ipfs/",
    configuredIpfsGatewaySource,
    "https://cf-ipfs.com",
    "https://cf-ipfs.com/ipfs/",
    ipfsGatewaySources,
    "https://media.generator.seize.io",
    "https://media.generator.6529.io",
    "https://generator.seize.io",
    ...arweaveGatewaySources,
    "https://nftstorage.link",
    "https://*.ipfs.nftstorage.link",
    "https://verify.walletconnect.com",
    "https://verify.walletconnect.org",
    "https://secure.walletconnect.com",
    "https://d3lqz0a4bldqgf.cloudfront.net",
    // Link-preview video embeds use youtube-nocookie.com; www.youtube.com is the
    // only other host the client-side embed allowlist accepts.
    "https://www.youtube-nocookie.com",
    "https://www.youtube.com",
    "https://artblocks.io",
    "https://*.artblocks.io",
    // Google Workspace link previews only embed docs.google.com preview pages.
    "https://docs.google.com",
  ];
  const contentSecurityPolicy = [
    cspDirective("default-src", ["'none'"]),
    cspDirective("script-src", [
      "'self'",
      // Next.js bootstrap scripts, the consent-gated GA snippet, and imported
      // legacy WordPress pages still rely on inline script execution.
      "'unsafe-inline'",
      "https://dnclu2fna0b2b.cloudfront.net",
      "https://www.google-analytics.com",
      "https://www.googletagmanager.com",
      "https://dataplane.rum.us-east-1.amazonaws.com",
      // Keep eval available for local/dev tooling only; production dependencies
      // in this app do not require eval-like script execution.
      options.allowUnsafeEval && "'unsafe-eval'",
      // Encrypted messages compile an MLS WebAssembly module; this keyword
      // permits WebAssembly compilation only, not JavaScript eval.
      options.allowWasmUnsafeEval && "'wasm-unsafe-eval'",
    ]),
    cspDirective("connect-src", connectSrc),
    cspDirective("font-src", [
      "'self'",
      "data:",
      "https://fonts.gstatic.com",
      "https://fonts.reown.com",
      "https://dnclu2fna0b2b.cloudfront.net",
      "https://cdnjs.cloudflare.com",
    ]),
    cspDirective("img-src", imgSrc),
    cspDirective("media-src", mediaSrc),
    // default-src is 'none', which would otherwise block the web app manifest.
    cspDirective("manifest-src", ["'self'"]),
    cspDirective("frame-src", frameSrc),
    cspDirective("style-src", [
      "'self'",
      // Next/legacy page styles are still emitted inline; removing this needs a
      // nonce/hash migration across the imported content surface.
      "'unsafe-inline'",
      "https://fonts.googleapis.com/css2",
      "https://dnclu2fna0b2b.cloudfront.net",
      "https://cdnjs.cloudflare.com",
      "https://cdn.jsdelivr.net",
    ]),
    cspDirective("object-src", ["'none'"]),
    // No <base> tags and no cross-origin native form posts exist in the app, and
    // framing is already same-origin only (see X-Frame-Options below).
    cspDirective("base-uri", ["'self'"]),
    cspDirective("form-action", ["'self'"]),
    cspDirective("frame-ancestors", ["'self'"]),
    ...(cspReportEndpoint
      ? [
          cspDirective("report-uri", [cspReportEndpoint]),
          cspDirective("report-to", [CSP_REPORT_GROUP]),
        ]
      : []),
  ].join(" ");

  return [
    {
      key: "Strict-Transport-Security",
      value: "max-age=31536000; includeSubDomains; preload",
    },
    {
      key: "Content-Security-Policy",
      value: contentSecurityPolicy,
    },
    ...(cspReportEndpoint
      ? [
          {
            key: "Reporting-Endpoints",
            value: `${CSP_REPORT_GROUP}="${cspReportEndpoint}"`,
          },
        ]
      : []),
    // Legacy equivalent of frame-ancestors 'self' for browsers without CSP2.
    { key: "X-Frame-Options", value: "SAMEORIGIN" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "same-origin" },
    {
      key: "Permissions-Policy",
      value: [
        "accelerometer=()",
        // Muted in-app video (NFT, drop and preview players) autoplays on this
        // origin only; cross-origin frames remain blocked.
        "autoplay=(self)",
        "camera=()",
        "cross-origin-isolated=()",
        "display-capture=()",
        "encrypted-media=()",
        "fullscreen=(self)",
        "geolocation=()",
        "gyroscope=()",
        "keyboard-map=()",
        "magnetometer=()",
        "microphone=()",
        "midi=()",
        "payment=()",
        "picture-in-picture=()",
        // Passkey WebAuthn stays closed: no wallet SDK path we ship calls
        // navigator.credentials in this document. A cross-origin wallet frame
        // would need its origin listed here plus an iframe allow attribute.
        "publickey-credentials-get=()",
        "screen-wake-lock=()",
        "sync-xhr=()",
        "usb=()",
        // web-share is intentionally not listed: Chromium reports it as an
        // unrecognized feature. Same-origin sharing is already the default.
        "xr-spatial-tracking=()",
      ].join(", "),
    },
  ];
}

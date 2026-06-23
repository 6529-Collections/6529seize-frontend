import { ARWEAVE_GATEWAY_CSP_SOURCES } from "../lib/media/arweave-gateways";
import { getMediaResolverSource } from "../lib/media/decentralized-media";
import { IPFS_GATEWAY_CSP_SOURCES } from "../lib/media/ipfs-gateways";

function isLocalhostHostname(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "[::1]"
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
      isLocalhostHostname(parsedUrl.hostname)
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
  readonly webSocketEndpoint?: string | undefined;
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
    "https://www.youtube.com",
    "https://www.youtube-nocookie.com",
    "https://*.youtube.com",
    "https://artblocks.io",
    "https://*.artblocks.io",
    "https://docs.google.com",
    "https://drive.google.com",
    "https://*.google.com",
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
    { key: "X-Frame-Options", value: "SAMEORIGIN" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "same-origin" },
    {
      key: "Permissions-Policy",
      value: [
        "accelerometer=()",
        "ambient-light-sensor=()",
        "autoplay=()",
        "battery=()",
        "camera=()",
        "cross-origin-isolated=()",
        "display-capture=()",
        "document-domain=()",
        "encrypted-media=()",
        "execution-while-not-rendered=()",
        "execution-while-out-of-viewport=()",
        "fullscreen=(self)",
        "geolocation=()",
        "gyroscope=()",
        "keyboard-map=()",
        "magnetometer=()",
        "microphone=()",
        "midi=()",
        "payment=()",
        "picture-in-picture=()",
        "publickey-credentials-get=()",
        "screen-wake-lock=()",
        "sync-xhr=()",
        "usb=()",
        "web-share=()",
        "xr-spatial-tracking=()",
      ].join(", "),
    },
  ];
}

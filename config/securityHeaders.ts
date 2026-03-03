import type { PublicEnv } from "./env.schema";

function tryGetOrigin(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).origin;
  } catch {
    return undefined;
  }
}

function uniq(values: readonly string[]): string[] {
  const set = new Set<string>();
  for (const v of values) {
    const trimmed = v.trim();
    if (trimmed) set.add(trimmed);
  }
  return Array.from(set);
}

export function createContentSecurityPolicyValue({
  nonce,
  publicEnv,
}: {
  nonce: string;
  publicEnv: PublicEnv;
}): string {
  const nodeEnv = process.env.NODE_ENV;
  const effectiveEnv = publicEnv.NODE_ENV ?? nodeEnv;
  const isProd =
    effectiveEnv !== "development" &&
    effectiveEnv !== "test" &&
    effectiveEnv !== "local";

  const apiOrigin = tryGetOrigin(publicEnv.API_ENDPOINT);
  const allowlistApiOrigin = tryGetOrigin(publicEnv.ALLOWLIST_API_ENDPOINT);
  const ipfsApiOrigin = tryGetOrigin(publicEnv.IPFS_API_ENDPOINT);
  const ipfsGatewayOrigin = tryGetOrigin(publicEnv.IPFS_GATEWAY_ENDPOINT);
  const wsOrigin = tryGetOrigin(publicEnv.WS_ENDPOINT);
  const derivedWsOrigin = apiOrigin
    ? tryGetOrigin(apiOrigin.replace("https://api", "wss://ws"))
    : undefined;

  const awsRumRegion = publicEnv.AWS_RUM_REGION || "us-east-1";
  const awsRumDataplane = `https://dataplane.rum.${awsRumRegion}.amazonaws.com`;
  const awsSts = `https://sts.${awsRumRegion}.amazonaws.com`;
  const awsCognitoIdentity = `https://cognito-identity.${awsRumRegion}.amazonaws.com`;

  const scriptSrc = uniq([
    "'self'",
    `'nonce-${nonce}'`,
    // Static assets (S3/CloudFront builds)
    "https://dnclu2fna0b2b.cloudfront.net",
    // Analytics (loaded after cookie consent)
    "https://www.googletagmanager.com",
    "https://www.google-analytics.com",
    ...(isProd ? [] : ["'unsafe-eval'"]),
  ]);

  const connectSrc = uniq([
    "'self'",
    "blob:",
    apiOrigin ?? "",
    allowlistApiOrigin ?? "",
    ipfsApiOrigin ?? "",
    ipfsGatewayOrigin ?? "",
    wsOrigin ?? "",
    derivedWsOrigin ?? "",
    // Wallet / Web3
    "https://registry.walletconnect.com",
    "https://explorer-api.walletconnect.com",
    "https://rpc.walletconnect.com",
    "https://*.walletconnect.com",
    "https://*.walletconnect.org",
    "https://cloudflare-eth.com",
    "https://rpc1.6529.io",
    "wss://*.bridge.walletconnect.org",
    "wss://*.walletconnect.com",
    "wss://www.walletlink.org",
    // Analytics / monitoring
    "https://www.google-analytics.com",
    "https://stats.g.doubleclick.net",
    "https://www.googletagmanager.com",
    "https://*.google-analytics.com",
    awsRumDataplane,
    awsSts,
    awsCognitoIdentity,
    "https://sts.us-east-1.amazonaws.com",
    "https://sts.us-west-2.amazonaws.com",
    // Content networks
    "https://arweave.net",
    // GIF picker
    "https://tenor.googleapis.com",
    "https://g.tenor.com",
  ]);

  const fontSrc = uniq([
    "'self'",
    "data:",
    "https://fonts.gstatic.com",
    "https://fonts.reown.com",
    "https://dnclu2fna0b2b.cloudfront.net",
    "https://cdnjs.cloudflare.com",
  ]);

  const imgSrc = uniq([
    "'self'",
    "https:",
    "data:",
    "blob:",
    "ipfs:",
  ]);

  const mediaSrc = uniq([
    "'self'",
    "blob:",
    "https://*.cloudfront.net",
    "https://videos.files.wordpress.com",
    "https://arweave.net",
    "https://*.arweave.net",
    "https://cf-ipfs.com",
    "https://*.twimg.com",
    "https://artblocks.io",
    "https://*.artblocks.io",
  ]);

  const frameSrc = uniq([
    "'self'",
    "https://ipfs.io",
    "https://cf-ipfs.com",
    "https://media.generator.seize.io",
    "https://media.generator.6529.io",
    "https://generator.seize.io",
    "https://arweave.net",
    "https://*.arweave.net",
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
  ]);

  const styleSrc = uniq([
    "'self'",
    // TODO: remove once all inline styles are migrated to nonced styles.
    "'unsafe-inline'",
    "https://fonts.googleapis.com",
    "https://dnclu2fna0b2b.cloudfront.net",
    "https://cdnjs.cloudflare.com",
    "https://cdn.jsdelivr.net",
  ]);

  const maybeDevOnly = isProd
    ? []
    : (["http://localhost:*", "http://127.0.0.1:*", "ws://localhost:*"] as const);

  const prodOnlyFiltered = (values: readonly string[]) =>
    isProd
      ? values.filter(
          (v) =>
            !v.startsWith("http://") &&
            !v.startsWith("ws://") &&
            v !== "http:" &&
            v !== "ws:"
        )
      : values;

  const connectSrcFinal = prodOnlyFiltered([...connectSrc, ...maybeDevOnly]);
  const imgSrcFinal = prodOnlyFiltered([...imgSrc, ...maybeDevOnly]);
  const styleSrcFinal = prodOnlyFiltered(styleSrc);
  const fontSrcFinal = prodOnlyFiltered(fontSrc);
  const scriptSrcFinal = prodOnlyFiltered(scriptSrc);
  const mediaSrcFinal = prodOnlyFiltered(mediaSrc);
  const frameSrcFinal = prodOnlyFiltered(frameSrc);

  return [
    `default-src 'none'`,
    `base-uri 'none'`,
    `frame-ancestors 'self'`,
    `script-src ${scriptSrcFinal.join(" ")}`,
    `connect-src ${connectSrcFinal.join(" ")}`,
    `font-src ${fontSrcFinal.join(" ")}`,
    `img-src ${imgSrcFinal.join(" ")}`,
    `media-src ${mediaSrcFinal.join(" ")}`,
    `frame-src ${frameSrcFinal.join(" ")}`,
    `style-src ${styleSrcFinal.join(" ")}`,
    `object-src 'none'`,
  ].join("; ");
}

export function createSecurityHeaders() {
  return [
    {
      key: "Strict-Transport-Security",
      value: "max-age=31536000; includeSubDomains; preload",
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

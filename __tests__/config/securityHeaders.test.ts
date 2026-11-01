import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { createSecurityHeaders } from "@/config/securityHeaders";

function findFilesMatching(directory: string, pattern: RegExp): string[] {
  const matches: string[] = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      matches.push(...findFilesMatching(entryPath, pattern));
      continue;
    }

    if (
      entry.isFile() &&
      /\.(?:js|jsx|ts|tsx|mdx)$/.test(entry.name) &&
      pattern.test(readFileSync(entryPath, "utf8"))
    ) {
      matches.push(relative(process.cwd(), entryPath));
    }
  }

  return matches.sort();
}

function getContentSecurityPolicy(
  options?: Parameters<typeof createSecurityHeaders>[3]
): string {
  return getContentSecurityPolicyFor(
    "https://api.6529.io",
    "https://ipfs.6529.io",
    options
  );
}

function getContentSecurityPolicyFor(
  apiEndpoint: string,
  ipfsGatewayEndpoint: string,
  options?: Parameters<typeof createSecurityHeaders>[3]
): string {
  const header = createSecurityHeaders(
    apiEndpoint,
    ipfsGatewayEndpoint,
    "",
    options
  ).find((candidate) => candidate.key === "Content-Security-Policy");

  if (!header) {
    throw new Error("Content-Security-Policy header was not created.");
  }

  return header.value;
}

function getHeaderValue(
  key: string,
  options?: Parameters<typeof createSecurityHeaders>[3]
): string | undefined {
  return createSecurityHeaders(
    "https://api.6529.io",
    "https://ipfs.6529.io",
    "",
    options
  ).find((candidate) => candidate.key === key)?.value;
}

const SENTRY_PUBLIC_KEY = "0123456789abcdef0123456789abcdef";
const SENTRY_DSN = `https://${SENTRY_PUBLIC_KEY}@o123.ingest.us.sentry.io/456`;
const SENTRY_SECURITY_ENDPOINT = `https://o123.ingest.us.sentry.io/api/456/security/?sentry_key=${SENTRY_PUBLIC_KEY}`;

function getPermissionsPolicy(): string {
  const header = createSecurityHeaders(
    "https://api.6529.io",
    "https://ipfs.6529.io"
  ).find((candidate) => candidate.key === "Permissions-Policy");

  if (!header) {
    throw new Error("Permissions-Policy header was not created.");
  }

  return header.value;
}

function getDirectiveSources(csp: string, name: string): string[] {
  const directive = csp
    .split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${name} `));

  if (!directive) {
    throw new Error(`Missing CSP directive: ${name}`);
  }

  return directive
    .slice(name.length + 1)
    .split(/\s+/)
    .filter(Boolean);
}

describe("createSecurityHeaders CSP", () => {
  it("uses scheme-limited connect sources instead of a wildcard host source", () => {
    const connectSrc = getDirectiveSources(
      getContentSecurityPolicy(),
      "connect-src"
    );

    expect(connectSrc).not.toContain("*");
    expect(connectSrc).toEqual(
      expect.arrayContaining([
        "'self'",
        "blob:",
        "https:",
        "wss:",
        "https://api.6529.io",
        "wss://*.walletconnect.com",
      ])
    );
  });

  it("uses scheme-limited image sources instead of a wildcard host source", () => {
    const imgSrc = getDirectiveSources(getContentSecurityPolicy(), "img-src");

    expect(imgSrc).not.toContain("*");
    expect(imgSrc).toEqual(
      expect.arrayContaining(["'self'", "data:", "blob:", "ipfs:", "https:"])
    );
  });

  it("blocks object and embed loads", () => {
    expect(
      getDirectiveSources(getContentSecurityPolicy(), "object-src")
    ).toEqual(["'none'"]);
  });

  it("restricts base URIs, form targets and framing ancestors to the same origin", () => {
    const policy = getContentSecurityPolicy();

    expect(getDirectiveSources(policy, "base-uri")).toEqual(["'self'"]);
    expect(getDirectiveSources(policy, "form-action")).toEqual(["'self'"]);
    expect(getDirectiveSources(policy, "frame-ancestors")).toEqual(["'self'"]);
  });

  it("keeps the legacy same-origin framing header aligned with frame-ancestors", () => {
    expect(getHeaderValue("X-Frame-Options")).toBe("SAMEORIGIN");
  });

  it("limits Google and YouTube frame sources to the hosts that are embedded", () => {
    const frameSrc = getDirectiveSources(
      getContentSecurityPolicy(),
      "frame-src"
    );

    expect(frameSrc).toEqual(
      expect.arrayContaining([
        "https://docs.google.com",
        "https://www.youtube-nocookie.com",
        "https://www.youtube.com",
      ])
    );
    expect(frameSrc).not.toContain("https://*.google.com");
    expect(frameSrc).not.toContain("https://drive.google.com");
    expect(frameSrc).not.toContain("https://*.youtube.com");
    expect(
      frameSrc.filter((source) => /google|youtube/.test(source)).sort()
    ).toEqual([
      "https://docs.google.com",
      "https://www.youtube-nocookie.com",
      "https://www.youtube.com",
    ]);
  });

  it("omits violation reporting when no Sentry DSN is configured", () => {
    const policy = getContentSecurityPolicy();

    expect(policy).not.toContain("report-uri");
    expect(policy).not.toContain("report-to");
    expect(getHeaderValue("Reporting-Endpoints")).toBeUndefined();
    expect(
      getHeaderValue("Reporting-Endpoints", { sentryDsn: "" })
    ).toBeUndefined();
  });

  it("reports violations to the Sentry security endpoint derived from the public DSN", () => {
    const options = { sentryDsn: SENTRY_DSN };
    const policy = getContentSecurityPolicy(options);

    expect(getDirectiveSources(policy, "report-uri")).toEqual([
      SENTRY_SECURITY_ENDPOINT,
    ]);
    expect(getDirectiveSources(policy, "report-to")).toEqual(["csp-endpoint"]);
    expect(getHeaderValue("Reporting-Endpoints", options)).toBe(
      `csp-endpoint="${SENTRY_SECURITY_ENDPOINT}"`
    );
  });

  it("reports the security endpoint for regional Sentry ingest hosts", () => {
    expect(
      getDirectiveSources(
        getContentSecurityPolicy({
          sentryDsn: `https://${SENTRY_PUBLIC_KEY}@o123.ingest.de.sentry.io/789`,
        }),
        "report-uri"
      )
    ).toEqual([
      `https://o123.ingest.de.sentry.io/api/789/security/?sentry_key=${SENTRY_PUBLIC_KEY}`,
    ]);
  });

  it.each([
    "not a url",
    `http://${SENTRY_PUBLIC_KEY}@o123.ingest.us.sentry.io/456`,
    "https://o123.ingest.us.sentry.io/456",
    `https://${SENTRY_PUBLIC_KEY}@o123.ingest.us.sentry.io/`,
    `https://${SENTRY_PUBLIC_KEY}@o123.ingest.us.sentry.io/project`,
    `https://${SENTRY_PUBLIC_KEY}@o123.ingest.us.sentry.io/prefix/456`,
    `https://${SENTRY_PUBLIC_KEY}@o123.ingest.us.sentry.io/456/extra`,
    "https://short@o123.ingest.us.sentry.io/456",
    `https://${SENTRY_PUBLIC_KEY};x@o123.ingest.us.sentry.io/456`,
    `https://${SENTRY_PUBLIC_KEY}@o123.ingest.us.sentry.io;script-src/456`,
    `https://${SENTRY_PUBLIC_KEY}@o123.ingest.us.sentry.io:8443/456`,
    // Only Sentry's hosted ingest hosts: the read-only E2E guard ignores CSP
    // report POSTs to those hosts and would block any other.
    `https://${SENTRY_PUBLIC_KEY}@telemetry.example/456`,
    `https://${SENTRY_PUBLIC_KEY}@sentry.io/456`,
    `https://${SENTRY_PUBLIC_KEY}@o123.ingest.eu.sentry.io/456`,
    `https://${SENTRY_PUBLIC_KEY}@o123.ingest.us.sentry.io.example/456`,
  ])(
    "ignores a Sentry DSN that cannot form a safe report endpoint: %s",
    (dsn) => {
      const options = { sentryDsn: dsn };

      expect(getContentSecurityPolicy(options)).not.toContain("report-uri");
      expect(getHeaderValue("Reporting-Endpoints", options)).toBeUndefined();
    }
  );

  it("lets the page load its own web app manifest and nothing else", () => {
    expect(
      getDirectiveSources(getContentSecurityPolicy(), "manifest-src")
    ).toEqual(["'self'"]);
  });

  it("allows passive artwork previews only from the two archive buckets without broadening active content", () => {
    const policy = getContentSecurityPolicy();
    const mediaSrc = getDirectiveSources(policy, "media-src");
    const archives = [
      "https://6529-artwork-documentation-987989283142-eu-west-1.s3.eu-west-1.amazonaws.com",
      "https://6529-artwork-documentation-987989283142-us-east-1.s3.us-east-1.amazonaws.com",
    ];
    expect(mediaSrc).toEqual(expect.arrayContaining(archives));
    expect(mediaSrc).not.toContain("https:");
    expect(mediaSrc).not.toContain("https://*.amazonaws.com");
    expect(mediaSrc).not.toContain("https://*.s3.amazonaws.com");
    for (const directive of ["script-src", "frame-src", "object-src"]) {
      const sources = getDirectiveSources(policy, directive);
      for (const origin of archives) expect(sources).not.toContain(origin);
    }
  });

  it("omits unsafe-eval unless explicitly enabled for local tooling", () => {
    expect(
      getDirectiveSources(getContentSecurityPolicy(), "script-src")
    ).not.toContain("'unsafe-eval'");

    expect(
      getDirectiveSources(
        getContentSecurityPolicy({ allowUnsafeEval: true }),
        "script-src"
      )
    ).toContain("'unsafe-eval'");
  });

  it("adds wasm-unsafe-eval only when encrypted messages need WebAssembly", () => {
    const defaultSources = getDirectiveSources(
      getContentSecurityPolicy(),
      "script-src"
    );
    expect(defaultSources).not.toContain("'wasm-unsafe-eval'");

    const e2eeSources = getDirectiveSources(
      getContentSecurityPolicy({ allowWasmUnsafeEval: true }),
      "script-src"
    );
    expect(e2eeSources).toContain("'wasm-unsafe-eval'");
    // WebAssembly compilation must not widen JavaScript eval.
    expect(e2eeSources).not.toContain("'unsafe-eval'");
    expect(
      getDirectiveSources(
        getContentSecurityPolicy({ allowWasmUnsafeEval: true }),
        "connect-src"
      )
    ).not.toContain("'wasm-unsafe-eval'");
  });

  it("keeps inline script and style exceptions explicit", () => {
    expect(
      getDirectiveSources(getContentSecurityPolicy(), "script-src")
    ).toContain("'unsafe-inline'");
    expect(
      getDirectiveSources(getContentSecurityPolicy(), "style-src")
    ).toContain("'unsafe-inline'");
  });

  it("does not allow clear-text CDN style sources", () => {
    const styleSrc = getDirectiveSources(
      getContentSecurityPolicy(),
      "style-src"
    );

    expect(styleSrc.some((source) => source.startsWith("http:"))).toBe(false);
  });

  it("does not leave protocol-relative cdnjs links in app pages", () => {
    expect(
      findFilesMatching(
        join(process.cwd(), "app"),
        /(^|[^:])\/\/cdnjs\.cloudflare\.com/
      )
    ).toEqual([]);
  });

  it("omits insecure remote API endpoints from connect sources", () => {
    const insecureRemoteApiEndpoint = "http:" + "//api.example.com";
    const connectSrc = getDirectiveSources(
      getContentSecurityPolicyFor(
        insecureRemoteApiEndpoint,
        "https://ipfs.6529.io"
      ),
      "connect-src"
    );

    expect(connectSrc).not.toContain(insecureRemoteApiEndpoint);
    expect(connectSrc.some((source) => source.startsWith("http:"))).toBe(false);
  });

  it("only allows insecure loopback API endpoints when enabled for local tooling", () => {
    const localApiEndpoint = "http:" + "//localhost:3000";

    expect(
      getDirectiveSources(
        getContentSecurityPolicyFor(localApiEndpoint, "https://ipfs.6529.io"),
        "connect-src"
      )
    ).not.toContain(localApiEndpoint);

    expect(
      getDirectiveSources(
        getContentSecurityPolicyFor(localApiEndpoint, "https://ipfs.6529.io", {
          allowInsecureLocalhostConnectSrc: true,
        }),
        "connect-src"
      )
    ).toContain(localApiEndpoint);
  });

  it("only allows insecure loopback WebSocket endpoints when enabled for local tooling", () => {
    const localWebSocketEndpoint = "ws:" + "//localhost:3000";

    expect(
      getDirectiveSources(
        getContentSecurityPolicy({
          webSocketEndpoint: localWebSocketEndpoint,
        }),
        "connect-src"
      )
    ).not.toContain(localWebSocketEndpoint);

    expect(
      getDirectiveSources(
        getContentSecurityPolicy({
          allowInsecureLocalhostConnectSrc: true,
          webSocketEndpoint: localWebSocketEndpoint,
        }),
        "connect-src"
      )
    ).toContain(localWebSocketEndpoint);
  });

  it("omits insecure remote WebSocket endpoints even when local tooling is enabled", () => {
    const remoteWebSocketEndpoint = "ws:" + "//api.example.com";
    const connectSrc = getDirectiveSources(
      getContentSecurityPolicy({
        allowInsecureLocalhostConnectSrc: true,
        webSocketEndpoint: remoteWebSocketEndpoint,
      }),
      "connect-src"
    );

    expect(connectSrc).not.toContain(remoteWebSocketEndpoint);
    expect(connectSrc.some((source) => source.startsWith("ws:"))).toBe(false);
  });

  it("only includes a configured IPFS gateway when it is HTTPS", () => {
    expect(getContentSecurityPolicy()).toContain("https://ipfs.6529.io");
    expect(
      getContentSecurityPolicyFor(
        "https://api.6529.io",
        "http://ipfs.example.com"
      )
    ).not.toContain("http://ipfs.example.com");
  });

  it("omits browser-rejected permissions policy directives", () => {
    const permissionsPolicy = getPermissionsPolicy();

    expect(permissionsPolicy).not.toContain("ambient-light-sensor");
    expect(permissionsPolicy).not.toContain("battery");
    expect(permissionsPolicy).not.toContain("document-domain");
    expect(permissionsPolicy).not.toContain("execution-while-not-rendered");
    expect(permissionsPolicy).not.toContain("execution-while-out-of-viewport");
  });

  it("omits the web-share token that Chromium does not recognize", () => {
    expect(getPermissionsPolicy()).not.toContain("web-share");
  });

  it("allows same-origin autoplay for muted in-app video", () => {
    const permissionsPolicy = getPermissionsPolicy();

    expect(permissionsPolicy).toContain("autoplay=(self)");
    expect(permissionsPolicy).not.toContain("autoplay=()");
  });

  it("pins the exact Permissions-Policy header", () => {
    expect(getPermissionsPolicy()).toBe(
      [
        "accelerometer=()",
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
        "publickey-credentials-get=()",
        "screen-wake-lock=()",
        "sync-xhr=()",
        "usb=()",
        "xr-spatial-tracking=()",
      ].join(", ")
    );
  });
});

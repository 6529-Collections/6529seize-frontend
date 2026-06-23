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

  it("omits unsafe-eval unless explicitly enabled for local tooling", () => {
    expect(
      getDirectiveSources(getContentSecurityPolicy(), "script-src")
    ).not.toContain("'unsafe-eval'");

    expect(
      getDirectiveSources(
        getContentSecurityPolicy({ allowUnsafeEval: true }),
        "script-src"
      )
    ).not.toContain("'unsafe-eval'");
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
    ).not.toContain(localApiEndpoint);
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
    ).not.toContain(localWebSocketEndpoint);
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
});

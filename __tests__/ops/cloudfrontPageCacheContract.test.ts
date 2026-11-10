/**
 * @jest-environment node
 */

import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import {
  NEXT_ROUTER_PREFETCH_HEADER,
  NEXT_ROUTER_SEGMENT_PREFETCH_HEADER,
  NEXT_ROUTER_STATE_TREE_HEADER,
  NEXT_URL,
  RSC_HEADER,
} from "next/dist/client/components/app-router-headers";
import { API_AUTH_COOKIE } from "@/constants/constants";
import { VALIDATOR_ACCESS_COOKIE } from "@/lib/validator-page/accessGate";
import { WALLET_AUTH_COOKIE } from "@/services/auth/wallet-auth-cookie";

/**
 * The page edge cache (ops/docs/developer/cloudfront-page-cache.md) is only
 * safe while its cache key holds every request input the origin uses to shape
 * a cacheable response. These tests keep the policy files and the application
 * in step.
 */

const ROOT = process.cwd();
const EDGE_DIR = join(ROOT, "ops/cloudfront/frontend-html");
const RUNBOOK = "ops/docs/developer/cloudfront-page-cache.md";

interface CachePolicy {
  readonly DefaultTTL: number;
  readonly MinTTL: number;
  readonly ParametersInCacheKeyAndForwardedToOrigin: {
    readonly HeadersConfig: { readonly Headers?: { readonly Items: string[] } };
    readonly CookiesConfig: {
      readonly CookieBehavior: string;
      readonly Cookies?: { readonly Items: string[] };
    };
    readonly QueryStringsConfig: { readonly QueryStringBehavior: string };
  };
}

interface CacheBehavior {
  readonly PathPattern?: string;
  readonly CachePolicyId: string;
}

interface Distribution {
  readonly _DoNotApplyAsWritten?: string;
  readonly WebACLId: string;
  readonly Origins: {
    readonly Items: Array<{
      readonly Id: string;
      readonly CustomHeaders: {
        readonly Quantity: number;
        readonly Items?: Array<{ HeaderName: string; HeaderValue: string }>;
      };
    }>;
  };
  readonly DefaultCacheBehavior: CacheBehavior;
  readonly CacheBehaviors: { readonly Items: CacheBehavior[] };
}

function readJson<T>(name: string): T {
  return JSON.parse(readFileSync(join(EDGE_DIR, name), "utf8")) as T;
}

const htmlPolicy = readJson<CachePolicy>("cache-policy-html.json");
const ogPolicy = readJson<CachePolicy>("cache-policy-og.json");
const production = readJson<Distribution>("distribution-production.json");

function keyedCookies(policy: CachePolicy): string[] {
  const config = policy.ParametersInCacheKeyAndForwardedToOrigin.CookiesConfig;
  return config.CookieBehavior === "whitelist"
    ? (config.Cookies?.Items ?? [])
    : [];
}

function keyedHeaders(policy: CachePolicy): string[] {
  return (
    policy.ParametersInCacheKeyAndForwardedToOrigin.HeadersConfig.Headers
      ?.Items ?? []
  ).map((header) => header.toLowerCase());
}

// Policy ids from the runbook's Setup table.
const HTML_POLICY_ID = "3d5e2933-ef97-4ca2-b075-14d8de39deff";
const OG_POLICY_ID = "d1fd2602-5e5a-4a50-ac66-82af1ad19c52";
const CACHING_DISABLED_POLICY_ID = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad";

// ---------------------------------------------------------------------------
// Server-side cookie reads
// ---------------------------------------------------------------------------

const SERVER_SOURCE_ROOTS = [
  "app",
  "components",
  "config",
  "contexts",
  "helpers",
  "hooks",
  "lib",
  "services",
  "utils",
  "proxy.ts",
  "instrumentation.ts",
];

/** Cookie-name constants server code passes to the cookie readers. */
const KNOWN_COOKIE_NAME_CONSTANTS: Readonly<Record<string, string>> = {
  API_AUTH_COOKIE,
  VALIDATOR_ACCESS_COOKIE,
  WALLET_AUTH_COOKIE,
};

/**
 * Route families answered through a cache behaviour with its own policy.
 * Everything else uses the default page policy.
 */
const ROUTE_POLICIES: ReadonlyArray<{
  readonly sourcePrefix: string;
  readonly policyFile: string;
  readonly policy: CachePolicy;
}> = [
  {
    sourcePrefix: "app/api/og-metadata/",
    policyFile: "cache-policy-og.json",
    policy: ogPolicy,
  },
];

function listSourceFiles(entry: string): string[] {
  const absolute = join(ROOT, entry);
  if (/\.(?:ts|tsx)$/.test(entry)) {
    return [absolute];
  }
  const files: string[] = [];
  for (const dirent of readdirSync(absolute, { withFileTypes: true })) {
    const child = join(absolute, dirent.name);
    if (dirent.isDirectory()) {
      files.push(...listSourceFiles(relative(ROOT, child)));
    } else if (
      /\.(?:ts|tsx)$/.test(dirent.name) &&
      !dirent.name.endsWith(".d.ts")
    ) {
      files.push(child);
    }
  }
  return files;
}

/**
 * True when the module starts with a "use client" directive, allowing only
 * whitespace and comments before it. Scans by index, so it cannot backtrack.
 */
function startsWithUseClient(source: string): boolean {
  let rest = source.trimStart();
  for (;;) {
    if (rest.startsWith("//")) {
      const lineEnd = rest.indexOf("\n");
      if (lineEnd === -1) {
        return false;
      }
      rest = rest.slice(lineEnd + 1).trimStart();
    } else if (rest.startsWith("/*")) {
      const commentEnd = rest.indexOf("*/", 2);
      if (commentEnd === -1) {
        return false;
      }
      rest = rest.slice(commentEnd + 2).trimStart();
    } else {
      break;
    }
  }
  return rest.startsWith('"use client"') || rest.startsWith("'use client'");
}

interface CookieRead {
  readonly file: string;
  readonly argument: string;
}

/**
 * Finds every cookie the module reads through `next/headers` `cookies()` or a
 * `NextRequest`'s `cookies`. Returns `unresolved` entries for reads the scan
 * cannot attribute to a single named cookie.
 */
function scanCookieReads(file: string, source: string) {
  const reads: CookieRead[] = [];
  const unresolved: string[] = [];
  const receivers = new Set<string>();

  for (const match of source.matchAll(
    /(?:const|let)\s+(\w+)\s*=\s*await\s+cookies\(\)/g
  )) {
    receivers.add(match[1]!);
  }
  for (const match of source.matchAll(
    /\[([^\]]+)\]\s*=\s*await\s+Promise\.all\(\[([^\]]+)\]/g
  )) {
    const names = match[1]!.split(",").map((name) => name.trim());
    const calls = match[2]!.split(",").map((call) => call.trim());
    calls.forEach((call, index) => {
      if (call === "cookies()" && names[index]) {
        receivers.add(names[index]);
      }
    });
  }

  const usesCookiesFn = /\bcookies\(\)/.test(source);
  if (usesCookiesFn && receivers.size === 0) {
    unresolved.push(
      "calls cookies() in a form this test cannot follow; bind it to a const"
    );
  }

  const receiverPattern = [
    String.raw`\b\w+\.cookies`,
    String.raw`\(await cookies\(\)\)`,
    ...[...receivers].map((name) => String.raw`\b${name}`),
  ].join("|");
  const readPattern = new RegExp(
    String.raw`(?:${receiverPattern})\.(get|has|getAll)\(\s*([^)]*?)\s*\)`,
    "g"
  );
  for (const match of source.matchAll(readPattern)) {
    if (match[1] === "getAll") {
      unresolved.push("reads every cookie with getAll()");
      continue;
    }
    reads.push({ file, argument: match[2]! });
  }

  if (
    /headers\.get\(\s*["']cookie["']\s*\)|\.headers\.cookie\b/i.test(source)
  ) {
    unresolved.push("parses the raw Cookie header");
  }

  return { reads, unresolved };
}

function resolveCookieName(argument: string): string | undefined {
  const literal = /^["'`]([^"'`]+)["'`]$/.exec(argument)?.[1];
  return literal ?? KNOWN_COOKIE_NAME_CONSTANTS[argument];
}

function collectServerCookieReads() {
  const reads: Array<CookieRead & { readonly name: string | undefined }> = [];
  const problems: string[] = [];

  for (const file of SERVER_SOURCE_ROOTS.flatMap(listSourceFiles)) {
    const source = readFileSync(file, "utf8");
    if (startsWithUseClient(source)) {
      continue;
    }
    const relativeFile = relative(ROOT, file).replaceAll("\\", "/");
    const scan = scanCookieReads(relativeFile, source);
    for (const issue of scan.unresolved) {
      problems.push(`${relativeFile} ${issue}`);
    }
    for (const read of scan.reads) {
      reads.push({ ...read, name: resolveCookieName(read.argument) });
    }
  }

  return { reads, problems };
}

function missingFromPolicyMessage(
  file: string,
  cookie: string,
  policyFile: string
): string {
  return (
    `${file} reads the cookie "${cookie}" on the server, but the page edge ` +
    `cache does not key on it. Add "${cookie}" to ` +
    `ops/cloudfront/frontend-html/${policyFile} and apply the policy to ` +
    `CloudFront (see ${RUNBOOK}) before reading it server-side; otherwise a ` +
    `response shaped by one visitor's cookie can be served to another.`
  );
}

describe("page edge cache key vs. server cookie reads", () => {
  const { reads, problems } = collectServerCookieReads();

  it("finds the known server cookie readers", () => {
    const files = new Set(reads.map((read) => read.file));

    // Guards the scan itself: if these disappear, the patterns above went stale.
    for (const file of [
      "helpers/server.app.helpers.ts",
      "proxy.ts",
      "lib/validator-page/proxyGate.ts",
      "app/api/og-metadata/profiles/[identity]/route.ts",
      "app/validator/locked/page.tsx",
    ]) {
      expect([...files]).toContain(file);
    }
  });

  it("can name every cookie server code reads", () => {
    const unnamed = reads
      .filter((read) => read.name === undefined)
      .map(
        (read) =>
          `${read.file} reads cookie ${read.argument}: use a string literal or ` +
          `a constant listed in KNOWN_COOKIE_NAME_CONSTANTS, and add the cookie ` +
          `to the edge cache policy first`
      );

    expect([...problems, ...unnamed]).toEqual([]);
  });

  it("keys the default page policy on every cookie server code reads", () => {
    const keyed = new Set(keyedCookies(htmlPolicy));
    const missing = reads
      .filter((read) => read.name !== undefined && !keyed.has(read.name))
      .map((read) =>
        missingFromPolicyMessage(
          read.file,
          read.name!,
          "cache-policy-html.json"
        )
      );

    expect(missing).toEqual([]);
  });

  it("keys each route-specific policy on the cookies its routes read", () => {
    const missing: string[] = [];
    for (const { sourcePrefix, policyFile, policy } of ROUTE_POLICIES) {
      const keyed = new Set(keyedCookies(policy));
      for (const read of reads) {
        if (
          read.file.startsWith(sourcePrefix) &&
          read.name !== undefined &&
          !keyed.has(read.name)
        ) {
          missing.push(
            missingFromPolicyMessage(read.file, read.name, policyFile)
          );
        }
      }
    }

    expect(missing).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Request headers and query strings Next varies on
// ---------------------------------------------------------------------------

describe("page edge cache key vs. Next's response variants", () => {
  const varyHeaders = [
    RSC_HEADER,
    NEXT_ROUTER_STATE_TREE_HEADER,
    NEXT_ROUTER_PREFETCH_HEADER,
    NEXT_ROUTER_SEGMENT_PREFETCH_HEADER,
    NEXT_URL,
  ];

  it("keys on every request header Next lists in Vary", () => {
    const keyed = new Set(keyedHeaders(htmlPolicy));

    for (const header of varyHeaders) {
      if (!keyed.has(header.toLowerCase())) {
        throw new Error(
          `Next varies responses on the "${header}" request header, but ` +
            `ops/cloudfront/frontend-html/cache-policy-html.json does not ` +
            `key on it. Add it to the policy and apply it (see ${RUNBOOK}).`
        );
      }
    }
  });

  it("still matches the headers the installed Next puts in Vary", () => {
    const baseServer = readFileSync(
      require.resolve("next/dist/server/base-server.js"),
      "utf8"
    );
    const start = baseServer.indexOf("setVaryHeader(req, res");
    const end = baseServer.indexOf("\n    async ", start);
    expect(start).toBeGreaterThan(-1);

    const used = new Set(
      [
        ...baseServer.slice(start, end).matchAll(/_approuterheaders\.(\w+)/g),
      ].map((match) => match[1])
    );

    // A Next upgrade that varies on another header must update this list and
    // the edge cache policy together.
    expect([...used].sort()).toEqual(
      [
        "NEXT_ROUTER_PREFETCH_HEADER",
        "NEXT_ROUTER_SEGMENT_PREFETCH_HEADER",
        "NEXT_ROUTER_STATE_TREE_HEADER",
        "NEXT_URL",
        "RSC_HEADER",
      ].sort()
    );
  });

  it("keys on every query string, so `_rsc` separates RSC from HTML", () => {
    expect(
      htmlPolicy.ParametersInCacheKeyAndForwardedToOrigin.QueryStringsConfig
        .QueryStringBehavior
    ).toBe("all");
  });

  it("stores only what the origin marks cacheable", () => {
    for (const policy of [htmlPolicy, ogPolicy]) {
      expect(policy.DefaultTTL).toBe(0);
      expect(policy.MinTTL).toBe(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Production distribution record
// ---------------------------------------------------------------------------

describe("production distribution record", () => {
  it("names the web ACL attached to the live distribution", () => {
    expect(production.WebACLId).toMatch(
      /^arn:aws:wafv2:us-east-1:\d{12}:global\/webacl\/[\w-]+\/[0-9a-f-]{36}$/
    );
  });

  it("records the origin verification header with a placeholder, never its value", () => {
    const origin = production.Origins.Items.find(
      (item) => item.Id === "production-alb-https"
    );
    const headers = origin?.CustomHeaders.Items ?? [];

    expect(origin?.CustomHeaders.Quantity).toBe(headers.length);
    expect(headers.map((header) => header.HeaderName)).toEqual([
      "X-Origin-Verify",
    ]);
    expect(headers[0]?.HeaderValue).toMatch(/^UNRESOLVED_PLACEHOLDER_/);
  });

  it("carries a key the AWS CLI rejects, so the file is never applied as written", () => {
    expect(production._DoNotApplyAsWritten).toContain(
      "get-distribution-config"
    );
  });

  it("routes pages, crawler cards and uncached paths to their policies", () => {
    const byPattern = new Map(
      production.CacheBehaviors.Items.map((behavior) => [
        behavior.PathPattern,
        behavior.CachePolicyId,
      ])
    );

    expect(production.DefaultCacheBehavior.CachePolicyId).toBe(HTML_POLICY_ID);
    expect(byPattern.get("/api/og-metadata/*")).toBe(OG_POLICY_ID);
    expect(byPattern.get("/validator*")).toBe(CACHING_DISABLED_POLICY_ID);
    expect(byPattern.get("/my-stream*")).toBe(CACHING_DISABLED_POLICY_ID);
  });
});

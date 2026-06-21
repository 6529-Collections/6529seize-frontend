import type { BrowserContext, Route } from "@playwright/test";

import mutationRegistry from "../../ops/testing-strategy/mutation-endpoint-registry.json";

type MutationEndpoint = {
  id: string;
  pattern: string;
  methods: string[];
};

export type PlaywrightEnvironment =
  | "local"
  | "staging"
  | "production"
  | "remote";

export type ReadonlyRequestInput = {
  baseURL?: string | undefined;
  method: string;
  postData?: string | null | undefined;
  url: string;
  readonly: boolean;
};

export type ReadonlyRequestDecision = {
  action: "allow" | "abort" | "block";
  reason: string;
  ruleId?: string;
};

export type BlockedReadonlyRequest = {
  method: string;
  url: string;
  reason: string;
  ruleId?: string | undefined;
};

export type InstalledReadonlyMutationGuard = {
  blockedRequests: BlockedReadonlyRequest[];
  assertNoBlockedRequests: () => void;
};

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const STAGING_HOSTNAME = "staging.6529.io";
const PRODUCTION_HOSTNAMES = new Set(["6529.io", "www.6529.io"]);

const IGNORED_EXTERNAL_MUTATION_HOSTS = [
  /(^|\.)mixpanel\.com$/i,
  /(^|\.)ingest\.sentry\.io$/i,
  /^dataplane\.rum\.[a-z0-9-]+\.amazonaws\.com$/i,
];
const GOOGLE_COLLECT_HOSTS = new Set([
  "analytics.google.com",
  "www.google-analytics.com",
  "www.google.com",
]);
const WALLETCONNECT_RPC_HOST = "rpc.walletconnect.org";
const SAFE_WALLETCONNECT_RPC_METHODS = new Set([
  "eth_accounts",
  "eth_blockNumber",
  "eth_call",
  "eth_chainId",
  "eth_estimateGas",
  "eth_feeHistory",
  "eth_gasPrice",
  "eth_getBalance",
  "eth_getBlockByHash",
  "eth_getBlockByNumber",
  "eth_getBlockTransactionCountByHash",
  "eth_getBlockTransactionCountByNumber",
  "eth_getCode",
  "eth_getLogs",
  "eth_getStorageAt",
  "eth_getTransactionByHash",
  "eth_getTransactionCount",
  "eth_getTransactionReceipt",
  "eth_maxPriorityFeePerGas",
  "net_version",
  "web3_clientVersion",
]);

function parseUrl(url: string) {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

export function inferPlaywrightEnvironment(
  baseURL?: string
): PlaywrightEnvironment {
  const explicit = process.env["PLAYWRIGHT_ENV"];
  if (
    explicit === "local" ||
    explicit === "staging" ||
    explicit === "production" ||
    explicit === "remote"
  ) {
    return explicit;
  }

  const parsed = baseURL ? parseUrl(baseURL) : null;
  if (parsed?.hostname === STAGING_HOSTNAME) {
    return "staging";
  }
  if (parsed && PRODUCTION_HOSTNAMES.has(parsed.hostname)) {
    return "production";
  }
  if (
    parsed &&
    parsed.hostname !== "localhost" &&
    parsed.hostname !== "127.0.0.1"
  ) {
    return "remote";
  }
  return "local";
}

export function shouldUseReadonlyGuard(baseURL?: string) {
  const explicit = process.env["PLAYWRIGHT_READONLY"];
  if (explicit === "0" || explicit === "false") {
    return false;
  }
  if (explicit === "1" || explicit === "true") {
    return true;
  }

  const environment = inferPlaywrightEnvironment(baseURL);
  return environment === "staging" || environment === "production";
}

function isIgnoredExternalMutation(url: URL) {
  if (
    url.hostname === "cca-lite.coinbase.com" &&
    (url.pathname === "/amp" || url.pathname === "/metrics")
  ) {
    return true;
  }

  if (url.hostname === "pulse.walletconnect.org" && url.pathname === "/batch") {
    return true;
  }

  if (GOOGLE_COLLECT_HOSTS.has(url.hostname) && url.pathname === "/g/collect") {
    return true;
  }

  if (url.hostname === "www.googletagmanager.com" && url.pathname === "/td") {
    return true;
  }

  if (
    (url.hostname === "www.youtube.com" || url.hostname === "youtube.com") &&
    url.pathname.startsWith("/api/stats/")
  ) {
    return true;
  }

  return IGNORED_EXTERNAL_MUTATION_HOSTS.some((pattern) =>
    pattern.test(url.hostname)
  );
}

function isSameOrigin(url: URL, baseURL?: string) {
  const base = baseURL ? parseUrl(baseURL) : null;
  return base?.origin === url.origin;
}

function isFirstPartyTelemetryEndpoint(url: URL, baseURL?: string) {
  return (
    isSameOrigin(url, baseURL) &&
    (url.pathname === "/monitoring" || url.pathname.startsWith("/monitoring/"))
  );
}

function isFirstPartyReadonlyRouteHandler(
  method: string,
  url: URL,
  baseURL?: string
) {
  return (
    method === "POST" &&
    isSameOrigin(url, baseURL) &&
    url.pathname === "/api/open-graph"
  );
}

function isNextDevInspectorEndpoint(url: URL, baseURL?: string) {
  return (
    isSameOrigin(url, baseURL) &&
    (url.pathname === "/__nextjs_original-stack-frame" ||
      url.pathname === "/__nextjs_original-stack-frames")
  );
}

function isWalletConnectRpc(url: URL) {
  return url.hostname === WALLETCONNECT_RPC_HOST && url.pathname === "/v1/";
}

function parseJsonRpcPayload(postData?: string | null) {
  if (!postData) {
    return null;
  }

  try {
    return JSON.parse(postData) as unknown;
  } catch {
    return null;
  }
}

function getJsonRpcCalls(payload: unknown) {
  if (Array.isArray(payload)) {
    return payload;
  }
  return [payload];
}

function isSafeWalletConnectRpcPost(postData?: string | null) {
  const payload = parseJsonRpcPayload(postData);
  if (!payload) {
    return false;
  }

  const calls = getJsonRpcCalls(payload);
  if (calls.length === 0) {
    return false;
  }

  return calls.every((call) => {
    if (!call || typeof call !== "object" || Array.isArray(call)) {
      return false;
    }

    const method = (call as { method?: unknown }).method;
    return (
      typeof method === "string" && SAFE_WALLETCONNECT_RPC_METHODS.has(method)
    );
  });
}

export function sanitizeReadonlyRequestUrl(url: string) {
  const parsed = parseUrl(url);
  if (!parsed || !["http:", "https:"].includes(parsed.protocol)) {
    return url;
  }

  const redactedSuffix = parsed.search || parsed.hash ? "?[redacted]" : "";
  return `${parsed.origin}${parsed.pathname}${redactedSuffix}`;
}

function wildcardPatternToRegExp(pattern: string) {
  let source = "";
  for (let index = 0; index < pattern.length; index += 1) {
    if (pattern.startsWith("**", index)) {
      source += ".*";
      index += 1;
      continue;
    }

    const char = pattern[index];
    if (char === "*") {
      source += "[^/]*";
    } else {
      source += char?.replace(/[.+?^${}()|[\]\\]/g, "\\$&") ?? "";
    }
  }

  return new RegExp(`^${source}$`);
}

function getUrlCandidates(
  endpoint: MutationEndpoint,
  url: URL,
  baseURL?: string
) {
  const candidates = [url.href, `${url.origin}${url.pathname}`];

  if (endpoint.pattern.startsWith("/")) {
    const base = baseURL ? parseUrl(baseURL) : null;
    if (base?.origin === url.origin) {
      candidates.push(url.pathname);
    }
  }

  return candidates;
}

function endpointMatches(
  endpoint: MutationEndpoint,
  method: string,
  url: URL,
  baseURL?: string
) {
  if (!endpoint.methods.includes(method)) {
    return false;
  }

  const urlCandidates = getUrlCandidates(endpoint, url, baseURL);
  const matcher = wildcardPatternToRegExp(endpoint.pattern);
  return urlCandidates.some((candidate) => matcher.test(candidate));
}

function registryMatch(method: string, url: URL, baseURL?: string) {
  const endpoints = mutationRegistry.endpoints as MutationEndpoint[];
  return endpoints.find((endpoint) =>
    endpointMatches(endpoint, method, url, baseURL)
  );
}

export function decideReadonlyRequest({
  baseURL,
  method,
  postData,
  readonly,
  url,
}: ReadonlyRequestInput): ReadonlyRequestDecision {
  const upperMethod = method.toUpperCase();
  if (!readonly || SAFE_METHODS.has(upperMethod)) {
    return { action: "allow", reason: "safe-method-or-readonly-disabled" };
  }

  const parsed = parseUrl(url);
  if (!parsed || !["http:", "https:"].includes(parsed.protocol)) {
    return { action: "allow", reason: "non-http-url" };
  }

  if (isFirstPartyReadonlyRouteHandler(upperMethod, parsed, baseURL)) {
    return { action: "allow", reason: "first-party-readonly-route-handler" };
  }

  if (isNextDevInspectorEndpoint(parsed, baseURL)) {
    return { action: "abort", reason: "ignored-next-dev-inspector" };
  }

  const endpoint = registryMatch(upperMethod, parsed, baseURL);
  if (endpoint) {
    return {
      action: "block",
      reason: "registered-mutation-endpoint",
      ruleId: endpoint.id,
    };
  }

  if (isFirstPartyTelemetryEndpoint(parsed, baseURL)) {
    return { action: "abort", reason: "ignored-first-party-telemetry" };
  }

  if (isWalletConnectRpc(parsed)) {
    if (isSafeWalletConnectRpcPost(postData)) {
      return { action: "allow", reason: "read-only-walletconnect-rpc" };
    }

    return { action: "block", reason: "unsafe-walletconnect-rpc" };
  }

  if (isIgnoredExternalMutation(parsed)) {
    return { action: "abort", reason: "ignored-external-sdk-endpoint" };
  }

  return {
    action: "block",
    reason: "non-allowlisted-mutation",
  };
}

export async function installReadonlyMutationGuard(
  context: BrowserContext,
  baseURL?: string
): Promise<InstalledReadonlyMutationGuard> {
  const readonly = shouldUseReadonlyGuard(baseURL);
  const blockedRequests: BlockedReadonlyRequest[] = [];

  if (!readonly) {
    return {
      blockedRequests,
      assertNoBlockedRequests: () => undefined,
    };
  }

  await context.route("**/*", async (route: Route) => {
    const request = route.request();
    const decision = decideReadonlyRequest({
      baseURL,
      method: request.method(),
      postData: request.postData(),
      readonly,
      url: request.url(),
    });

    if (decision.action === "abort") {
      await route.abort("blockedbyclient");
      return;
    }

    if (decision.action === "block") {
      const blockedRequest: BlockedReadonlyRequest = {
        method: request.method(),
        url: sanitizeReadonlyRequestUrl(request.url()),
        reason: decision.reason,
      };
      if (decision.ruleId) {
        blockedRequest.ruleId = decision.ruleId;
      }
      blockedRequests.push(blockedRequest);
      await route.abort("blockedbyclient");
      return;
    }

    await route.continue();
  });

  return {
    blockedRequests,
    assertNoBlockedRequests: () => {
      if (blockedRequests.length === 0) {
        return;
      }

      const details = blockedRequests
        .slice(0, 10)
        .map(
          (request) =>
            `${request.method} ${request.url} (${request.reason}${
              request.ruleId ? `: ${request.ruleId}` : ""
            })`
        )
        .join("\n");

      throw new Error(
        `Read-only Playwright run blocked ${blockedRequests.length} mutation request(s):\n${details}`
      );
    },
  };
}

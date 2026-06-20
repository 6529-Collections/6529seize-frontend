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
  url: string;
  readonly: boolean;
};

export type ReadonlyRequestDecision = {
  action: "allow" | "block";
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

const ALLOWED_EXTERNAL_MUTATION_HOSTS = [
  /(^|\.)google-analytics\.com$/i,
  /(^|\.)analytics\.google\.com$/i,
  /(^|\.)mixpanel\.com$/i,
  /(^|\.)ingest\.sentry\.io$/i,
  /^dataplane\.rum\.[a-z0-9-]+\.amazonaws\.com$/i,
];

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

function isAllowedExternalMutation(url: URL) {
  return ALLOWED_EXTERNAL_MUTATION_HOSTS.some((pattern) =>
    pattern.test(url.hostname)
  );
}

function isStagingAccessUnlock(url: URL, baseURL?: string) {
  const base = baseURL ? parseUrl(baseURL) : null;
  return (
    base?.hostname === STAGING_HOSTNAME &&
    url.hostname === STAGING_HOSTNAME &&
    (url.pathname === "/access" || url.pathname.startsWith("/access/"))
  );
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

function endpointMatches(endpoint: MutationEndpoint, method: string, url: URL) {
  if (!endpoint.methods.includes(method)) {
    return false;
  }

  const urlCandidates = [
    url.href,
    `${url.origin}${url.pathname}`,
    url.pathname,
  ];
  const matcher = wildcardPatternToRegExp(endpoint.pattern);
  return urlCandidates.some((candidate) => matcher.test(candidate));
}

function registryMatch(method: string, url: URL) {
  const endpoints = mutationRegistry.endpoints as MutationEndpoint[];
  return endpoints.find((endpoint) => endpointMatches(endpoint, method, url));
}

export function decideReadonlyRequest({
  baseURL,
  method,
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

  const endpoint = registryMatch(upperMethod, parsed);
  if (endpoint) {
    return {
      action: "block",
      reason: "registered-mutation-endpoint",
      ruleId: endpoint.id,
    };
  }

  if (isStagingAccessUnlock(parsed, baseURL)) {
    return { action: "allow", reason: "staging-access-unlock" };
  }

  if (isAllowedExternalMutation(parsed)) {
    return { action: "allow", reason: "allowed-telemetry-endpoint" };
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
      readonly,
      url: request.url(),
    });

    if (decision.action === "block") {
      const blockedRequest: BlockedReadonlyRequest = {
        method: request.method(),
        url: request.url(),
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

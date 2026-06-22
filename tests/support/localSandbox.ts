import { expect, type Page } from "@playwright/test";

export type SandboxRequest = {
  readonly method: string;
  readonly path: string;
  readonly kind: string;
  readonly body?: Record<string, unknown> | undefined;
};

type SandboxRequestsResponse = {
  readonly requests: SandboxRequest[];
};

type LocalSandboxTestApi = {
  skip: (condition: boolean, description: string) => void;
  beforeEach: (
    handler: (args: {
      readonly baseURL: string | undefined;
      readonly page: Page;
    }) => Promise<void>
  ) => void;
  afterEach: (handler: () => void) => void;
};

export const LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS = 30000;
const SAFE_LOCAL_SANDBOX_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export type LocalSandboxBrowserMutationGuard = {
  assertNoBlockedMutations: () => void;
};

export function getSandboxApiOrigin(baseURL: string | undefined) {
  if (!baseURL) {
    throw new Error("Local sandbox tests require a local baseURL.");
  }

  const url = new URL(baseURL);
  assertLocalSandboxUrl(url);
  const port = Number(url.port || "3001");
  return `http://127.0.0.1:${port + 1000}`;
}

export function assertLocalSandboxBaseURL(baseURL: string | undefined) {
  if (!baseURL) {
    throw new Error("Local sandbox tests require a local baseURL.");
  }

  assertLocalSandboxUrl(new URL(baseURL));
}

export async function dismissNextDevTools(page: Page) {
  const closeButton = page.getByRole("button", {
    name: "Close Next.js Dev Tools",
  });

  if (await closeButton.isVisible().catch(() => false)) {
    await closeButton.click({ force: true });
  }
}

export function useLocalSandboxMutationGuard(
  localTest: LocalSandboxTestApi,
  sandboxFlag: "PLAYWRIGHT_AUTH_SANDBOX" | "PLAYWRIGHT_COMPOSER_SANDBOX",
  skipMessage: string
) {
  let browserMutationGuard: LocalSandboxBrowserMutationGuard | undefined;

  localTest.skip(
    process.env[sandboxFlag] !== "1" ||
      process.env["PLAYWRIGHT_ENV"] !== "local",
    skipMessage
  );

  localTest.beforeEach(async ({ baseURL, page }) => {
    assertLocalSandboxBaseURL(baseURL);
    browserMutationGuard = await installLocalSandboxBrowserMutationGuard(
      page,
      baseURL
    );
    await resetSandboxRequests(baseURL);
  });

  localTest.afterEach(() => {
    browserMutationGuard?.assertNoBlockedMutations();
    browserMutationGuard = undefined;
  });
}

export async function installLocalSandboxBrowserMutationGuard(
  page: Page,
  baseURL: string | undefined
): Promise<LocalSandboxBrowserMutationGuard> {
  assertLocalSandboxBaseURL(baseURL);
  const appUrl = new URL(baseURL!);
  const sandboxApiUrl = new URL(getSandboxApiOrigin(baseURL));
  const blockedMutations: SandboxRequest[] = [];

  await page.route("**/*", async (route) => {
    const request = route.request();
    const method = request.method().toUpperCase();

    if (SAFE_LOCAL_SANDBOX_METHODS.has(method)) {
      await route.continue();
      return;
    }

    let url: URL;
    try {
      url = new URL(request.url());
    } catch {
      await route.continue();
      return;
    }

    if (isSameLoopbackOrigin(url, sandboxApiUrl)) {
      await route.continue();
      return;
    }

    if (isSameLoopbackOrigin(url, appUrl)) {
      if (url.pathname.startsWith("/api/")) {
        blockedMutations.push({
          method,
          path: url.pathname,
          kind: "blocked-browser-local-mutation",
        });
        await route.abort("blockedbyclient");
        return;
      }

      await route.continue();
      return;
    }

    if (isAllowedBlockedExternalWrite(url)) {
      await route.abort("blockedbyclient");
      return;
    }

    if (url.protocol === "http:" || url.protocol === "https:") {
      blockedMutations.push({
        method,
        path: `${url.origin}${url.pathname}`,
        kind: "blocked-browser-external-mutation",
      });
      await route.abort("blockedbyclient");
      return;
    }

    await route.continue();
  });

  return {
    assertNoBlockedMutations() {
      expect(
        blockedMutations,
        `Expected no blocked browser mutations in local sandbox. Requests: ${JSON.stringify(
          blockedMutations
        )}`
      ).toEqual([]);
    },
  };
}

export async function fetchSandboxRequests(baseURL: string | undefined) {
  const response = await fetch(
    `${getSandboxApiOrigin(baseURL)}/__composer-sandbox/requests`
  );
  expect(response.ok).toBe(true);
  const body = (await response.json()) as SandboxRequestsResponse;
  return body.requests;
}

export async function resetSandboxRequests(baseURL: string | undefined) {
  const response = await fetch(
    `${getSandboxApiOrigin(baseURL)}/__composer-sandbox/reset`,
    { method: "POST" }
  );
  expect(response.ok).toBe(true);
}

export async function expectNoUnsafeSandboxMutations(
  baseURL: string | undefined
) {
  const requests = await fetchSandboxRequests(baseURL);
  const unsafeRequests = requests.filter(
    (request) =>
      request.kind === "dangerous-composer-mutation" ||
      request.kind === "unhandled-mutation"
  );

  expect(
    unsafeRequests,
    `Expected no unsafe sandbox mutations. Requests: ${JSON.stringify(
      requests
    )}`
  ).toEqual([]);
}

function assertLocalSandboxUrl(url: URL) {
  if (url.protocol !== "http:") {
    throw new Error(
      `Local sandbox must run against a local http origin, got ${url.origin}.`
    );
  }

  if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
    throw new Error(`Local sandbox refused non-local baseURL ${url.origin}.`);
  }
}

function isLoopbackHostname(hostname: string) {
  return ["localhost", "127.0.0.1", "[::1]"].includes(hostname);
}

function isSameLoopbackOrigin(actual: URL, expected: URL) {
  return (
    actual.protocol === expected.protocol &&
    actual.port === expected.port &&
    isLoopbackHostname(actual.hostname) &&
    isLoopbackHostname(expected.hostname)
  );
}

// Exact-match blocked SDK chatter stays non-fatal; any unknown external write fails.
function isAllowedBlockedExternalWrite(url: URL) {
  return (
    (url.hostname === "cca-lite.coinbase.com" && url.pathname === "/amp") ||
    (url.hostname === "rpc.walletconnect.org" &&
      url.pathname.startsWith("/v1/")) ||
    (url.hostname === "www.google-analytics.com" &&
      url.pathname === "/g/collect") ||
    (url.hostname === "www.google.com" && url.pathname === "/g/collect")
  );
}

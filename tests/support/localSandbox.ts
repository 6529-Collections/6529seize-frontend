import {
  expect,
  type BrowserContext,
  type Page,
  type Route,
} from "@playwright/test";
import { blockedRpcResponseBody } from "./blockedRpcResponse";

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

/**
 * Hides the `next dev` overlay (indicator and issue toasts) in every page of
 * a context. It sits over bottom-left controls, such as the sidebar account
 * button and the phone composer's attach button, and intercepts their
 * clicks. It is not app UI; page errors are still asserted through the page
 * diagnostics.
 */
export async function hideNextDevOverlay(context: BrowserContext) {
  // A stylesheet, so the overlay element's own inline styles cannot undo it.
  await context.addInitScript(() => {
    const add = () => {
      const style = document.createElement("style");
      style.textContent = "nextjs-portal{display:none!important}";
      (document.head ?? document.documentElement).append(style);
    };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", add, { once: true });
    } else {
      add();
    }
  });
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
  page: Page | BrowserContext,
  baseURL: string | undefined
): Promise<LocalSandboxBrowserMutationGuard> {
  assertLocalSandboxBaseURL(baseURL);
  const appUrl = new URL(baseURL!);
  const sandboxApiUrl = new URL(getSandboxApiOrigin(baseURL));
  const blockedMutations: SandboxRequest[] = [];

  await page.route("**/*", async (route) => {
    const request = route.request();
    const method = request.method().toUpperCase();

    let url: URL;
    try {
      url = new URL(request.url());
    } catch {
      await route.continue();
      return;
    }

    // Preflights and writes to known SDK endpoints are answered locally.
    if (
      isAllowedBlockedExternalWrite(url) &&
      (method === "OPTIONS" || !SAFE_LOCAL_SANDBOX_METHODS.has(method))
    ) {
      await fulfillBlockedExternalWrite(route, url, method);
      return;
    }

    if (SAFE_LOCAL_SANDBOX_METHODS.has(method)) {
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

export async function enableSandboxWaveGuidelines(baseURL: string | undefined) {
  const response = await fetch(
    `${getSandboxApiOrigin(baseURL)}/__composer-sandbox/guidelines`,
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

// Answer blocked SDK traffic instead of aborting it. Recent WebKit builds log
// an aborted cross-origin fetch ("... due to access control checks") as a page
// error even when the app handles the failure. The app still sees a failed
// call, and nothing leaves the machine.
async function fulfillBlockedExternalWrite(
  route: Route,
  url: URL,
  method: string
) {
  const request = route.request();
  const headers = {
    "access-control-allow-origin": (await request.headerValue("origin")) ?? "*",
    "access-control-allow-credentials": "true",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers":
      (await request.headerValue("access-control-request-headers")) ??
      "content-type",
    vary: "Origin",
  };
  if (method !== "OPTIONS" && url.hostname === "rpc.walletconnect.org") {
    await route.fulfill({
      status: 200,
      headers,
      contentType: "application/json",
      body: JSON.stringify(blockedRpcResponseBody(request.postData())),
    });
    return;
  }
  await route.fulfill({ status: 204, headers });
}

// Exact-match blocked SDK chatter stays non-fatal; any unknown external write fails.
function isAllowedBlockedExternalWrite(url: URL) {
  return (
    (url.hostname === "cca-lite.coinbase.com" && url.pathname === "/amp") ||
    (url.hostname === "cca-lite.coinbase.com" && url.pathname === "/metrics") ||
    (url.hostname === "pulse.walletconnect.org" && url.pathname === "/batch") ||
    (url.hostname === "rpc.walletconnect.org" &&
      url.pathname.startsWith("/v1/")) ||
    (url.hostname === "region1.google-analytics.com" &&
      url.pathname === "/g/collect") ||
    (url.hostname === "www.google-analytics.com" &&
      url.pathname === "/g/collect") ||
    (url.hostname === "www.google.com" && url.pathname === "/g/collect") ||
    (url.hostname === "www.googletagmanager.com" && url.pathname === "/td")
  );
}

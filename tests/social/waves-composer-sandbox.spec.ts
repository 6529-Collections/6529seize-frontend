import type { Page, Route } from "@playwright/test";

import {
  expect,
  expectNoHorizontalOverflow,
  test,
  waitForRouteReady,
} from "../testHelpers";

const NAVIGATION_TIMEOUT_MS = 30000;
const SANDBOX_WAVE_ID = "00000000-0000-4000-8000-000000000529";
const PREVIEW_URL = "https://example.com/6529-composer-preview";
const PREVIEW_TITLE = "Sandbox Preview Title";
const PREVIEW_DESCRIPTION = "Deterministic local preview served by Playwright.";

type SandboxRequest = {
  readonly method: string;
  readonly path: string;
  readonly kind: string;
};

type SandboxRequestsResponse = {
  readonly requests: SandboxRequest[];
};

test.describe.configure({ mode: "serial" });

test.describe("Waves composer local sandbox @auth @medium @local-only", () => {
  test.skip(
    process.env["PLAYWRIGHT_COMPOSER_SANDBOX"] !== "1" ||
      process.env["PLAYWRIGHT_ENV"] !== "local",
    "Composer sandbox requires the local mock API runner."
  );

  test.beforeEach(async ({ baseURL }) => {
    assertLocalSandboxBaseURL(baseURL);
    await resetSandboxRequests(baseURL);
  });

  test("queues and removes an attachment without upload or submit", async ({
    baseURL,
    page,
  }) => {
    await gotoSandboxWave(page);
    await showDropActionsIfCollapsed(page);

    const fileInput = page
      .locator('input[type="file"][accept*="application/pdf"]')
      .first();
    await expect(fileInput).toBeAttached();

    await fileInput.setInputFiles({
      name: "composer-sandbox.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4\n% composer sandbox fixture\n"),
    });

    await expect(page.getByText("composer-sandbox.pdf")).toBeVisible({
      timeout: NAVIGATION_TIMEOUT_MS,
    });
    await expect(
      page.getByRole("img", { name: "PDF file: composer-sandbox.pdf" })
    ).toBeVisible();

    const postButton = page.getByRole("button", { name: "Post" }).last();
    await expect(postButton).toBeVisible();

    await page.getByRole("button", { name: "Remove file" }).last().click();
    await expect(page.getByText("composer-sandbox.pdf")).toBeHidden();
    await expectNoHorizontalOverflow(page);
    await expectNoUnsafeSandboxMutations(baseURL);
  });

  test("renders deterministic link preview and keeps composer usable", async ({
    baseURL,
    page,
  }) => {
    await gotoSandboxWave(page);

    const previewLink = page
      .getByRole("link", { name: new RegExp(PREVIEW_TITLE) })
      .first();
    await expect(previewLink).toBeVisible({ timeout: NAVIGATION_TIMEOUT_MS });
    await expect(previewLink).toHaveAttribute("href", PREVIEW_URL);
    await expect(page.getByText(PREVIEW_TITLE).first()).toBeVisible({
      timeout: NAVIGATION_TIMEOUT_MS,
    });
    await expect(page.getByText(PREVIEW_DESCRIPTION).first()).toBeVisible();

    const composer = page
      .getByRole("textbox", { name: "Write a chat message" })
      .last();
    await composer.fill("Checking the local composer without sending.");
    await expect(
      page.getByRole("button", { name: "Post" }).last()
    ).toBeEnabled();
    await expectNoHorizontalOverflow(page);
    await expectNoUnsafeSandboxMutations(baseURL);
  });
});

async function gotoSandboxWave(page: Page) {
  await installExternalDataFixtures(page);
  await installOpenGraphFixture(page);
  await page.goto(`/waves/${SANDBOX_WAVE_ID}`, {
    waitUntil: "domcontentloaded",
  });
  await waitForRouteReady(page);
  await expect(page).toHaveURL(new RegExp(`/waves/${SANDBOX_WAVE_ID}$`));
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Local Composer Sandbox Wave",
    })
  ).toBeVisible({ timeout: NAVIGATION_TIMEOUT_MS });
  await expect(
    page.getByRole("textbox", { name: "Write a chat message" }).last()
  ).toBeVisible({ timeout: NAVIGATION_TIMEOUT_MS });
  await dismissNextDevTools(page);
  await expectNoHorizontalOverflow(page);
}

async function installExternalDataFixtures(page: Page) {
  await page.route("**/6529-emoji/emoji-list.json**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      json: [],
      status: 200,
    });
  });
}

async function showDropActionsIfCollapsed(page: Page) {
  await dismissNextDevTools(page);

  const showActionsButton = page.getByRole("button", {
    name: "Show drop actions",
  });

  if (await showActionsButton.isVisible().catch(() => false)) {
    await showActionsButton.evaluate((element) => {
      if (element instanceof HTMLElement) {
        element.click();
      }
    });
  }

  await expect(page.getByRole("button", { name: "Upload a file" })).toBeVisible(
    { timeout: NAVIGATION_TIMEOUT_MS }
  );
}

async function dismissNextDevTools(page: Page) {
  const closeButton = page.getByRole("button", {
    name: "Close Next.js Dev Tools",
  });

  if (await closeButton.isVisible().catch(() => false)) {
    await closeButton.click({ force: true });
  }
}

async function installOpenGraphFixture(page: Page) {
  await page.route("**/api/open-graph**", async (route) => {
    const request = route.request();
    const method = request.method().toUpperCase();

    if (method === "POST") {
      await fulfillOpenGraphBatch(route);
      return;
    }

    const url = new URL(request.url());
    const targetUrl = url.searchParams.get("url") || PREVIEW_URL;
    await route.fulfill({
      contentType: "application/json",
      json: previewFor(targetUrl),
      status: 200,
    });
  });
}

async function fulfillOpenGraphBatch(route: Route) {
  const body = route.request().postDataJSON() as { urls?: unknown };
  const urls = Array.isArray(body.urls)
    ? body.urls.filter((url): url is string => typeof url === "string")
    : [PREVIEW_URL];

  await route.fulfill({
    contentType: "application/json",
    json: {
      errors: {},
      results: Object.fromEntries(urls.map((url) => [url, previewFor(url)])),
    },
    status: 200,
  });
}

function previewFor(url: string) {
  return {
    url,
    title: PREVIEW_TITLE,
    description: PREVIEW_DESCRIPTION,
    siteName: "Example Sandbox",
    mediaType: "article",
  };
}

function getSandboxApiOrigin(baseURL: string | undefined) {
  if (!baseURL) {
    throw new Error("Composer sandbox tests require a local baseURL.");
  }

  const url = new URL(baseURL);
  assertLocalSandboxUrl(url);
  const port = Number(url.port || "3001");
  return `http://127.0.0.1:${port + 1000}`;
}

function assertLocalSandboxBaseURL(baseURL: string | undefined) {
  if (!baseURL) {
    throw new Error("Composer sandbox tests require a local baseURL.");
  }

  assertLocalSandboxUrl(new URL(baseURL));
}

function assertLocalSandboxUrl(url: URL) {
  if (url.protocol !== "http:") {
    throw new Error(
      `Composer sandbox must run against a local http origin, got ${url.origin}.`
    );
  }

  if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
    throw new Error(
      `Composer sandbox refused non-local baseURL ${url.origin}.`
    );
  }
}

async function fetchSandboxRequests(baseURL: string | undefined) {
  const response = await fetch(
    `${getSandboxApiOrigin(baseURL)}/__composer-sandbox/requests`
  );
  expect(response.ok).toBe(true);
  const body = (await response.json()) as SandboxRequestsResponse;
  return body.requests;
}

async function resetSandboxRequests(baseURL: string | undefined) {
  const response = await fetch(
    `${getSandboxApiOrigin(baseURL)}/__composer-sandbox/reset`,
    { method: "POST" }
  );
  expect(response.ok).toBe(true);
}

async function expectNoUnsafeSandboxMutations(baseURL: string | undefined) {
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

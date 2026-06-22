import type { Page, Route } from "@playwright/test";

import {
  expect,
  expectNoHorizontalOverflow,
  test,
  waitForRouteReady,
} from "../testHelpers";
import {
  dismissNextDevTools,
  expectNoUnsafeSandboxMutations,
  LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
  useLocalSandboxMutationGuard,
} from "../support/localSandbox";

const SANDBOX_WAVE_ID = "00000000-0000-4000-8000-000000000529";
const PREVIEW_URL = "https://example.com/6529-composer-preview";
const PREVIEW_TITLE = "Sandbox Preview Title";
const PREVIEW_DESCRIPTION = "Deterministic local preview served by Playwright.";

test.describe.configure({ mode: "serial" });

test.describe("Waves composer local sandbox @auth @medium @local-only", () => {
  useLocalSandboxMutationGuard(
    test,
    "PLAYWRIGHT_COMPOSER_SANDBOX",
    "Composer sandbox requires the local mock API runner."
  );

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
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
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
    await expect(previewLink).toBeVisible({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    await expect(previewLink).toHaveAttribute("href", PREVIEW_URL);
    await expect(page.getByText(PREVIEW_TITLE).first()).toBeVisible({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
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
  ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
  await expect(
    page.getByRole("textbox", { name: "Write a chat message" }).last()
  ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
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
    { timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS }
  );
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

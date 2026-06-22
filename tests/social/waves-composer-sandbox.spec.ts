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
  fetchSandboxRequests,
  getSandboxApiOrigin,
  LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
  resetSandboxRequests,
  useLocalSandboxMutationGuard,
} from "../support/localSandbox";

const SANDBOX_WAVE_ID = "00000000-0000-4000-8000-000000000529";
const SANDBOX_WALLET = "0x0000000000000000000000000000000000000529";
const PREVIEW_URL = "https://example.com/6529-composer-preview";
const PREVIEW_TITLE = "Sandbox Preview Title";
const PREVIEW_DESCRIPTION = "Deterministic local preview served by Playwright.";
const SANDBOX_CHAT_DROP_CONTENT = "Local-only chat drop from Playwright.";

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

  test("submits one exact-shape synthetic chat drop without uploads", async ({
    baseURL,
    page,
  }) => {
    await gotoSandboxWave(page);

    const composer = page
      .getByRole("textbox", { name: "Write a chat message" })
      .last();
    await composer.fill(SANDBOX_CHAT_DROP_CONTENT);
    await expect(
      page.getByRole("button", { name: "Post" }).last()
    ).toBeEnabled();

    await page.getByRole("button", { name: "Post" }).last().click();

    await expect
      .poll(
        async () =>
          (await fetchSandboxRequests(baseURL))
            .filter(
              (request) =>
                request.method === "POST" && request.path === "/api/drops"
            )
            .map((request) => request.kind),
        {
          timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
          message: "Expected exactly one chat submit to reach the mock API.",
        }
      )
      .toEqual(["allowed-sandbox-mutation"]);

    const dropRequests = (await fetchSandboxRequests(baseURL)).filter(
      (request) => request.method === "POST" && request.path === "/api/drops"
    );
    expect(dropRequests).toHaveLength(1);
    expect(dropRequests[0]).toMatchObject({
      kind: "allowed-sandbox-mutation",
      body: expect.objectContaining({
        wave_id: SANDBOX_WAVE_ID,
        drop_type: "CHAT",
        content: SANDBOX_CHAT_DROP_CONTENT,
        part_count: 1,
        media_count: 0,
        has_attachments: false,
        referenced_nfts_count: 0,
        mentioned_users_count: 0,
        mentioned_groups_count: 0,
        mentioned_waves_count: 0,
        metadata_count: 0,
        signature: null,
        is_safe_signature: false,
        signer_address: SANDBOX_WALLET,
      }),
    });

    const submittedDrop = page.locator('[data-serial-no="2"]');
    await expect(submittedDrop).toBeVisible({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    await expect(submittedDrop).toContainText(SANDBOX_CHAT_DROP_CONTENT);

    const requests = await fetchSandboxRequests(baseURL);
    expect(
      requests.some((request) => request.path.startsWith("/api/drop-media"))
    ).toBe(false);
    expect(
      requests.some((request) => request.path.startsWith("/api/attachments"))
    ).toBe(false);
    await expectNoHorizontalOverflow(page);
    await expectNoUnsafeSandboxMutations(baseURL);
  });

  test("rejects repeated exact-shape chat drop mutation bodies", async ({
    baseURL,
  }) => {
    const exactBody = buildExactChatDropBody();
    const apiOrigin = getSandboxApiOrigin(baseURL);

    const firstResponse = await fetch(`${apiOrigin}/api/drops`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(exactBody),
    });
    expect(firstResponse.status).toBe(200);

    const secondResponse = await fetch(`${apiOrigin}/api/drops`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(exactBody),
    });
    expect(secondResponse.status).toBe(409);

    await expect
      .poll(
        async () =>
          (await fetchSandboxRequests(baseURL))
            .filter(
              (request) =>
                request.method === "POST" && request.path === "/api/drops"
            )
            .map((request) => request.kind),
        {
          timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
          message:
            "Expected the mock API to allow one exact-shape submit only.",
        }
      )
      .toEqual(["allowed-sandbox-mutation", "dangerous-composer-mutation"]);

    await resetSandboxRequests(baseURL);
    await expectNoUnsafeSandboxMutations(baseURL);
  });

  test("rejects non-exact chat drop mutation bodies", async ({ baseURL }) => {
    const response = await fetch(`${getSandboxApiOrigin(baseURL)}/api/drops`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...buildExactChatDropBody(),
        parts: [
          {
            content: "Unexpected sandbox chat body",
            quoted_drop: null,
            media: [],
          },
        ],
      }),
    });

    expect(response.status).toBe(409);
    await expect
      .poll(async () => await fetchSandboxRequests(baseURL), {
        timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
        message: "Expected the mock API to log the rejected drop mutation.",
      })
      .toContainEqual(
        expect.objectContaining({
          method: "POST",
          path: "/api/drops",
          kind: "dangerous-composer-mutation",
          body: expect.objectContaining({
            content: "Unexpected sandbox chat body",
          }),
        })
      );

    await resetSandboxRequests(baseURL);
    await expectNoUnsafeSandboxMutations(baseURL);
  });
});

function buildExactChatDropBody() {
  return {
    wave_id: SANDBOX_WAVE_ID,
    drop_type: "CHAT",
    title: null,
    parts: [
      {
        content: SANDBOX_CHAT_DROP_CONTENT,
        quoted_drop: null,
        media: [],
      },
    ],
    referenced_nfts: [],
    mentioned_users: [],
    mentioned_groups: [],
    mentioned_waves: [],
    metadata: [],
    signature: null,
    is_safe_signature: false,
    signer_address: "",
  };
}

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

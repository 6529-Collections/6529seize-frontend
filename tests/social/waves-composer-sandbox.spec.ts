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
const SANDBOX_FIRST_POLL_OPTION =
  "A longer poll option that stays readable on a phone";
const SANDBOX_SECOND_POLL_OPTION = "A second poll option";
const SANDBOX_POLL_OPTIONS = [
  SANDBOX_FIRST_POLL_OPTION,
  SANDBOX_SECOND_POLL_OPTION,
] as const;
const SANDBOX_STORM_INITIAL_PART = "Calm storm first draft.";
const SANDBOX_STORM_FIRST_PART = "Calm storm conclusion.";
const SANDBOX_STORM_SECOND_PART = "Calm storm opening.";

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

  test("restores an in-progress chat draft across a full reload", async ({
    baseURL,
    page,
  }) => {
    await gotoSandboxWave(page);

    const draftText = "Draft that must survive the new-version reload.";
    const composer = page
      .getByRole("textbox", { name: "Write a chat message" })
      .last();
    await composer.fill(draftText);
    // The draft autosave is debounced (400ms); wait for it to persist.
    await expect
      .poll(
        () =>
          page.evaluate(() =>
            Object.keys(globalThis.sessionStorage).some((key) =>
              key.startsWith("wave-draft:v1:")
            )
          ),
        {
          timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
          message: "Expected the chat draft to be persisted before reloading.",
        }
      )
      .toBe(true);

    // Simulate the new-version toast's full reload.
    await page.reload({ waitUntil: "domcontentloaded" });
    await waitForRouteReady(page);
    await dismissNextDevTools(page);

    const restoredComposer = page
      .getByRole("textbox", { name: "Write a chat message" })
      .last();
    await expect(restoredComposer).toBeVisible({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    await expect(restoredComposer).toContainText(draftText, {
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });

    // Sending must still be possible, and the restore itself must not have
    // produced any mutation.
    await expect(
      page.getByRole("button", { name: "Post" }).last()
    ).toBeEnabled();
    await expectNoUnsafeSandboxMutations(baseURL);
  });

  test("keeps the ordinary chat composer within the viewport", async ({
    baseURL,
    page,
  }, testInfo) => {
    await gotoSandboxWave(page);

    const isIosSurface = testInfo.project.name === "capacitor-ios-sim";
    const composer = page
      .getByRole("textbox", { name: "Write a chat message" })
      .last();
    const wrapper = composer.locator(
      "xpath=ancestor::div[contains(@class, 'tw-sticky') and contains(@class, 'tw-overflow-y-auto')][1]"
    );

    await expect(wrapper).toHaveAttribute(
      "class",
      isIosSurface ? /--layout-viewport-height/ : /100vh/
    );
    const maxHeightBeforeKeyboardInset = await wrapper.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).maxHeight)
    );

    await page.evaluate(() => {
      document.documentElement.style.setProperty(
        "--native-keyboard-inset-bottom",
        "180px"
      );
    });
    await composer.fill("Ordinary chat composer layout check.");

    const readWrapperMaxHeight = () =>
      wrapper.evaluate((element) =>
        Number.parseFloat(getComputedStyle(element).maxHeight)
      );
    if (isIosSurface) {
      await expect
        .poll(readWrapperMaxHeight)
        .toBeLessThan(maxHeightBeforeKeyboardInset);
    } else {
      await expect
        .poll(readWrapperMaxHeight)
        .toBe(maxHeightBeforeKeyboardInset);
    }
    const composerBounds = await composer.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return {
        bottom: rect.bottom,
        top: rect.top,
        viewportHeight: window.innerHeight,
      };
    });
    expect(composerBounds.top).toBeGreaterThanOrEqual(0);
    expect(composerBounds.bottom).toBeLessThanOrEqual(
      composerBounds.viewportHeight
    );
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

    // Inside the covered band (1280-1455px wide, right sidebar closed) the
    // quick-DM launcher yields to the docked composer
    // (WaveComposerDockVisibility): pointer-inert (keyboard/screen-reader
    // reachable) so the real pointer click below must land on Post. The
    // desktop project's 1280x720 viewport sits in that band; mobile projects
    // never render the launcher.
    const viewportWidth = page.viewportSize()?.width ?? 0;
    if (viewportWidth >= 1280 && viewportWidth <= 1455) {
      await expect(
        page.getByRole("button", { name: /Open quick direct messages/ })
      ).toHaveCSS("pointer-events", "none", {
        timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
      });
    }
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
        signer_address: expect.stringMatching(
          new RegExp(`^${SANDBOX_WALLET}$`, "i")
        ),
      }),
    });

    // Optimistic drops use timestamp serials; serial 2 is the mock server drop.
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

  test("keeps the poll composer usable and submits its exact shape", async ({
    baseURL,
    page,
  }) => {
    await resetSandboxRequests(baseURL);
    await gotoSandboxWave(page);
    await showDropActionsIfCollapsed(page);

    await page.getByRole("button", { name: "Add poll" }).click();

    const poll = page.getByTestId("create-drop-poll");
    await expect(poll).toBeVisible();

    const viewportWidth = page.viewportSize()?.width ?? 0;
    const pollMetrics = await poll.evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      return {
        width: bounds.width,
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
      };
    });
    expect(pollMetrics.width).toBeGreaterThan(
      viewportWidth < 640 ? viewportWidth * 0.6 : 500
    );
    expect(pollMetrics.scrollWidth).toBeLessThanOrEqual(
      pollMetrics.clientWidth + 1
    );

    await poll.getByRole("button", { name: "Remove poll" }).click();
    await expect(poll).toBeHidden();
    await page.getByRole("button", { name: "Add poll" }).click();
    await expect(poll).toBeVisible();

    const firstOption = page.getByRole("textbox", { name: "Poll option 1" });
    const secondOption = page.getByRole("textbox", { name: "Poll option 2" });
    await firstOption.fill(SANDBOX_FIRST_POLL_OPTION);
    await secondOption.fill(SANDBOX_SECOND_POLL_OPTION);
    await expect(firstOption).toHaveValue(SANDBOX_FIRST_POLL_OPTION);
    expect((await firstOption.boundingBox())?.width ?? 0).toBeGreaterThan(140);

    const multipleButton = page.getByRole("button", { name: "Multiple" });
    await multipleButton.click();
    await expect(multipleButton).toHaveAttribute("aria-pressed", "true");

    await page.getByRole("button", { name: "Add option" }).click();
    const thirdOption = page.getByRole("textbox", { name: "Poll option 3" });
    await thirdOption.fill("Temporary third option");
    await page.getByRole("button", { name: "Remove option 3" }).click();
    await expect(thirdOption).toBeHidden();

    const closingTime = page.locator('input[type="datetime-local"]');
    expect((await closingTime.boundingBox())?.width ?? 0).toBeGreaterThan(170);
    await closingTime.click();
    await expect(closingTime).toBeFocused();

    const responderScope = page.getByRole("checkbox", {
      name: "Only people who can chat can respond",
    });
    const anonymous = page.getByRole("checkbox", { name: "Anonymous poll" });
    await responderScope.check();
    await anonymous.check();
    await expect(responderScope).toBeChecked();
    await expect(anonymous).toBeChecked();

    await expectNoHorizontalOverflow(page);
    const postButton = page.getByRole("button", { name: "Post" }).last();
    await expect(postButton).toBeEnabled();
    await postButton.click();

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
          message: "Expected exactly one poll submit to reach the mock API.",
        }
      )
      .toEqual(["allowed-sandbox-mutation"]);

    const pollRequests = (await fetchSandboxRequests(baseURL)).filter(
      (request) => request.method === "POST" && request.path === "/api/drops"
    );
    expect(pollRequests).toHaveLength(1);
    expect(pollRequests[0]).toMatchObject({
      kind: "allowed-sandbox-mutation",
      body: expect.objectContaining({
        wave_id: SANDBOX_WAVE_ID,
        drop_type: "CHAT",
        content: null,
        poll: expect.objectContaining({
          options: SANDBOX_POLL_OPTIONS,
          multichoice: true,
          anonymous: true,
          only_droppers_can_respond: true,
          closing_time: expect.any(Number),
        }),
      }),
    });

    const submittedPoll = page.locator('[data-serial-no="2"]');
    await expect(submittedPoll).toBeVisible({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    await expect(submittedPoll).toContainText(SANDBOX_FIRST_POLL_OPTION);
    await expect(poll).toBeHidden();
    await expectNoUnsafeSandboxMutations(baseURL);
    await resetSandboxRequests(baseURL);
  });

  test("builds, edits, reorders, and posts a storm", async ({
    baseURL,
    page,
  }) => {
    await resetSandboxRequests(baseURL);
    await gotoSandboxWave(page);

    const composer = page
      .getByRole("textbox", { name: "Write a chat message" })
      .last();
    await composer.fill(SANDBOX_STORM_INITIAL_PART);
    await showDropActionsIfCollapsed(page);
    await page.getByRole("button", { name: "Break into storm" }).click();

    const stormDraft = page.getByRole("region", { name: "Storm draft" });
    await expect(stormDraft).toBeVisible();
    await expect(stormDraft.getByText("1 part")).toBeVisible();
    await expect(
      stormDraft.getByRole("article", { name: "Part 1" })
    ).toContainText(SANDBOX_STORM_INITIAL_PART);
    await expect(
      page.getByRole("textbox", { name: "Write part 2" })
    ).toBeVisible();

    await page
      .getByRole("textbox", { name: "Write part 2" })
      .fill(SANDBOX_STORM_SECOND_PART);
    await page.getByRole("button", { name: "Add part" }).click();
    await expect(stormDraft.getByText("2 parts")).toBeVisible();

    await stormDraft.getByRole("button", { name: "Edit part 1" }).click();
    const partOneEditor = page.getByRole("textbox", { name: "Write part 1" });
    await expect(partOneEditor).toBeVisible();
    await partOneEditor.fill(SANDBOX_STORM_FIRST_PART);
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(
      stormDraft.getByRole("article", { name: "Part 1" })
    ).toContainText(SANDBOX_STORM_FIRST_PART);
    await expect(stormDraft).not.toContainText(SANDBOX_STORM_INITIAL_PART);

    await stormDraft
      .getByRole("button", { name: "Move part 2 earlier" })
      .click();
    await expect(
      stormDraft.getByRole("article", { name: "Part 1" })
    ).toContainText(SANDBOX_STORM_SECOND_PART);
    await expect(
      stormDraft.getByRole("article", { name: "Part 2" })
    ).toContainText(SANDBOX_STORM_FIRST_PART);
    await expectNoHorizontalOverflow(page);

    await page.getByRole("button", { name: "Post storm" }).click();

    await expect
      .poll(
        async () =>
          (await fetchSandboxRequests(baseURL))
            .filter(
              (request) =>
                request.method === "POST" && request.path === "/api/drops"
            )
            .map((request) => request.body),
        {
          timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
          message: "Expected the ordered storm to reach the mock API.",
        }
      )
      .toEqual([
        expect.objectContaining({
          part_count: 2,
          part_contents: [SANDBOX_STORM_SECOND_PART, SANDBOX_STORM_FIRST_PART],
        }),
      ]);

    const submittedDrop = page.locator('[data-serial-no="2"]');
    await expect(submittedDrop).toContainText(SANDBOX_STORM_SECOND_PART, {
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    await submittedDrop.getByRole("button", { name: "Next part" }).click();
    await expect(submittedDrop).toContainText(SANDBOX_STORM_FIRST_PART);
    await expectNoUnsafeSandboxMutations(baseURL);

    await resetSandboxRequests(baseURL);
    await expectNoUnsafeSandboxMutations(baseURL);
  });

  test("rejects repeated exact-shape chat drop mutation bodies", async ({
    baseURL,
  }) => {
    await resetSandboxRequests(baseURL);

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
    await resetSandboxRequests(baseURL);

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
    page
      .getByRole("heading", {
        level: 1,
        name: "Local Composer Sandbox Wave",
      })
      .or(page.getByText("Local Composer Sandbox Wave", { exact: true }))
      .first()
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

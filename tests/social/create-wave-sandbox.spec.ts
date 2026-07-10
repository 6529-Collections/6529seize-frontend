import type { Page } from "@playwright/test";

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
  LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
  useLocalSandboxMutationGuard,
} from "../support/localSandbox";

const SANDBOX_WALLET = "0x0000000000000000000000000000000000000529";
const SANDBOX_CREATED_WAVE_ID = "00000000-0000-4000-8000-000000000536";
const SANDBOX_ADMIN_GROUP_ID = "00000000-0000-4000-8000-000000000537";
const SANDBOX_CREATED_WAVE_NAME = "Sandbox Created Wave";
const SANDBOX_CREATED_WAVE_DESCRIPTION =
  "Local-only create-wave description for Playwright.";
const SANDBOX_PERPETUAL_WAVE_NAME = "Sandbox Perpetual Rank Wave";
const SANDBOX_PERPETUAL_WAVE_DESCRIPTION =
  "Local-only perpetual rank wave description for Playwright.";

test.describe.configure({ mode: "serial" });

test.describe("Create wave local sandbox @auth @medium @local-only", () => {
  useLocalSandboxMutationGuard(
    test,
    "PLAYWRIGHT_AUTH_SANDBOX",
    "Create-wave sandbox requires the local mock API runner."
  );

  test("creates a chat wave with only explicit sandbox mutations", async ({
    baseURL,
    page,
  }) => {
    await gotoCreateWave(page);

    await page.getByLabel(/Wave Name/).fill(SANDBOX_CREATED_WAVE_NAME);
    await expect(nextStepButton(page)).toBeEnabled();
    await nextStepButton(page).click();

    await expect(
      page.getByRole("heading", { name: "Who can view" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Who can chat" })
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Admin" })).toBeVisible();
    await expect(page.getByText("Anyone").first()).toBeVisible();
    await expect(page.getByText("Only me").first()).toBeVisible();
    await nextStepButton(page).click();

    await expect(
      page.getByRole("heading", { name: "Rules", level: 2, exact: true })
    ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
    await nextStepButton(page).click();

    await expect(
      page.getByText("Give a good description of your wave")
    ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
    await fillDescription(page, SANDBOX_CREATED_WAVE_DESCRIPTION);
    await page.getByRole("button", { name: "Complete" }).click();
    await expect
      .poll(
        async () =>
          (await fetchSandboxRequests(baseURL)).filter(
            (request) =>
              request.method === "POST" &&
              ["/api/groups", "/api/waves"].includes(request.path)
          ),
        {
          timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
          message: "Expected create-wave submit to reach the sandbox mock API.",
        }
      )
      .toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: "/api/groups",
            kind: "allowed-sandbox-mutation",
          }),
          expect.objectContaining({
            path: "/api/waves",
            kind: "allowed-sandbox-mutation",
          }),
        ])
      );

    await expect(page).toHaveURL(
      new RegExp(`/waves/${SANDBOX_CREATED_WAVE_ID}$`),
      { timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS }
    );
    await waitForRouteReady(page);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: SANDBOX_CREATED_WAVE_NAME,
      })
    ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
    await expect(
      page.getByText(SANDBOX_CREATED_WAVE_DESCRIPTION).first()
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);

    const requests = await fetchSandboxRequests(baseURL);
    expect(requests).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          method: "POST",
          path: "/api/groups",
          kind: "allowed-sandbox-mutation",
          body: {
            name: "Only playwright",
            identity_addresses: [SANDBOX_WALLET],
          },
        }),
        expect.objectContaining({
          method: "POST",
          path: `/api/groups/${SANDBOX_ADMIN_GROUP_ID}/visible`,
          kind: "allowed-sandbox-mutation",
          body: {
            visible: true,
            old_version_id: null,
          },
        }),
        expect.objectContaining({
          method: "POST",
          path: "/api/waves",
          kind: "allowed-sandbox-mutation",
          body: expect.objectContaining({
            name: SANDBOX_CREATED_WAVE_NAME,
            admin_group_id: SANDBOX_ADMIN_GROUP_ID,
            description: SANDBOX_CREATED_WAVE_DESCRIPTION,
          }),
        }),
      ])
    );
    await expectNoUnsafeSandboxMutations(baseURL);
  });

  test("creates a perpetual rank wave after choosing the mode on the overview", async ({
    baseURL,
    page,
  }) => {
    await gotoCreateWave(page);

    await page.getByLabel(/Wave Name/).fill(SANDBOX_PERPETUAL_WAVE_NAME);
    await page.getByText("Rank", { exact: true }).click();

    // The scheduling mode is chosen up front on the Overview step.
    const announceRadio = page.getByRole("radio", {
      name: "Announce Winners",
    });
    const perpetualRadio = page.getByRole("radio", {
      name: "Perpetual Ranking",
    });
    await expect(announceRadio).toBeChecked();
    await expect(perpetualRadio).not.toBeChecked();
    await nextStepButton(page).click();

    await expect(
      page.getByRole("heading", { name: "Who can vote" })
    ).toBeVisible();
    await nextStepButton(page).click();

    // Dates step in scheduled mode shows the announcement schedule, expanded
    // by default; mounting it also defaults the first announcement to a valid
    // future time, so Next proceeds to the Drops step.
    await expect(page.getByText("Wave Timeline")).toBeVisible({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    await expect(
      page.getByRole("button", { name: "Winners Announcements" })
    ).toBeVisible();
    await expect(
      page.getByText("First Winners Announcement").first()
    ).toBeVisible();
    await nextStepButton(page).click();
    await expect(
      page.locator("#no-of-applications-allowed-per-participant")
    ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });

    // Go back to the Overview and switch the wave to perpetual ranking.
    await previousStepButton(page).click();
    await expect(page.getByText("Wave Timeline")).toBeVisible();
    await previousStepButton(page).click();
    await expect(
      page.getByRole("heading", { name: "Who can vote" })
    ).toBeVisible();
    await previousStepButton(page).click();
    await expect(perpetualRadio).toBeVisible();
    await page.getByText("Perpetual Ranking", { exact: true }).click();
    await expect(perpetualRadio).toBeChecked();
    await nextStepButton(page).click();
    await expect(
      page.getByRole("heading", { name: "Who can vote" })
    ).toBeVisible();
    await nextStepButton(page).click();

    // The dates step is now purely about dates: no announcement schedule.
    await expect(page.getByText("Wave Timeline")).toBeVisible({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    await expect(
      page.getByRole("button", { name: "Winners Announcements" })
    ).toBeHidden();

    await nextStepButton(page).click();
    await expect(
      page.locator("#no-of-applications-allowed-per-participant")
    ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
    await nextStepButton(page).click();

    await expect(
      page.getByRole("heading", { name: "Rules", level: 2, exact: true })
    ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
    await nextStepButton(page).click();

    // Voting step keeps its defaults (TDH + XTDH).
    await nextStepButton(page).click();

    // Outcomes step: no awards to configure, visibility locked on.
    await expect(page.getByText("Outcome is leaderboard position")).toBeVisible(
      { timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS }
    );
    await expect(page.getByText("Choose outcome type")).toBeHidden();
    const outcomesToggle = page.getByRole("checkbox");
    await expect(outcomesToggle).not.toBeChecked();
    await expect(outcomesToggle).toBeDisabled();
    await nextStepButton(page).click();

    await expect(
      page.getByText("Give a good description of your wave")
    ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
    await fillDescription(page, SANDBOX_PERPETUAL_WAVE_DESCRIPTION);
    await page.getByRole("button", { name: "Complete" }).click();

    // The sandbox mock only whitelists a rank body with a null decision
    // strategy, open-ended periods and zero outcomes; anything else would be
    // rejected as an unsafe mutation and fail this poll.
    await expect
      .poll(
        async () =>
          (await fetchSandboxRequests(baseURL)).filter(
            (request) =>
              request.method === "POST" && request.path === "/api/waves"
          ),
        {
          timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
          message:
            "Expected the perpetual rank wave submit to reach the sandbox mock API.",
        }
      )
      .toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: "/api/waves",
            kind: "allowed-sandbox-mutation",
            body: expect.objectContaining({
              name: SANDBOX_PERPETUAL_WAVE_NAME,
              admin_group_id: SANDBOX_ADMIN_GROUP_ID,
              description: SANDBOX_PERPETUAL_WAVE_DESCRIPTION,
            }),
          }),
        ])
      );

    await expect(page).toHaveURL(
      new RegExp(`/waves/${SANDBOX_CREATED_WAVE_ID}$`),
      { timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS }
    );
    await expectNoUnsafeSandboxMutations(baseURL);
  });

  test("keeps the ranking mode choice out of approve wave dates", async ({
    page,
  }) => {
    await gotoCreateWave(page);

    await page.getByLabel(/Wave Name/).fill("Sandbox Approve Wave");
    await page.getByText("Approve", { exact: true }).click();
    // The ranking-mode choice is a Rank-only concept, on Overview included.
    await expect(page.getByText("Perpetual Ranking")).toBeHidden();
    await nextStepButton(page).click();

    await expect(
      page.getByRole("heading", { name: "Who can vote" })
    ).toBeVisible();
    await nextStepButton(page).click();

    await expect(
      page.getByRole("heading", { name: "Wave End", level: 3 })
    ).toBeVisible({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    await expect(page.getByText("Perpetual Ranking")).toBeHidden();
    await expect(
      page.getByRole("button", { name: "Winners Announcements" })
    ).toBeHidden();
  });
});

async function gotoCreateWave(page: Page) {
  await installExternalDataFixtures(page);
  await page.goto("/waves/create", { waitUntil: "domcontentloaded" });
  await waitForRouteReady(page);
  await expect(page).toHaveURL(/\/waves\/create$/);
  await expect(page.getByLabel(/Wave Name/)).toBeVisible({
    timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
  });
  await dismissNextDevTools(page);
  await expectNoHorizontalOverflow(page);
}

async function fillDescription(page: Page, text: string) {
  const editor = page.locator('[contenteditable="true"]').last();
  await expect(editor).toBeVisible({
    timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
  });
  await editor.fill(text);
}

function nextStepButton(page: Page) {
  return page.getByRole("button", { name: "Next", exact: true });
}

function previousStepButton(page: Page) {
  return page.getByRole("button", { name: "Previous", exact: true });
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

import type { BrowserContext } from "@playwright/test";
import { expect, test } from "../testHelpers";
import {
  closeE2eeUsers,
  e2eeSandboxControls,
  type E2eeUserSession,
  openE2eeUser,
  resetE2eeSandbox,
} from "../support/e2ee/e2eeSandboxSession";
import {
  enroll,
  expectMessage,
  gotoPath,
  messageRow,
  openConversationFromList,
  sendMessage,
  startChat,
} from "../support/e2ee/e2eeUi";
import { isMobileWebProject } from "../support/surfaceSimulation";

const PROFILE_WAVE_ID = "00000000-0000-4000-8000-000000000529";

/** Decorate existing sandbox identities without changing encrypted traffic. */
async function decorateProfiles(context: BrowserContext) {
  await context.route(/\/api\/identities\/[^/]+$/u, async (route) => {
    const response = await route.fetch();
    const profile = await response.json();
    await route.fulfill({
      response,
      json: {
        ...profile,
        level: profile.handle === "bob" ? 82 : 51,
        profile_wave_id: profile.handle === "bob" ? PROFILE_WAVE_ID : null,
      },
    });
  });
}

test.describe("Encrypted sender profiles @medium @local-only @e2ee", () => {
  test.describe.configure({ timeout: 300_000 });
  test.skip(
    process.env["PLAYWRIGHT_E2EE_SANDBOX"] !== "1" ||
      process.env["PLAYWRIGHT_ENV"] !== "local",
    "Encrypted messages sandbox requires the local E2EE mock API runner."
  );

  let sessions: E2eeUserSession[] = [];
  test.afterEach(async () => {
    const open = sessions;
    sessions = [];
    await closeE2eeUsers(open);
  });

  test("ordinary sender identities and profile navigation on desktop and phone", async ({
    baseURL,
    browser,
  }, testInfo) => {
    const users = await resetE2eeSandbox(baseURL);
    const alice = await openE2eeUser(browser, testInfo, baseURL, users.alice);
    sessions.push(alice);
    const bob = await openE2eeUser(browser, testInfo, baseURL, users.bob);
    sessions.push(bob);
    await decorateProfiles(alice.context);
    await decorateProfiles(bob.context);
    await enroll(alice);
    await enroll(bob);
    await startChat(alice, ["bob"]);
    const chatUrl = alice.page.url();
    const hello = "Hello @bob, profiles still work in an encrypted chat.";
    const reply = "Hello Alice, this message stays encrypted.";
    await sendMessage(alice.page, hello);
    await openConversationFromList(bob.page, "alice");
    await expectMessage(bob.page, hello);
    await sendMessage(bob.page, reply);
    await expectMessage(alice.page, reply);

    const headerName = alice.page
      .getByRole("heading", { level: 1, name: "bob" })
      .getByRole("link", { name: "bob", exact: true });
    await expect(headerName).toHaveAttribute("href", "/bob");
    const introName = alice.page
      .getByRole("heading", { level: 2, name: "bob" })
      .getByRole("link", { name: "bob", exact: true });
    await expect(introName).toHaveAttribute("href", "/bob");
    await expect(
      messageRow(alice.page, hello).getByRole("link", {
        name: "alice",
        exact: true,
      })
    ).toHaveAttribute("href", "/alice");
    await expect(
      messageRow(alice.page, hello).getByRole("link", {
        name: "@bob",
        exact: true,
      })
    ).toHaveAttribute("href", "/bob");
    await expect(
      messageRow(alice.page, hello).getByLabel("Level 51")
    ).toBeVisible();
    const received = messageRow(alice.page, reply);
    await expect(
      received.getByRole("link", { name: "bob", exact: true })
    ).toHaveAttribute("href", "/bob");
    await expect(
      received.getByRole("link", { name: "View bob's profile" })
    ).toHaveAttribute("href", "/bob");
    await expect(received.getByLabel("Level 82")).toBeVisible();
    await expect(
      received.locator(`button[data-wave-id="${PROFILE_WAVE_ID}"]`)
    ).toBeVisible();

    const overflow = await alice.page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth
    );
    expect(overflow).toBe(false);
    await alice.page.screenshot({
      path: testInfo.outputPath("encrypted-profiles.png"),
      fullPage: true,
    });
    if (!isMobileWebProject(testInfo.project.name)) {
      await headerName.focus();
      await expect(
        alice.page.getByRole("dialog", { name: "User profile for bob" })
      ).toBeVisible();
      await alice.page.keyboard.press("Escape");
    }
    await headerName.click();
    await expect(alice.page).toHaveURL(/\/bob$/u, { timeout: 60_000 });
    await gotoPath(alice.page, new URL(chatUrl).pathname);
    await expectMessage(alice.page, reply);
    await received.getByRole("link", { name: "bob", exact: true }).click();
    await expect(alice.page).toHaveURL(/\/bob$/u, { timeout: 30_000 });

    const scan = await e2eeSandboxControls.plaintextScan(baseURL, [
      hello,
      reply,
    ]);
    expect(scan.found).toEqual([]);
  });
});

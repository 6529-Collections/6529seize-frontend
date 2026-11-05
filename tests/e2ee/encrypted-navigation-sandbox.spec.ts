import { expect, test } from "../testHelpers";
import { installSurfaceSimulation } from "../support/surfaceSimulation";
import {
  closeE2eeUsers,
  type E2eeUserSession,
  openE2eeUser,
  resetE2eeSandbox,
} from "../support/e2ee/e2eeSandboxSession";
import {
  enroll,
  ENCRYPTED_ROUTE,
  openConversationFromList,
  startChat,
} from "../support/e2ee/e2eeUi";

test.describe("Encrypted chat navigation @medium @local-only @e2ee", () => {
  test.describe.configure({ timeout: 300_000 });
  test.skip(
    process.env["PLAYWRIGHT_E2EE_SANDBOX"] !== "1" ||
      process.env["PLAYWRIGHT_ENV"] !== "local",
    "Requires the local E2EE mock API runner."
  );

  let sessions: E2eeUserSession[] = [];
  test.afterEach(async () => {
    const open = sessions;
    sessions = [];
    await closeE2eeUsers(open);
  });

  test("iPad app keeps the back arrow when rotating into landscape", async ({
    baseURL,
    browser,
  }, testInfo) => {
    const users = await resetE2eeSandbox(baseURL);
    const alice = await openE2eeUser(browser, testInfo, baseURL, users.alice);
    sessions.push(alice);
    await installSurfaceSimulation(alice.context, "capacitor-ios-sim", baseURL);
    const bob = await openE2eeUser(browser, testInfo, baseURL, users.bob);
    sessions.push(bob);
    // Wallet balance reads are unrelated to navigation and blocked by the sandbox.
    for (const session of sessions) {
      await session.context.route("https://rpc.walletconnect.org/**", (route) =>
        route.fulfill({
          status: 400,
          json: { error: "Fixture RPC unavailable" },
        })
      );
    }
    await alice.page.setViewportSize({ width: 834, height: 1194 });
    await enroll(alice);
    await enroll(bob);
    await startChat(alice, ["bob"]);
    const chatUrl = alice.page.url();
    const back = alice.page.getByRole("link", {
      name: "Back to encrypted messages",
    });

    for (const viewport of [
      { width: 834, height: 1194 },
      { width: 1194, height: 834 },
      { width: 1366, height: 1024 },
    ]) {
      await alice.page.setViewportSize(viewport);
      await expect(back).toBeVisible();
      await expect(back).toHaveAttribute("href", ENCRYPTED_ROUTE);
      expect(
        await alice.page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth
        )
      ).toBe(false);
      await alice.page.screenshot({
        path: testInfo.outputPath(`encrypted-ipad-${viewport.width}.png`),
        fullPage: true,
      });
      await back.click();
      await expect(alice.page).toHaveURL(
        new RegExp(`${ENCRYPTED_ROUTE}$`, "u")
      );
      await openConversationFromList(alice.page, "bob");
      await expect(alice.page).toHaveURL(chatUrl);
    }

    await bob.page.setViewportSize({ width: 1366, height: 1024 });
    await openConversationFromList(bob.page, "alice");
    const webBack = bob.page.getByRole("link", {
      name: "Back to encrypted messages",
      includeHidden: true,
    });
    await expect(webBack).toBeHidden();
    await bob.page.setViewportSize({ width: 834, height: 1194 });
    await expect(webBack).toBeVisible();
  });
});

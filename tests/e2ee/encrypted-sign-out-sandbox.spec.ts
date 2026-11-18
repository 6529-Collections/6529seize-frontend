import { expect, test } from "../testHelpers";
import { e2eeMessage } from "../support/e2ee/e2eeCopy";
import {
  openE2eeUser,
  resetE2eeSandbox,
} from "../support/e2ee/e2eeSandboxSession";
import { enroll } from "../support/e2ee/e2eeUi";
import { installSurfaceSimulation } from "../support/surfaceSimulation";

test("mobile sign-out replaces the drawer with the encrypted messages choice @medium @local-only @e2ee", async ({
  baseURL,
  browser,
}, testInfo) => {
  test.skip(
    process.env["PLAYWRIGHT_E2EE_SANDBOX"] !== "1" ||
      process.env["PLAYWRIGHT_ENV"] !== "local" ||
      testInfo.project.name !== "capacitor-ios-sim",
    "Requires the iPhone browser simulation and local encrypted messages sandbox."
  );
  test.setTimeout(240_000);
  const { alice } = await resetE2eeSandbox(baseURL);
  const session = await openE2eeUser(browser, testInfo, baseURL, alice);
  const { context, page } = session;
  try {
    await installSurfaceSimulation(context, testInfo.project.name, baseURL);
    await enroll(session, { app: true });

    const menuButton = page.getByRole("button", {
      name: "Open menu",
      exact: true,
    });
    const closeMenu = page.getByRole("button", {
      name: "Close menu",
      exact: true,
      includeHidden: true,
    });
    const logout = page.getByRole("button", {
      name: "Disconnect & Logout",
      exact: true,
    });
    const confirmation = page.getByRole("dialog", {
      name: e2eeMessage("e2ee.signOut.title"),
      exact: true,
    });
    const removeMessages = confirmation.getByRole("checkbox", {
      name: e2eeMessage("e2ee.signOut.remove.label"),
    });

    await menuButton.tap();
    await logout.scrollIntoViewIfNeeded();
    await logout.tap();
    await expect(removeMessages).toBeVisible();
    await expect(closeMenu).toHaveCount(0);
    await expect(removeMessages).not.toBeChecked();
    await removeMessages.tap();
    await expect(removeMessages).toBeChecked();
    await confirmation
      .getByRole("button", { name: e2eeMessage("e2ee.action.cancel") })
      .tap();
    await expect(confirmation).toHaveCount(0);
    await expect(closeMenu).toHaveCount(0);

    await menuButton.tap();
    await logout.scrollIntoViewIfNeeded();
    await logout.tap();
    await expect(removeMessages).toBeVisible();
    await expect(removeMessages).not.toBeChecked();
    await confirmation
      .getByRole("button", { name: e2eeMessage("e2ee.signOut.confirm") })
      .tap();
    await expect(confirmation).toHaveCount(0);
    await expect(closeMenu).toHaveCount(0);
  } finally {
    await session.close();
  }
});

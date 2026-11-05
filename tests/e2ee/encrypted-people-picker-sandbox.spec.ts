import { expect, test } from "../testHelpers";
import {
  closeE2eeUsers,
  E2EE_UI_TIMEOUT_MS,
  type E2eeUserSession,
  openE2eeUser,
  resetE2eeSandbox,
} from "../support/e2ee/e2eeSandboxSession";
import {
  enroll,
  ENCRYPTED_ROUTE,
  gotoPath,
  peopleSearch,
  selectedPerson,
} from "../support/e2ee/e2eeUi";

test.describe("Encrypted chat people picker @medium @local-only @e2ee", () => {
  test.describe.configure({ timeout: 300_000 });
  // Dev auth and mutable fixtures require the opt-in loopback delivery service.
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

  test("selects on a completed tap, preserves keyboard activation and dismisses results", async ({
    baseURL,
    browser,
    isMobile,
  }, testInfo) => {
    const users = await resetE2eeSandbox(baseURL);
    const alice = await openE2eeUser(browser, testInfo, baseURL, users.alice);
    sessions.push(alice);
    const bob = await openE2eeUser(browser, testInfo, baseURL, users.bob);
    sessions.push(bob);
    await enroll(alice);
    await enroll(bob);

    const page = alice.page;
    await gotoPath(page, `${ENCRYPTED_ROUTE}/new`);
    const search = peopleSearch(page);
    const result = page.getByRole("button", { name: "bob", exact: true });
    const create = page.getByRole("button", { name: "Start encrypted chat" });

    await search.fill("bob");
    await expect(result).toBeVisible();
    await search.press("Escape");
    await expect(result).toHaveCount(0);
    await expect(search).toHaveValue("bob");

    await search.blur();
    await search.focus();
    await expect(result).toBeVisible();
    await page
      .getByRole("heading", { name: "Start an encrypted chat" })
      .click();
    await expect(result).toHaveCount(0);
    await expect(page.getByText("No one selected yet.")).toBeVisible();

    await search.focus();
    await expect(result).toBeVisible();
    if (isMobile) {
      await result.tap();
    } else {
      await result.click();
    }
    const selected = selectedPerson(page, "bob");
    await expect(selected).toHaveCount(1);
    await expect(
      selected.getByText("Can receive encrypted messages")
    ).toBeVisible({
      timeout: E2EE_UI_TIMEOUT_MS,
    });
    await expect(search).toHaveValue("");
    await expect(page.getByText("No one selected yet.")).toHaveCount(0);
    await expect(create).toBeEnabled();

    for (const key of ["Enter", "Space"]) {
      await page
        .getByRole("button", { name: "Remove bob", exact: true })
        .click();
      await expect(create).toBeDisabled();
      await search.fill("bob");
      await result.focus();
      await expect(result).toBeFocused();
      await result.press(key);
      await expect(selected).toHaveCount(1);
      await expect(search).toHaveValue("");
      await expect(create).toBeEnabled();
    }
  });
});

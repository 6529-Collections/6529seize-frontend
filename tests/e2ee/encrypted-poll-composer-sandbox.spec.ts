import { expect, test } from "../testHelpers";
import {
  closeE2eeUsers,
  openE2eeUser,
  resetE2eeSandbox,
} from "../support/e2ee/e2eeSandboxSession";
import { composer, enroll, startChat } from "../support/e2ee/e2eeUi";

test.describe("Encrypted poll composer @medium @local-only @e2ee", () => {
  test.describe.configure({ timeout: 240_000 });
  test.skip(
    process.env["PLAYWRIGHT_E2EE_SANDBOX"] !== "1" ||
      process.env["PLAYWRIGHT_ENV"] !== "local",
    "Encrypted messages sandbox requires the local E2EE mock API runner."
  );

  test("shows the inline poll draft and preserves the message draft on close", async ({
    baseURL,
    browser,
  }, testInfo) => {
    const users = await resetE2eeSandbox(baseURL);
    const alice = await openE2eeUser(browser, testInfo, baseURL, users.alice);
    const bob = await openE2eeUser(browser, testInfo, baseURL, users.bob);
    try {
      await enroll(alice);
      await enroll(bob);
      await startChat(alice, ["bob"], { kind: "group" });

      const page = alice.page;
      await composer(page).fill("An unfinished chat message");
      const create = page.getByRole("button", { name: "Create poll" });
      await create.click();

      const form = page.getByRole("form", { name: "Create poll" });
      await expect(
        form.getByRole("heading", { name: "Create poll" })
      ).toBeFocused();
      await expect(
        form.getByRole("button", { name: "Single" })
      ).toHaveAttribute("aria-pressed", "true");
      await expect(form.getByText("Enter at least 2 options.")).toBeVisible();
      await expect(
        form.getByRole("button", { name: "Post poll" })
      ).toBeDisabled();
      await expect(composer(page)).toBeHidden();
      await testInfo.attach("empty encrypted poll composer", {
        body: await form.screenshot(),
        contentType: "image/png",
      });

      const multiple = form.getByRole("button", { name: "Multiple" });
      await multiple.click();
      await expect(multiple).toHaveAttribute("aria-pressed", "true");
      await expect(
        form.getByText("Voters can select more than one option.")
      ).toBeVisible();
      await form.getByRole("button", { name: "Add option" }).click();
      await expect(form.getByLabel("Poll option 3")).toBeVisible();
      await form.getByRole("button", { name: "Remove option 3" }).click();
      await expect(form.getByLabel("Poll option 3")).toHaveCount(0);

      await form.getByRole("button", { name: "Remove poll" }).click();
      await expect(form).toBeHidden();
      await expect(composer(page)).toHaveText("An unfinished chat message");
      await expect(create).toBeFocused();
    } finally {
      await closeE2eeUsers([alice, bob]);
    }
  });
});

import type { Locator, TestInfo } from "@playwright/test";
import {
  closeE2eeUsers,
  openE2eeUser,
  resetE2eeSandbox,
} from "../support/e2ee/e2eeSandboxSession";
import { enroll, openConversation, startChat } from "../support/e2ee/e2eeUi";
import {
  endEncryptedPoll,
  pollCard,
  postEncryptedPoll,
} from "../support/e2ee/polls";
import { expect, test } from "../testHelpers";

test.describe("Posted encrypted poll @medium @local-only @e2ee", () => {
  test.describe.configure({ timeout: 240_000 });
  test.skip(
    process.env["PLAYWRIGHT_E2EE_SANDBOX"] !== "1" ||
      process.env["PLAYWRIGHT_ENV"] !== "local",
    "Encrypted messages sandbox requires the local E2EE mock API runner."
  );

  test("switches between voting and results and keeps results available after closing", async ({
    baseURL,
    browser,
  }, testInfo) => {
    const users = await resetE2eeSandbox(baseURL);
    const alice = await openE2eeUser(browser, testInfo, baseURL, users.alice);
    const bob = await openE2eeUser(browser, testInfo, baseURL, users.bob);
    try {
      await enroll(alice);
      await enroll(bob);
      const group = await startChat(alice, ["bob"], { kind: "group" });
      const question = "What should we serve?";
      await postEncryptedPoll(alice.page, question, false);
      await openConversation(bob.page, group);

      const card = pollCard(bob.page, question);
      const viewResults = card.getByRole("button", { name: "View results" });
      const vote = card.getByRole("button", { name: "Vote", exact: true });
      const coffee = card.getByText("Coffee", { exact: true });
      const coffeeBallot = card.getByRole("radio", { name: "Coffee" });
      const coffeeResult = card.getByRole("button", {
        name: /^View voters for Coffee\./u,
      });
      await expect(viewResults).toBeVisible({ timeout: 45_000 });
      await expect(vote).toHaveCount(0);
      await capture(card, "open poll", testInfo);

      await viewResults.click();
      await expect(card.getByText("0 votes", { exact: true })).toHaveCount(2);
      await expect(coffeeBallot).toHaveCount(0);
      await vote.click();
      await coffee.click();
      await expect(coffeeBallot).toBeChecked();
      await vote.click();
      await expect(card.getByText("Voted", { exact: true })).toBeVisible({
        timeout: 45_000,
      });
      await expect(coffeeResult).toHaveAccessibleName(/1 vote, 100 percent/u);
      await capture(card, "voted poll results", testInfo);

      await card.getByRole("button", { name: "Change vote" }).click();
      await expect(coffeeBallot).toBeChecked();
      await card.getByRole("button", { name: "Clear selection" }).click();
      await card.getByRole("button", { name: "Update vote" }).click();
      await expect(card.getByText("0 votes", { exact: true })).toHaveCount(2, {
        timeout: 45_000,
      });
      await vote.click();
      await coffee.click();
      await vote.click();
      await expect(coffeeResult).toBeVisible({ timeout: 45_000 });

      await alice.page.route(
        /\/e2ee\/groups\/[^/]+\/messages(?:\?|$)/u,
        (route) =>
          route.fulfill({
            status: 400,
            contentType: "application/json",
            body: JSON.stringify({
              error: "Rejected close event",
              code: "E2EE_INVALID_INPUT",
            }),
          }),
        { times: 1 }
      );
      await endEncryptedPoll(alice.page, question);
      const endDialog = alice.page.getByRole("dialog", { name: "End poll" });
      await expect(endDialog.getByRole("alert")).toBeVisible();
      await expect(card.getByText("Poll ended", { exact: true })).toHaveCount(
        0
      );
      await endDialog.getByRole("button", { name: "End poll" }).click();
      await expect(endDialog).toBeHidden();
      await expect(card.getByText("Poll ended", { exact: true })).toBeVisible({
        timeout: 45_000,
      });
      await expect(
        card.getByRole("button", { name: "Change vote" })
      ).toHaveCount(0);
      await coffeeResult.click();
      await expect(card.getByText("You", { exact: true })).toBeVisible();
      await capture(card, "closed poll with voters", testInfo);
    } finally {
      await closeE2eeUsers([alice, bob]);
    }
  });
});

async function capture(card: Locator, name: string, testInfo: TestInfo) {
  await testInfo.attach(name, {
    body: await card.screenshot({ animations: "disabled" }),
    contentType: "image/png",
  });
}

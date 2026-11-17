import type { Page } from "@playwright/test";
import { expect } from "../../testHelpers";

export async function postEncryptedPoll(
  page: Page,
  question: string,
  multi: boolean
) {
  await page.getByRole("button", { name: "Create poll" }).click();
  const form = page.getByRole("form", { name: "Create poll" });
  await form.getByLabel("Question", { exact: true }).fill(question);
  await form.getByLabel("Poll option 1", { exact: true }).fill("Tea");
  await form.getByLabel("Poll option 2", { exact: true }).fill("Coffee");
  if (multi) {
    await form.getByRole("button", { name: "Multiple", exact: true }).click();
  }
  await form.getByRole("button", { name: "Post poll" }).click();
  await expect(form).toBeHidden();
  await expect(pollCard(page, question)).toBeVisible({ timeout: 45_000 });
}

export function pollCard(page: Page, question: string) {
  return page.getByRole("region", { name: question, exact: true });
}

export async function checkEncryptedPoll(
  author: Page,
  voter: Page,
  voterHandle: string,
  question: string,
  multi: boolean
) {
  await postEncryptedPoll(author, question, multi);
  const recipient = pollCard(voter, question);
  await expect(recipient).toBeVisible({ timeout: 45_000 });
  const role = multi ? "checkbox" : "radio";
  await recipient.getByRole(role, { name: "Tea", exact: true }).check();
  await recipient.getByRole(role, { name: "Coffee", exact: true }).check();
  await expect(
    recipient.getByRole(role, { name: "Tea", exact: true })
  ).toBeChecked({
    checked: multi,
  });
  await recipient.getByRole("button", { name: "Vote", exact: true }).click();

  const creator = pollCard(author, question);
  await creator
    .getByText("View votes", { exact: true })
    .click({ timeout: 45_000 });
  await expect(creator.getByText(voterHandle, { exact: true })).toHaveCount(
    multi ? 2 : 1
  );
  await expect(recipient.getByRole("button", { name: "End poll" })).toHaveCount(
    0
  );
  await creator.getByRole("button", { name: "End poll" }).click();
  await author
    .getByRole("dialog", { name: "End poll" })
    .getByRole("button", { name: "End poll" })
    .click();
  await expect(recipient.getByText("Poll ended", { exact: true })).toBeVisible({
    timeout: 45_000,
  });
  await expect(recipient.getByRole(role)).toHaveCount(0);
}

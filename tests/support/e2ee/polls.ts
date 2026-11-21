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
  await recipient.getByText("Tea", { exact: true }).click();
  await recipient.getByText("Coffee", { exact: true }).click();
  await expect(
    recipient.getByRole(role, { name: "Coffee", exact: true })
  ).toBeChecked();
  await expect(
    recipient.getByRole(role, { name: "Tea", exact: true })
  ).toBeChecked({
    checked: multi,
  });
  await recipient.getByRole("button", { name: "Vote", exact: true }).click();

  const creator = pollCard(author, question);
  await creator
    .getByRole("button", { name: "View results", exact: true })
    .click();
  const coffee = creator.getByRole("button", {
    name: /^View voters for Coffee\./u,
  });
  await coffee.click({ timeout: 45_000 });
  await expect(creator.getByText(voterHandle, { exact: true })).toBeVisible();
  const tea = creator.getByRole("button", { name: /^View voters for Tea\./u });
  if (multi) {
    await tea.click();
    await expect(creator.getByText(voterHandle, { exact: true })).toBeVisible();
  } else {
    await expect(tea).toHaveCount(0);
  }

  await recipient.getByRole("button", { name: "Change vote" }).click();
  await recipient.getByText(multi ? "Coffee" : "Tea", { exact: true }).click();
  await expect(
    recipient.getByRole(role, { name: "Tea", exact: true })
  ).toBeChecked();
  await expect(
    recipient.getByRole(role, { name: "Coffee", exact: true })
  ).not.toBeChecked();
  await recipient.getByRole("button", { name: "Update vote" }).click();
  await expect(
    creator.getByRole("button", { name: /^(?:View|Hide) voters for Coffee\./u })
  ).toHaveCount(0, { timeout: 45_000 });
  await expect(
    creator.getByRole("button", { name: /^(?:View|Hide) voters for Tea\./u })
  ).toHaveAccessibleName(/1 vote, 100 percent/u);

  await expect(recipient.getByRole("button", { name: "End poll" })).toHaveCount(
    0
  );
  await endEncryptedPoll(author, question);
  await expect(recipient.getByText("Poll ended", { exact: true })).toBeVisible({
    timeout: 45_000,
  });
  await expect(recipient.getByRole(role)).toHaveCount(0);
}

export async function endEncryptedPoll(author: Page, question: string) {
  await pollCard(author, question)
    .getByRole("button", { name: "End poll" })
    .click();
  await author
    .getByRole("dialog", { name: "End poll" })
    .getByRole("button", { name: "End poll" })
    .click();
}

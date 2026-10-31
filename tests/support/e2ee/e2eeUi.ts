import { expect, type Locator, type Page } from "@playwright/test";

import { dismissNextDevTools } from "../localSandbox";
import {
  E2EE_SYNC_TIMEOUT_MS,
  E2EE_UI_TIMEOUT_MS,
  type E2eeUserSession,
} from "./e2eeSandboxSession";

/**
 * Browser-level steps for the encrypted messages UI (D109). Selectors use
 * roles and the en-US copy from i18n/messages/e2ee.ts.
 */

export const ENCRYPTED_ROUTE = "/messages/encrypted";
const CONVERSATION_URL = /\/messages\/encrypted\/(0x[0-9a-f]{64})$/u;
/** First visit compiles routes and loads the MLS WebAssembly module. */
const FIRST_LOAD_TIMEOUT_MS = 120_000;

/** The enrollment card point about history living on devices (and backup). */
export const NO_BACKUP_WARNING =
  "Your history is stored on your devices. If you lose all of them or clear this browser’s data, you lose it, unless you turn on encrypted backup in Devices.";

export async function gotoPath(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await dismissNextDevTools(page);
}

export function enrollmentHeading(page: Page): Locator {
  return page.getByRole("heading", { name: "Turn on encrypted messages" });
}

export function enrollButton(page: Page): Locator {
  return page.getByRole("button", {
    name: "Turn on encrypted messages (one signature)",
  });
}

/** Opens the encrypted list; the gate shows the enrollment card on first use. */
export async function expectEnrollmentCard(page: Page) {
  await gotoPath(page, ENCRYPTED_ROUTE);
  await expect(enrollmentHeading(page)).toBeVisible({
    timeout: FIRST_LOAD_TIMEOUT_MS,
  });
  const card = page.getByRole("region", {
    name: "Turn on encrypted messages",
  });
  await expect(card.getByText(NO_BACKUP_WARNING)).toBeVisible();
  await expect(enrollButton(page)).toBeEnabled({
    timeout: FIRST_LOAD_TIMEOUT_MS,
  });
}

/** First use: the card, then exactly one wallet signature. */
export async function enroll(session: E2eeUserSession) {
  const { page } = session;
  await expectEnrollmentCard(page);
  const before = session.signatureCount();
  await enrollButton(page).click();
  await expect(enrollmentHeading(page)).toHaveCount(0, {
    timeout: E2EE_UI_TIMEOUT_MS,
  });
  await expect(
    page.getByRole("link", { name: "Devices for encrypted messages" })
  ).toBeVisible();
  expect(session.signatureCount()).toBe(before + 1);
}

export function peopleSearch(page: Page, label = "Search people"): Locator {
  return page.getByPlaceholder(label, { exact: true });
}

/** Adds one person through the identity search; waits for eligibility. */
export async function pickPerson(
  scope: Page | Locator,
  handle: string,
  options: {
    readonly searchLabel?: string;
    readonly listLabel?: string;
    readonly expectedStatus?: string;
  } = {}
) {
  await scope
    .getByPlaceholder(options.searchLabel ?? "Search people", { exact: true })
    .fill(handle);
  await scope.getByRole("button", { name: handle, exact: true }).click();
  const row = selectedPerson(scope, handle, options.listLabel);
  await expect(row).toBeVisible();
  await expect(
    row.getByText(options.expectedStatus ?? "Can receive encrypted messages")
  ).toBeVisible({ timeout: E2EE_UI_TIMEOUT_MS });
}

/** A chosen person in the picker's list, with their eligibility line. */
export function selectedPerson(
  scope: Page | Locator,
  handle: string,
  listLabel = "People in this chat"
): Locator {
  return scope
    .getByRole("list", { name: listLabel })
    .getByRole("listitem")
    .filter({ hasText: handle });
}

export function conversationIdFromUrl(page: Page): string {
  const match = CONVERSATION_URL.exec(new URL(page.url()).pathname);
  if (!match?.[1]) {
    throw new Error(`Not on an encrypted conversation: ${page.url()}`);
  }
  return match[1];
}

/** `/messages/encrypted/new`: people, kind and optional group name. */
export async function startChat(
  session: E2eeUserSession,
  people: readonly string[],
  options: { readonly kind?: "dm" | "group"; readonly name?: string } = {}
): Promise<string> {
  const { page } = session;
  await gotoPath(page, `${ENCRYPTED_ROUTE}/new`);
  await expect(
    page.getByRole("heading", { name: "New encrypted chat" })
  ).toBeVisible({ timeout: FIRST_LOAD_TIMEOUT_MS });
  for (const handle of people) {
    await pickPerson(page, handle);
  }
  if (options.kind === "group") {
    await page.getByRole("radio", { name: /^Group/u }).check();
  }
  if (options.name) {
    await page.getByLabel("Group name (optional)").fill(options.name);
  }
  await page.getByRole("button", { name: "Start encrypted chat" }).click();
  await expect(page).toHaveURL(CONVERSATION_URL, {
    timeout: E2EE_UI_TIMEOUT_MS,
  });
  await expect(composer(page)).toBeVisible({ timeout: E2EE_UI_TIMEOUT_MS });
  return conversationIdFromUrl(page);
}

export function composer(page: Page): Locator {
  return page.getByRole("textbox", { name: "Encrypted message" });
}

export function timeline(page: Page): Locator {
  return page.getByRole("list", { name: "Messages" });
}

export function messageRow(page: Page, text: string | RegExp): Locator {
  return timeline(page)
    .getByRole("listitem")
    .filter({ has: page.getByText(text, { exact: typeof text === "string" }) });
}

export function notice(page: Page, text: string | RegExp): Locator {
  return timeline(page).getByText(text);
}

/** Types into the composer, sends with Enter, waits until sequenced. */
export async function sendMessage(page: Page, text: string) {
  const input = composer(page);
  await input.fill(text);
  await input.press("Enter");
  const row = messageRow(page, text);
  await expect(row).toBeVisible({ timeout: E2EE_UI_TIMEOUT_MS });
  await expect(row.getByText("Sending…")).toHaveCount(0, {
    timeout: E2EE_SYNC_TIMEOUT_MS,
  });
}

/** Waits (polling, no WebSocket in the sandbox) for a message to arrive. */
export async function expectMessage(page: Page, text: string | RegExp) {
  await expect(messageRow(page, text)).toBeVisible({
    timeout: E2EE_SYNC_TIMEOUT_MS,
  });
}

export async function openMessageActions(page: Page, row: Locator) {
  await row.hover();
  await row.getByRole("button", { name: "Message actions" }).click();
  return page.getByRole("menu");
}

export async function openConversation(page: Page, g: string) {
  await gotoPath(page, `${ENCRYPTED_ROUTE}/${g}`);
  await expect(composer(page)).toBeVisible({ timeout: E2EE_SYNC_TIMEOUT_MS });
}

/** Waits until the list shows the chat (Welcome processed), then opens it. */
export async function openConversationFromList(
  page: Page,
  title: string | RegExp
) {
  await gotoPath(page, ENCRYPTED_ROUTE);
  const row = conversationListRow(page, title);
  await expect(row).toBeVisible({ timeout: E2EE_SYNC_TIMEOUT_MS });
  await row.click();
  await expect(page).toHaveURL(CONVERSATION_URL, {
    timeout: E2EE_UI_TIMEOUT_MS,
  });
  await expect(composer(page)).toBeVisible({ timeout: E2EE_UI_TIMEOUT_MS });
  return conversationIdFromUrl(page);
}

/**
 * The chat's row in the page's encrypted list. On desktop the messages side
 * pane renders its own "Encrypted chats" list first; the page list is last.
 */
export function conversationListRow(page: Page, title: string | RegExp) {
  return page
    .getByRole("list", { name: "Encrypted chats" })
    .last()
    .getByRole("link")
    .filter({ hasText: title });
}

export async function openChatInfo(page: Page) {
  await page.getByRole("button", { name: "Chat info" }).click();
  const dialog = page.getByRole("dialog", { name: "Chat info" });
  // The dialog root is a zero-size wrapper; its title is what renders.
  await expect(
    dialog.getByRole("heading", { name: "Chat info" })
  ).toBeVisible();
  return dialog;
}

export function confirmDialog(page: Page, title: string): Locator {
  return page.getByRole("dialog", { name: title });
}

/** Header title of the open conversation. */
export function conversationTitle(page: Page): Locator {
  return page.getByRole("heading", { level: 1 });
}

export async function closeChatInfo(page: Page) {
  await page.getByRole("button", { name: "Close chat info" }).click();
  await expect(page.getByRole("dialog", { name: "Chat info" })).toHaveCount(0);
}

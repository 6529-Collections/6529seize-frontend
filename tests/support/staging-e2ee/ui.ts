import type { Locator, Page, Request } from "@playwright/test";
import { expect } from "@playwright/test";

import {
  ENCRYPTED_ROUTE,
  FIRST_LOAD_TIMEOUT_MS,
  gotoStaging,
  type StagingE2eeSession,
  SYNC_TIMEOUT_MS,
  UI_TIMEOUT_MS,
} from "./session";

/**
 * Encrypted messages UI steps against staging, located by role and the
 * en-US copy in i18n/messages/e2ee.ts (PR #4274).
 */

const CONVERSATION_PATH = /^\/messages\/encrypted\/(0x[0-9a-f]{64})$/u;
const SEND_MESSAGE_PATH = /^\/api\/e2ee\/groups\/0x[0-9a-f]{64}\/messages$/u;
/** A brand-new profile can take a moment to reach identity search. */
const PEOPLE_SEARCH_TIMEOUT_MS = 120_000;
const UNDECRYPTABLE = "Couldn’t decrypt this message";

export function conversationId(page: Page): string {
  const match = CONVERSATION_PATH.exec(new URL(page.url()).pathname);
  if (!match?.[1]) {
    throw new Error(`Expected an encrypted chat URL, got ${page.url()}`);
  }
  return match[1];
}

export function composer(page: Page): Locator {
  return page.getByRole("textbox", { name: "Encrypted message" });
}

function timeline(page: Page): Locator {
  return page.getByRole("list", { name: "Messages" });
}

export function messageRow(page: Page, text: string): Locator {
  return timeline(page)
    .getByRole("listitem")
    .filter({ has: page.getByText(text, { exact: true }) });
}

/** A membership notice; device changes may be announced more than once. */
export function timelineNotice(page: Page, text: string | RegExp): Locator {
  return timeline(page).getByText(text).first();
}

/**
 * Adds `handle` through the identity search and requires the delivery
 * service to report them able to receive encrypted messages.
 */
export async function pickPerson(
  scope: Page | Locator,
  handle: string,
  options: { readonly searchLabel?: string; readonly listLabel?: string } = {}
) {
  const search = scope.getByPlaceholder(
    options.searchLabel ?? "Search people",
    {
      exact: true,
    }
  );
  // Handles are word characters only; a second line may follow the handle.
  const result = scope.getByRole("button", {
    name: new RegExp(`^${handle}(?:\\s|$)`, "u"),
  });
  // Waiting for search to index the new profile, not retrying an assertion.
  await expect(async () => {
    await search.fill("");
    await search.fill(handle);
    await expect(result).toBeVisible({ timeout: 10_000 });
  }, `identity search never returned ${handle}`).toPass({
    timeout: PEOPLE_SEARCH_TIMEOUT_MS,
    intervals: [2_000, 5_000, 10_000],
  });
  await result.click();
  const row = scope
    .getByRole("list", { name: options.listLabel ?? "People in this chat" })
    .getByRole("listitem")
    .filter({ hasText: handle });
  const eligibility = row.getByText(
    /^(?:Can receive encrypted messages|Doesn’t accept messages from you|Blocked|Hasn’t turned on encrypted messages yet|Couldn’t check\. Try again\.)$/u
  );
  await expect(eligibility).toBeVisible({ timeout: UI_TIMEOUT_MS });
  await expect(
    eligibility,
    `${handle} must be eligible for encrypted messages`
  ).toHaveText("Can receive encrypted messages");
}

/** `/messages/encrypted/new`: returns the new chat's group handle. */
export async function startEncryptedChat(
  session: StagingE2eeSession,
  handles: readonly string[],
  options: { readonly group?: { readonly name: string } } = {}
): Promise<string> {
  const { page } = session;
  await gotoStaging(page, `${ENCRYPTED_ROUTE}/new`);
  await expect(
    page.getByRole("heading", { name: "New encrypted chat" })
  ).toBeVisible({ timeout: FIRST_LOAD_TIMEOUT_MS });
  for (const handle of handles) {
    await pickPerson(page, handle);
  }
  if (options.group) {
    await page.getByRole("radio", { name: /^Group/u }).check();
    await page.getByLabel("Group name (optional)").fill(options.group.name);
  }
  await page.getByRole("button", { name: "Start encrypted chat" }).click();
  await expect(page).toHaveURL((url) => CONVERSATION_PATH.test(url.pathname), {
    timeout: UI_TIMEOUT_MS,
  });
  await expect(composer(page)).toBeVisible({ timeout: UI_TIMEOUT_MS });
  return conversationId(page);
}

/**
 * Sends `text` from the composer and returns the delivery request, so the
 * caller can inspect exactly what the server received.
 */
export async function sendEncrypted(
  session: StagingE2eeSession,
  text: string
): Promise<Request> {
  const { page } = session;
  const sent = page.waitForRequest(
    (request) =>
      request.method() === "POST" &&
      SEND_MESSAGE_PATH.test(new URL(request.url()).pathname),
    { timeout: SYNC_TIMEOUT_MS }
  );
  sent.catch(() => undefined);
  const input = composer(page);
  await input.fill(text);
  await input.press("Enter");
  const request = await sent;
  const row = messageRow(page, text);
  await expect(row).toBeVisible({ timeout: UI_TIMEOUT_MS });
  await expect(
    row.getByText("Sending…"),
    `${session.label}: the message was not sequenced by the delivery service`
  ).toHaveCount(0, { timeout: SYNC_TIMEOUT_MS });
  return request;
}

/** The decrypted message appears, character for character. */
export async function expectDecrypted(
  session: StagingE2eeSession,
  text: string
) {
  await expect(
    messageRow(session.page, text),
    `${session.label} did not receive and decrypt: ${text}`
  ).toBeVisible({ timeout: SYNC_TIMEOUT_MS });
}

export async function expectNothingUndecryptable(session: StagingE2eeSession) {
  await expect(
    session.page.getByText(UNDECRYPTABLE),
    `${session.label} shows a message it could not decrypt`
  ).toHaveCount(0);
  await expect(
    session.page.getByText("Encrypted messages couldn’t start"),
    `${session.label}: the encrypted messages engine failed`
  ).toHaveCount(0);
}

export async function openChat(session: StagingE2eeSession, group: string) {
  await gotoStaging(session.page, `${ENCRYPTED_ROUTE}/${group}`);
  await expect(composer(session.page)).toBeVisible({
    timeout: SYNC_TIMEOUT_MS,
  });
}

/**
 * Waits until this device's encrypted list shows the chat `group` (its
 * Welcome was processed), checks its title, then opens it. Desktop also
 * renders a side-pane list, so the page's own list is the last one. Rows are
 * matched by link target: previews can repeat another chat's names.
 */
export async function openChatFromList(
  session: StagingE2eeSession,
  group: string,
  title: string,
  timeout = SYNC_TIMEOUT_MS
) {
  const { page } = session;
  await gotoStaging(page, ENCRYPTED_ROUTE);
  const row = page
    .getByRole("list", { name: "Encrypted chats" })
    .last()
    .locator(`a[href="${ENCRYPTED_ROUTE}/${group}"]`);
  await expect(
    row,
    `${session.label} never received the encrypted chat "${title}"`
  ).toBeVisible({ timeout });
  await expect(row).toContainText(title);
  await row.click();
  await expect(page).toHaveURL(
    (url) => url.pathname === `${ENCRYPTED_ROUTE}/${group}`,
    { timeout: UI_TIMEOUT_MS }
  );
  await expect(composer(page)).toBeVisible({ timeout: UI_TIMEOUT_MS });
}

/** Chooses files through the composer's real file picker. */
export async function attachFile(
  session: StagingE2eeSession,
  file: {
    readonly name: string;
    readonly mimeType: string;
    readonly buffer: Buffer;
  }
) {
  const { page } = session;
  const chooser = page.waitForEvent("filechooser", { timeout: UI_TIMEOUT_MS });
  await page.getByRole("button", { name: "Attach files" }).click();
  await (await chooser).setFiles(file);
  await expect(
    page.getByRole("list", { name: "Attachments" }).getByText(file.name)
  ).toBeVisible({ timeout: UI_TIMEOUT_MS });
}

/** RGBA pixels of a decrypted image, read back through a canvas. */
export async function imagePixels(image: Locator): Promise<number[]> {
  await expect
    .poll(() =>
      image.evaluate((element: HTMLImageElement) =>
        element.complete ? element.naturalWidth : 0
      )
    )
    .toBeGreaterThan(0);
  return image.evaluate((element: HTMLImageElement) => {
    const canvas = document.createElement("canvas");
    canvas.width = element.naturalWidth;
    canvas.height = element.naturalHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      return [];
    }
    context.drawImage(element, 0, 0);
    return [...context.getImageData(0, 0, canvas.width, canvas.height).data];
  });
}

/** Active rows on `/messages/encrypted/devices`. */
export function activeDeviceRows(page: Page): Locator {
  return page
    .getByRole("main")
    .getByRole("listitem")
    .filter({ has: page.getByRole("button", { name: /^Revoke / }) });
}

/** From the devices page, revokes this person's other active device. */
export async function revokeOtherDevice(session: StagingE2eeSession) {
  const { page } = session;
  await gotoStaging(page, `${ENCRYPTED_ROUTE}/devices`);
  const active = activeDeviceRows(page);
  await expect(
    active,
    `${session.label} should list both of this person's devices`
  ).toHaveCount(2, { timeout: UI_TIMEOUT_MS });
  const thisDevice = page.getByText("This device", { exact: true });
  await expect(active.filter({ has: thisDevice })).toHaveCount(1);
  await active
    .filter({ hasNot: thisDevice })
    .getByRole("button", { name: /^Revoke / })
    .click();
  await page
    .getByRole("dialog", { name: /^Revoke .+\?$/u })
    .getByRole("button", { name: "Revoke device" })
    .click();
  await expect(activeDeviceRows(page)).toHaveCount(1, {
    timeout: UI_TIMEOUT_MS,
  });
  await expect(
    page.getByRole("heading", { name: "Revoked devices" })
  ).toBeVisible({ timeout: UI_TIMEOUT_MS });
}

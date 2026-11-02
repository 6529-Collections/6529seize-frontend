import { expect, test } from "../testHelpers";
import {
  closeE2eeUsers,
  e2eeSandboxControls,
  E2EE_SYNC_TIMEOUT_MS,
  E2EE_UI_TIMEOUT_MS,
  type E2eeUserSession,
  openE2eeUser,
  resetE2eeSandbox,
} from "../support/e2ee/e2eeSandboxSession";
import {
  composer,
  conversationListRow,
  enroll,
  ENCRYPTED_ROUTE,
  expectMessage,
  gotoPath,
  messageRow,
  openConversationFromList,
  openMessageActions,
  sendMessage,
  startChat,
} from "../support/e2ee/e2eeUi";

/** A valid 1x1 RGBA PNG (raster images are the only inline type). */
const PIXEL_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

/**
 * Encrypted 1:1 chat in two real browsers (D109 stories 1, 4, 8, 9, 10, 11).
 * Engine rules are covered in Jest (__tests__/lib/e2ee); this proves the
 * browser path: WASM + IndexedDB + the real UI against the delivery service.
 */
test.describe("Encrypted DMs @medium @local-only @e2ee", () => {
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

  test("enroll once each, then send, receive, edit, delete, react, search and report", async ({
    baseURL,
    browser,
  }, testInfo) => {
    const users = await resetE2eeSandbox(baseURL);
    const alice = await openE2eeUser(browser, testInfo, baseURL, users.alice);
    const bob = await openE2eeUser(browser, testInfo, baseURL, users.bob);
    sessions = [alice, bob];

    // Stories 1 and 4: first use shows the card; one signature per device.
    await enroll(alice);
    await enroll(bob);

    const hello = "Hello Bob, this stays between us.";
    const typo = "Meet at noone";
    const fixed = "Meet at noon";
    const doomed = "This one will be deleted.";
    const reply = "Hi Alice, loud and clear.";

    await startChat(alice, ["bob"]);
    await sendMessage(alice.page, hello);
    await sendMessage(alice.page, typo);
    await sendMessage(alice.page, doomed);

    await openConversationFromList(bob.page, "alice");
    await expectMessage(bob.page, hello);
    await expectMessage(bob.page, typo);
    await sendMessage(bob.page, reply);
    await expectMessage(alice.page, reply);

    // Edit: alice fixes the typo; bob sees the new text, marked edited.
    const typoRow = messageRow(alice.page, typo);
    await (await openMessageActions(alice.page, typoRow))
      .getByRole("menuitem", { name: "Edit" })
      .click();
    await expect(composer(alice.page)).toHaveValue(typo);
    await composer(alice.page).fill(fixed);
    await composer(alice.page).press("Enter");
    await expect(messageRow(alice.page, fixed)).toBeVisible();
    const bobFixed = messageRow(bob.page, fixed);
    await expect(bobFixed).toBeVisible({ timeout: E2EE_SYNC_TIMEOUT_MS });
    await expect(bobFixed.getByText("(edited)")).toBeVisible();
    await expect(messageRow(bob.page, typo)).toHaveCount(0);

    // Delete: alice deletes her own message; bob sees the tombstone.
    await (await openMessageActions(alice.page, messageRow(alice.page, doomed)))
      .getByRole("menuitem", { name: "Delete" })
      .click();
    await alice.page.getByRole("button", { name: "Delete message" }).click();
    await expect(messageRow(alice.page, doomed)).toHaveCount(0);
    await expect(messageRow(bob.page, doomed)).toHaveCount(0, {
      timeout: E2EE_SYNC_TIMEOUT_MS,
    });
    await expect(bob.page.getByText("Message deleted")).toBeVisible();

    // React: bob reacts to alice's first message; alice sees the chip.
    await (await openMessageActions(bob.page, messageRow(bob.page, hello)))
      .getByRole("menuitem", { name: "React with 🔥" })
      .click();
    await expect(
      messageRow(alice.page, hello).getByRole("button", {
        name: /^🔥: 1\. Reacted by bob$/u,
      })
    ).toBeVisible({ timeout: E2EE_SYNC_TIMEOUT_MS });

    // Story 11: search runs over this device's decrypted messages.
    await bob.page.getByRole("button", { name: "Search this chat" }).click();
    await bob.page
      .getByRole("searchbox", { name: "Search messages on this device" })
      .fill("noon");
    await expect(bob.page.getByText("1 result")).toBeVisible({
      timeout: E2EE_UI_TIMEOUT_MS,
    });
    await bob.page.getByRole("button", { name: "Close search" }).click();

    // Story 10 (report, severe harm only): the delivery service verifies the
    // sender signature.
    await (await openMessageActions(bob.page, messageRow(bob.page, hello)))
      .getByRole("menuitem", { name: "Report illegal or severe harm" })
      .click();
    const reportDialog = bob.page.getByRole("dialog", {
      name: "Report illegal or severe harm",
    });
    await reportDialog
      .getByRole("radio", { name: "A credible threat of violence" })
      .check();
    await reportDialog.getByRole("button", { name: "Send report" }).click();
    await expect(reportDialog).toHaveCount(0, { timeout: E2EE_UI_TIMEOUT_MS });

    const state = await e2eeSandboxControls.state(baseURL);
    expect(state.reports).toHaveLength(1);
    expect(state.reports[0]).toMatchObject({
      verified: true,
      sender_profile_id: users.alice.profileId,
      reporter_profile_id: users.bob.profileId,
      reason: "CREDIBLE_THREAT_OF_VIOLENCE",
    });

    // Invariant 1: the server never saw plaintext (reports aside, by design).
    const scan = await e2eeSandboxControls.plaintextScan(baseURL, [
      hello,
      typo,
      fixed,
      doomed,
      reply,
    ]);
    expect(scan.scannedBytes).toBeGreaterThan(0);
    expect(scan.found).toEqual([]);
    expect(scan.foundInReports).toEqual([hello]);

    // Enrollment was the only wallet prompt on each device.
    expect(alice.signatureCount()).toBe(1);
    expect(bob.signatureCount()).toBe(1);
  });

  test("an encrypted image round-trips and the unread badge follows it", async ({
    baseURL,
    browser,
  }, testInfo) => {
    const users = await resetE2eeSandbox(baseURL);
    const alice = await openE2eeUser(browser, testInfo, baseURL, users.alice);
    const bob = await openE2eeUser(browser, testInfo, baseURL, users.bob);
    sessions = [alice, bob];
    await enroll(alice);
    await enroll(bob);

    await startChat(alice, ["bob"]);
    await sendMessage(alice.page, "Picture coming up.");
    await openConversationFromList(bob.page, "alice");
    await expectMessage(bob.page, "Picture coming up.");
    await gotoPath(bob.page, ENCRYPTED_ROUTE);
    const bobRow = conversationListRow(bob.page, "alice");
    await expect(bobRow).toBeVisible({ timeout: E2EE_UI_TIMEOUT_MS });
    await expect(bobRow.getByText(/unread message/u)).toHaveCount(0);

    // Story 9: the image is encrypted in the browser and uploaded as a blob.
    const caption = "Here is the picture.";
    const chooser = alice.page.waitForEvent("filechooser");
    // Keyboard activation: on phones the dev-only Next.js badge overlaps the
    // composer's bottom-left attach button.
    await alice.page
      .getByRole("button", { name: "Attach files" })
      .press("Enter");
    await (
      await chooser
    ).setFiles({
      name: "pixel.png",
      mimeType: "image/png",
      buffer: Buffer.from(PIXEL_PNG_BASE64, "base64"),
    });
    await expect(
      alice.page
        .getByRole("list", { name: "Attachments" })
        .getByText("pixel.png")
    ).toBeVisible();
    await sendMessage(alice.page, caption);
    await expect(
      messageRow(alice.page, caption).getByRole("img", {
        name: "Image: pixel.png",
      })
    ).toBeVisible({ timeout: E2EE_UI_TIMEOUT_MS });

    // Story 8: bob's list shows the unread message and its preview.
    await expect(bobRow.getByText("1 unread message")).toBeAttached({
      timeout: E2EE_SYNC_TIMEOUT_MS,
    });
    await expect(bobRow).toContainText(caption);
    await bobRow.click();
    const image = messageRow(bob.page, caption).getByRole("img", {
      name: "Image: pixel.png",
    });
    await expect(image).toBeVisible({ timeout: E2EE_SYNC_TIMEOUT_MS });
    await expect
      .poll(() =>
        image.evaluate((element: HTMLImageElement) => element.naturalWidth)
      )
      .toBe(1);
    await gotoPath(bob.page, ENCRYPTED_ROUTE);
    await expect(conversationListRow(bob.page, "alice")).toBeVisible({
      timeout: E2EE_UI_TIMEOUT_MS,
    });
    await expect(
      conversationListRow(bob.page, "alice").getByText(/unread message/u)
    ).toHaveCount(0);

    const state = await e2eeSandboxControls.state(baseURL);
    expect(state.notify.at(-1)?.hints).toEqual([
      { profile_id: users.bob.profileId, kind: "message" },
    ]);
    const scan = await e2eeSandboxControls.plaintextScan(baseURL, [
      caption,
      PIXEL_PNG_BASE64,
    ]);
    expect(scan.found).toEqual([]);
  });
});

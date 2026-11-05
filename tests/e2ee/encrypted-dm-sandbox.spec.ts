import type { BrowserContext } from "@playwright/test";
import { ApiNotificationCause } from "../../generated/models/ApiNotificationCause";
import type { ApiNotificationsResponseV2 } from "../../generated/models/ApiNotificationsResponseV2";
import { ApiProfileClassification } from "../../generated/models/ApiProfileClassification";
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

import {
  installSurfaceSimulation,
  isMobileWebProject,
} from "../support/surfaceSimulation";

/** A valid 1x1 RGBA PNG (raster images are the only inline type). */
const PIXEL_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

const PROFILE_WAVE_ID = "00000000-0000-4000-8000-000000000529";

/** Decorate existing sandbox identities without changing encrypted traffic. */
async function decorateProfiles(context: BrowserContext) {
  await context.route(/\/api\/identities\/[^/]+$/u, async (route) => {
    const response = await route.fetch();
    const profile = await response.json();
    await route.fulfill({
      response,
      json: {
        ...profile,
        level: profile.handle === "bob" ? 82 : 51,
        profile_wave_id: profile.handle === "bob" ? PROFILE_WAVE_ID : null,
      },
    });
  });
}

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

  test("encrypted notifications align sender details and keep the account tooltip beside the avatar", async ({
    baseURL,
    browser,
  }, testInfo) => {
    const users = await resetE2eeSandbox(baseURL);
    const alice = await openE2eeUser(browser, testInfo, baseURL, users.alice);
    sessions.push(alice);
    const groupId = `0x${"1".repeat(64)}`;
    await alice.page.route("**/api/v2/notifications?*", async (route) => {
      const notifications: ApiNotificationsResponseV2 = {
        unread_count: 0,
        notifications: [
          {
            id: 1,
            cause: ApiNotificationCause.E2EeMessage,
            created_at: Date.now(),
            read_at: Date.now(),
            related_identity: {
              id: users.bob.profileId,
              handle: "bob",
              primary_address: users.bob.wallet,
              pfp: "/favicon.png",
              level: 82,
              classification: ApiProfileClassification.Pseudonym,
              badges: {
                artist_of_memes: 1,
                artist_of_main_stage_submissions: 0,
              },
            },
            related_drops: [],
            additional_context: { encrypted_group: groupId },
          },
        ],
      };
      await route.fulfill({ json: notifications });
    });
    await gotoPath(alice.page, "/notifications");
    const sender = alice.page.getByRole("link", { name: "bob", exact: true });
    const entry = alice.page.getByRole("article").filter({ has: sender });
    const level = entry.getByRole("img", { name: "Level 82" });
    await expect(sender).toHaveAttribute("href", "/bob", { timeout: 60_000 });
    await expect(level).toBeVisible();
    await expect(
      entry.getByRole("button", { name: "View 1 minted meme" })
    ).toBeVisible();
    await expect(
      entry.getByRole("link", {
        name: /^(Open encrypted chat|Set up Encrypted DMs)$/,
      })
    ).toHaveAttribute("href", `/messages/encrypted/${groupId}`);
    await expect
      .poll(async () => {
        const [senderBox, levelBox] = await Promise.all([
          sender.boundingBox(),
          level.boundingBox(),
        ]);
        if (!senderBox || !levelBox) return null;
        return Math.abs(
          senderBox.y + senderBox.height / 2 - levelBox.y - levelBox.height / 2
        );
      })
      .toBeLessThanOrEqual(1);

    if (!isMobileWebProject(testInfo.project.name)) {
      await alice.page.setViewportSize({ width: 1100, height: 540 });
      const account = alice.page.getByRole("button", {
        name: "Open account and profiles menu",
      });
      await account.hover();
      const tooltip = alice.page
        .getByRole("tooltip")
        .filter({ hasText: "Encrypted DMs:" });
      await expect(tooltip).toBeVisible();
      await expect
        .poll(async () => {
          const [anchor, popup] = await Promise.all([
            account.boundingBox(),
            tooltip.boundingBox(),
          ]);
          return Boolean(
            anchor &&
            popup &&
            popup.x >= anchor.x + anchor.width &&
            popup.y >= 0 &&
            popup.y + popup.height <= 540
          );
        })
        .toBe(true);
    }
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

  test("ordinary sender identities and profile navigation on desktop and phone", async ({
    baseURL,
    browser,
  }, testInfo) => {
    const users = await resetE2eeSandbox(baseURL);
    const alice = await openE2eeUser(browser, testInfo, baseURL, users.alice);
    sessions.push(alice);
    const bob = await openE2eeUser(browser, testInfo, baseURL, users.bob);
    sessions.push(bob);
    await decorateProfiles(alice.context);
    await decorateProfiles(bob.context);
    await enroll(alice);
    await enroll(bob);
    await startChat(alice, ["bob"]);
    const chatUrl = alice.page.url();
    const hello = "Hello @bob, profiles still work in an encrypted chat.";
    const reply = "Hello Alice, this message stays encrypted.";
    await sendMessage(alice.page, hello);
    await openConversationFromList(bob.page, "alice");
    await expectMessage(bob.page, hello);
    await sendMessage(bob.page, reply);
    await expectMessage(alice.page, reply);

    const headerName = alice.page
      .getByRole("heading", { level: 1, name: "bob" })
      .getByRole("link", { name: "bob", exact: true });
    await expect(headerName).toHaveAttribute("href", "/bob");
    const introName = alice.page
      .getByRole("heading", { level: 2, name: "bob" })
      .getByRole("link", { name: "bob", exact: true });
    await expect(introName).toHaveAttribute("href", "/bob");
    await expect(
      messageRow(alice.page, hello).getByRole("link", {
        name: "alice",
        exact: true,
      })
    ).toHaveAttribute("href", "/alice");
    await expect(
      messageRow(alice.page, hello).getByRole("link", {
        name: "@bob",
        exact: true,
      })
    ).toHaveAttribute("href", "/bob");
    await expect(
      messageRow(alice.page, hello).getByLabel("Level 51")
    ).toBeVisible();
    const received = messageRow(alice.page, reply);
    await expect(
      received.getByRole("link", { name: "bob", exact: true })
    ).toHaveAttribute("href", "/bob");
    await expect(
      received.getByRole("link", { name: "View bob's profile" })
    ).toHaveAttribute("href", "/bob");
    await expect(received.getByLabel("Level 82")).toBeVisible();
    const profileWaveBadge = received.getByRole("button", {
      name: "Open Local Composer Sandbox Wave",
    });
    await expect(profileWaveBadge).toBeVisible();
    await expect(profileWaveBadge).toHaveAttribute(
      "data-wave-id",
      PROFILE_WAVE_ID
    );

    const overflow = await alice.page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth
    );
    expect(overflow).toBe(false);
    await alice.page.screenshot({
      path: testInfo.outputPath("encrypted-profiles.png"),
      fullPage: true,
    });
    if (!isMobileWebProject(testInfo.project.name)) {
      await headerName.focus();
      await expect(
        alice.page.getByRole("dialog", { name: "User profile for bob" })
      ).toBeVisible();
      await alice.page.keyboard.press("Escape");
    }
    await headerName.click();
    await expect(alice.page).toHaveURL(/\/bob$/u, { timeout: 60_000 });
    await gotoPath(alice.page, new URL(chatUrl).pathname);
    await expectMessage(alice.page, reply);
    await received.getByRole("link", { name: "bob", exact: true }).click();
    await expect(alice.page).toHaveURL(/\/bob$/u, { timeout: 30_000 });

    const scan = await e2eeSandboxControls.plaintextScan(baseURL, [
      hello,
      reply,
    ]);
    expect(scan.found).toEqual([]);
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
  test("a restarted DM has one inbox entry and keeps earlier history reachable", async ({
    baseURL,
    browser,
  }, testInfo) => {
    const users = await resetE2eeSandbox(baseURL);
    const alice = await openE2eeUser(browser, testInfo, baseURL, users.alice);
    const bob = await openE2eeUser(browser, testInfo, baseURL, users.bob);
    sessions.push(alice, bob);
    await enroll(alice);
    await enroll(bob);
    await startChat(alice, ["bob"]);
    const oldUrl = alice.page.url();
    await sendMessage(alice.page, "An earlier encrypted message");
    await openConversationFromList(bob.page, "alice");
    await expectMessage(bob.page, "An earlier encrypted message");
    await alice.page
      .getByRole("button", { name: "Chat info", exact: true })
      .click();
    await alice.page
      .getByRole("dialog", { name: "Chat info", exact: true })
      .getByRole("button", { name: "Leave chat", exact: true })
      .click();
    await alice.page
      .getByRole("dialog", { name: "Leave this chat?", exact: true })
      .getByRole("button", { name: "Leave chat", exact: true })
      .click();
    const resume = alice.page.getByRole("button", {
      name: "Continue encrypted chat",
      exact: true,
    });
    await expect(resume).toBeVisible({ timeout: E2EE_UI_TIMEOUT_MS });
    await resume.click();
    await expect(alice.page).not.toHaveURL(oldUrl, {
      timeout: E2EE_UI_TIMEOUT_MS,
    });
    const freshUrl = alice.page.url();
    await sendMessage(alice.page, "A fresh encrypted message");
    await gotoPath(alice.page, ENCRYPTED_ROUTE);
    const row = conversationListRow(alice.page, "bob");
    await expect(row).toHaveCount(1);
    await row.click();
    await expect(alice.page).toHaveURL(freshUrl);
    const history = alice.page.getByRole("combobox", {
      name: "Chat history",
      exact: true,
    });
    await expect(history.getByRole("option")).toHaveCount(2);
    const oldGroup = new URL(oldUrl).pathname.split("/").at(-1)!;
    await history.selectOption(oldGroup);
    await expect(alice.page).toHaveURL(oldUrl);
    await expectMessage(alice.page, "An earlier encrypted message");
    await expect(composer(alice.page)).toHaveCount(0);
    await alice.page
      .getByRole("link", { name: "Open current chat", exact: true })
      .click();
    await expectMessage(alice.page, "A fresh encrypted message");
    await expect(composer(alice.page)).toBeEnabled();
    expect(
      await alice.page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBe(true);
  });
});

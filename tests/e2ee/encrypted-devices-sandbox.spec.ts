import type { Page } from "@playwright/test";

import { expect, test } from "../testHelpers";
import {
  closeE2eeUsers,
  E2EE_SYNC_TIMEOUT_MS,
  E2EE_UI_TIMEOUT_MS,
  type E2eeUserSession,
  openE2eeUser,
  resetE2eeSandbox,
} from "../support/e2ee/e2eeSandboxSession";
import {
  confirmDialog,
  enroll,
  enrollButton,
  enrollmentHeading,
  ENCRYPTED_ROUTE,
  expectEnrollmentCard,
  expectMessage,
  gotoPath,
  messageRow,
  notice,
  NO_BACKUP_WARNING,
  openConversation,
  openConversationFromList,
  sendMessage,
  startChat,
} from "../support/e2ee/e2eeUi";
import { DEVICES_SECURITY_MESSAGES } from "../../i18n/messages/devices-security";
import { e2eeMessage, NEW_DEVICE_NOTICE } from "../support/e2ee/e2eeCopy";
import { isMobileWebProject } from "../support/surfaceSimulation";

/** First visit compiles routes and loads the MLS WebAssembly module. */
const FIRST_LOAD_TIMEOUT_MS = 120_000;

/** Other members add a new device after a random 5-30 s delay (8.4). */
const DEVICE_ADD_TIMEOUT_MS = 30_000 + 2 * E2EE_SYNC_TIMEOUT_MS;

/**
 * Several devices per person in real browsers, each with its own storage
 * (D109 stories 5, 6 and the device notices of 12).
 */
test.describe("Encrypted messages devices @medium @local-only @e2ee", () => {
  test.describe.configure({ timeout: 420_000 });
  test.skip(
    process.env["PLAYWRIGHT_E2EE_SANDBOX"] !== "1" ||
      process.env["PLAYWRIGHT_ENV"] !== "local",
    "Encrypted messages sandbox requires the local E2EE mock API runner."
  );

  let sessions: E2eeUserSession[] = [];

  test.beforeEach(({}, testInfo) => {
    testInfo.skip(
      isMobileWebProject(testInfo.project.name),
      "Desktop covers devices; the DM spec is the mobile representative."
    );
  });

  test.afterEach(async () => {
    const open = sessions;
    sessions = [];
    await closeE2eeUsers(open);
  });

  test("a second device receives too, both are listed, and one revokes the other", async ({
    baseURL,
    browser,
  }, testInfo) => {
    const users = await resetE2eeSandbox(baseURL);
    const alice = await openE2eeUser(browser, testInfo, baseURL, users.alice);
    const bobPhone = await openE2eeUser(
      browser,
      testInfo,
      baseURL,
      users.bob,
      "bob phone"
    );
    sessions = [alice, bobPhone];
    await enroll(alice);
    await enroll(bobPhone);
    const g = await startChat(alice, ["bob"]);
    await sendMessage(alice.page, "Before your second device.");
    await openConversationFromList(bobPhone.page, "alice");
    await expectMessage(bobPhone.page, "Before your second device.");

    // A second browser with separate storage is a new device: one prompt.
    const bobLaptop = await openE2eeUser(
      browser,
      testInfo,
      baseURL,
      users.bob,
      "bob laptop"
    );
    sessions.push(bobLaptop);
    await enroll(bobLaptop);

    // Bob's phone adds his own new device when it reconciles the open chat,
    // and tells him a new device can read his messages.
    await openConversation(bobPhone.page, g);
    await expect(bobPhone.page.getByText(NEW_DEVICE_NOTICE)).toBeVisible({
      timeout: E2EE_SYNC_TIMEOUT_MS,
    });
    await openConversationFromList(bobLaptop.page, "alice");
    await expect(notice(alice.page, "bob added a device")).toBeVisible({
      timeout: E2EE_SYNC_TIMEOUT_MS,
    });
    await expect(
      messageRow(bobLaptop.page, "Before your second device.")
    ).toHaveCount(0);

    await sendMessage(alice.page, "Both of your devices get this.");
    await expectMessage(bobPhone.page, "Both of your devices get this.");
    await expectMessage(bobLaptop.page, "Both of your devices get this.");

    // The former devices page opens Devices & security, which lists both:
    // this browser pinned, the phone as another device. The laptop revokes
    // the phone.
    await gotoPath(bobLaptop.page, `${ENCRYPTED_ROUTE}/devices`);
    await expect(bobLaptop.page).toHaveURL(/\/preferences\?tab=security$/u, {
      timeout: E2EE_UI_TIMEOUT_MS,
    });
    await expect(thisDeviceCard(bobLaptop.page)).toHaveCount(1, {
      timeout: E2EE_UI_TIMEOUT_MS,
    });
    const phoneRow = revocableDeviceRows(bobLaptop.page);
    await expect(phoneRow).toHaveCount(1, { timeout: E2EE_UI_TIMEOUT_MS });
    const revokePhone = phoneRow.getByRole("button", { name: /^Revoke /u });
    const revokeLabel = await revokePhone.getAttribute("aria-label");
    const phoneLabel = revokeLabel?.replace(/^Revoke /u, "") ?? "";
    expect(phoneLabel).toBeTruthy();
    await revokePhone.click();
    // The combined sign-in granted the phone both permissions, so revoking
    // it ends both.
    const dialog = confirmDialog(
      bobLaptop.page,
      DEVICES_SECURITY_MESSAGES["devicesSecurity.revoke.title"].replace(
        "{label}",
        phoneLabel
      )
    );
    await expect(dialog).toContainText(
      DEVICES_SECURITY_MESSAGES["devicesSecurity.revoke.both"]
    );
    await dialog
      .getByRole("button", { name: e2eeMessage("e2ee.devices.revokeConfirm") })
      .click();
    await expect(revocableDeviceRows(bobLaptop.page)).toHaveCount(0, {
      timeout: E2EE_UI_TIMEOUT_MS,
    });
    await expect(
      bobLaptop.page.getByRole("button", {
        name: new RegExp(
          `^${DEVICES_SECURITY_MESSAGES["devicesSecurity.history.title"]}`,
          "u"
        ),
      })
    ).toBeVisible();

    // The revoked phone falls back to enrollment; the others see the removal.
    await bobPhone.page.reload({ waitUntil: "domcontentloaded" });
    await expect(enrollmentHeading(bobPhone.page)).toBeVisible({
      timeout: E2EE_SYNC_TIMEOUT_MS,
    });
    await expect(notice(alice.page, "bob removed a device")).toBeVisible({
      timeout: E2EE_SYNC_TIMEOUT_MS,
    });
    await sendMessage(alice.page, "Only the laptop now.");
    await openConversation(bobLaptop.page, g);
    await expectMessage(bobLaptop.page, "Only the laptop now.");

    expect(alice.signatureCount()).toBe(1);
    expect(bobPhone.signatureCount()).toBe(1);
    expect(bobLaptop.signatureCount()).toBe(1);
  });

  test("Devices & security starts encrypted messages on a cold visit", async ({
    baseURL,
    browser,
  }, testInfo) => {
    const users = await resetE2eeSandbox(baseURL);
    // A fresh browser that never opened encrypted messages: no enrollment
    // marker, no visit to /messages. The tab itself must start the engine.
    const alice = await openE2eeUser(browser, testInfo, baseURL, users.alice);
    sessions = [alice];
    await gotoPath(alice.page, "/preferences?tab=security");
    const backup = alice.page
      .getByRole("main")
      .getByRole("region", { name: /^Encrypted backup/u });
    // A real state, not "Checking your backup…": encrypted DMs are off here.
    await expect(backup).toContainText(
      DEVICES_SECURITY_MESSAGES["devicesSecurity.backup.needsDms"],
      { timeout: FIRST_LOAD_TIMEOUT_MS }
    );
    await backup.getByRole("button", { name: /^Turn on/u }).click();
    await enrollButton(alice.page).click();
    // After the one signature, the card is the backup itself, off.
    await expect(
      backup.getByRole("button", {
        name: e2eeMessage("e2ee.backup.action.turnOn"),
      })
    ).toBeVisible({ timeout: E2EE_UI_TIMEOUT_MS });
    await expect(backup).toContainText(
      DEVICES_SECURITY_MESSAGES["devicesSecurity.backup.pill.off"]
    );
    await expect(thisDeviceCard(alice.page)).toHaveCount(1);
    expect(alice.signatureCount()).toBe(1);
  });

  test("cleared browser storage re-enrolls once and starts without the old history", async ({
    baseURL,
    browser,
  }, testInfo) => {
    const users = await resetE2eeSandbox(baseURL);
    const alice = await openE2eeUser(browser, testInfo, baseURL, users.alice);
    const bob = await openE2eeUser(browser, testInfo, baseURL, users.bob);
    sessions = [alice, bob];
    await enroll(alice);
    await enroll(bob);
    const g = await startChat(alice, ["bob"]);
    const oldHistory = "Kept only on the browser that gets cleared.";
    await sendMessage(alice.page, oldHistory);
    await openConversationFromList(bob.page, "alice");
    await expectMessage(bob.page, oldHistory);

    // Clearing site data loses this device; a fresh browser is a new device.
    await alice.close();
    sessions = [bob];
    const aliceAgain = await openE2eeUser(
      browser,
      testInfo,
      baseURL,
      users.alice,
      "alice after clearing data"
    );
    sessions.push(aliceAgain);
    await expectEnrollmentCard(aliceAgain.page);
    await expect(aliceAgain.page.getByText(NO_BACKUP_WARNING)).toBeVisible();
    await enroll(aliceAgain);
    await expect(
      aliceAgain.page.getByText("No encrypted chats yet")
    ).toBeVisible();

    // Bob's device adds alice's new device to the chat (8.4); it joins from
    // now on and never receives the history it lost.
    await openConversation(bob.page, g);
    await openConversationFromListWithin(aliceAgain.page, "bob");
    await expect(notice(bob.page, "alice added a device")).toBeVisible({
      timeout: E2EE_SYNC_TIMEOUT_MS,
    });
    await sendMessage(bob.page, "Welcome back, alice.");
    await expectMessage(aliceAgain.page, "Welcome back, alice.");
    await expect(messageRow(aliceAgain.page, oldHistory)).toHaveCount(0);
    expect(aliceAgain.signatureCount()).toBe(1);
  });
});

/** This browser's pinned card on Devices & security (its one chip). */
function thisDeviceCard(page: Page) {
  return page.getByRole("main").getByText("This device", { exact: true });
}

/** Other active devices (incl. earlier setups): rows with a Revoke button. */
function revocableDeviceRows(page: Page) {
  return page
    .getByRole("main")
    .getByRole("listitem")
    .filter({ has: page.getByRole("button", { name: /^Revoke / }) });
}

async function openConversationFromListWithin(page: Page, title: string) {
  await gotoPath(page, ENCRYPTED_ROUTE);
  await expect(
    page
      .getByRole("list", { name: "Encrypted chats" })
      .last()
      .getByRole("link")
      .filter({ hasText: title })
  ).toBeVisible({ timeout: DEVICE_ADD_TIMEOUT_MS });
  await openConversationFromList(page, title);
}

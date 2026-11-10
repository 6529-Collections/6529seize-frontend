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

/** The describe title of the phone-layout tests (mobile project only). */
const PHONE_GROUP = "on a phone";

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
    // Desktop covers devices; the DM spec is the mobile representative. The
    // phone group runs only in the mobile project, for its touch layout.
    const phoneGroup = testInfo.titlePath.includes(PHONE_GROUP);
    testInfo.skip(
      isMobileWebProject(testInfo.project.name) !== phoneGroup,
      phoneGroup
        ? "The phone layout runs in the mobile project."
        : "Desktop covers devices; the DM spec is the mobile representative."
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
    // "It was me" answers it for good: gone now and after a reload.
    await bobPhone.page
      .getByRole("button", {
        name: DEVICES_SECURITY_MESSAGES["devicesSecurity.newDevice.itWasMe"],
      })
      .click();
    await expect(bobPhone.page.getByText(NEW_DEVICE_NOTICE)).toHaveCount(0);
    await bobPhone.page.reload({ waitUntil: "domcontentloaded" });
    await expectMessage(bobPhone.page, "Before your second device.");
    await expect(bobPhone.page.getByText(NEW_DEVICE_NOTICE)).toHaveCount(0);
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
    // Encrypted messages are running in this tab (the backup card shows its
    // real state), so the revoke signs with this device and members see
    // the removal. Before that, Revoke goes through the grant instead.
    await expect(
      bobLaptop.page
        .getByRole("main")
        .getByRole("region", { name: /^Encrypted backup/u })
        .getByRole("button", { name: e2eeMessage("e2ee.backup.action.turnOn") })
    ).toBeVisible({ timeout: FIRST_LOAD_TIMEOUT_MS });
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
    // One "Turn on", on the This device card; backup only points to it.
    await turnOnHere(alice.page).click();
    await enrollButton(alice.page).click();
    // Setup ends with backup's one more step, which starts the backup steps.
    const nextStep = confirmDialog(
      alice.page,
      e2eeMessage("e2ee.setupDone.titleBoth")
    );
    await expect(nextStep).toContainText(
      e2eeMessage("e2ee.setupDone.backupTitle"),
      { timeout: E2EE_UI_TIMEOUT_MS }
    );
    await nextStep
      .getByRole("link", { name: e2eeMessage("e2ee.backup.action.turnOn") })
      .click();
    const why = confirmDialog(
      alice.page,
      e2eeMessage("e2ee.backup.setup.why.title")
    );
    // The dialog root is a zero-size wrapper; its title is what renders.
    await expect(
      why.getByRole("heading", {
        name: e2eeMessage("e2ee.backup.setup.why.title"),
      })
    ).toBeVisible({ timeout: E2EE_UI_TIMEOUT_MS });
    await why
      .getByRole("button", { name: e2eeMessage("e2ee.backup.setup.notNow") })
      .click();
    // Not now: the card is the backup itself, off.
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

  /**
   * The phone layout of Devices & security and of the backup steps, in the
   * mobile project only, so the app renders its touch layout.
   */
  test.describe(PHONE_GROUP, () => {
    test("Devices & security, setup's last step and all backup steps work at 390 px", async ({
      baseURL,
      browser,
    }, testInfo) => {
      const users = await resetE2eeSandbox(baseURL);
      // The phone project's touch and user agent, at a common phone width.
      const alice = await openE2eeUser(browser, testInfo, baseURL, users.alice);
      sessions = [alice];
      const { page } = alice;
      await page.setViewportSize({ width: 390, height: 844 });
      await gotoPath(page, "/preferences?tab=security");
      const backup = page
        .getByRole("main")
        .getByRole("region", { name: /^Encrypted backup/u });
      await expect(backup).toContainText(
        DEVICES_SECURITY_MESSAGES["devicesSecurity.backup.needsDms"],
        { timeout: FIRST_LOAD_TIMEOUT_MS }
      );
      await expectNoHorizontalOverflow(page);
      await turnOnHere(page).click();
      await enrollButton(page).click();
      const nextStep = confirmDialog(page, e2eeMessage("e2ee.setupDone.titleBoth"));
      await expect(
        nextStep.getByRole("heading", {
          name: e2eeMessage("e2ee.setupDone.titleBoth"),
        })
      ).toBeVisible({ timeout: E2EE_UI_TIMEOUT_MS });
      await expectNoHorizontalOverflow(page);
      await nextStep
        .getByRole("link", { name: e2eeMessage("e2ee.backup.action.turnOn") })
        .click();

      // Step 1 → 2 → 3, each within the phone's width.
      const why = confirmDialog(page, e2eeMessage("e2ee.backup.setup.why.title"));
      await expect(
        why.getByRole("heading", {
          name: e2eeMessage("e2ee.backup.setup.why.title"),
        })
      ).toBeVisible({ timeout: E2EE_UI_TIMEOUT_MS });
      await expectNoHorizontalOverflow(page);
      await why
        .getByRole("button", { name: e2eeMessage("e2ee.backup.setup.continue") })
        .click();
      const save = confirmDialog(page, e2eeMessage("e2ee.backup.code.title"));
      const codeGroups = save
        .getByRole("list", { name: e2eeMessage("e2ee.backup.code.label") })
        .getByRole("listitem");
      await expect(codeGroups.first()).toBeVisible({
        timeout: E2EE_UI_TIMEOUT_MS,
      });
      await expect.poll(() => codeGroups.count()).toBeGreaterThan(1);
      // Each item reads "<number> <group>"; the code itself is the groups.
      const groups = await codeGroups.evaluateAll((items) =>
        items.map((item) => item.lastElementChild?.textContent ?? "")
      );
      const toCheck = save.getByRole("button", {
        name: e2eeMessage("e2ee.backup.setup.continue"),
      });
      await expect(toCheck).toBeDisabled();
      await expectNoHorizontalOverflow(page);
      await save
        .getByRole("checkbox", { name: e2eeMessage("e2ee.backup.setup.save.paper") })
        .check();
      await toCheck.click();
      const check = confirmDialog(
        page,
        e2eeMessage("e2ee.backup.setup.check.title")
      );
      await expect(check.getByLabel(/^Group \d+$/u)).toHaveCount(2);
      // Checked in the browser: a wrong answer is named, nothing is sent.
      await check.getByLabel(/^Group \d+$/u).first().fill("AAAA");
      await check
        .getByRole("button", { name: e2eeMessage("e2ee.backup.code.confirm") })
        .click();
      await expect(check.getByRole("alert")).toContainText(/match group \d+/u);
      await expectNoHorizontalOverflow(page);
      const fields = check.getByLabel(/^Group \d+$/u);
      for (const index of [0, 1]) {
        const field = fields.nth(index);
        const label = await field.evaluate(
          (input) => (input as HTMLInputElement).labels?.[0]?.textContent ?? ""
        );
        await field.fill(groups[Number(/\d+/u.exec(label)?.[0]) - 1] ?? "");
      }
      await check
        .getByRole("button", { name: e2eeMessage("e2ee.backup.code.confirm") })
        .click();

      // Step 4: the first upload finishes and says what it saved.
      const done = confirmDialog(page, e2eeMessage("e2ee.backup.setup.done.title"));
      await expect(
        done.getByRole("heading", {
          name: e2eeMessage("e2ee.backup.setup.done.title"),
        })
      ).toBeVisible({ timeout: E2EE_SYNC_TIMEOUT_MS });
      await expectNoHorizontalOverflow(page);
      await done
        .getByRole("button", { name: e2eeMessage("e2ee.backup.setup.done.action") })
        .click();

      // The card (now on) and the device list at phone width.
      await expect(backup).toContainText(e2eeMessage("e2ee.backup.status.on"), {
        timeout: E2EE_UI_TIMEOUT_MS,
      });
      await expect(thisDeviceCard(page)).toHaveCount(1);
      await expectNoHorizontalOverflow(page);

      // The inbox keeps a labelled entry to Devices & security on phones.
      await gotoPath(page, ENCRYPTED_ROUTE);
      await expect(
        page.getByRole("link", { name: e2eeMessage("e2ee.devices.open") })
      ).toContainText(e2eeMessage("e2ee.action.devicesShort"), {
        timeout: FIRST_LOAD_TIMEOUT_MS,
      });
      await expectNoHorizontalOverflow(page);
    });
  });
});

/**
 * Nothing on the page is wider than the viewport. On failure it names the
 * elements that stick out, outermost first.
 */
async function expectNoHorizontalOverflow(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(() => {
        const width = document.documentElement.clientWidth;
        if (document.documentElement.scrollWidth <= width) {
          return [];
        }
        return [...document.querySelectorAll("body *")]
          .filter((element) => element.getBoundingClientRect().right > width + 1)
          .slice(0, 8)
          .map((element) => {
            const right = Math.round(element.getBoundingClientRect().right);
            const classes = String(element.getAttribute("class") ?? "");
            return `${element.tagName.toLowerCase()} right=${right} ${classes}`.slice(
              0,
              240
            );
          });
      })
    )
    .toEqual([]);
}

/** The This device card's one "Turn on" while this browser has none. */
function turnOnHere(page: Page) {
  return page
    .getByRole("main")
    .getByRole("region", {
      name: DEVICES_SECURITY_MESSAGES["devicesSecurity.thisDevice.label"],
    })
    .getByRole("button", { name: /^Turn on/u });
}

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

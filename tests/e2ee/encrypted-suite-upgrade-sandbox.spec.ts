import { E2EE_MESSAGES } from "../../i18n/messages/e2ee";
import { expect, test } from "../testHelpers";
import {
  closeE2eeUsers,
  E2EE_SYNC_TIMEOUT_MS,
  E2EE_UI_TIMEOUT_MS,
  type E2eeUserSession,
  openE2eeUser,
  resetE2eeSandbox,
  seedLegacySuiteBrowser,
} from "../support/e2ee/e2eeSandboxSession";
import {
  composer,
  conversationListRow,
  enroll,
  ENCRYPTED_ROUTE,
  expectMessage,
  gotoPath,
  openConversationFromList,
  sendMessage,
  startChat,
} from "../support/e2ee/e2eeUi";
import { isMobileWebProject } from "../support/surfaceSimulation";

const UPGRADE_INTRO = E2EE_MESSAGES["e2ee.upgrade.intro"];
const READ_ONLY_BODY = E2EE_MESSAGES["e2ee.superseded.body"];
const CONTINUE_DM = E2EE_MESSAGES["e2ee.superseded.continueDm"];
const CONTINUED_NOTICE = E2EE_MESSAGES["e2ee.superseded.notice"];
const EARLIER_LINK = E2EE_MESSAGES["e2ee.superseded.noticeLink"];
const READ_ONLY_LABEL = E2EE_MESSAGES["e2ee.list.status.superseded"];

/** The upgrade card on the encrypted inbox, then exactly one signature. */
async function upgrade(session: E2eeUserSession) {
  const { page } = session;
  await gotoPath(page, ENCRYPTED_ROUTE);
  await expect(page.getByText(UPGRADE_INTRO)).toBeVisible({
    timeout: E2EE_SYNC_TIMEOUT_MS,
  });
  const before = session.signatureCount();
  // Signed Posts may still be on (DMs only) or off (the combined sign-in).
  await page
    .getByRole("button", {
      name: /^Sign to (upgrade Encrypted DMs|enable both)$/u,
    })
    .click();
  await expect(page.getByText(UPGRADE_INTRO)).toHaveCount(0, {
    timeout: E2EE_UI_TIMEOUT_MS,
  });
  await expect(
    page.getByRole("link", { name: "Devices for encrypted messages" })
  ).toBeVisible();
  expect(session.signatureCount()).toBe(before + 1);
}

/**
 * D172 / C+: browsers that hold a device from the earlier suite (0x004F)
 * upgrade with one signature each, keep the earlier DM readable but
 * read-only, and continue it in a new session in the same list entry.
 *
 * The composer-to-continue focus handoff is defensive (a running engine
 * never supersedes a conversation; retirement happens at engine start), so
 * it is covered only in Jest (`__tests__/components/e2ee/E2eeSuperseded`).
 */
test.describe("Encrypted DMs: moving to stronger encryption @medium @local-only @e2ee", () => {
  test.describe.configure({ timeout: 300_000 });
  test.beforeEach(({}, testInfo) => {
    testInfo.skip(
      process.env["PLAYWRIGHT_E2EE_SANDBOX"] !== "1" ||
        process.env["PLAYWRIGHT_ENV"] !== "local",
      "Encrypted messages sandbox requires the local E2EE mock API runner."
    );
    testInfo.skip(
      isMobileWebProject(testInfo.project.name),
      "Desktop covers the suite upgrade; nothing in it differs on mobile web, and the DM spec is the mobile representative."
    );
  });

  let sessions: E2eeUserSession[] = [];

  test.afterEach(async () => {
    const open = sessions;
    sessions = [];
    await closeE2eeUsers(open);
  });

  test("an earlier-suite DM stays readable and continues after one upgrade signature", async ({
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
    const oldPath = new URL(alice.page.url()).pathname;
    await sendMessage(alice.page, "Sent before the upgrade");
    await openConversationFromList(bob.page, "alice");
    await expectMessage(bob.page, "Sent before the upgrade");

    // Both browsers held devices from the earlier suite. Bob must move too,
    // or he has nothing on the new suite to join.
    await seedLegacySuiteBrowser(bob, baseURL);
    await seedLegacySuiteBrowser(alice, baseURL);
    await upgrade(bob);
    await upgrade(alice);

    // The earlier DM: listed as read-only, history kept, no composer.
    const row = conversationListRow(alice.page, "bob");
    await expect(row).toHaveCount(1, { timeout: E2EE_SYNC_TIMEOUT_MS });
    await expect(row.getByText(READ_ONLY_LABEL)).toBeVisible();
    await gotoPath(alice.page, oldPath);
    await expectMessage(alice.page, "Sent before the upgrade");
    await expect(alice.page.getByText(READ_ONLY_BODY)).toBeVisible();
    await expect(composer(alice.page)).toHaveCount(0);

    // Continuing needs no further signature and opens the new session.
    const signatures = alice.signatureCount();
    await alice.page.getByRole("button", { name: CONTINUE_DM }).click();
    await expect(alice.page).not.toHaveURL(new RegExp(`${oldPath}$`, "u"), {
      timeout: E2EE_UI_TIMEOUT_MS,
    });
    await expect(composer(alice.page)).toBeVisible({
      timeout: E2EE_UI_TIMEOUT_MS,
    });
    const newPath = new URL(alice.page.url()).pathname;
    await expect(alice.page.getByText(CONTINUED_NOTICE)).toBeVisible();
    await expect(
      alice.page.getByRole("link", { name: EARLIER_LINK })
    ).toHaveAttribute("href", oldPath);
    await sendMessage(alice.page, "Sent after the upgrade");
    expect(alice.signatureCount()).toBe(signatures);

    // Bob gets it in the same thread; both histories stay selectable. Until
    // his device processes the new Welcome, the "alice" entry still opens
    // the read-only session, so wait for it to point at the new one.
    await gotoPath(bob.page, ENCRYPTED_ROUTE);
    const bobRow = conversationListRow(bob.page, "alice");
    await expect(bobRow).toHaveAttribute("href", newPath, {
      timeout: E2EE_SYNC_TIMEOUT_MS,
    });
    await expect(bobRow).toHaveCount(1);
    await bobRow.click();
    await expect(bob.page).toHaveURL(new RegExp(`${newPath}$`, "u"), {
      timeout: E2EE_UI_TIMEOUT_MS,
    });
    await expectMessage(bob.page, "Sent after the upgrade");
    await expect(composer(bob.page)).toBeVisible();
    await expect(bob.page.getByText(CONTINUED_NOTICE)).toBeVisible();
    await expect(
      bob.page
        .getByRole("combobox", { name: "Chat history", exact: true })
        .getByRole("option")
    ).toHaveCount(2);

    expect(
      await alice.page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    ).toBe(true);
  });
});

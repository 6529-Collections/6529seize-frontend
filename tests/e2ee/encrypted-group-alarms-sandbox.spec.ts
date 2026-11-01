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
  confirmDialog,
  enroll,
  expectMessage,
  messageRow,
  notice,
  openChatInfo,
  openConversationFromList,
  sendMessage,
  startChat,
} from "../support/e2ee/e2eeUi";
import { SPLIT_VIEW_BANNER } from "../support/e2ee/e2eeCopy";
import { isMobileWebProject } from "../support/surfaceSimulation";

const DELAYED_BANNER =
  "Group changes are delayed. Messages will send once the change goes through.";
/** Contract 8.3: the composer blocks after 20 s of failed commits. */
const STALL_RULE_MS = 20_000;

/**
 * Leaving a group and the 8.6 alarms in real browsers (D109 stories 2 and
 * 12): a leave that cannot be committed raises "Group changes are delayed"
 * after the 20 s rule and sending resumes once commits go through; a forged
 * epoch fingerprint raises the split-view banner. The engine timing rules
 * themselves are covered with a virtual clock in Jest.
 */
test.describe("Encrypted group alarms @medium @local-only @e2ee", () => {
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
      "Desktop covers group alarms; the DM spec is the mobile representative."
    );
  });

  test.afterEach(async ({ baseURL }) => {
    await e2eeSandboxControls.clearFaults(baseURL);
    await e2eeSandboxControls.tamperEpochFp(baseURL, null);
    const open = sessions;
    sessions = [];
    await closeE2eeUsers(open);
  });

  test("a member leaves, delayed commits block sending until they go through, and a forged fingerprint raises split view", async ({
    baseURL,
    browser,
  }, testInfo) => {
    const users = await resetE2eeSandbox(baseURL);
    const alice = await openE2eeUser(browser, testInfo, baseURL, users.alice);
    const bob = await openE2eeUser(browser, testInfo, baseURL, users.bob);
    const carol = await openE2eeUser(browser, testInfo, baseURL, users.carol);
    sessions = [alice, bob, carol];
    for (const session of sessions) {
      await enroll(session);
    }

    await startChat(alice, ["bob", "carol"], { kind: "group", name: "Side" });
    await sendMessage(alice.page, "Side channel open.");
    await openConversationFromList(bob.page, "Side");
    await openConversationFromList(carol.page, "Side");
    await expectMessage(carol.page, "Side channel open.");

    // Every commit now fails: carol's leave proposal still goes through, but
    // nobody can commit her removal, which must happen before sending (8.3).
    await e2eeSandboxControls.addFault(baseURL, {
      method: "POST",
      path: "^e2ee/groups/0x[0-9a-f]+/entries$",
      kind: "commit",
      status: 500,
    });

    const info = await openChatInfo(carol.page);
    await info.getByRole("button", { name: "Leave chat" }).click();
    await confirmDialog(carol.page, "Leave this chat?")
      .getByRole("button", { name: "Leave chat" })
      .click();
    await expect(carol.page.getByText("You left this chat.")).toBeVisible({
      timeout: E2EE_UI_TIMEOUT_MS,
    });

    const queued = "Sent once the group change goes through.";
    await composer(alice.page).fill(queued);
    await composer(alice.page).press("Enter");
    const pending = messageRow(alice.page, queued);
    await expect(pending.getByText("Sending…")).toBeVisible({
      timeout: E2EE_UI_TIMEOUT_MS,
    });
    await expect(alice.page.getByText(DELAYED_BANNER)).toBeVisible({
      timeout: STALL_RULE_MS + E2EE_SYNC_TIMEOUT_MS,
    });
    await expect(
      alice.page.getByText(
        "Sending is paused until the group change goes through."
      )
    ).toBeVisible();
    await expect(messageRow(bob.page, queued)).toHaveCount(0);

    // Commits go through again: the removal lands, then the queued message.
    const { hits } = await e2eeSandboxControls.clearFaults(baseURL);
    expect(hits).toBeGreaterThan(1);
    await expect(alice.page.getByText(DELAYED_BANNER)).toHaveCount(0, {
      timeout: E2EE_SYNC_TIMEOUT_MS,
    });
    await expect(pending.getByText("Sending…")).toHaveCount(0, {
      timeout: E2EE_SYNC_TIMEOUT_MS,
    });
    await expect(composer(alice.page)).toBeVisible();
    await expectMessage(bob.page, queued);
    // Story 12: the left notice, named although carol is no longer a member.
    await expect(notice(alice.page, "carol left")).toBeVisible();
    await expect(notice(bob.page, "carol left")).toBeVisible({
      timeout: E2EE_SYNC_TIMEOUT_MS,
    });
    await expect(messageRow(carol.page, queued)).toHaveCount(0);

    // Split view (8.6): bob is served a forged epoch fingerprint.
    await e2eeSandboxControls.tamperEpochFp(baseURL, "bob");
    await sendMessage(alice.page, "Fingerprint check.");
    await expect(bob.page.getByText(SPLIT_VIEW_BANNER)).toBeVisible({
      timeout: E2EE_SYNC_TIMEOUT_MS,
    });
    await expect(alice.page.getByText(SPLIT_VIEW_BANNER)).toHaveCount(0);
    await bob.page
      .getByRole("button", { name: "Compare safety codes" })
      .click();
    await expect(
      bob.page
        .getByRole("dialog", { name: "Chat info" })
        .getByRole("heading", { name: "Safety code" })
    ).toBeVisible();
  });
});

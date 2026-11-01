import { expect, test } from "../testHelpers";
import {
  buildSyntheticJwt,
  closeE2eeUsers,
  e2eeSandboxControls,
  E2EE_SYNC_TIMEOUT_MS,
  E2EE_UI_TIMEOUT_MS,
  type E2eeUserSession,
  openE2eeUser,
  resetE2eeSandbox,
} from "../support/e2ee/e2eeSandboxSession";
import {
  closeChatInfo,
  composer,
  confirmDialog,
  conversationListRow,
  conversationTitle,
  enroll,
  ENCRYPTED_ROUTE,
  expectMessage,
  gotoPath,
  messageRow,
  notice,
  openChatInfo,
  openConversation,
  openConversationFromList,
  pickPerson,
  sendMessage,
  startChat,
} from "../support/e2ee/e2eeUi";
import { getSandboxApiOrigin } from "../support/localSandbox";
import { isMobileWebProject } from "../support/surfaceSimulation";

/**
 * Encrypted groups across four browsers (D109 stories 2, 3, 8 and the
 * joined/removed notices of 12). Membership validation, commit ordering and
 * history windows are covered in Jest; this proves the real UI drives them.
 */
test.describe("Encrypted groups @medium @local-only @e2ee", () => {
  test.describe.configure({ timeout: 480_000 });
  test.skip(
    process.env["PLAYWRIGHT_E2EE_SANDBOX"] !== "1" ||
      process.env["PLAYWRIGHT_ENV"] !== "local",
    "Encrypted messages sandbox requires the local E2EE mock API runner."
  );

  let sessions: E2eeUserSession[] = [];

  test.beforeEach(({}, testInfo) => {
    testInfo.skip(
      isMobileWebProject(testInfo.project.name),
      "Desktop covers groups; the DM spec is the mobile representative."
    );
  });

  test.afterEach(async () => {
    const open = sessions;
    sessions = [];
    await closeE2eeUsers(open);
  });

  test("create, rename, add and remove members with history windows, notices and mention badges", async ({
    baseURL,
    browser,
  }, testInfo) => {
    const users = await resetE2eeSandbox(baseURL);
    const alice = await openE2eeUser(browser, testInfo, baseURL, users.alice);
    const bob = await openE2eeUser(browser, testInfo, baseURL, users.bob);
    const carol = await openE2eeUser(browser, testInfo, baseURL, users.carol);
    const dave = await openE2eeUser(browser, testInfo, baseURL, users.dave);
    sessions = [alice, bob, carol, dave];
    for (const session of sessions) {
      await enroll(session);
    }

    const beforeDave = "Agenda draft before dave joins.";
    const afterDave = "Welcome dave, here is the plan.";
    const mention = "@dave please review the plan";
    const afterCarol = "Carol is out; final numbers follow.";

    // Story 2: create a group of three with a name only members can see.
    const g = await startChat(alice, ["bob", "carol"], {
      kind: "group",
      name: "Planning",
    });
    await expect(conversationTitle(alice.page)).toHaveText("Planning");
    await expect(alice.page.getByText("3 members").first()).toBeVisible();
    await sendMessage(alice.page, beforeDave);

    await openConversationFromList(bob.page, "Planning");
    await expectMessage(bob.page, beforeDave);
    await openConversationFromList(carol.page, "Planning");
    await expectMessage(carol.page, beforeDave);

    // Rename (admin): everyone sees the new name and a notice.
    let info = await openChatInfo(alice.page);
    await info.getByLabel("Group name", { exact: true }).fill("Planning v2");
    await info.getByRole("button", { name: "Save name" }).click();
    await closeChatInfo(alice.page);
    await expect(conversationTitle(alice.page)).toHaveText("Planning v2", {
      timeout: E2EE_UI_TIMEOUT_MS,
    });
    await expect(
      notice(alice.page, "You renamed the chat to “Planning v2”")
    ).toBeVisible();
    await expect(conversationTitle(bob.page)).toHaveText("Planning v2", {
      timeout: E2EE_SYNC_TIMEOUT_MS,
    });
    await expect(
      notice(bob.page, "alice renamed the chat to “Planning v2”")
    ).toBeVisible();

    // Add dave (story 2) and the joined notice (story 12).
    info = await openChatInfo(alice.page);
    await pickPerson(info, "dave", {
      searchLabel: "Search people to add",
      listLabel: "Add people",
    });
    await info.getByRole("button", { name: "Add to chat" }).click();
    // The member list grows once the add commit is sequenced.
    await expect(info.getByText("4 members")).toBeVisible({
      timeout: E2EE_UI_TIMEOUT_MS,
    });
    await closeChatInfo(alice.page);
    await expect(notice(alice.page, "You added dave")).toBeVisible();
    await expect(notice(bob.page, "alice added dave")).toBeVisible({
      timeout: E2EE_SYNC_TIMEOUT_MS,
    });

    // Story 3: a new member sees nothing from before joining.
    await openConversationFromList(dave.page, "Planning v2");
    await sendMessage(alice.page, afterDave);
    await expectMessage(dave.page, afterDave);
    await expect(messageRow(dave.page, beforeDave)).toHaveCount(0);

    // Story 8: a mention while dave is on the list raises his badges.
    await gotoPath(dave.page, ENCRYPTED_ROUTE);
    await expect(conversationListRow(dave.page, "Planning v2")).toBeVisible({
      timeout: E2EE_UI_TIMEOUT_MS,
    });
    await composer(bob.page).fill(mention);
    await composer(bob.page).press("Enter");
    await expect(
      messageRow(bob.page, mention).getByText("Sending…")
    ).toHaveCount(0, { timeout: E2EE_SYNC_TIMEOUT_MS });
    const daveRow = conversationListRow(dave.page, "Planning v2");
    await expect(daveRow.getByText("1 mention")).toBeAttached({
      timeout: E2EE_SYNC_TIMEOUT_MS,
    });
    await expect(daveRow.getByText("1 unread message")).toBeAttached();
    await daveRow.click();
    await expectMessage(dave.page, mention);
    await gotoPath(dave.page, ENCRYPTED_ROUTE);
    const readRow = conversationListRow(dave.page, "Planning v2");
    await expect(readRow).toBeVisible({ timeout: E2EE_UI_TIMEOUT_MS });
    await expect(readRow.getByText("1 mention")).toHaveCount(0);
    await expect(readRow.getByText(/unread message/u)).toHaveCount(0);
    await openConversation(dave.page, g);

    // Remove carol (admin) and the removed notice (story 12).
    info = await openChatInfo(alice.page);
    await info
      .getByRole("button", { name: "Remove carol from the chat" })
      .click();
    await confirmDialog(alice.page, "Remove carol?")
      .getByRole("button", { name: "Remove", exact: true })
      .click();
    await expect(confirmDialog(alice.page, "Remove carol?")).toHaveCount(0, {
      timeout: E2EE_UI_TIMEOUT_MS,
    });
    await closeChatInfo(alice.page);
    await expect(notice(alice.page, "You removed carol")).toBeVisible();
    await expect(
      carol.page.getByText("You were removed from this chat.")
    ).toBeVisible({ timeout: E2EE_SYNC_TIMEOUT_MS });
    await expect(notice(bob.page, "alice removed carol")).toBeVisible({
      timeout: E2EE_SYNC_TIMEOUT_MS,
    });

    // Story 3: a removed member gets no later messages, on screen or wire.
    await sendMessage(alice.page, afterCarol);
    await expectMessage(bob.page, afterCarol);
    await expectMessage(dave.page, afterCarol);
    await carol.page.reload({ waitUntil: "domcontentloaded" });
    await expect(
      carol.page.getByText("You were removed from this chat.")
    ).toBeVisible({ timeout: E2EE_SYNC_TIMEOUT_MS });
    await expect(messageRow(carol.page, beforeDave)).toBeVisible();
    await expect(messageRow(carol.page, afterCarol)).toHaveCount(0);
    await expect(composer(carol.page)).toHaveCount(0);
    await expectRemovedDeviceSeesNoLaterItems(baseURL, {
      g,
      wallet: users.carol.wallet,
      profileId: users.carol.profileId,
    });

    // Group names and messages never reached the server in clear.
    const scan = await e2eeSandboxControls.plaintextScan(baseURL, [
      "Planning",
      beforeDave,
      afterDave,
      mention,
      afterCarol,
    ]);
    expect(scan.found).toEqual([]);
    for (const session of sessions) {
      expect(session.signatureCount(), session.label).toBe(1);
    }
  });
});

/**
 * Asks the delivery service, as carol's device, for the group log: it must
 * hold no message sequenced after her removal (contract 4.2 log window).
 */
async function expectRemovedDeviceSeesNoLaterItems(
  baseURL: string | undefined,
  carol: { g: string; wallet: string; profileId: string }
) {
  const state = await e2eeSandboxControls.state(baseURL);
  const device = state.devices.find(
    (item) => item.profile_id === carol.profileId && item.revoked_at === null
  );
  expect(device, "carol's active device").toBeDefined();
  const group = state.groups.find((item) => item.group === carol.g);
  expect(group, "group on the delivery service").toBeDefined();
  expect(
    group!.roster.some((entry) => entry.profile_id === carol.profileId)
  ).toBe(false);
  const messages = group!.items.filter((item) => item.type === "message");
  const response = await fetch(
    `${getSandboxApiOrigin(baseURL)}/api/e2ee/groups/${carol.g}/log?device_key=${device!.device_key}&after_seq=0&limit=200`,
    { headers: { Authorization: `Bearer ${buildSyntheticJwt(carol.wallet)}` } }
  );
  expect(response.ok).toBe(true);
  const page = (await response.json()) as { items: { seq: number }[] };
  const visible = new Set(page.items.map((item) => item.seq));
  expect(visible.has(messages.at(-1)!.seq)).toBe(false);
  expect(visible.has(messages[0]!.seq)).toBe(true);
}

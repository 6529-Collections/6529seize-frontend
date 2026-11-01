import { expect, test } from "../testHelpers";
import {
  closeE2eeUsers,
  e2eeSandboxControls,
  E2EE_UI_TIMEOUT_MS,
  type E2eeUserSession,
  openE2eeUser,
  resetE2eeSandbox,
} from "../support/e2ee/e2eeSandboxSession";
import {
  composer,
  enroll,
  ENCRYPTED_ROUTE,
  gotoPath,
  pickPerson,
  selectedPerson,
} from "../support/e2ee/e2eeUi";
import { isMobileWebProject } from "../support/surfaceSimulation";

/** The composer sandbox's plaintext DM fixture (between alice and bob here). */
const PLAINTEXT_DM_WAVE_ID = "00000000-0000-4000-8000-000000000532";

/**
 * Ways into an encrypted chat and the refusals on the way (D109 stories 7
 * and 10): the plaintext DM label and hand-off, then DM policy and blocks
 * shown before creation and enforced by the delivery service at creation.
 */
test.describe("Encrypted chat entry points @medium @local-only @e2ee", () => {
  test.describe.configure({ timeout: 300_000 });
  test.skip(
    process.env["PLAYWRIGHT_E2EE_SANDBOX"] !== "1" ||
      process.env["PLAYWRIGHT_ENV"] !== "local",
    "Encrypted messages sandbox requires the local E2EE mock API runner."
  );

  let sessions: E2eeUserSession[] = [];

  test.beforeEach(({}, testInfo) => {
    testInfo.skip(
      isMobileWebProject(testInfo.project.name),
      "Desktop covers entry points; the DM spec is the mobile representative."
    );
  });

  test.afterEach(async () => {
    const open = sessions;
    sessions = [];
    await closeE2eeUsers(open);
  });

  test("a plaintext DM is labelled and starts an encrypted chat with the same people", async ({
    baseURL,
    browser,
  }, testInfo) => {
    const users = await resetE2eeSandbox(baseURL);
    const alice = await openE2eeUser(browser, testInfo, baseURL, users.alice);
    const bob = await openE2eeUser(browser, testInfo, baseURL, users.bob);
    sessions = [alice, bob];
    await enroll(alice);
    await enroll(bob);

    await gotoPath(alice.page, `/messages/${PLAINTEXT_DM_WAVE_ID}`);
    await expect(
      alice.page.getByText("Not end-to-end encrypted").first()
    ).toBeVisible({ timeout: 120_000 });
    // D146: the thread states when 6529 deletes its unencrypted copy, and
    // its notice starts the encrypted chat (the header offers the same).
    const notice = alice.page.getByRole("region", {
      name: "Unencrypted chat notice",
    });
    await expect(notice).toContainText(
      "This history will be deleted from 6529’s servers on Dec 1, 2026, unless we’re legally required to keep it."
    );
    await expect(
      notice.getByRole("button", { name: "Export history" })
    ).toBeVisible();
    await notice.getByRole("button", { name: "Start encrypted chat" }).click();

    await expect(alice.page).toHaveURL(new RegExp(`${ENCRYPTED_ROUTE}/new$`), {
      timeout: E2EE_UI_TIMEOUT_MS,
    });
    await expect(
      alice.page.getByText(
        "Starting from a direct message. Earlier messages aren’t copied; the encrypted chat starts empty."
      )
    ).toBeVisible({ timeout: E2EE_UI_TIMEOUT_MS });
    const bobRow = selectedPerson(alice.page, "bob");
    await expect(bobRow).toBeVisible();
    await expect(
      bobRow.getByText("Can receive encrypted messages")
    ).toBeVisible({ timeout: E2EE_UI_TIMEOUT_MS });
    await expect(
      alice.page.getByRole("radio", { name: /^Direct message/u })
    ).toBeChecked();
    await alice.page
      .getByRole("button", { name: "Start encrypted chat" })
      .click();
    await expect(composer(alice.page)).toBeVisible({
      timeout: E2EE_UI_TIMEOUT_MS,
    });
    await expect(
      alice.page.getByRole("heading", { level: 1, name: "bob" })
    ).toBeVisible();
  });

  test("DM policy and blocks are shown before creation and enforced at creation", async ({
    baseURL,
    browser,
  }, testInfo) => {
    const users = await resetE2eeSandbox(baseURL);
    const alice = await openE2eeUser(browser, testInfo, baseURL, users.alice);
    const bob = await openE2eeUser(browser, testInfo, baseURL, users.bob);
    sessions = [alice, bob];
    await enroll(alice);
    await enroll(bob);
    await e2eeSandboxControls.setDmPolicy(baseURL, "carol", "NOBODY");
    await e2eeSandboxControls.block(baseURL, "dave", "alice");

    const { page } = alice;
    await gotoPath(page, `${ENCRYPTED_ROUTE}/new`);
    await pickPerson(page, "carol", {
      expectedStatus: "Doesn’t accept messages from you",
    });
    // Dave blocked alice: alice sees the same notice as a closed inbox, so
    // the block is never disclosed.
    await pickPerson(page, "dave", {
      expectedStatus: "Doesn’t accept messages from you",
    });
    const start = page.getByRole("button", { name: "Start encrypted chat" });
    await expect(start).toBeDisabled();
    await expect(
      page.getByText(
        "Remove the people who can’t receive encrypted messages to continue."
      )
    ).toBeVisible();
    await page.getByRole("button", { name: "Remove carol" }).click();
    await page.getByRole("button", { name: "Remove dave" }).click();

    // Eligible when checked; bob closes his DMs before alice presses start:
    // the delivery service refuses the claim and no chat is created.
    await pickPerson(page, "bob");
    await expect(start).toBeEnabled();
    await e2eeSandboxControls.setDmPolicy(baseURL, "bob", "NOBODY");
    await start.click();
    await expect(
      page.getByRole("alert").filter({
        hasText: "Doesn’t accept messages from you",
      })
    ).toBeVisible({ timeout: E2EE_UI_TIMEOUT_MS });
    await expect(page).toHaveURL(new RegExp(`${ENCRYPTED_ROUTE}/new$`));

    const state = await e2eeSandboxControls.state(baseURL);
    for (const group of state.groups) {
      expect(
        group.roster.some((entry) => entry.profile_id === users.bob.profileId)
      ).toBe(false);
    }
    await gotoPath(bob.page, ENCRYPTED_ROUTE);
    await expect(bob.page.getByText("No encrypted chats yet")).toBeVisible({
      timeout: E2EE_UI_TIMEOUT_MS,
    });
  });
});

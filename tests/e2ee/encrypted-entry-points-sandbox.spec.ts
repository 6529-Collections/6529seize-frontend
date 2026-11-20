import { LEGACY_DM_DELETION_AT } from "@/components/e2ee/legacy/legacyDmRetention";
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
  conversationIdFromUrl,
  enroll,
  enrollButton,
  enrollmentHeading,
  ENCRYPTED_ROUTE,
  gotoPath,
  pickPerson,
  selectedPerson,
} from "../support/e2ee/e2eeUi";
import { isMobileWebProject } from "../support/surfaceSimulation";
import { expectUrlState } from "../support/urlState";

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

  test("the Messages gear opens privacy settings with independent saves", async ({
    baseURL,
    browser,
  }, testInfo) => {
    const users = await resetE2eeSandbox(baseURL);
    const alice = await openE2eeUser(browser, testInfo, baseURL, users.alice);
    sessions = [alice];
    const { page } = alice;
    const preferences = {
      direct_message_policy: "EVERYONE",
      direct_message_group_id: null,
      direct_message_allow_people_i_follow: true,
      direct_message_group_unavailable: false,
      notification_level: "ALL",
      notifications: {
        direct_messages: true,
        mentions_replies_quotes: true,
        reactions_votes_boosts: true,
        new_followers: true,
        rep_and_nic: true,
        subscription_coverage: true,
      },
    };
    const updates: unknown[] = [];
    let groupCreated = false;
    await page.route("**/profile-preferences", async (route) => {
      if (route.request().method() === "PUT") {
        const update = route.request().postDataJSON() as Partial<
          typeof preferences
        >;
        updates.push(update);
        const notifications = {
          ...preferences.notifications,
          ...update.notifications,
        };
        Object.assign(preferences, update, { notifications });
      }
      await route.fulfill({ json: preferences });
    });
    await page.route("**/groups", async (route) => {
      if (route.request().method() !== "POST") return route.fallback();
      const body: unknown = route.request().postDataJSON();
      expect(body).toMatchObject({
        is_private: true,
        group: { level: { min: 20 } },
      });
      groupCreated = true;
      await route.fulfill({ json: { id: "dm-criteria" } });
    });
    await page.route("**/groups/dm-criteria/visible", (route) =>
      route.fulfill({ json: { id: "dm-criteria", visible: true } })
    );

    await gotoPath(page, ENCRYPTED_ROUTE);
    const gear = page.getByRole("link", { name: "Message preferences" });
    await expect(gear).toBeVisible({ timeout: E2EE_UI_TIMEOUT_MS });
    await expect(gear).toHaveAttribute("href", "/preferences?tab=messages");
    await gear.click();
    await expect(page).toHaveURL(/\/preferences\?tab=messages$/, {
      timeout: E2EE_UI_TIMEOUT_MS,
    });
    const tabs = page.getByRole("navigation", { name: "Preference sections" });
    await expect(
      tabs.getByRole("link", { name: "Messages", exact: true })
    ).toHaveAttribute("aria-current", "page");
    await expect(
      page.getByRole("checkbox", { name: "New followers" })
    ).toHaveCount(0);
    await page
      .getByText("People who meet my criteria", { exact: true })
      .click();
    await page.getByRole("button", { name: "Set criteria" }).click();
    const editor = page.getByRole("dialog", { name: "Who can message you" });
    await expect(
      editor.getByRole("button", { name: "Choose group" })
    ).toHaveCount(0);
    await expect(editor.getByPlaceholder("Search groups...")).toHaveCount(0);
    await editor.getByRole("button", { name: "NIC", exact: true }).click();
    for (const field of [
      editor.getByLabel("From Identity", { exact: true }),
      editor.getByRole("spinbutton", { name: "NIC at least" }),
    ]) {
      await expect(field).toBeVisible();
      const colors = await field.evaluate((input) => {
        let panel = input.parentElement;
        while (panel) {
          const background = getComputedStyle(panel).backgroundColor;
          if (background !== "rgba(0, 0, 0, 0)") {
            return {
              panel: background,
              input: getComputedStyle(input).backgroundColor,
            };
          }
          panel = panel.parentElement;
        }
        throw new Error("The criteria field has no surrounding background");
      });
      expect(colors.input).not.toBe("rgba(0, 0, 0, 0)");
      expect(colors.input).not.toBe(colors.panel);
    }
    await editor.screenshot({
      path: testInfo.outputPath("criteria-nic-desktop.png"),
    });
    await editor.getByRole("button", { name: "Level", exact: true }).click();
    const minimumLevel = editor.getByRole("spinbutton", {
      name: "Level at least",
    });
    await minimumLevel.fill("20");
    const desktopViewport = page.viewportSize();
    if (desktopViewport) {
      await editor.screenshot({
        path: testInfo.outputPath("criteria-desktop.png"),
      });
      await page.setViewportSize({ width: 390, height: 844 });
      await editor.getByRole("button", { name: "Back", exact: true }).click();
      await editor.getByRole("button", { name: /^Level\b/ }).click();
      await expect(minimumLevel).toHaveValue("20");
      const bounds = await editor.boundingBox();
      expect(bounds?.width).toBeLessThanOrEqual(390);
      await editor.screenshot({
        path: testInfo.outputPath("criteria-narrow-viewport.png"),
      });
      await page.setViewportSize(desktopViewport);
    }
    await editor.getByRole("button", { name: "Done", exact: true }).click();
    await expect(editor).toHaveCount(0);
    expect(groupCreated).toBe(false);
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect
      .poll(() => updates)
      .toEqual([
        {
          direct_message_policy: "GROUP_MEMBERS",
          direct_message_group_id: "dm-criteria",
        },
      ]);
    expect(groupCreated).toBe(true);

    const notificationsTab = tabs.getByRole("link", {
      name: "Notifications",
      exact: true,
    });
    await notificationsTab.click();
    await expect(notificationsTab).toHaveAttribute("aria-current", "page", {
      timeout: E2EE_UI_TIMEOUT_MS,
    });
    await expect(
      page.getByRole("radio", { name: "People who meet my criteria" })
    ).toHaveCount(0);
    await page.getByText("New followers", { exact: true }).click();
    await expect(
      page.getByRole("checkbox", { name: "New followers" })
    ).not.toBeChecked();
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect
      .poll(() => updates)
      .toEqual([
        {
          direct_message_policy: "GROUP_MEMBERS",
          direct_message_group_id: "dm-criteria",
        },
        { notifications: { new_followers: false } },
      ]);
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
      "6529 deletes this history from its servers on Dec 1, 2026 unless legally required to keep it."
    );
    await expect(
      notice.getByRole("button", { name: "Export history" })
    ).toBeVisible();
    // Full DM views retain the notice and actions at narrow viewport widths.
    for (const width of [390, 768]) {
      await alice.page.setViewportSize({ width, height: 900 });
      const exportBox = await notice
        .getByRole("button", { name: "Export history" })
        .boundingBox();
      const startBox = await notice
        .getByRole("button", { name: "Start encrypted chat" })
        .boundingBox();
      const noticeBox = await notice.boundingBox();
      expect(exportBox).not.toBeNull();
      expect(startBox).not.toBeNull();
      expect(noticeBox).not.toBeNull();
      expect(Math.abs(exportBox!.width - startBox!.width)).toBeLessThan(2);
      expect(Math.abs(exportBox!.y - startBox!.y)).toBeLessThan(2);
      expect(noticeBox!.height).toBeLessThan(320);
    }
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
    await expect(alice.page.getByLabel("Group name (optional)")).toHaveCount(0);
    await alice.page.getByRole("button", { name: "Start chat" }).click();
    await expect(composer(alice.page)).toBeVisible({
      timeout: E2EE_UI_TIMEOUT_MS,
    });
    await expect(
      alice.page.getByRole("heading", { level: 1, name: "bob" })
    ).toBeVisible();
  });

  test("a profile opens the encrypted-first composer with its recipient selected", async ({
    baseURL,
    browser,
  }, testInfo) => {
    const users = await resetE2eeSandbox(baseURL);
    const alice = await openE2eeUser(browser, testInfo, baseURL, users.alice);
    const bob = await openE2eeUser(browser, testInfo, baseURL, users.bob);
    sessions = [alice, bob];
    await enroll(bob);

    const { page } = alice;
    const creationRequests: string[] = [];
    page.on("request", (request) => {
      if (request.method() !== "POST") return;
      const { pathname } = new URL(request.url());
      if (
        pathname.endsWith("/e2ee/groups") ||
        pathname.endsWith("/waves/direct-message/new")
      ) {
        creationRequests.push(pathname);
      }
    });
    const openFromProfile = async (handle: string) => {
      await gotoPath(page, `/${handle}`);
      await page.getByRole("button", { name: "Send direct message" }).click({
        timeout: 60_000,
      });
      await expectUrlState(
        page,
        (url) =>
          url.pathname === "/messages/new" &&
          /^[a-f0-9-]{36}$/u.test(url.searchParams.get("compose") ?? "")
      );
    };

    await openFromProfile("bob");
    await expect(
      page.getByRole("button", { name: "Remove bob" })
    ).toBeVisible();
    await expect(enrollmentHeading(page)).toBeVisible({
      timeout: E2EE_UI_TIMEOUT_MS,
    });
    await enrollButton(page).click();
    const bobRow = selectedPerson(page, "bob");
    await expect(
      bobRow.getByText("Can receive encrypted messages")
    ).toBeVisible({ timeout: E2EE_UI_TIMEOUT_MS });
    expect(creationRequests).toEqual([]);
    expect((await e2eeSandboxControls.state(baseURL)).groups).toHaveLength(0);

    await page.getByRole("button", { name: "Start chat" }).click();
    await expect(composer(page)).toBeVisible({ timeout: E2EE_UI_TIMEOUT_MS });
    const existingChat = conversationIdFromUrl(page);
    const { groups } = await e2eeSandboxControls.state(baseURL);
    const chat = groups.find(({ group }) => group === existingChat);
    const memberProfiles = [
      ...new Set(chat?.roster.map(({ profile_id }) => profile_id)),
    ];
    expect(memberProfiles.sort()).toEqual(
      [users.alice.profileId, users.bob.profileId].sort()
    );

    await openFromProfile("bob");
    await expect(bobRow).toBeVisible();
    await page.getByRole("button", { name: "Open chat" }).click({
      timeout: E2EE_UI_TIMEOUT_MS,
    });
    await expectUrlState(
      page,
      (url) => url.pathname === `${ENCRYPTED_ROUTE}/${existingChat}`
    );
    const beforeCutoff = new Date(Date.parse(LEGACY_DM_DELETION_AT) - 60_000);
    await page.clock.setFixedTime(beforeCutoff);
    const continueUnencrypted = page.getByRole("button", {
      name: "Continue unencrypted",
    });

    await e2eeSandboxControls.setDmPolicy(baseURL, "carol", "EVERYONE");
    await openFromProfile("carol");
    await expect(
      selectedPerson(page, "carol").getByText(
        "Hasn’t turned on encrypted messages yet"
      )
    ).toBeVisible({ timeout: E2EE_UI_TIMEOUT_MS });
    await expect(continueUnencrypted).toBeEnabled();

    await e2eeSandboxControls.setDmPolicy(baseURL, "carol", "NOBODY");
    await openFromProfile("carol");
    await expect(
      selectedPerson(page, "carol").getByText(
        "Doesn’t accept messages from you"
      )
    ).toBeVisible({ timeout: E2EE_UI_TIMEOUT_MS });
    await expect(
      page.getByRole("button", { name: "Start chat" })
    ).toBeDisabled();
    await expect(continueUnencrypted).toHaveCount(0);

    await page.route("**/api/v2/waves?*", async (route) => {
      const url = new URL(route.request().url());
      if (url.searchParams.get("direct_message") !== "true") {
        await route.fallback();
        return;
      }
      const response = await route.fetch();
      const body = await response.json();
      await route.fulfill({
        response,
        json: {
          ...body,
          data: [
            {
              ...body.data[0],
              id: PLAINTEXT_DM_WAVE_ID,
              name: "Sandbox Direct Message",
              is_private: true,
              is_dm_wave: true,
            },
          ],
        },
      });
    });
    await openFromProfile("bob");
    await page
      .getByRole("link", { name: "Sandbox Direct Message", exact: true })
      .click({ timeout: E2EE_UI_TIMEOUT_MS });
    await expectUrlState(
      page,
      (url) => url.pathname === `/messages/${PLAINTEXT_DM_WAVE_ID}`
    );
    await expect(
      page.getByRole("region", { name: "Unencrypted chat notice" })
    ).toBeVisible({ timeout: E2EE_UI_TIMEOUT_MS });

    expect(creationRequests).toHaveLength(1);
    expect(creationRequests[0]).toMatch(/\/e2ee\/groups$/u);
    expect((await e2eeSandboxControls.state(baseURL)).groups).toHaveLength(1);
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
    await gotoPath(page, ENCRYPTED_ROUTE);
    const entry = page.getByRole("button", {
      name: "New message",
      exact: true,
    });
    await expect(entry).toHaveCount(1);
    await entry.click();
    await expectUrlState(page, (url) => url.pathname === "/messages/new");
    await expect(
      page.getByRole("heading", { name: "New message", exact: true })
    ).toBeVisible({ timeout: E2EE_UI_TIMEOUT_MS });
    await expect(page.getByRole("dialog", { name: "New message" })).toHaveCount(
      0
    );
    await pickPerson(page, "carol", {
      expectedStatus: "Doesn’t accept messages from you",
    });
    // Dave blocked alice: alice sees the same notice as a closed inbox, so
    // the block is never disclosed.
    await pickPerson(page, "dave", {
      expectedStatus: "Doesn’t accept messages from you",
    });
    const start = page.getByRole("button", { name: "Start chat" });
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
    await expectUrlState(page, (url) => url.pathname === "/messages/new");
    await expect(
      page.getByRole("button", { name: "Remove bob" })
    ).toBeVisible();

    // No group puts bob with anyone else. His own self group, which holds
    // only his devices for read-state sync (D175), is not a chat.
    const state = await e2eeSandboxControls.state(baseURL);
    for (const group of state.groups) {
      const profiles = new Set(group.roster.map((entry) => entry.profile_id));
      expect(profiles.has(users.bob.profileId) && profiles.size > 1).toBe(
        false
      );
    }
    await gotoPath(bob.page, ENCRYPTED_ROUTE);
    await expect(bob.page.getByText("No encrypted chats yet")).toBeVisible({
      timeout: E2EE_UI_TIMEOUT_MS,
    });
  });
});

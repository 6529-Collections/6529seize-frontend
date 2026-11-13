import { createChatWave } from "../support/staging-e2ee/chat-wave";
import type { Locator, Page } from "@playwright/test";

import { expect, test } from "../testHelpers";
import { newRunId } from "../support/staging-e2ee/fixtures";
import {
  attachSessionEvidence,
  closeSessions,
  createThrowawayUser,
  configureStagingJourney,
  gotoStaging,
  prepareProfileSession,
  stagingApiError,
  stagingApiRequest,
  stagingJourneyOptInProblem,
  startStagingJourneySetup,
  type StagingE2eeSession,
  SYNC_TIMEOUT_MS,
  UI_TIMEOUT_MS,
} from "../support/staging-e2ee/session";

/**
 * Live unread state in the wave list (WAVES-PLAN 0.2, PR #4723) between two
 * real users on staging.6529.io.
 *
 * Both users are throwaway wallets with test-only profiles, signed in
 * through the app's own wallet modal (see the encrypted DM journey). A
 * creates a public chat wave and posts in it; B follows it while another
 * wave is open, then opens it. The run writes throwaway waves and drops to
 * staging, so it is part of the opt-in `e2ee-staging` pack only.
 *
 * Covered: the badge counts posts in a wave that is not open without a
 * reload, and the row links to the first unread; opening the wave jumps to
 * the first unread and the count clears and stays cleared after a reload; a
 * post that arrives while the wave is open leaves no count behind.
 */

const SETUP_TIMEOUT_MS = 10 * 60_000;
const TEST_TIMEOUT_MS = 10 * 60_000;
const DESKTOP_PROJECT = "web-desktop-chromium";

const OPT_IN_PROBLEM = stagingJourneyOptInProblem(
  "The staging wave unread journey",
  process.env["PLAYWRIGHT_BASE_URL"]
);

async function followWave(session: StagingE2eeSession, waveId: string) {
  const result = await stagingApiRequest(
    session,
    "POST",
    `waves/${waveId}/subscriptions`,
    { actions: ["DROP_CREATED"] }
  );
  const error = stagingApiError(result.json);
  expect(
    result.ok,
    `${session.label}: staging refused to let a new profile follow the wave (HTTP ${result.status}${error ? `: ${error.slice(0, 300)}` : ""})`
  ).toBe(true);
}

function chatComposer(page: Page): Locator {
  return page.getByRole("textbox", { name: "Write a message" }).last();
}

async function visibleToastText(page: Page): Promise<string> {
  const texts = await page
    .getByRole("alert")
    .or(page.getByRole("status"))
    .filter({ visible: true })
    .allInnerTexts()
    .catch(() => []);
  return texts
    .map((text) => text.trim())
    .filter(Boolean)
    .join(" | ")
    .slice(0, 300);
}

/**
 * Posts `text` from the wave composer. A new profile may first be asked to
 * enable Signed Posts; the scripted wallet signs that as a user would.
 */
async function post(session: StagingE2eeSession, text: string) {
  const { page } = session;
  const input = chatComposer(page);
  await expect(
    input,
    `${session.label}: the wave composer did not appear for a new profile`
  ).toBeVisible({ timeout: UI_TIMEOUT_MS });
  await input.fill(text);
  await input.press("Enter");
  const message = page.getByText(text, { exact: true }).last();
  const signedPosts = page.getByRole("dialog", { name: "Enable Signed Posts" });
  await expect(message.or(signedPosts).first()).toBeVisible({
    timeout: UI_TIMEOUT_MS,
  });
  if (await signedPosts.isVisible()) {
    await signedPosts
      .getByRole("button", { name: "Sign to enable Signed Posts", exact: true })
      .click();
    await expect(signedPosts).toHaveCount(0, { timeout: UI_TIMEOUT_MS });
  }
  const sent = await message
    .waitFor({ state: "visible", timeout: SYNC_TIMEOUT_MS })
    .then(() => true)
    .catch(() => false);
  expect(
    sent,
    `${session.label}: staging did not accept a post from a new profile (${(await visibleToastText(page)) || "no message shown"})`
  ).toBe(true);
}

/** The sidebar row for `waveName`: its link and its unread badge. */
function waveRow(page: Page, waveName: string) {
  const link = page.getByRole("link", { name: waveName, exact: true }).first();
  const avatar = page
    .getByRole("link", { name: waveName, exact: true })
    .first()
    .locator('xpath=ancestor::*[.//*[@data-testid="sidebar-wave-avatar"]][1]')
    .getByTestId("sidebar-wave-avatar");
  return {
    link,
    badge: (count: number) => avatar.getByText(String(count), { exact: true }),
    anyBadge: avatar.getByText(/^\d+\+?$/u),
  };
}

/** The row's unread count, 0 when it shows no badge. */
async function badgeCount(row: ReturnType<typeof waveRow>): Promise<number> {
  if ((await row.anyBadge.count()) === 0) return 0;
  return Number.parseInt((await row.anyBadge.first().innerText()).trim(), 10);
}

interface World {
  readonly runId: string;
  readonly a: StagingE2eeSession;
  readonly b: StagingE2eeSession;
  readonly watched: { readonly id: string; readonly name: string };
  readonly other: { readonly id: string; readonly name: string };
}

let world: World | null = null;

function requireWorld(): World {
  if (!world) {
    throw new Error("Staging unread users were not set up.");
  }
  return world;
}

test.describe("Live wave unread state between real users on staging @large", () => {
  // The steps build on each other.
  configureStagingJourney(test, {
    mode: "serial",
    testTimeoutMs: TEST_TIMEOUT_MS,
    optInProblem: OPT_IN_PROBLEM,
  });

  test.beforeAll(async ({ browser }, testInfo) => {
    startStagingJourneySetup(testInfo, {
      setupTimeoutMs: SETUP_TIMEOUT_MS,
      project: DESKTOP_PROJECT,
      journey: "The staging unread journey",
      pack: "The staging unread journey",
    });
    const runId = newRunId();
    // Both sign in again once the profile exists, as returning users do.
    const again = { signInAgainWithProfile: true };
    const a = await prepareProfileSession(
      browser,
      testInfo,
      createThrowawayUser("A"),
      "A",
      again
    );
    try {
      const b = await prepareProfileSession(
        browser,
        testInfo,
        createThrowawayUser("B"),
        "B",
        again
      );
      try {
        const watchedName = `unreadqa ${runId} watched`;
        const otherName = `unreadqa ${runId} other`;
        const watched = {
          id: await createChatWave(a, watchedName),
          name: watchedName,
        };
        const other = {
          id: await createChatWave(b, otherName),
          name: otherName,
        };
        await followWave(b, watched.id);
        world = { runId, a, b, watched, other };
      } catch (error) {
        await attachSessionEvidence(testInfo, [a, b]);
        await b.close();
        throw error;
      }
    } catch (error) {
      await a.close();
      throw error;
    }
  });

  test.afterEach(async () => {
    const testInfo = test.info();
    if (world && testInfo.status !== testInfo.expectedStatus) {
      await attachSessionEvidence(testInfo, [world.a, world.b]);
    }
  });

  test.afterAll(async () => {
    if (world) {
      await closeSessions([world.a, world.b]);
      world = null;
    }
  });

  test("posts in a wave that is not open raise its badge without a reload", async () => {
    const { a, b, watched, other, runId } = requireWorld();
    await gotoStaging(b.page, `/waves/${other.id}`);
    const row = waveRow(b.page, watched.name);
    await expect(
      row.link,
      "B: the followed wave is not in the wave list"
    ).toBeVisible({ timeout: UI_TIMEOUT_MS });
    // The wave's description drop may already count; only the change matters.
    const before = await badgeCount(row);

    await gotoStaging(a.page, `/waves/${watched.id}`);
    await post(a, `unreadqa ${runId} first`);
    await post(a, `unreadqa ${runId} second`);

    // B's page was not reloaded: the count arrives live.
    await expect(
      row.badge(before + 2),
      `B: the badge did not go from ${before} to ${before + 2} without a reload`
    ).toBeVisible({ timeout: SYNC_TIMEOUT_MS });
    await expect(row.link).toHaveAttribute("href", /[?&]divider=\d+/u);
  });

  test("opening the wave jumps to the first unread and the count stays cleared", async () => {
    const { b, watched, other, runId } = requireWorld();
    const row = waveRow(b.page, watched.name);
    await row.link.click();
    await expect(b.page).toHaveURL(new RegExp(watched.id, "u"));
    // The jump to the first unread; the in-chat divider is not asserted (a
    // first unread that arrived over the socket shows none on main either).
    await expect(
      b.page.getByText(`unreadqa ${runId} first`, { exact: true }).last()
    ).toBeInViewport({ timeout: UI_TIMEOUT_MS });
    await expect(
      b.page.getByText(`unreadqa ${runId} second`, { exact: true }).last()
    ).toBeVisible();

    // Give the read marker its moment, then leave and come back.
    await b.page.waitForTimeout(3_000);
    await waveRow(b.page, other.name).link.click();
    await expect(b.page).toHaveURL(new RegExp(other.id, "u"));
    await expect(
      row.anyBadge,
      "B: the count came back after opening the wave"
    ).toHaveCount(0, { timeout: UI_TIMEOUT_MS });

    await b.page.reload({ waitUntil: "domcontentloaded" });
    await expect(row.link).toBeVisible({ timeout: UI_TIMEOUT_MS });
    await expect(
      row.anyBadge,
      "B: the server still counted the read posts after a reload"
    ).toHaveCount(0);
    await expect(row.link).not.toHaveAttribute("href", /[?&]divider=/u);
  });

  test("a post while the wave is open leaves no count behind", async () => {
    const { a, b, watched, other, runId } = requireWorld();
    const row = waveRow(b.page, watched.name);
    await row.link.click();
    await expect(b.page).toHaveURL(new RegExp(watched.id, "u"));

    await post(a, `unreadqa ${runId} while open`);
    await expect(
      b.page.getByText(`unreadqa ${runId} while open`, { exact: true }).last(),
      "B: the post did not arrive live in the open wave"
    ).toBeVisible({ timeout: SYNC_TIMEOUT_MS });

    await b.page.waitForTimeout(3_000);
    await waveRow(b.page, other.name).link.click();
    await expect(b.page).toHaveURL(new RegExp(other.id, "u"));
    await expect(
      row.anyBadge,
      "B: a post read while the wave was open still counts as unread"
    ).toHaveCount(0, { timeout: UI_TIMEOUT_MS });
    await b.page.reload({ waitUntil: "domcontentloaded" });
    await expect(row.link).toBeVisible({ timeout: UI_TIMEOUT_MS });
    await expect(row.anyBadge).toHaveCount(0);
  });
});

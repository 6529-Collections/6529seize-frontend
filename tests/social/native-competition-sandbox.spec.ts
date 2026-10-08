import { writeFile } from "node:fs/promises";
import composerSandboxConstants from "../support/composerSandboxConstants.json";
import { installSurfaceSimulation } from "../support/surfaceSimulation";
import type { Page } from "@playwright/test";
import { expectCompetitionScroll } from "../support/competitionScroll";
import { expect, expectNoHorizontalOverflow, test } from "../testHelpers";
import {
  dismissNextDevTools,
  getSandboxApiOrigin,
  useLocalSandboxMutationGuard,
} from "../support/localSandbox";

const WAVE = "00000000-0000-4000-8000-000000000529";
const PROFILE = "00000000-0000-4000-8000-000000000531";
const MEMES_WAVE = composerSandboxConstants.linkedDropMemesWaveId;
const entryDropId = (id: string) =>
  id === "alpha"
    ? "00000000-0000-4000-8000-000000000532"
    : "00000000-0000-4000-8000-000000000533";
const ROOT = `/waves/${WAVE}/competitions`;
const competitionContent = (page: Page) =>
  page
    .getByRole("main")
    .locator('[data-competition-detail], [data-competition-navigation="flat"]')
    .filter({ visible: true });
const waveTabStrip = (page: Page) =>
  page.getByRole("tablist").filter({
    has: page.getByRole("tab", { name: "Chat", exact: true }),
  });

async function expectSubmissionActionsGrouped(page: Page, singleRow = false) {
  const toolbar = page.getByTestId("leaderboard-header-row");
  const mine = toolbar.getByRole("button", {
    name: "My submissions",
    exact: true,
  });
  const create = toolbar.getByRole("button", { name: "Drop", exact: true });
  await expect(mine).toBeInViewport({ ratio: 1 });
  await expect(create).toBeInViewport({ ratio: 1 });
  await expect
    .poll(async () => {
      const mineBox = await mine.boundingBox();
      const createBox = await create.boundingBox();
      return mineBox && createBox
        ? Math.abs(mineBox.y - createBox.y)
        : Number.POSITIVE_INFINITY;
    })
    .toBeLessThanOrEqual(1);
  if (singleRow) {
    const controls = toolbar.getByTestId("leaderboard-header-controls-row");
    await expect
      .poll(async () => {
        const controlsBox = await controls.boundingBox();
        const mineBox = await mine.boundingBox();
        return controlsBox && mineBox
          ? Math.abs(controlsBox.y - mineBox.y)
          : Number.POSITIVE_INFINITY;
      })
      .toBeLessThanOrEqual(1);
  }
}

async function expectBalancedSubmissionRows(page: Page) {
  const toolbar = page.getByTestId("leaderboard-header-row");
  await expect(toolbar).toHaveAttribute("data-submission-layout", "two-rows");
  await expectSubmissionActionsGrouped(page);
  const controls = toolbar.getByTestId("leaderboard-header-controls-row");
  await expect
    .poll(async () =>
      controls.evaluate((element) => element.scrollWidth - element.clientWidth)
    )
    .toBeLessThanOrEqual(1);
  const mine = toolbar.getByRole("button", {
    name: "My submissions",
    exact: true,
  });
  const create = toolbar.getByRole("button", { name: "Drop", exact: true });
  const sort = toolbar.getByRole("button", {
    name: "Sort: Current Vote",
    exact: true,
  });
  await expect(sort).toBeInViewport({ ratio: 1 });
  await expect(sort).not.toContainText("Sort:");
  await expect
    .poll(async () => {
      const rowBox = await toolbar.boundingBox();
      const mineBox = await mine.boundingBox();
      const createBox = await create.boundingBox();
      const sortBox = await sort.boundingBox();
      if (!rowBox || !mineBox || !createBox || !sortBox) {
        return Number.POSITIVE_INFINITY;
      }
      return Math.max(
        Math.abs(mineBox.x - rowBox.x),
        Math.abs(createBox.x + createBox.width - rowBox.x - rowBox.width),
        Math.abs(sortBox.x + sortBox.width - createBox.x - createBox.width)
      );
    })
    .toBeLessThanOrEqual(1);
}

async function selectLegacyNewestSort(page: Page, mobile: boolean) {
  if (mobile) {
    await page
      .getByRole("button", { name: "Sort: Current Vote", exact: true })
      .click();
  }
  const newest = page.getByRole(mobile ? "menuitem" : "tab", {
    name: "Newest",
    exact: true,
  });
  if (mobile) await expect(newest).toBeInViewport({ ratio: 1 });
  await newest.click();
  const selected = mobile
    ? page.getByRole("button", { name: "Sort: Newest", exact: true })
    : newest;
  await expect(selected).toBeVisible();
  if (!mobile) await expect(selected).toHaveAttribute("aria-selected", "true");
  return selected;
}

async function deferDefaultCompetition(page: Page) {
  let releaseDefault!: () => void;
  const pendingDefault = new Promise<void>((resolve) => {
    releaseDefault = resolve;
  });
  await page.route("**/v3/waves/**/default-competition", async (route) => {
    await pendingDefault;
    await route.fallback();
  });
  return {
    releaseDefault,
    waitForDefaultResponse: () =>
      page.waitForResponse(
        (response) =>
          response.url().endsWith("/default-competition") && response.ok()
      ),
  };
}

async function expectLegacySectionContent(page: Page, tab: string) {
  if (tab === "decisions") {
    await expect(
      page.getByText("No Winners Yet", { exact: true })
    ).toBeVisible();
  } else if (tab === "outcomes") {
    await expect(
      page.getByText("No outcomes to show.", { exact: true })
    ).toBeVisible();
  } else if (tab === "votes") {
    await expect(
      page.getByText("You haven't voted on any submissions in this wave yet.", {
        exact: true,
      })
    ).toBeVisible();
  } else if (tab === "rules") {
    await expect(
      page.getByRole("heading", { name: "Participation", exact: true }).first()
    ).toBeVisible();
  } else {
    await expect(
      page.getByRole("tablist", { name: "Leaderboard view modes" })
    ).toBeVisible();
  }
}

async function expectFamiliarWaveTabs(page: Page) {
  for (const name of ["Chat", "Leaderboard", "Winners", "Outcome", "Votes"]) {
    await expect(
      waveTabStrip(page).getByRole("tab", { name, exact: true })
    ).toBeVisible();
  }
}
async function openWaveInformation(page: Page) {
  await page
    .getByRole("button", { name: /^About / })
    .first()
    .click();
  return page
    .getByRole("complementary", { name: "Wave details" })
    .or(
      page
        .getByRole("dialog")
        .filter({ has: page.getByRole("tab", { name: "About", exact: true }) })
    );
}

const pageResult = (data: unknown[]) => ({
  data,
  next_cursor: null,
  has_more: false,
});
const competition = (id: string, title: string) => ({
  id,
  wave_id: WAVE,
  type: "RANK",
  title,
  description: "Independent entries and voting in the same wave.",
  lifecycle: "PUBLISHED",
  computed_phase: "VOTING_OPEN",
  config_version: 1,
  participation: {
    group_id: null,
    signature_required: false,
    max_entries_per_participant: null,
    required_metadata: [],
    required_media: [],
    submission_type: null,
    identity_submission_strategy: null,
    identity_submission_duplicates: null,
    starts_at: null,
    ends_at: null,
    terms: null,
  },
  voting: {
    group_id: null,
    credit_type: "TDH",
    credit_scope: "WAVE",
    credit_category: null,
    credit_creditor: null,
    credit_nfts: [],
    signature_required: false,
    starts_at: null,
    ends_at: null,
    max_votes_per_identity_to_entry: null,
    forbid_negative_votes: false,
  },
  decisions: {
    strategy: null,
    next_decision_time: null,
    winning_min_threshold: null,
    winning_max_threshold: null,
    winning_threshold_min_duration_ms: 0,
    max_winners: null,
    time_lock_ms: null,
  },
  winners: {
    max_winners: null,
    winning_min_threshold: null,
    winning_max_threshold: null,
    winning_threshold_min_duration_ms: 0,
  },
  outcome_config: [],
  presentation:
    id === "beta"
      ? [
          {
            data_key: "wave_display.submission.button_label",
            data_value: "Enter Beta",
          },
        ]
      : [],
  capabilities: [],
  permissions: { view: true, submit: true, vote: true, administer: true },
  created_at: 1,
  updated_at: 1,
  published_at: 1,
  ended_at: null,
  cancelled_at: null,
  archived_at: null,
});

async function installCompetitionApi(
  page: Page,
  selfNomination = false,
  administer = true,
  waveId = WAVE
) {
  // Fixture the external analytics loader; keep the sandbox mutation guard strict.
  await page.route("https://www.googletagmanager.com/gtag/js?**", (route) =>
    route.fulfill({ contentType: "application/javascript", body: "" })
  );
  const fixtureResponse = await page.request.get(
    `${getSandboxApiOrigin(process.env["PLAYWRIGHT_BASE_URL"])}/api/v2/waves/${waveId}/drops`
  );
  expect(fixtureResponse.ok()).toBe(true);
  const entryFixture = await fixtureResponse.json();
  await page.route("**/api/open-graph**", (route) =>
    route.fulfill({ json: {} })
  );
  const competitions = [
    competition("alpha", "Parallel Alpha"),
    competition("beta", "Parallel Beta"),
  ];
  competitions.forEach((item) => {
    item.permissions.administer = administer;
    item.wave_id = waveId;
  });
  if (selfNomination) {
    Object.assign(competitions[0]!.participation, {
      submission_type: "IDENTITY",
      identity_submission_strategy: "ONLY_MYSELF",
      terms: "Keep submissions original and follow this competition’s rules.",
    });
  }
  let defaultId: string | null = "alpha";
  let legacyPrimaryId: string | null = null;
  let refreshAfter: number | null = null;
  let selectionReads = 0;
  const configurations = new Map<string, Record<string, unknown>>();
  const votes: Record<string, number> = { alpha: 0, beta: 0 };
  const requests: { path: string; body: Record<string, unknown> }[] = [];
  await page.route("**/v3/waves", async (route) => {
    const request = route.request().postDataJSON() as Record<string, unknown>;
    requests.push({
      path: new URL(route.request().url()).pathname,
      body: request,
    });
    return route.fulfill({
      json: {
        id: waveId,
        name: request["name"],
        legacy_primary_competition_id: legacyPrimaryId,
        permissions: { view: true, administer, create_competition: administer },
      },
    });
  });
  const entry = (id: string) => ({
    id: `entry-${id}`,
    wave_id: waveId,
    competition_id: id,
    drop_id: entryDropId(id),
    submitter: { id: PROFILE, handle: "playwright", pfp: null },
    status: "ACTIVE",
    config_version: 1,
    submitted_at: 1,
    rank: null,
    won_at: null,
    decision_id: null,
  });
  await page.route("**/v3/waves/**", async (route) => {
    const url = new URL(route.request().url());
    const suffix = url.pathname.split(`/v3/waves/${waveId}`)[1];
    if (suffix === undefined) return route.fallback();
    const method = route.request().method();
    if (suffix === "/default-competition") {
      selectionReads += 1;
      const now = Date.now();
      return route.fulfill({
        json: {
          competition_id: defaultId,
          evaluated_at: now,
          next_refresh_at: refreshAfter === null ? null : now + refreshAfter,
        },
      });
    }
    if (
      suffix.startsWith("/drops/") &&
      suffix.endsWith("/competition-context")
    ) {
      const dropId = suffix.split("/")[2];
      const owner = competitions.find(
        (item) => entryDropId(item.id) === dropId
      );
      return route.fulfill({
        json: {
          competition: owner ?? null,
          entry: owner ? entry(owner.id) : null,
          vote_summary: owner
            ? {
                rating: votes[owner.id] ?? 0,
                realtime_rating: votes[owner.id] ?? 0,
                rating_prediction: votes[owner.id] ?? 0,
                user_vote: votes[owner.id] ?? 0,
                rank: 1,
                raters_count: votes[owner.id] ? 1 : 0,
                top_raters: [],
                over_threshold_since_ms: null,
              }
            : null,
        },
      });
    }
    const parts = suffix.split("/").filter(Boolean);
    const id = parts[1] ?? "";
    const selected = competitions.find((item) => item.id === id);
    const resource = parts.slice(2).join("/");
    const budget = () => ({
      competition_id: id,
      profile_id: PROFILE,
      entry_id: url.searchParams.get("entry_id"),
      credit_type: "TDH",
      credit_scope: "WAVE",
      available: 100,
      spent: Math.abs(votes[id] ?? 0),
      remaining: 100 - Math.abs(votes[id] ?? 0),
      current_vote: votes[id] ?? 0,
      min_vote: -100,
      max_vote: 100,
    });
    let body: unknown;
    if (method === "PUT" && resource.endsWith("/votes/me")) {
      const request = route.request().postDataJSON() as Record<string, unknown>;
      requests.push({ path: url.pathname, body: request });
      votes[id] = Number(request["value"]);
      body = budget();
    } else if (method === "POST" && suffix === "/competitions") {
      const request = route.request().postDataJSON() as {
        config: Record<string, unknown>;
      };
      requests.push({ path: url.pathname, body: request });
      const draft = {
        ...competition("draft", String(request.config["title"])),
        lifecycle: "DRAFT",
        computed_phase: "DRAFT",
      };
      competitions.push(draft);
      configurations.set(draft.id, request.config);
      body = draft;
    } else if (method === "PATCH" && selected) {
      const request = route.request().postDataJSON() as {
        config: Record<string, unknown>;
      };
      requests.push({ path: url.pathname, body: request });
      configurations.set(id, request.config);
      selected.title = String(request.config["title"]);
      selected.config_version += 1;
      body = selected;
    } else if (method === "POST" && resource === "entries") {
      const request = route.request().postDataJSON() as Record<string, unknown>;
      requests.push({ path: url.pathname, body: request });
      body = entry(id);
    } else if (method !== "GET")
      return route.fulfill({
        status: 409,
        json: { message: "This sandbox only permits scoped vote mutations." },
      });
    else if (suffix === "")
      body = {
        id: waveId,
        name: "Sandbox Composer Wave",
        legacy_primary_competition_id: legacyPrimaryId,
        permissions: { view: true, administer, create_competition: administer },
      };
    else if (suffix === "/competitions") {
      const phases = url.searchParams.getAll("phase");
      body = pageResult(
        competitions.filter(
          (item) => phases.length === 0 || phases.includes(item.computed_phase)
        )
      );
    } else if (!selected)
      return route.fulfill({ status: 404, json: { message: "Not found" } });
    else if (!resource) body = selected;
    else if (resource === "activity") body = [];
    else if (resource === "configuration") body = configurations.get(id);
    else if (resource === "entries" || resource === "winners")
      body = pageResult(resource === "entries" ? [entry(id)] : []);
    else if (resource === "leaderboard")
      body = pageResult([
        {
          competition_id: id,
          entry_id: `entry-${id}`,
          drop_id: entryDropId(id),
          rating: votes[id],
          real_time_rating: votes[id],
          rank: 1,
          submitted_at: 1,
        },
      ]);
    else if (resource === "credits/me") body = budget();
    else if (resource === "votes/me")
      body = pageResult([
        {
          entry_id: `entry-${id}`,
          drop_id: entryDropId(id),
          value: votes[id],
          credit_spent: Math.abs(votes[id] ?? 0),
          entry_status: "ACTIVE",
        },
      ]);
    else if (resource.endsWith("/content"))
      body = {
        wave_id: waveId,
        title: `Recorded ${id} entry`,
        parts: [{ content: `Immutable ${id} entry content`, media: [] }],
        mentioned_users: [],
        mentioned_waves: [],
        metadata: [],
        referenced_nfts: [],
        signature: null,
      };
    else if (resource === `entries/entry-${id}`) body = entry(id);
    else body = pageResult([]);
    return route.fulfill({ json: body });
  });
  await page.route("**/v2/drops/*", async (route) => {
    const dropId = new URL(route.request().url()).pathname.split("/").at(-1);
    const owner = competitions.find((item) => entryDropId(item.id) === dropId);
    if (!owner) return route.fallback();
    return route.fulfill({
      json: {
        wave: entryFixture.wave,
        drop: {
          ...entryFixture.drops[0],
          id: dropId,
          drop_type: "PARTICIPATORY",
          title: `Recorded ${owner.id} entry`,
          content: `Immutable ${owner.id} entry content`,
        },
      },
    });
  });
  return {
    requests,
    setPhase: (id: string, phase: string) => {
      const selected = competitions.find((item) => item.id === id);
      expect(selected).toBeDefined();
      selected!.computed_phase = phase;
    },
    setDefault: (id: string | null) => {
      defaultId = id;
    },
    clearCompetitions: () => {
      competitions.splice(0);
      defaultId = null;
    },
    onlyCompetition: (id: string) => {
      const selected = competitions.find((item) => item.id === id);
      expect(selected).toBeDefined();
      competitions.splice(0, competitions.length, selected!);
      defaultId = id;
    },
    legacyPrimary: async (id: string, ended = false) => {
      legacyPrimaryId = id;
      const response = await page.request.get(
        `${getSandboxApiOrigin(process.env["PLAYWRIGHT_BASE_URL"])}/api/waves/${waveId}`
      );
      expect(response.ok()).toBe(true);
      const wave = await response.json();
      wave.id = waveId;
      wave.description_drop.wave.id = waveId;
      wave.wave.type = "RANK";
      wave.wave.authenticated_user_eligible_for_admin = administer;
      if (!administer) {
        wave.author.id = "00000000-0000-4000-8000-000000000999";
        wave.author.handle = "sandbox-wave-author";
      }
      wave.wave.no_of_decisions_done = 1;
      wave.wave.decisions_strategy = {
        first_decision_time: 1,
        subsequent_decisions: ended ? [] : [86_400_000],
        is_rolling: !ended,
      };
      await page.route(`**/api/waves/${waveId}`, (route) =>
        route.fulfill({ json: wave })
      );
    },
    refreshAtBoundary: () => {
      refreshAfter = 1000;
    },
    selectionReads: () => selectionReads,
  };
}

test.describe("Native competition sandbox @auth @medium @local-only", () => {
  test.afterEach(async ({ page }) => {
    // Let fixture responses finish before Playwright disposes their request context.
    await page.unrouteAll({ behavior: "wait" });
  });
  useLocalSandboxMutationGuard(
    test,
    "PLAYWRIGHT_AUTH_SANDBOX",
    "Native competition tests require an isolated local mock API."
  );
  for (const legacy of [false, true]) {
    test(`scrolls overflowing ${legacy ? "legacy" : "native"} Settings and vote Activity`, async ({
      page,
    }, testInfo) => {
      const sandbox = await installCompetitionApi(page, false, false);
      sandbox.onlyCompetition("alpha");
      if (legacy) await sandbox.legacyPrimary("alpha");
      const app = (testInfo.project.use.viewport?.width ?? 1280) < 640;
      if (app)
        await installSurfaceSimulation(
          page.context(),
          "capacitor-ios-sim",
          testInfo.project.use.baseURL
        );
      const selected = competition("alpha", "Parallel Alpha");
      selected.permissions.administer = false;
      await page.route("**/v3/waves/*/competitions/alpha", (route) =>
        route.fulfill({
          json: {
            ...selected,
            participation: {
              ...selected.participation,
              terms: `${"Original artwork is required. ".repeat(160)}End of participation terms.`,
            },
          },
        })
      );
      await page.route(
        "**/v3/waves/*/competitions/alpha/activity?**",
        (route) =>
          route.fulfill({
            json: Array.from({ length: 30 }, (_, index) => ({
              id: `scroll-log-${index}`,
              action: "DROP_VOTE_EDIT",
              wave_id: WAVE,
              drop_id: entryDropId("alpha"),
              invoker: {
                id: PROFILE,
                handle: `scroll-voter-${index}`,
                pfp: null,
              },
              created_at: "2026-10-01T12:00:00Z",
              contents: { oldVote: 0, newVote: index + 1 },
            })),
          })
      );
      await page.goto(`${ROOT}/alpha?tab=rules`);
      const rules = page.getByRole("main").locator("#competition-alpha-rules");
      await expect(
        rules.getByRole("heading", { name: "Participation", exact: true })
      ).toBeVisible();
      await expectCompetitionScroll(
        page,
        page
          .getByRole("main")
          .locator("#competition-alpha-rules")
          .locator(".."),
        rules.getByRole("heading").last()
      );
      await page.screenshot({
        path: testInfo.outputPath("settings-scrolled.png"),
      });
      await page
        .getByRole(app ? "button" : "tab", { name: "Votes", exact: true })
        .click();
      await page.getByRole("tab", { name: "Activity", exact: true }).click();
      await expect(
        page.getByRole("tab", { name: "Activity", exact: true })
      ).toHaveAttribute("aria-selected", "true");
      await expectCompetitionScroll(
        page,
        page
          .getByRole("main")
          .locator("#competition-alpha-votes")
          .locator(".."),
        page.getByRole("link", { name: "scroll-voter-29", exact: true })
      );
      await expectNoHorizontalOverflow(page);
      await page.screenshot({
        path: testInfo.outputPath("activity-scrolled.png"),
      });
    });
  }
  for (const app of [false, true]) {
    test(`closes mobile ${app ? "app" : "web"} information back onto the selected Votes view`, async ({
      page,
    }, testInfo) => {
      // Desktop uses the sidebar; this scenario covers the mobile information modal.
      test.skip(
        testInfo.project.name !== "web-mobile-chromium",
        "The information overlay is specific to mobile web and app layouts."
      );
      await installCompetitionApi(page);
      if (app)
        await installSurfaceSimulation(
          page.context(),
          "capacitor-ios-sim",
          testInfo.project.use.baseURL
        );
      const destination = `${ROOT}/beta?tab=votes&voteTab=activity`;
      await page.goto(destination);
      const activity = page.getByRole("tab", { name: "Activity", exact: true });
      await expect(activity).toHaveAttribute("aria-selected", "true", {
        timeout: 30000,
      });
      const opener = page.getByRole("button", {
        name: /^About Local Composer Sandbox Wave/,
      });
      await opener.click();
      const dialog = page
        .getByRole("dialog")
        .filter({ has: page.getByRole("tab", { name: "About", exact: true }) });
      await expect(dialog).toHaveAttribute("aria-modal", "true");
      await expect(dialog).toHaveAccessibleName(
        /^About Local Composer Sandbox Wave/
      );
      await expect(
        dialog.getByRole("tab", { name: "About", exact: true })
      ).toBeVisible();
      await expect(page).toHaveURL(destination);
      await dialog
        .getByRole("tab", { name: "Configuration", exact: true })
        .click();
      await expect(
        dialog.getByRole("heading", { name: "Chat", exact: true })
      ).toBeVisible();
      await page.screenshot({
        path: testInfo.outputPath("wave-information-mobile.png"),
        fullPage: true,
      });
      await page.goBack();
      await expect(dialog).toHaveCount(0);
      await expect(page).toHaveURL(destination);
      await expect(activity).toHaveAttribute("aria-selected", "true");
      await expect(opener).toBeFocused();
      await opener.click();
      await dialog.getByRole("button", { name: "Close", exact: true }).click();
      await expect(dialog).toHaveCount(0);
      await expect(page).toHaveURL(destination);
      await opener.click();
      await page.keyboard.press("Escape");
      await expect(dialog).toHaveCount(0);
      await expect(opener).toBeFocused();
      await expect(activity).toHaveAttribute("aria-selected", "true");
      await opener.click();
      await dialog
        .getByRole("link", {
          name: "Local Composer Sandbox Wave",
          exact: true,
        })
        .click();
      await expect(page).toHaveURL(new RegExp(`/waves/${WAVE}$`));
      await page.goBack();
      await expect(page).toHaveURL(destination);
      await expect(dialog).toHaveCount(0);
      await expect(activity).toHaveAttribute("aria-selected", "true");
      await page.goForward();
      await expect(page).toHaveURL(new RegExp(`/waves/${WAVE}$`));
      await page.goBack();
      await expect(page).toHaveURL(destination);
      await expect(dialog).toHaveCount(0);
      await expectNoHorizontalOverflow(page);
    });
  }
  test("isolates parallel votes and content and preserves back, forward and shared chat", async ({
    page,
  }, testInfo) => {
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    const sandbox = await installCompetitionApi(page);
    await page.goto(ROOT);
    await dismissNextDevTools(page);
    await expect(
      page.getByRole("tab", { name: /^Competitions(?:\s+\d+\+?)?$/ })
    ).toBeVisible({ timeout: 30000 });
    await page.getByRole("link", { name: /Parallel Alpha/ }).click();
    await expect(
      page.getByText("Immutable alpha entry content", { exact: true })
    ).toBeVisible({ timeout: 30000 });
    await expect(
      page.getByRole("tab", { name: "Leaderboard", exact: true })
    ).toHaveAttribute("aria-selected", "true");
    await waveTabStrip(page)
      .getByRole("tab", { name: "Votes", exact: true })
      .click();
    const voteInput = page.getByRole("spinbutton", { name: "Your vote" });
    await expect(
      page.getByRole("button", {
        name: "Use an existing drop",
        exact: true,
        includeHidden: true,
      })
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", {
        name: "End",
        exact: true,
        includeHidden: true,
      })
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", {
        name: "Cancel competition",
        exact: true,
        includeHidden: true,
      })
    ).toHaveCount(0);
    await voteInput.fill("");
    await expect(voteInput).toHaveAttribute("aria-invalid", "true");
    await expect(voteInput).toHaveAccessibleDescription(
      /Enter a whole number between/
    );
    await voteInput.fill("25");
    await expect(voteInput).toHaveAttribute("aria-invalid", "false");
    await page.getByRole("button", { name: "Save vote", exact: true }).click();
    await expect(voteInput).toHaveValue("25");
    await expect(
      page.getByRole("button", { name: "Save vote", exact: true })
    ).toBeDisabled();
    expect(sandbox.requests).toHaveLength(1);
    expect(sandbox.requests[0]?.path).toContain(
      "/alpha/entries/entry-alpha/votes/me"
    );
    expect(sandbox.requests[0]?.body).toMatchObject({
      config_version: 1,
      value: 25,
    });
    await page
      .getByRole("tab", { name: /^Competitions(?:\s+\d+\+?)?$/ })
      .click();
    await page.getByRole("link", { name: /Parallel Beta/ }).click();
    await expect(
      page.getByRole("tab", { name: "Entries", exact: true })
    ).toHaveCount(0);
    await expect(
      waveTabStrip(page).getByRole("tab", {
        name: "Leaderboard",
        exact: true,
      })
    ).toHaveAttribute("aria-selected", "true");
    await expect(
      page.getByRole("heading", {
        name: /Local Composer Sandbox Wave/,
        level: 1,
      })
    ).toBeVisible({ timeout: 30000 });
    const backLink = waveTabStrip(page).getByRole("tab", {
      name: /^Competitions(?:\s+\d+\+?)?$/,
    });
    await backLink.scrollIntoViewIfNeeded();
    await expect(
      page.getByRole("button", { name: "Enter Beta", exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Drop", exact: true })
    ).toHaveCount(0);
    const topNavigation = await backLink.evaluate((element) => {
      const box = element.getBoundingClientRect();
      return {
        x: box.x,
        y: box.y,
        height: box.height,
        unobscured:
          document
            .elementFromPoint(box.x + box.width / 2, box.y + 4)
            ?.closest("button") === element,
      };
    });
    expect(topNavigation.unobscured).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath("native-competition-initial.png"),
      fullPage: true,
    });
    await writeFile(
      testInfo.outputPath("top-navigation.json"),
      JSON.stringify(topNavigation, null, 2)
    );
    await waveTabStrip(page)
      .getByRole("tab", { name: "Votes", exact: true })
      .click();
    await expect(
      page.getByRole("spinbutton", { name: "Your vote" })
    ).toHaveValue("0");
    await expect(
      page.getByText("Immutable alpha entry content", { exact: true })
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: /Withdraw entry|Disqualify entry/ })
    ).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
    await page.screenshot({
      path: testInfo.outputPath("native-competition.png"),
      fullPage: true,
    });
    await expect(page).toHaveURL(/beta\?tab=votes$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/beta$/);
    await expect(
      waveTabStrip(page).getByRole("tab", {
        name: "Leaderboard",
        exact: true,
      })
    ).toHaveAttribute("aria-selected", "true");
    await expect(
      page.getByRole("spinbutton", { name: "Your vote" })
    ).toHaveCount(0);
    await page.goForward();
    await expect(page).toHaveURL(/beta\?tab=votes$/);
    await expect(
      waveTabStrip(page).getByRole("tab", {
        name: "Votes",
        exact: true,
      })
    ).toHaveAttribute("aria-selected", "true");
    await expect(
      page.getByRole("spinbutton", { name: "Your vote" })
    ).toHaveValue("0");
    await page.getByRole("tab", { name: "Chat", exact: true }).click();
    await expect(page).toHaveURL(
      new RegExp(`/waves/${WAVE}\\?tab=chat&competition=beta$`),
      {
        timeout: 30000,
      }
    );
    await expect(
      page.getByRole("link", { name: "Add competition", exact: true })
    ).toHaveCount(0);
    const competitionsTab = page.getByRole("tab", {
      name: /^Competitions(?:\s+\d+\+?)?$/,
    });
    await competitionsTab.click();
    await expect(competitionsTab).toHaveAttribute("aria-selected", "true");
    await expect(
      page.getByRole("link", { name: /Parallel Alpha/ })
    ).toBeVisible();
    await page.getByRole("tab", { name: "Chat", exact: true }).click();
    await page.goBack();
    await expect(
      page.getByRole("heading", {
        name: /Local Composer Sandbox Wave/,
        level: 1,
      })
    ).toBeVisible({ timeout: 30000 });
    await writeFile(
      testInfo.outputPath("console-errors.json"),
      JSON.stringify(consoleErrors, null, 2)
    );
    expect(
      consoleErrors.filter((error) =>
        /hydration|hydrated|cannot be a (?:child|descendant)/i.test(error)
      )
    ).toEqual([]);
  });

  test("saves and resumes a native draft through the existing configuration controls", async ({
    page,
  }) => {
    const sandbox = await installCompetitionApi(page);
    await page.goto(ROOT);
    await page
      .getByRole("link", { name: "Add competition", exact: true })
      .click();
    await expect(
      page.getByLabel("Competition name", { exact: true })
    ).toBeVisible({ timeout: 30000 });
    await page
      .getByLabel("Competition name", { exact: true })
      .fill("Native draft");
    await expect(
      page.getByRole("button", { name: "Save changes", exact: true })
    ).toHaveCount(0);
    await expect.poll(() => sandbox.requests.length).toBe(1);
    await page.reload();
    await expect(
      page.getByLabel("Competition name", { exact: true })
    ).toHaveValue("Native draft");
    expect(sandbox.requests[0]?.path).toBe(
      `/api/v3/waves/${WAVE}/competitions`
    );
    expect(sandbox.requests[0]?.body).toMatchObject({
      config: { title: "Native draft", rules: { type: "RANK" } },
    });
    await page
      .getByRole("button", { name: "Close editor", exact: true })
      .click();
    await expect(page).toHaveURL(ROOT);
    await page.getByRole("tab", { name: "Drafts", exact: true }).click();
    await page
      .getByRole("link")
      .filter({
        has: page.getByRole("heading", { name: "Native draft", exact: true }),
      })
      .click();
    await expect(
      page.getByLabel("Competition name", { exact: true })
    ).toHaveValue("Native draft");
    await expect(competitionContent(page)).toBeVisible();
    await expect(
      waveTabStrip(page).getByRole("tab", { name: "Leaderboard", exact: true })
    ).toBeVisible();
    await expect(
      competitionContent(page).getByRole("tab", {
        name: "Leaderboard",
        exact: true,
      })
    ).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
  });

  test("uses About-style pills for app competition sub-navigation", async ({
    page,
  }, testInfo) => {
    const app = testInfo.project.name === "web-mobile-chromium";
    const sandbox = await installCompetitionApi(page);
    if (app)
      await installSurfaceSimulation(
        page.context(),
        "capacitor-ios-sim",
        testInfo.project.use.baseURL
      );
    await page.goto(ROOT);
    const collection = page.getByRole("region", {
      name: "Competitions",
      exact: true,
    });
    const active = collection.getByRole("tab", {
      name: "Active and upcoming",
      exact: true,
    });
    const collectionMore = collection.getByRole("button", {
      name: "More tabs",
      exact: true,
    });
    await expect(active).toHaveAttribute("aria-selected", "true");
    await expect(active).toHaveAttribute(
      "aria-controls",
      `competition-collection-${WAVE}-active`
    );
    if (app) {
      await expect(active).toHaveCSS("height", "32px");
      await expect(active).toHaveCSS("border-radius", "9999px");
      const viewport = page.viewportSize();
      await page.setViewportSize({ width: 320, height: 780 });
      await expect(collectionMore).toBeInViewport({ ratio: 1 });
      if (viewport) await page.setViewportSize(viewport);
      await collectionMore.tap();
      await page.keyboard.press("Escape");
      await expect(collectionMore).toBeFocused();
      await expect(active).toHaveAttribute("aria-selected", "true");
      await collectionMore.press("Enter");
      await page.getByRole("menuitem", { name: "Drafts", exact: true }).tap();
      await expect(collectionMore).toHaveText("Drafts");
      await expect(collectionMore).toHaveAttribute("aria-expanded", "false");
    } else {
      await expect(collectionMore).toHaveCount(0);
      await collection
        .getByRole("tab", { name: "Drafts", exact: true })
        .click();
    }
    await expect(
      collection.getByRole("tabpanel", { name: "Drafts", exact: true })
    ).toBeVisible();
    await active.click();
    await page.screenshot({
      path: testInfo.outputPath("competition-collection-tabs.png"),
      animations: "disabled",
      style: "nextjs-portal { visibility: hidden; }",
    });
    await expect(
      collection.getByRole("link", { name: "Add competition", exact: true })
    ).toBeInViewport({ ratio: 1 });
    await expectNoHorizontalOverflow(page);

    // Published competitions share the primary row; Votes owns its secondary tabs.
    await page.goto(`${ROOT}/beta?tab=votes`);
    const mine = page.getByRole("tab", {
      name: "My Votes",
      exact: true,
    });
    const allVotes = page.getByRole("tab", { name: "All votes", exact: true });
    await expect(mine).toHaveAttribute("aria-selected", "true");
    await expect(mine).toHaveAttribute(
      "aria-controls",
      "competition-beta-votes-mine"
    );
    if (app) {
      await expect(mine).toHaveCSS("border-radius", "9999px");
      await expect(mine).toHaveCSS("height", "32px");
    } else {
      await expect(mine).toHaveCSS("border-bottom-width", "2px");
    }
    await allVotes.click();
    await expect(page).toHaveURL(`${ROOT}/beta?tab=votes&voteTab=all`);
    await expect(
      page.getByRole("tabpanel", { name: "All votes", exact: true })
    ).toBeVisible();
    await page.reload();
    await expect(allVotes).toHaveAttribute("aria-selected", "true");
    await page.goBack();
    await expect(page).toHaveURL(ROOT);
    await expect(active).toHaveAttribute("aria-selected", "true");
    await page.goForward();
    await expect(allVotes).toHaveAttribute("aria-selected", "true");
    await expect(
      page.getByRole("tabpanel", { name: "All votes", exact: true })
    ).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath("competition-vote-pills.png"),
      animations: "disabled",
      style: "nextjs-portal { visibility: hidden; }",
    });
    await expectNoHorizontalOverflow(page);
    expect(sandbox.requests).toHaveLength(0);
  });

  test("aligns Waves collection filters with the search control", async ({
    page,
  }, testInfo) => {
    const app = testInfo.project.name === "web-mobile-chromium";
    const sandbox = await installCompetitionApi(page);
    if (app)
      await installSurfaceSimulation(
        page.context(),
        "capacitor-ios-sim",
        testInfo.project.use.baseURL
      );
    await page.goto("/waves");
    const filters = page
      .getByRole("group", { name: "Wave list filter", exact: true })
      .filter({ visible: true });
    const search = page
      .getByRole("button", { name: "Find a wave…", exact: true })
      .filter({ visible: true });
    const searchSurface = page
      .getByRole("button", { name: "Find a wave…", exact: true })
      .filter({ visible: true })
      .locator("span");
    await expect(filters).toHaveCSS("height", app ? "40px" : "36px");
    await expect(searchSurface).toHaveCSS("height", app ? "40px" : "36px");
    await expect
      .poll(async () => {
        const filterBox = await filters.boundingBox();
        const searchBox = await searchSurface.boundingBox();
        return filterBox && searchBox
          ? Math.abs(filterBox.y - searchBox.y)
          : Number.POSITIVE_INFINITY;
      })
      .toBeLessThanOrEqual(1);
    if (app) await expect(search).toHaveCSS("height", "44px");
    for (const name of ["Pinned", "Joined", "All"]) {
      const filter = filters.getByRole("button", { name, exact: true });
      await filter.click();
      await expect(filter).toHaveAttribute("aria-pressed", "true");
    }
    await search.click();
    const input = page.getByRole("searchbox", { name: "Find a wave…" });
    await expect(input).toBeFocused();
    await input.press("Escape");
    await expect(search).toBeFocused();
    await expect(filters).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await page.screenshot({
      path: testInfo.outputPath("wave-filter-search-alignment.png"),
      animations: "disabled",
      style: "nextjs-portal { visibility: hidden; }",
    });
    expect(sandbox.requests).toHaveLength(0);
  });

  test("keeps the draft editor footer flush with its scroll container", async ({
    page,
  }, testInfo) => {
    const sandbox = await installCompetitionApi(page);
    await page.goto(`${ROOT}/new`);
    const name = page.getByLabel("Competition name", { exact: true });
    await expect(name).toBeVisible({ timeout: 30000 });
    const footer = page
      .getByRole("button", { name: "Close editor", exact: true })
      .locator("..");

    for (const draft of ["new", "reopened"]) {
      if (draft === "reopened") {
        await name.fill("Footer layout draft");
        await expect.poll(() => sandbox.requests.length).toBe(1);
        await page.goto(`${ROOT}/draft`);
        await expect(name).toHaveValue("Footer layout draft");
      }
      for (const progress of [0, 0.5, 1]) {
        await expect
          .poll(() =>
            footer.evaluate((element, fraction) => {
              let container = element.parentElement;
              while (
                container &&
                !/(auto|scroll)/.test(getComputedStyle(container).overflowY)
              ) {
                container = container.parentElement;
              }
              if (!container) throw new Error("Draft scroll container missing");
              container.scrollTop =
                fraction * (container.scrollHeight - container.clientHeight);
              return Math.abs(
                container.getBoundingClientRect().bottom -
                  element.getBoundingClientRect().bottom
              );
            }, progress)
          )
          .toBeLessThanOrEqual(1);
        await expect(
          footer.getByRole("button", { name: "Next", exact: true })
        ).toBeInViewport({ ratio: 1 });
        if (progress === 0.5) {
          await page.screenshot({
            path: testInfo.outputPath(`${draft}-draft-footer.png`),
          });
        }
      }
      await expect
        .poll(() =>
          footer.evaluate((element) => {
            const fields = element
              .closest("section")
              ?.querySelector("fieldset");
            if (!fields) throw new Error("Draft fields missing");
            return (
              fields.getBoundingClientRect().bottom -
              element.getBoundingClientRect().top
            );
          })
        )
        .toBeLessThanOrEqual(0);
      await expectNoHorizontalOverflow(page);
    }
  });

  test("keeps competition fields above the app keyboard and restores the footer", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "web-mobile-chromium",
      "App keyboard layout"
    );
    const sandbox = await installCompetitionApi(page);
    await installSurfaceSimulation(
      page.context(),
      "capacitor-ios-sim",
      testInfo.project.use.baseURL
    );
    await page.goto(`${ROOT}/new`);
    const name = page.getByLabel("Competition name", { exact: true });
    const footer = page
      .getByRole("button", { name: "Close editor", exact: true })
      .locator("..");

    for (const draft of ["new", "reopened"]) {
      if (draft === "reopened") {
        await name.fill("Keyboard layout draft");
        await expect.poll(() => sandbox.requests.length).toBe(1);
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto(`${ROOT}/draft`);
        await expect(name).toHaveValue("Keyboard layout draft");
      }
      await expect(name).toBeVisible({ timeout: 30000 });
      const restingBottom = await footer.evaluate(
        (element) => element.getBoundingClientRect().bottom
      );
      for (const label of ["Competition name", "Description"]) {
        const field = page.getByLabel(label, { exact: true });
        expect(
          await field.evaluate((element) =>
            Number.parseFloat(getComputedStyle(element).fontSize)
          )
        ).toBeGreaterThanOrEqual(16);
        await field.tap();
        for (const keyboardHeight of draft === "new"
          ? [320, 400]
          : [260, 320]) {
          await page.evaluate((height) => {
            const viewport = globalThis.visualViewport;
            if (!viewport) throw new Error("Visual viewport missing");
            Object.defineProperty(viewport, "height", {
              configurable: true,
              value: globalThis.innerHeight - height,
            });
            viewport.dispatchEvent(new Event("resize"));
          }, keyboardHeight);
          await expect(page.locator("html")).toHaveAttribute(
            "data-native-keyboard-visible",
            "true"
          );
          await expect(field).toBeFocused();
          await expect
            .poll(() =>
              field.evaluate((element) => {
                let container = element.parentElement;
                while (
                  container &&
                  !/(auto|scroll)/.test(getComputedStyle(container).overflowY)
                ) {
                  container = container.parentElement;
                }
                if (!container)
                  throw new Error("Draft scroll container missing");
                const bounds = element.getBoundingClientRect();
                return {
                  aboveKeyboard:
                    bounds.bottom <=
                    (globalThis.visualViewport?.height ?? 0) - 8,
                  belowHeader:
                    bounds.top >= container.getBoundingClientRect().top + 8,
                };
              })
            )
            .toEqual({ aboveKeyboard: true, belowHeader: true });
        }
        await expect
          .poll(
            async () => {
              const fieldBox = await field.boundingBox();
              const footerBox = await footer.boundingBox();
              return fieldBox && footerBox
                ? fieldBox.y + fieldBox.height - footerBox.y
                : Number.POSITIVE_INFINITY;
            },
            { message: `${draft} ${label} must not be covered by the footer` }
          )
          .toBeLessThanOrEqual(-8);
      }
      await page.screenshot({
        path: testInfo.outputPath(`${draft}-description-keyboard.png`),
        animations: "disabled",
        style: "nextjs-portal { visibility: hidden; }",
      });
      await name.evaluate(() => {
        if (document.activeElement instanceof HTMLElement)
          document.activeElement.blur();
        const viewport = globalThis.visualViewport;
        if (!viewport) throw new Error("Visual viewport missing");
        Reflect.deleteProperty(viewport, "height");
        viewport.dispatchEvent(new Event("resize"));
      });
      await expect(page.locator("html")).not.toHaveAttribute(
        "data-native-keyboard-visible",
        "true"
      );
      await expect
        .poll(() =>
          footer.evaluate((element) => element.getBoundingClientRect().bottom)
        )
        .toBeCloseTo(restingBottom, 0);
      await expectNoHorizontalOverflow(page);
    }
  });

  test("uses the shared competition type dropdown and app bottom sheet", async ({
    page,
  }, testInfo) => {
    const app = testInfo.project.name === "web-mobile-chromium";
    await installCompetitionApi(page);
    if (app) {
      await installSurfaceSimulation(
        page.context(),
        "capacitor-ios-sim",
        testInfo.project.use.baseURL
      );
    }
    await page.goto(`${ROOT}/new`);
    const trigger = page.getByRole("combobox", {
      name: "Competition type",
      exact: true,
      includeHidden: true,
    });
    await expect(trigger).toHaveText("Rank");
    await expect(trigger).toHaveAttribute(
      "aria-haspopup",
      app ? "dialog" : "listbox"
    );
    await expect
      .poll(() =>
        trigger.evaluate((element) => {
          const icon = element.querySelector("svg");
          if (!icon) throw new Error("Dropdown chevron missing");
          return (
            element.getBoundingClientRect().right -
            icon.getBoundingClientRect().right
          );
        })
      )
      .toBeGreaterThanOrEqual(8);

    if (app) await trigger.tap();
    else await trigger.press("ArrowDown");
    const choices = page.getByRole("listbox", {
      name: "Competition type",
      exact: true,
    });
    await expect(choices).toBeVisible();
    await expect(
      choices.getByRole("option", { name: "Rank", exact: true })
    ).toHaveAttribute("aria-selected", "true");
    if (app) {
      const sheet = page.getByRole("dialog", {
        name: "Competition type",
        exact: true,
      });
      await expect(sheet).toHaveAttribute("aria-modal", "true");
      await expect(sheet).toHaveAttribute(
        "id",
        (await trigger.getAttribute("aria-controls"))!
      );
      const sheetPanel = page
        .getByRole("dialog", { name: "Competition type", exact: true })
        .locator(".mobile-wrapper-dialog");
      await expect(sheetPanel).toBeVisible();
      await expect
        .poll(() =>
          sheetPanel.evaluate((element) =>
            Math.abs(innerHeight - element.getBoundingClientRect().bottom)
          )
        )
        .toBeLessThanOrEqual(1);
    } else {
      await expect(choices).toHaveAttribute(
        "id",
        (await trigger.getAttribute("aria-controls"))!
      );
      await expect(
        page.getByRole("dialog", { name: "Competition type", exact: true })
      ).toHaveCount(0);
      await expect(
        choices.getByRole("option", { name: "Rank", exact: true })
      ).toBeFocused();
    }
    await page.screenshot({
      path: testInfo.outputPath("competition-type-open.png"),
      animations: "disabled",
      style: "nextjs-portal { visibility: hidden; }",
    });
    if (app)
      await choices.getByRole("option", { name: "Approve", exact: true }).tap();
    else {
      await page.keyboard.press("ArrowDown");
      await expect(
        choices.getByRole("option", { name: "Approve", exact: true })
      ).toBeFocused();
      await page.keyboard.press("Enter");
    }
    await expect(trigger).toHaveText("Approve");
    await expect(choices).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(page.getByText("Ranking mode", { exact: true })).toHaveCount(
      0
    );
    await trigger.click();
    await expect(
      choices.getByRole("option", { name: "Approve", exact: true })
    ).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("Escape");
    await expect(choices).toBeHidden();
    await expect(trigger).toHaveText("Approve");
    await expect(trigger).toBeFocused();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await trigger.click();
    await choices.getByRole("option", { name: "Rank", exact: true }).click();
    await expect(trigger).toHaveText("Rank");
    await expect(choices).toBeHidden();
    await expectNoHorizontalOverflow(page);
  });

  test("protects an unfinished draft when browser storage is unavailable", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const setItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key: string, value: string) {
        if (key.startsWith("competition-editor:"))
          throw new DOMException("Storage unavailable", "QuotaExceededError");
        return setItem.call(this, key, value);
      };
    });
    const sandbox = await installCompetitionApi(page);
    await page.goto(ROOT);
    await page
      .getByRole("link", { name: "Add competition", exact: true })
      .click();
    await page
      .getByRole("combobox", { name: "Competition type", exact: true })
      .click();
    await page.getByRole("option", { name: "Approve", exact: true }).click();
    await page
      .getByLabel("Competition name", { exact: true })
      .fill("Unsaved approve draft");
    const dialogPromise = page.waitForEvent("dialog");
    const reload = page.evaluate(() => {
      globalThis.location.reload();
    });
    const dialog = await dialogPromise;
    expect(dialog.type()).toBe("beforeunload");
    await dialog.dismiss();
    await reload;
    await expect(
      page.getByLabel("Competition name", { exact: true })
    ).toHaveValue("Unsaved approve draft");
    expect(sandbox.requests).toHaveLength(0);
  });

  test("creates one native identity entry with dedicated immutable drop content", async ({
    page,
  }) => {
    const sandbox = await installCompetitionApi(page, true);
    await page.goto(`${ROOT}/alpha`);
    await expectSubmissionActionsGrouped(page);
    await expectNoHorizontalOverflow(page);
    const initialViewport = page.viewportSize();
    await page.setViewportSize({ width: 653, height: 897 });
    await expectSubmissionActionsGrouped(page, true);
    await expectNoHorizontalOverflow(page);
    await page.setViewportSize({ width: 442, height: 897 });
    await expectBalancedSubmissionRows(page);
    await expectNoHorizontalOverflow(page);
    await page.setViewportSize({ width: 320, height: 780 });
    await expectBalancedSubmissionRows(page);
    await expectNoHorizontalOverflow(page);
    if (initialViewport) await page.setViewportSize(initialViewport);
    await page.getByRole("button", { name: "Drop", exact: true }).click();
    const composer = page.getByRole("region", {
      name: "Submit an entry",
      exact: true,
    });
    await composer
      .getByLabel("Entry title", { exact: true })
      .fill("New native entry");
    await expect(
      composer.getByText("Nominating yourself: playwright", { exact: true })
    ).toBeVisible();
    const editor = composer.getByRole("textbox", {
      name: "Describe your wave",
      exact: true,
    });
    await editor.fill("Entry body in shared chat");
    const terms = composer.getByRole("checkbox", {
      name: "I agree to this competition’s terms.",
      exact: true,
    });
    await expect(terms).toHaveAccessibleDescription(
      "Keep submissions original and follow this competition’s rules."
    );
    await terms.check();
    await composer
      .getByRole("button", { name: "Submit an entry", exact: true })
      .click();
    await expect(page).toHaveURL(/\?entry=entry-alpha$/, { timeout: 30000 });
    await expect(
      page.getByRole("status").filter({ hasText: "Your entry is in" })
    ).toBeVisible();
    await page
      .getByRole("button", { name: "My submissions", exact: true })
      .click();
    const ownEntries = page.getByRole("dialog", {
      name: "My submissions",
      exact: true,
    });
    await expect(
      ownEntries.getByText("Recorded alpha entry", { exact: true })
    ).toBeVisible();
    await expect(
      ownEntries.getByText("Recorded beta entry", { exact: true })
    ).toHaveCount(0);
    await ownEntries
      .getByRole("button", { name: "Close my submissions" })
      .click();
    await expect(ownEntries).toHaveCount(0);
    const mySubmissions = page.getByRole("button", {
      name: "My submissions",
      exact: true,
    });
    await expect(mySubmissions).toBeFocused();
    await expect(page).toHaveURL(/\?entry=entry-alpha$/);
    await mySubmissions.click();
    await page.keyboard.press("Escape");
    await expect(ownEntries).toHaveCount(0);
    await expect(mySubmissions).toBeFocused();
    await mySubmissions.click();
    await ownEntries.getByText("Recorded alpha entry", { exact: true }).click();
    await expect(ownEntries).toHaveCount(0);
    await expect(page).toHaveURL(
      new RegExp(`entry=entry-alpha&drop=${entryDropId("alpha")}`)
    );
    await expectNoHorizontalOverflow(page);
    expect(sandbox.requests).toHaveLength(1);
    expect(sandbox.requests[0]?.path).toContain("/alpha/entries");
    expect(sandbox.requests[0]?.body).toMatchObject({
      config_version: 1,
      drop: {
        wave_id: WAVE,
        drop_type: "PARTICIPATORY",
        title: "New native entry",
        signature: null,
        metadata: [
          {
            data_key: "identity",
            data_value: "0x0000000000000000000000000000000000000529",
          },
        ],
        parts: [{ content: "Entry body in shared chat" }],
      },
    });
  });

  test("opens personal entry actions through explicit competition navigation", async ({
    page,
    isMobile,
  }) => {
    const sandbox = await installCompetitionApi(page);
    await page.goto(`${ROOT}/alpha?tab=leaderboard&default=1`);
    await expect(page).toHaveURL(/tab=leaderboard&default=1$/);
    await page
      .getByRole("button", { name: "My submissions", exact: true })
      .click();
    const ownEntries = page.getByRole("dialog", {
      name: "My submissions",
      exact: true,
    });
    const entry = page
      .getByRole("dialog", { name: "My submissions", exact: true })
      .locator('[data-competition-entry="entry-alpha"]');
    const title = entry.getByText("Recorded alpha entry", { exact: true });
    await expect(title).toBeVisible();
    if (isMobile) {
      const touchTarget = await title.elementHandle();
      if (!touchTarget) throw new Error("Personal entry title was not mounted");
      await touchTarget.evaluate((element) => {
        const box = element.getBoundingClientRect();
        const touch = new Touch({
          identifier: 1,
          target: element,
          clientX: box.x + box.width / 2,
          clientY: box.y + box.height / 2,
        });
        element.dispatchEvent(
          new TouchEvent("touchstart", {
            bubbles: true,
            cancelable: true,
            touches: [touch],
            changedTouches: [touch],
          })
        );
      });
      await expect(
        page.getByRole("button", { name: "Open drop", exact: true })
      ).toBeVisible();
      await touchTarget.evaluate((element) => {
        const box = element.getBoundingClientRect();
        const touch = new Touch({
          identifier: 1,
          target: element,
          clientX: box.x + box.width / 2,
          clientY: box.y + box.height / 2,
        });
        element.dispatchEvent(
          new TouchEvent("touchend", {
            bubbles: true,
            touches: [],
            changedTouches: [touch],
          })
        );
      });
      await page
        .getByRole("button", { name: "Open drop", exact: true })
        .click();
    } else {
      await entry
        .getByRole("button", { name: "Open drop", exact: true })
        .click();
    }
    await expect(ownEntries).toHaveCount(0);
    await expect(page).toHaveURL(
      `${ROOT}/alpha?tab=leaderboard&drop=${entryDropId("alpha")}`
    );
    expect(sandbox.requests).toHaveLength(0);
  });

  test("recovers a failed first legacy leaderboard load without changing its view", async ({
    page,
  }) => {
    const sandbox = await installCompetitionApi(page);
    sandbox.onlyCompetition("alpha");
    await sandbox.legacyPrimary("alpha");
    let failLeaderboard = true;
    await page.route(`**/v2/waves/${WAVE}/leaderboard*`, async (route) => {
      if (!failLeaderboard) return route.fallback();
      return route.fulfill({
        status: 503,
        json: { message: "Temporary leaderboard failure" },
      });
    });
    await page.goto(`${ROOT}/alpha`);
    const error = page
      .getByRole("alert")
      .filter({ hasText: "Couldn’t load submissions." });
    await expect(error).toBeVisible({ timeout: 30000 });
    await expect(
      page.getByRole("button", { name: "My submissions", exact: true })
    ).toBeVisible();
    await expectSubmissionActionsGrouped(page);
    failLeaderboard = false;
    await error.getByRole("button", { name: "Retry", exact: true }).click();
    await expect(error).toHaveCount(0);
    await expect(
      page.getByRole("tab", { name: "List view", exact: true })
    ).toHaveAttribute("aria-selected", "true");
    await expectNoHorizontalOverflow(page);
    expect(sandbox.requests).toHaveLength(0);
  });

  test("creates a chat-only hub with no implicit competition", async ({
    page,
  }) => {
    const sandbox = await installCompetitionApi(page);
    await page.goto("/waves/create");
    await expect(page.getByText(/Configure the first competition/)).toHaveCount(
      0
    );
    await expect(page.getByRole("radio", { name: "Chat only" })).toHaveCount(0);
    await page.getByLabel(/Wave Name/).fill("Native shared hub");
    await page
      .getByRole("textbox", { name: "First post", exact: true })
      .fill("A shared chat with independently configured competitions.");
    await page
      .getByRole("button", { name: "Review wave", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Confirm and create", exact: true })
      .click();
    await expect(page).toHaveURL(new RegExp(`/waves/${WAVE}$`), {
      timeout: 30000,
    });
    await expect(
      page.getByText("Your wave is ready", { exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Copy wave link", exact: true })
    ).toBeVisible();
    expect(sandbox.requests).toHaveLength(1);
    expect(sandbox.requests[0]?.path).toBe("/api/v3/waves");
    expect(sandbox.requests[0]?.body).toMatchObject({
      name: "Native shared hub",
      chat: { enabled: true },
    });
    expect(sandbox.requests[0]?.body).not.toHaveProperty("participation");
    expect(sandbox.requests[0]?.body).not.toHaveProperty("voting");
  });

  for (const mode of [
    "native-multi",
    "native-single",
    "legacy-single",
    "native-app",
  ] as const) {
    test(`keeps rendered Chat after delayed default resolution (${mode})`, async ({
      page,
    }, testInfo) => {
      // The native mobile shell has no desktop variant; web entry is covered above.
      test.skip(
        mode === "native-app" &&
          testInfo.project.name !== "web-mobile-chromium",
        "Native app simulation uses the mobile viewport."
      );
      const sandbox = await installCompetitionApi(page, false, false);
      if (mode.endsWith("single")) sandbox.onlyCompetition("alpha");
      if (mode === "legacy-single") await sandbox.legacyPrimary("alpha");
      if (mode === "native-app")
        await installSurfaceSimulation(
          page.context(),
          "capacitor-ios-sim",
          testInfo.project.use.baseURL
        );
      const { releaseDefault, waitForDefaultResponse } =
        await deferDefaultCompetition(page);
      const selectionResponse = waitForDefaultResponse();
      try {
        await page.goto(`/waves/${WAVE}`);
        const chatContent = page
          .getByText("6529-composer-preview", { exact: false })
          .first();
        const chatTab = page.getByRole(
          mode === "native-app" ? "button" : "tab",
          {
            name: "Chat",
            exact: true,
          }
        );
        await expect(chatContent).toBeVisible({ timeout: 30000 });
        await expect(chatTab).toHaveAttribute(
          mode === "native-app" ? "aria-current" : "aria-selected",
          "true"
        );
        releaseDefault();
        await (await selectionResponse).finished();
        if (mode.endsWith("single"))
          await expect(
            page.getByRole(mode === "native-app" ? "button" : "tab", {
              name: /^Competitions(?:\s+\d+\+?)?$/,
            })
          ).toHaveCount(0);
        const leaderboard = page.getByRole(
          mode === "native-app" ? "button" : "tab",
          { name: "Leaderboard", exact: true }
        );
        await expect(leaderboard).toBeVisible({ timeout: 30000 });
        await expect(chatContent).toBeVisible();
        await expect(chatTab).toHaveAttribute(
          mode === "native-app" ? "aria-current" : "aria-selected",
          "true"
        );
        await expect(page).toHaveURL(new RegExp(`/waves/${WAVE}$`));
        await expect(
          page.getByText("Immutable alpha entry content", { exact: true })
        ).toHaveCount(0);
        await leaderboard.click();
        await expect(page).toHaveURL(/competitions\/alpha\?tab=leaderboard$/);
        if (mode === "legacy-single")
          await expectLegacySectionContent(page, "leaderboard");
        else
          await expect(
            page.getByText("Immutable alpha entry content", { exact: true })
          ).toBeVisible();
        await page.goBack();
        await expect(chatContent).toBeVisible({ timeout: 30000 });
        await expect(page).toHaveURL(new RegExp(`/waves/${WAVE}$`));
        await page.goForward();
        await expect(page).toHaveURL(/competitions\/alpha\?tab=leaderboard$/);
      } finally {
        releaseDefault();
      }
    });
  }

  for (const mode of ["native", "legacy", "app"] as const) {
    test(`remembers independent wave tabs on an ordinary round trip (${mode})`, async ({
      page,
    }, testInfo) => {
      // The app simulation is mobile-only; desktop web is covered by native and legacy cases.
      test.skip(
        mode === "app" && testInfo.project.name !== "web-mobile-chromium",
        "The shared app layout uses the mobile viewport."
      );
      if (mode === "app")
        await installSurfaceSimulation(
          page.context(),
          "capacitor-ios-sim",
          testInfo.project.use.baseURL
        );
      const BAR = "00000000-0000-4000-8000-000000000536";
      const mainStage = await installCompetitionApi(page, false, false, WAVE);
      if (mode !== "native") await mainStage.legacyPrimary("alpha");
      await page.route(`**/v3/waves/${BAR}**`, (route) => {
        const path = new URL(route.request().url()).pathname;
        if (path.endsWith("/default-competition"))
          return route.fulfill({
            json: {
              competition_id: null,
              evaluated_at: Date.now(),
              next_refresh_at: null,
            },
          });
        if (path.endsWith("/competitions"))
          return route.fulfill({ json: pageResult([]) });
        return route.fulfill({
          json: {
            id: BAR,
            name: "The Memes - Maybes Bar",
            legacy_primary_competition_id: null,
            permissions: {
              view: true,
              administer: false,
              create_competition: false,
            },
          },
        });
      });
      const response = await page.request.get(
        `${getSandboxApiOrigin(process.env["PLAYWRIGHT_BASE_URL"])}/api/v2/waves/${BAR}/drops`
      );
      const data = await response.json();
      const overview = data.wave;
      const main = {
        ...overview,
        id: WAVE,
        name: "The Memes - Main Stage",
      };
      const bar = { ...overview, id: BAR, name: "The Memes - Maybes Bar" };
      await page.route(/\/api\/v2\/waves(?:\?|$)/, (route) =>
        route.fulfill({ json: { data: [main, bar], page: 1, next: false } })
      );
      await page.route("**/api/v2/official-waves", (route) =>
        route.fulfill({ json: [main, bar] })
      );
      const openWaveFromList = async (name: string) => {
        const list = page.getByRole("region", {
          name: /All recent waves list|Regular waves list/,
        });
        await expect(list).toBeVisible({ timeout: 30000 });
        await list.getByRole("link").filter({ hasText: name }).first().click();
      };
      const returnToList = async () => {
        if (mode === "app")
          await page.getByRole("button", { name: "Back", exact: true }).click();
        else if (testInfo.project.name === "web-mobile-chromium")
          await page
            .getByRole("button", { name: "Go back", exact: true })
            .click();
        else
          await page
            .getByRole("link", { name: "Waves", exact: true })
            .filter({ visible: true })
            .first()
            .click();
        await expect(page).toHaveURL(
          (url) => url.pathname === "/waves" && !url.searchParams.has("wave")
        );
      };
      const chat = page.getByRole("region", {
        name: "Wave chat file upload area",
        exact: true,
      });
      const leaderboard = page.getByRole(mode === "app" ? "button" : "tab", {
        name: "Leaderboard",
        exact: true,
      });
      await page.goto("/waves");
      await openWaveFromList("The Memes - Main Stage");
      await expect(chat).toBeVisible({ timeout: 30000 });
      await leaderboard.click();
      if (mode === "native")
        await expect(
          page.getByText("Immutable alpha entry content", { exact: true })
        ).toBeVisible();
      else await expectLegacySectionContent(page, "leaderboard");
      await returnToList();
      await openWaveFromList("The Memes - Maybes Bar");
      await expect(chat).toBeVisible({ timeout: 30000 });
      await page
        .getByRole(mode === "app" ? "button" : "tab", {
          name: "Chat",
          exact: true,
        })
        .click();
      await returnToList();
      await openWaveFromList("The Memes - Main Stage");
      await expect(page).toHaveURL(
        new RegExp(`/waves/${WAVE}/competitions/alpha\\?tab=leaderboard$`)
      );
      if (mode === "native")
        await expect(
          page.getByText("Immutable alpha entry content", { exact: true })
        ).toBeVisible();
      else await expectLegacySectionContent(page, "leaderboard");
      await expect(chat).toHaveCount(0);
      await page.screenshot({
        path: testInfo.outputPath(`remembered-${mode}-leaderboard.png`),
        fullPage: true,
      });
      await page.reload();
      if (mode === "native")
        await expect(
          page.getByText("Immutable alpha entry content", { exact: true })
        ).toBeVisible();
      else await expectLegacySectionContent(page, "leaderboard");
      await returnToList();
      await openWaveFromList("The Memes - Maybes Bar");
      await expect(chat).toBeVisible({ timeout: 30000 });
      await expect(page).toHaveURL(new RegExp(`/waves/${BAR}$`));
      await page.screenshot({
        path: testInfo.outputPath(`remembered-${mode}-chat.png`),
        fullPage: true,
      });
    });
  }

  test("keeps the current Chat mounted while wave information is open and default data loads", async ({
    page,
  }, testInfo) => {
    await installCompetitionApi(page);
    if (testInfo.project.name === "web-mobile-chromium")
      await installSurfaceSimulation(
        page.context(),
        "capacitor-ios-sim",
        testInfo.project.use.baseURL
      );
    const { releaseDefault, waitForDefaultResponse } =
      await deferDefaultCompetition(page);
    const response = waitForDefaultResponse();
    try {
      await page.goto(`/waves/${WAVE}?tab=chat`);
      await expect(
        page.getByRole("region", {
          name: "Wave chat file upload area",
          exact: true,
        })
      ).toBeVisible({ timeout: 30000 });
      const originalUrl = page.url();
      const information = await openWaveInformation(page);
      await expect(
        information.getByRole("region", { name: "Pinned drop", exact: true })
      ).toBeVisible();
      releaseDefault();
      await (await response).finished();
      await expect(
        information.getByRole("tab", { name: "About", exact: true })
      ).toHaveAttribute("aria-selected", "true");
      await expect(page).toHaveURL(originalUrl);
      // The modal hides background content from accessibility while it stays mounted.
      await expect(
        page.getByRole("region", {
          name: "Wave chat file upload area",
          exact: true,
          includeHidden: true,
        })
      ).toHaveCount(1);
    } finally {
      releaseDefault();
    }
  });

  test("honors a Leaderboard click before default selection completes", async ({
    page,
  }, testInfo) => {
    const sandbox = await installCompetitionApi(page);
    await sandbox.legacyPrimary("alpha");
    const app = testInfo.project.name === "web-mobile-chromium";
    if (app)
      await installSurfaceSimulation(
        page.context(),
        "capacitor-ios-sim",
        testInfo.project.use.baseURL
      );
    const { releaseDefault } = await deferDefaultCompetition(page);
    try {
      await page.goto(`/waves/${WAVE}`);
      await expect(
        page.getByRole("region", {
          name: "Wave chat file upload area",
          exact: true,
        })
      ).toBeVisible({ timeout: 30000 });
      const leaderboard = page.getByRole(app ? "button" : "tab", {
        name: "Leaderboard",
        exact: true,
      });
      await leaderboard.click();
      await expect(page).toHaveURL(
        new RegExp(`/waves/${WAVE}\\?tab=leaderboard$`)
      );
      releaseDefault();
      await expect(page).toHaveURL(
        /competitions\/alpha\?tab=leaderboard&default=1$/,
        { timeout: 30000 }
      );
      await expectLegacySectionContent(page, "leaderboard");
    } finally {
      releaseDefault();
    }
  });

  for (const mode of ["native", "legacy", "app"] as const) {
    test(`acknowledges tab navigation and avoids page requests for same-page tabs (${mode})`, async ({
      page,
    }, testInfo) => {
      test.skip(
        mode === "app" && testInfo.project.name !== "web-mobile-chromium",
        "The app simulation uses the mobile viewport."
      );
      const sandbox = await installCompetitionApi(page);
      if (mode !== "native") await sandbox.legacyPrimary("alpha");
      if (mode === "app")
        await installSurfaceSimulation(
          page.context(),
          "capacitor-ios-sim",
          testInfo.project.use.baseURL
        );
      await page.goto(`/waves/${WAVE}`);
      const role = mode === "app" ? "button" : "tab";
      const selectedAttribute =
        mode === "app" ? "aria-current" : "aria-selected";
      const chat = page.getByRole(role, { name: "Chat", exact: true });
      const leaderboard = page.getByRole(role, {
        name: "Leaderboard",
        exact: true,
      });
      await expect(chat).toHaveAttribute(selectedAttribute, "true");
      await expect(leaderboard).toBeVisible();

      let releaseNavigation!: () => void;
      const navigation = new Promise<void>((resolve) => {
        releaseNavigation = resolve;
      });
      await page.route(
        `**/waves/${WAVE}/competitions/alpha?**`,
        async (route) => {
          if (new URL(route.request().url()).searchParams.has("_rsc"))
            await navigation;
          await route.continue();
        }
      );
      try {
        await page.emulateMedia({ reducedMotion: "reduce" });
        const before = await leaderboard.boundingBox();
        await leaderboard.click();
        await expect(leaderboard).toHaveAttribute("aria-busy", "true");
        await expect(chat).toHaveAttribute(selectedAttribute, "true");
        const pending = await leaderboard.boundingBox();
        expect(pending?.width).toBe(before?.width);
        expect(pending?.height).toBe(before?.height);
        const indicator = page
          .getByRole(role, { name: "Leaderboard", exact: true })
          .locator('[aria-hidden="true"]')
          .last();
        await expect(indicator).toBeVisible();
        await expect(indicator).toHaveCSS("animation-name", "none");
        await page.screenshot({ path: testInfo.outputPath("pending-tab.png") });
        releaseNavigation();
        await expect(page).toHaveURL(/alpha\?tab=leaderboard$/, {
          timeout: 30000,
        });
        await expect(leaderboard).toHaveAttribute(selectedAttribute, "true");
        await expect(leaderboard).not.toHaveAttribute("aria-busy", "true");
        if (mode === "native")
          await expect(
            page.getByText("Immutable alpha entry content", { exact: true })
          ).toBeVisible();
        else await expectLegacySectionContent(page, "leaderboard");

        const pageRequests: string[] = [];
        page.on("request", (request) => {
          const url = new URL(request.url());
          if (url.pathname === `${ROOT}/alpha` && url.searchParams.has("_rsc"))
            pageRequests.push(url.pathname);
        });
        const winners = page.getByRole(role, { name: "Winners", exact: true });
        const outcome = page.getByRole(role, {
          name: /^Outcomes?$/,
          exact: true,
        });
        const outcomeContent = page.getByText(
          mode === "native" ? "Nothing to show yet." : "No outcomes to show.",
          { exact: true }
        );
        const winnersContent = page.getByText(
          mode === "native" ? "No Winners to Display" : "No Winners Yet",
          { exact: true }
        );
        await winners.click();
        await expect(winners).toHaveAttribute(selectedAttribute, "true");
        await expect(page).toHaveURL(/alpha\?tab=decisions$/);
        await expect(winners).not.toHaveAttribute("aria-busy", "true");
        await expect(winners).toBeFocused();
        await expect(winnersContent).toBeVisible();
        await outcome.click();
        await expect(outcome).toHaveAttribute(selectedAttribute, "true");
        await expect(page).toHaveURL(/alpha\?tab=outcomes$/);
        await expect(outcomeContent).toBeVisible();
        await expect(winnersContent).toHaveCount(0);
        await page.goBack();
        await expect(winners).toHaveAttribute(selectedAttribute, "true");
        await expect(page).toHaveURL(/alpha\?tab=decisions$/);
        await expect(winnersContent).toBeVisible();
        await page.goForward();
        await expect(outcome).toHaveAttribute(selectedAttribute, "true");
        await expect(page).toHaveURL(/alpha\?tab=outcomes$/);
        await expect(outcomeContent).toBeVisible();
        // Two quick choices must settle on the last one, without a stuck cue.
        await winners.evaluate((button) => {
          (button as HTMLButtonElement).click();
          const next = Array.from(document.querySelectorAll("button")).find(
            (candidate) =>
              /^Outcomes?$/.test(candidate.textContent?.trim() ?? "")
          );
          next?.click();
        });
        await expect(outcome).toHaveAttribute(selectedAttribute, "true");
        await expect(page).toHaveURL(/alpha\?tab=outcomes$/);
        await expect(winners).not.toHaveAttribute("aria-busy", "true");
        await expect(outcomeContent).toBeVisible();
        expect(pageRequests).toEqual([]);
      } finally {
        releaseNavigation();
      }
    });
  }

  test("opens Chat on wave entry and preserves explicit tabs, reload, back and forward", async ({
    page,
  }, testInfo) => {
    const sandbox = await installCompetitionApi(page);
    await page.goto(`/waves/${WAVE}`);
    await expect(page.getByRole("tabpanel")).toContainText(
      "6529-composer-preview",
      { timeout: 30000 }
    );
    await expect(page).toHaveURL(new RegExp(`/waves/${WAVE}$`));
    await waveTabStrip(page)
      .getByRole("tab", { name: "Leaderboard", exact: true })
      .click();
    await expect(page).toHaveURL(/competitions\/alpha\?tab=leaderboard$/);
    await expect(
      page.getByText("Immutable alpha entry content", { exact: true })
    ).toBeVisible();
    await expectFamiliarWaveTabs(page);
    await expect(
      page.getByRole("main").locator("[data-competition-detail]")
    ).toHaveCount(0);
    await expect(waveTabStrip(page).filter({ visible: true })).toHaveCount(1);
    await page.screenshot({
      path: testInfo.outputPath("flat-default-competition.png"),
      fullPage: true,
    });
    await waveTabStrip(page)
      .getByRole("tab", { name: "Winners", exact: true })
      .click();
    await expect(page).toHaveURL(/alpha\?tab=decisions$/);
    await expectFamiliarWaveTabs(page);
    await waveTabStrip(page)
      .getByRole("tab", { name: /^Outcomes?$/, exact: true })
      .click();
    await expect(page).toHaveURL(/alpha\?tab=outcomes$/);
    await waveTabStrip(page)
      .getByRole("tab", { name: "Votes", exact: true })
      .click();
    await expect(page).toHaveURL(/alpha\?tab=votes$/);
    sandbox.setDefault("beta");
    await page.reload();
    await expect(
      page.getByRole("heading", {
        name: /Local Composer Sandbox Wave/,
        level: 1,
      })
    ).toBeVisible();
    await expect(
      waveTabStrip(page).getByRole("tab", {
        name: "Votes",
        exact: true,
      })
    ).toHaveAttribute("aria-selected", "true");
    await expectFamiliarWaveTabs(page);
    await page.goBack();
    await expect(page).toHaveURL(/alpha\?tab=outcomes$/);
    await expect(
      waveTabStrip(page).getByRole("tab", {
        name: /^Outcomes?$/,
        exact: true,
      })
    ).toHaveAttribute("aria-selected", "true");
    await expectFamiliarWaveTabs(page);
    await page.goForward();
    await expect(page).toHaveURL(/alpha\?tab=votes$/);
    await expect(
      waveTabStrip(page).getByRole("tab", {
        name: "Votes",
        exact: true,
      })
    ).toHaveAttribute("aria-selected", "true");
    await expectFamiliarWaveTabs(page);
    await waveTabStrip(page)
      .getByRole("tab", { name: "Winners", exact: true })
      .click();
    await expect(page).toHaveURL(/alpha\?tab=decisions$/);
    await expect(
      waveTabStrip(page).getByRole("tab", {
        name: "Winners",
        exact: true,
      })
    ).toHaveAttribute("aria-selected", "true");
    await waveTabStrip(page)
      .getByRole("tab", { name: /^Competitions(?:\s+\d+\+?)?$/ })
      .click();
    await expect(page).toHaveURL(ROOT, { timeout: 30000 });
    await expectFamiliarWaveTabs(page);
    await page.getByRole("link", { name: /Parallel Alpha/ }).click();
    await expect(page).toHaveURL(`${ROOT}/alpha`);
    await expect(
      page.getByRole("heading", {
        name: /Local Composer Sandbox Wave/,
        level: 1,
      })
    ).toBeVisible();
    await expectFamiliarWaveTabs(page);
    await expectNoHorizontalOverflow(page);
    await page.screenshot({
      path: testInfo.outputPath("default-competition-navigation.png"),
      fullPage: true,
    });
  });

  test("keeps wave Configuration in the information panel and competition appearance in Settings", async ({
    page,
  }) => {
    const sandbox = await installCompetitionApi(page);
    sandbox.onlyCompetition("alpha");
    await sandbox.legacyPrimary("alpha");
    await page.goto(`/waves/${WAVE}?tab=chat`);
    const information = await openWaveInformation(page);
    await information
      .getByRole("tab", { name: "Configuration", exact: true })
      .click();
    await expect(
      information.getByRole("button", { name: "Edit proposal card settings" })
    ).toHaveCount(0);
    await expect(
      information.getByRole("heading", { name: "Chat", exact: true })
    ).toBeVisible();
    await expect(
      information.getByRole("tab", { name: "Voters", exact: true })
    ).toHaveCount(0);
    await expect(
      information.getByRole("tab", { name: "Activity", exact: true })
    ).toHaveCount(0);
    await page.goto(`${ROOT}/alpha?tab=rules`);
    const appearance = page.getByRole("button", {
      name: "Appearance and labels",
      exact: true,
    });
    await appearance.click();
    const full = page.getByRole("radio", { name: /^Full proposal/ });
    const summary = page.getByRole("radio", { name: /^Summary card/ });
    await expect(full).toBeChecked();
    await page.getByText("Summary card", { exact: true }).click();
    await expect(summary).toBeChecked();
    const limit = page.getByRole("spinbutton", {
      name: "Maximum proposal preview characters",
      exact: true,
    });
    await limit.fill("119");
    await expect(limit).toHaveAttribute("aria-invalid", "true");
    await expect(limit).toHaveAccessibleDescription(/120/);
    await expect(
      page.getByRole("button", { name: "Save changes", exact: true })
    ).toBeDisabled();
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(appearance).toHaveAttribute("aria-expanded", "false");
    await appearance.click();
    await expect(full).toBeChecked();
    await expectNoHorizontalOverflow(page);
  });

  for (const legacy of [false, true]) {
    test(`renders a ${legacy ? "legacy" : "native"} single competition in the wave row without a detail shell`, async ({
      page,
    }, testInfo) => {
      const sandbox = await installCompetitionApi(page);
      sandbox.onlyCompetition("alpha");
      if (legacy) await sandbox.legacyPrimary("alpha");
      await page.goto(`${ROOT}/alpha`);
      await expect(
        waveTabStrip(page).getByRole("tab", {
          name: "Leaderboard",
          exact: true,
        })
      ).toBeVisible({ timeout: 30000 });
      await expect(waveTabStrip(page).filter({ visible: true })).toHaveCount(1);
      await expect(
        page.getByRole("main").locator("[data-competition-detail]")
      ).toHaveCount(0);
      await expect(
        waveTabStrip(page).getByRole("tab", {
          name: "Settings",
          exact: true,
        })
      ).toBeVisible();
      const tabLabels = await waveTabStrip(page)
        .filter({ visible: true })
        .getByRole("tab")
        .allTextContents();
      expect(
        tabLabels.filter((label) => label === "Settings" || label === "About")
      ).toEqual(["Settings"]);
      await waveTabStrip(page)
        .getByRole("tab", { name: "Settings", exact: true })
        .click();
      await expect(page).toHaveURL(/alpha\?tab=rules$/);
      await expect(
        page
          .getByRole("heading", {
            name: "Participation",
            exact: true,
          })
          .first()
      ).toBeVisible();
      if (legacy) {
        await expect(
          waveTabStrip(page).getByRole("tab", { name: "Voters", exact: true })
        ).toHaveCount(0);
      }
      await expect(
        page.getByRole("link", { name: "All competitions", exact: true })
      ).toHaveCount(0);
      await waveTabStrip(page)
        .getByRole("tab", { name: "Chat", exact: true })
        .click();
      await expect(page).toHaveURL(
        new RegExp(`/waves/${WAVE}\\?tab=chat&competition=alpha$`)
      );
      await waveTabStrip(page)
        .getByRole("tab", { name: "Leaderboard", exact: true })
        .click();
      await expect(page).toHaveURL(/alpha\?tab=leaderboard$/);
      await expect(
        page.getByRole("main").locator("[data-competition-detail]")
      ).toHaveCount(0);
      await expectNoHorizontalOverflow(page);
      await page.screenshot({
        path: testInfo.outputPath(
          `flat-${legacy ? "legacy" : "native"}-single-competition.png`
        ),
        fullPage: true,
      });
    });
  }

  for (const legacy of [false, true]) {
    test(`hides the sole default collection for a non-admin and retains readable ${legacy ? "legacy" : "native"} configuration`, async ({
      page,
    }, testInfo) => {
      const sandbox = await installCompetitionApi(page, false, false);
      sandbox.onlyCompetition("alpha");
      if (legacy) await sandbox.legacyPrimary("alpha");
      await page.goto(`${ROOT}/alpha?tab=rules`);
      const tabs = waveTabStrip(page).filter({ visible: true });
      await expect(
        tabs.getByRole("tab", { name: "Settings", exact: true })
      ).toHaveAttribute("aria-selected", "true", { timeout: 30000 });
      await expect(
        tabs.getByRole("tab", { name: /^Competitions/ })
      ).toHaveCount(0);
      expect(
        (await tabs.getByRole("tab").allTextContents()).filter(
          (label) => label === "Settings" || label === "About"
        )
      ).toEqual(["Settings"]);
      await expect(
        page
          .getByRole("heading", {
            name: "Participation",
            exact: true,
          })
          .first()
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Edit competition details" })
      ).toHaveCount(0);
      await expect(
        page.getByRole("button", { name: "Pause decisions", exact: true })
      ).toHaveCount(0);
      await expectNoHorizontalOverflow(page);
      await page.screenshot({
        path: testInfo.outputPath(
          `configuration-${legacy ? "legacy" : "native"}-non-admin.png`
        ),
        fullPage: true,
      });
      await tabs.getByRole("tab", { name: "Chat", exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`tab=chat&competition=alpha$`));
      await tabs.getByRole("tab", { name: "Settings", exact: true }).click();
      await expect(page).toHaveURL(`${ROOT}/alpha?tab=rules`);
      await page.goBack();
      await expect(page).toHaveURL(/tab=chat&competition=alpha$/);
      await page.goForward();
      await expect(page).toHaveURL(`${ROOT}/alpha?tab=rules`);
      await page.goto(ROOT);
      await expect(
        page.getByRole("link", { name: /Parallel Alpha/ })
      ).toBeVisible();
      await expect(
        tabs.getByRole("tab", { name: /^Competitions/ })
      ).toHaveCount(0);
    });
  }

  for (const app of [false, true]) {
    test(`keeps settled tabs still during an unchanged competition refresh (${app ? "app" : "web"})`, async ({
      page,
    }, testInfo) => {
      test.skip(app && testInfo.project.name !== "web-mobile-chromium");
      const sandbox = await installCompetitionApi(page, false, false);
      sandbox.onlyCompetition("alpha");
      sandbox.refreshAtBoundary();
      if (app)
        await installSurfaceSimulation(
          page.context(),
          "capacitor-ios-sim",
          testInfo.project.use.baseURL
        );
      let holdRefresh = false;
      let refreshStarted = false;
      let releaseRefresh!: () => void;
      const refreshGate = new Promise<void>((resolve) => {
        releaseRefresh = resolve;
      });
      await page.route("**/v3/waves/**/default-competition", async (route) => {
        if (holdRefresh) {
          refreshStarted = true;
          await refreshGate;
        }
        await route.fallback();
      });
      try {
        await page.goto(`${ROOT}/alpha?tab=rules`);
        const tabs = app
          ? page.getByRole("navigation", { name: "Wave sections" })
          : waveTabStrip(page).filter({ visible: true });
        const settings = tabs.getByRole(app ? "button" : "tab", {
          name: "Settings",
          exact: true,
        });
        const collection = tabs.getByRole(app ? "button" : "tab", {
          name: /^Competitions/,
        });
        await expect(settings).toHaveAttribute(
          app ? "aria-current" : "aria-selected",
          "true"
        );
        await expect(collection).toHaveCount(0);
        await expect(settings).toBeVisible();
        await tabs.screenshot({
          path: testInfo.outputPath("tabs-before-refresh.png"),
        });
        const before = await settings.boundingBox();
        expect(before).not.toBeNull();
        // Observe the whole refresh, not only its endpoints, so a brief extra tab fails.
        const monitor = await tabs.evaluateHandle((element) => {
          const labels = () =>
            Array.from(
              element.querySelectorAll('button, [role="tab"]'),
              (item) => item.textContent?.trim()
            )
              .filter(Boolean)
              .join("|");
          const initial = labels();
          const changes: string[] = [];
          const observer = new MutationObserver(() => {
            const current = labels();
            if (current !== initial) changes.push(current);
          });
          observer.observe(element, {
            childList: true,
            subtree: true,
            characterData: true,
          });
          return { observer, changes };
        });
        holdRefresh = true;
        await expect.poll(() => refreshStarted, { timeout: 10000 }).toBe(true);
        await expect(collection).toHaveCount(0);
        await tabs.screenshot({
          path: testInfo.outputPath("tabs-during-refresh.png"),
        });
        expect((await settings.boundingBox())?.x).toBeCloseTo(before!.x, 0);
        const response = page.waitForResponse(
          "**/v3/waves/**/default-competition"
        );
        holdRefresh = false;
        releaseRefresh();
        await response;
        await tabs.screenshot({
          path: testInfo.outputPath("tabs-after-refresh.png"),
        });
        await expect(collection).toHaveCount(0);
        expect((await settings.boundingBox())?.x).toBeCloseTo(before!.x, 0);
        expect(
          await monitor.evaluate(({ observer, changes }) => {
            observer.disconnect();
            return changes;
          })
        ).toEqual([]);
        await monitor.dispose();
        expect(sandbox.requests).toEqual([]);
      } finally {
        holdRefresh = false;
        releaseRefresh();
      }
    });
  }

  for (const phase of ["COMPLETED", "UPCOMING"]) {
    test(`retains the collection for a non-admin with an active default plus ${phase}`, async ({
      page,
    }) => {
      const sandbox = await installCompetitionApi(page, false, false);
      sandbox.setPhase("beta", phase);
      await page.goto(`${ROOT}/alpha`);
      await expect(
        waveTabStrip(page).getByRole("tab", { name: /^Competitions/ })
      ).toBeVisible({ timeout: 30000 });
      await waveTabStrip(page)
        .getByRole("tab", { name: /^Competitions/ })
        .click();
      await expect(page).toHaveURL(ROOT);
      await page.getByRole("tab", { name: "All", exact: true }).click();
      await expect(
        page.getByRole("link", { name: /Parallel Beta/ })
      ).toBeVisible();
    });
  }

  test("hides the sole native default collection in the app and resolves Configuration links", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "web-mobile-chromium");
    const sandbox = await installCompetitionApi(page, false, false);
    sandbox.onlyCompetition("alpha");
    await installSurfaceSimulation(
      page.context(),
      "capacitor-ios-sim",
      testInfo.project.use.baseURL
    );
    const navigation = page.getByRole("navigation", { name: "Wave sections" });
    await page.goto(`/waves/${WAVE}?tab=chat`);
    await expect(
      navigation.getByRole("button", { name: "Chat", exact: true })
    ).toHaveAttribute("aria-current", "true");
    await expect(
      navigation.getByRole("button", { name: "Settings", exact: true })
    ).toBeVisible();
    await navigation
      .getByRole("button", { name: "Settings", exact: true })
      .click();
    await expect(page).toHaveURL(`${ROOT}/alpha?tab=rules`);
    await page.goto(`/waves/${WAVE}?tab=configuration&competition=alpha`);
    await expect(page).toHaveURL(`${ROOT}/alpha?tab=rules`);
    await expect(
      navigation.getByRole("button", { name: "Settings", exact: true })
    ).toHaveAttribute("aria-current", "true");
    await expect(
      navigation.getByRole("button", { name: /^Competitions/ })
    ).toHaveCount(0);
    expect(
      (
        await navigation
          .getByRole("button")
          .filter({ hasText: /\S/ })
          .allTextContents()
      ).filter((label) => label === "Settings" || label === "About")
    ).toEqual(["Settings"]);
    await expect(
      page.getByRole("heading", { name: "Participation", exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Edit competition details" })
    ).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
    await page.screenshot({
      path: testInfo.outputPath("configuration-native-non-admin-app.png"),
      fullPage: true,
    });
  });

  for (const legacy of [false, true]) {
    test(`keeps visible app tabs still when selecting Settings and Votes (${legacy ? "legacy" : "native"})`, async ({
      page,
    }, testInfo) => {
      test.skip(testInfo.project.name !== "web-mobile-chromium");
      // Match the server fixture's admin identity, keeping the create control stable.
      const sandbox = await installCompetitionApi(page);
      sandbox.onlyCompetition("alpha");
      if (legacy) await sandbox.legacyPrimary("alpha");
      await installSurfaceSimulation(
        page.context(),
        "capacitor-ios-sim",
        testInfo.project.use.baseURL
      );
      await page.goto(`${ROOT}/alpha?tab=rules`);
      const navigation = page.getByRole("navigation", {
        name: "Wave sections",
      });
      const scroller = page
        .getByRole("navigation", { name: "Wave sections" })
        .locator('[data-wave-tabs-scroll="app"]');
      const settings = navigation.getByRole("button", {
        name: "Settings",
        exact: true,
      });
      await expect(settings).toHaveAttribute("aria-current", "true");
      // Match a user who has already swiped both target tabs into view.
      const initialScrollLeft = await scroller.evaluate((element) => {
        const votes = Array.from(element.querySelectorAll("button")).find(
          (button) => button.textContent?.trim() === "Votes"
        );
        if (!votes) throw new Error("Votes tab missing");
        element.scrollTo({
          left:
            element.scrollLeft +
            votes.getBoundingClientRect().left -
            element.getBoundingClientRect().left,
          behavior: "instant",
        });
        return element.scrollLeft;
      });
      expect(initialScrollLeft).toBeGreaterThan(0);
      const initialSettingsLeft = await settings.evaluate(
        (element) => element.getBoundingClientRect().left
      );

      for (const name of ["Votes", "Settings"]) {
        const tab = navigation.getByRole("button", { name, exact: true });
        const buttonBounds = await tab.boundingBox();
        const rowBounds = await scroller.boundingBox();
        if (!buttonBounds || !rowBounds)
          throw new Error("Tab row is not visible");
        expect(buttonBounds.x).toBeGreaterThanOrEqual(rowBounds.x - 1);
        expect(buttonBounds.x + buttonBounds.width).toBeLessThanOrEqual(
          rowBounds.x + rowBounds.width + 1
        );
        // Tap where a finger would, without Playwright first scrolling the button.
        await page.touchscreen.tap(
          buttonBounds.x + buttonBounds.width / 2,
          buttonBounds.y + buttonBounds.height / 2
        );
        await expect(tab).toHaveAttribute("aria-current", "true");
        const movement = await settings.evaluate(async (element, initial) => {
          let maximum = Math.abs(
            element.getBoundingClientRect().left - initial
          );
          const until = performance.now() + 500;
          await new Promise<void>((resolve) => {
            const sample = () => {
              maximum = Math.max(
                maximum,
                Math.abs(element.getBoundingClientRect().left - initial)
              );
              if (performance.now() < until) requestAnimationFrame(sample);
              else resolve();
            };
            requestAnimationFrame(sample);
          });
          return maximum;
        }, initialSettingsLeft);
        expect(movement).toBeLessThanOrEqual(1);
      }
      await expectNoHorizontalOverflow(page);
      await navigation.screenshot({
        path: testInfo.outputPath("stable-app-tab-row.png"),
      });
    });
  }

  test("retains sole legacy Configuration in the app on a wave URL without a competition selection", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "web-mobile-chromium");
    const sandbox = await installCompetitionApi(page, false, false);
    sandbox.onlyCompetition("alpha");
    await sandbox.legacyPrimary("alpha");
    await installSurfaceSimulation(
      page.context(),
      "capacitor-ios-sim",
      testInfo.project.use.baseURL
    );
    await page.goto(`/waves/${WAVE}?tab=chat`);
    const navigation = page.getByRole("navigation", { name: "Wave sections" });
    const configuration = navigation.getByRole("button", {
      name: "Settings",
      exact: true,
    });
    await expect(configuration).toBeVisible();
    await expect(
      navigation.getByRole("button", { name: /^Competitions/ })
    ).toHaveCount(0);
    await configuration.click();
    await expect(page).toHaveURL(`${ROOT}/alpha?tab=rules`);
    await expect(configuration).toHaveAttribute("aria-current", "true");
    await expect(
      page.getByRole("heading", { name: "Participation", exact: true }).first()
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Pause decisions", exact: true })
    ).toHaveCount(0);
    await page.goBack();
    await expect(page).toHaveURL(`/waves/${WAVE}?tab=chat`);
    await expect(configuration).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("keeps legacy flat app sections synchronized on click and reload", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "web-mobile-chromium");
    const sandbox = await installCompetitionApi(page);
    sandbox.onlyCompetition("alpha");
    await sandbox.legacyPrimary("alpha");
    await installSurfaceSimulation(
      page.context(),
      "capacitor-ios-sim",
      testInfo.project.use.baseURL
    );
    await page.goto(`${ROOT}/alpha`);
    const navigation = page.getByRole("navigation", { name: "Wave sections" });
    await expect(
      navigation.getByRole("button", { name: "Leaderboard", exact: true })
    ).toHaveAttribute("aria-current", "true", { timeout: 30000 });
    for (const [label, tab] of [
      ["Winners", "decisions"],
      ["Outcome", "outcomes"],
      ["Votes", "votes"],
      ["Settings", "rules"],
      ["Leaderboard", "leaderboard"],
    ] as const) {
      const button = navigation.getByRole("button", {
        name: label,
        exact: true,
      });
      await button.click();
      await expect(page).toHaveURL(`${ROOT}/alpha?tab=${tab}`);
      await expect(button).toHaveAttribute("aria-current", "true");
      await expectLegacySectionContent(page, tab);
      await page.reload();
      await expect(button).toHaveAttribute("aria-current", "true");
      await expectLegacySectionContent(page, tab);
      await expect(page.getByRole("tabpanel")).toHaveCount(
        tab === "votes" ? 1 : 0
      );
      await expect(
        page.getByRole("region", {
          name: "Local Composer Sandbox Wave",
          exact: true,
        })
      ).toBeVisible();
    }
    await page.goBack();
    await expect(page).toHaveURL(`${ROOT}/alpha?tab=rules`);
    await expectLegacySectionContent(page, "rules");
    await page.goForward();
    await expect(page).toHaveURL(`${ROOT}/alpha?tab=leaderboard`);
    await expectLegacySectionContent(page, "leaderboard");
    await navigation.getByRole("button", { name: "Chat", exact: true }).click();
    await expect(page).toHaveURL(
      new RegExp(`/waves/${WAVE}\\?tab=chat&competition=alpha$`)
    );
    await expect(
      navigation.getByRole("button", { name: "Chat", exact: true })
    ).toHaveAttribute("aria-current", "true");
  });

  test("renders ended legacy app submissions and respects hidden Outcome", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "web-mobile-chromium");
    const sandbox = await installCompetitionApi(page);
    sandbox.onlyCompetition("alpha");
    await sandbox.legacyPrimary("alpha", true);
    await page.route(`**/api/v2/waves/${WAVE}/metadata`, (route) =>
      route.fulfill({
        json: [
          {
            id: 1,
            data_key: "wave_display.outcomes.visible",
            data_value: "false",
          },
        ],
      })
    );
    await installSurfaceSimulation(
      page.context(),
      "capacitor-ios-sim",
      testInfo.project.use.baseURL
    );
    await page.goto(`${ROOT}/alpha?tab=leaderboard`);
    const navigation = page.getByRole("navigation", { name: "Wave sections" });
    const submissions = navigation.getByRole("button", {
      name: "Submissions",
      exact: true,
    });
    await expect(submissions).toHaveAttribute("aria-current", "true", {
      timeout: 30000,
    });
    await expect(
      page.getByText("No submissions to show.", { exact: true })
    ).toBeVisible();
    await expect(
      navigation.getByRole("button", { name: "Outcome", exact: true })
    ).toHaveCount(0);
    await page.reload();
    await expect(submissions).toHaveAttribute("aria-current", "true");
    await expect(
      page.getByText("No submissions to show.", { exact: true })
    ).toBeVisible();
    await page.goto(`${ROOT}/alpha?tab=outcomes`);
    await expect(submissions).toHaveAttribute("aria-current", "true");
    await expect(
      page.getByText("No submissions to show.", { exact: true })
    ).toBeVisible();
    await expect(
      navigation.getByRole("button", { name: "Outcome", exact: true })
    ).toHaveCount(0);
    await expect(
      page.getByText("No outcomes to show.", { exact: true })
    ).toHaveCount(0);
  });

  test("waits for competition navigation before exposing legacy leaderboard controls", async ({
    page,
  }, testInfo) => {
    const sandbox = await installCompetitionApi(page, false, true, MEMES_WAVE);
    sandbox.onlyCompetition("alpha");
    await sandbox.legacyPrimary("alpha");
    // Compile the destination on the local dev server before holding navigation.
    const destination = await page.request.get(
      `/waves/${MEMES_WAVE}/competitions/alpha?tab=leaderboard`
    );
    expect(destination.ok()).toBe(true);
    let releaseNavigation!: () => void;
    const pendingNavigation = new Promise<void>((resolve) => {
      releaseNavigation = resolve;
    });
    let navigationRequested!: () => void;
    const navigationRequest = new Promise<void>((resolve) => {
      navigationRequested = resolve;
    });
    await page.route(
      `**/waves/${MEMES_WAVE}/competitions/alpha?**`,
      async (route) => {
        navigationRequested();
        await pendingNavigation;
        await route.fallback();
      }
    );
    try {
      const defaultResponse = page.waitForResponse(
        (response) =>
          response.url().endsWith("/default-competition") && response.ok()
      );
      await page.goto(`/waves/${MEMES_WAVE}`);
      await defaultResponse;
      await expect(
        waveTabStrip(page).getByRole("tab", { name: "Chat", exact: true })
      ).toHaveAttribute("aria-selected", "true");
      await expect(
        page.getByRole("region", {
          name: "Wave chat file upload area",
          exact: true,
        })
      ).toBeVisible();
      await waveTabStrip(page)
        .getByRole("tab", { name: "Leaderboard", exact: true })
        .click();
      await navigationRequest;
      await expect(
        page.getByRole("tablist", { name: "Leaderboard view modes" })
      ).toHaveCount(0);
      await expect(page).toHaveURL(new RegExp(`/waves/${MEMES_WAVE}$`));
      releaseNavigation();
      await expect(page).toHaveURL(
        new RegExp(
          `/waves/${MEMES_WAVE}/competitions/alpha\\?tab=leaderboard$`
        ),
        { timeout: 30000 }
      );
      await expect(
        page.getByRole("tablist", { name: "Leaderboard view modes" })
      ).toBeVisible();
      await selectLegacyNewestSort(
        page,
        testInfo.project.name === "web-mobile-chromium"
      );
      expect(sandbox.requests).toEqual([]);
    } finally {
      releaseNavigation();
    }
  });

  for (const surface of ["web", "app"] as const) {
    test(`preserves populated legacy Main Stage artwork in ${surface} views`, async ({
      page,
    }, testInfo) => {
      test.skip(
        surface === "app" && testInfo.project.name !== "web-mobile-chromium"
      );
      const sandbox = await installCompetitionApi(
        page,
        false,
        true,
        MEMES_WAVE
      );
      sandbox.onlyCompetition("alpha");
      await sandbox.legacyPrimary("alpha");
      if (surface === "app") {
        await installSurfaceSimulation(
          page.context(),
          "capacitor-ios-sim",
          testInfo.project.use.baseURL
        );
      }
      const response = await page.request.get(
        `${getSandboxApiOrigin(process.env["PLAYWRIGHT_BASE_URL"])}/api/v2/waves/${MEMES_WAVE}/drops`
      );
      expect(response.ok()).toBe(true);
      const fixture = await response.json();
      fixture.wave.id = MEMES_WAVE;
      const sorts: string[] = [];
      const artwork = {
        ...fixture.drops[0],
        id: entryDropId("alpha"),
        drop_type: "SUBMISSION",
        title: "Legacy Main Stage artwork",
        content: "Existing artwork preserved on the legacy leaderboard.",
        media: [
          {
            url: "https://d3lqz0a4bldqgf.cloudfront.net/drops/legacy-main-stage.png",
            mime_type: "image/png",
          },
        ],
        submission_context: {
          status: "ACTIVE",
          has_metadata: false,
          voting: {
            is_open: true,
            total_votes_given: 100,
            current_calculated_vote: 100,
            predicted_final_vote: 120,
            voters_count: 1,
            place: 1,
            context_profile_context: {
              can_vote: true,
              min: -1000,
              max: 1000,
              current: 100,
            },
          },
        },
      };
      await page.route(
        "https://d3lqz0a4bldqgf.cloudfront.net/drops/**/legacy-main-stage.png",
        (route) =>
          route.fulfill({
            contentType: "image/png",
            path: "public/test-wave-icon.png",
          })
      );
      await page.route(
        "https://d3lqz0a4bldqgf.cloudfront.net/drops/legacy-main-stage.png",
        (route) =>
          route.fulfill({
            contentType: "image/png",
            path: "public/test-wave-icon.png",
          })
      );
      await page.route(
        `**/api/v2/waves/${MEMES_WAVE}/leaderboard?**`,
        (route) => {
          sorts.push(
            new URL(route.request().url()).searchParams.get("sort") ?? ""
          );
          return route.fulfill({
            json: {
              wave: fixture.wave,
              drops: [artwork],
              count: 1,
              page: 1,
              next: false,
            },
          });
        }
      );
      const root = `/waves/${MEMES_WAVE}/competitions/alpha`;
      await page.goto(`/waves/${MEMES_WAVE}?tab=leaderboard`);
      await expect(page).toHaveURL(`${root}?tab=leaderboard&default=1`, {
        timeout: 30000,
      });
      await dismissNextDevTools(page);
      const sections =
        surface === "app"
          ? page
              .getByRole("navigation", { name: "Wave sections" })
              .getByRole("button", {
                name: /^(Chat|Leaderboard|Winners|Votes)$/,
              })
          : waveTabStrip(page).getByRole("tab", {
              name: /^(Chat|Leaderboard|Winners|Votes)$/,
            });
      await expect(sections).toHaveText([
        "Chat",
        "Leaderboard",
        "Winners",
        "Votes",
      ]);
      const modes = page.getByRole("tablist", {
        name: "Leaderboard view modes",
      });
      const expectArtwork = async () => {
        await expect(
          page.getByRole("list", { name: "Leaderboard drops" })
        ).toBeVisible();
        await expect(
          page.getByText("Legacy Main Stage artwork", { exact: true }).first()
        ).toBeVisible();
        await expect(
          page.getByText("No drops to show", { exact: true })
        ).toHaveCount(0);
        await expect(
          page.getByText("No artwork submissions yet", { exact: true })
        ).toHaveCount(0);
      };
      await modes.getByRole("tab", { name: "Grid view", exact: true }).click();
      await expectArtwork();
      const image = page
        .getByRole("img", { name: "Media content", exact: true })
        .first();
      await expect(image).toBeVisible();
      await expect
        .poll(() =>
          image.evaluate(
            (element) => (element as HTMLImageElement).naturalWidth
          )
        )
        .toBeGreaterThan(0);
      const selectedSort = await selectLegacyNewestSort(
        page,
        testInfo.project.name === "web-mobile-chromium"
      );
      await expectArtwork();
      await modes.getByRole("tab", { name: "List view", exact: true }).click();
      await expectArtwork();
      await modes.getByRole("tab", { name: "Grid view", exact: true }).click();
      await expectArtwork();
      await page.reload();
      await expect(selectedSort).toBeVisible();
      if (testInfo.project.name === "web-desktop-chromium") {
        await expect(selectedSort).toHaveAttribute("aria-selected", "true");
      }
      await expectArtwork();
      expect(sorts).toContain("RANK");
      expect(sorts).toContain("CREATED_AT");
      expect(sandbox.requests).toEqual([]);
      await expectNoHorizontalOverflow(page);
      const screenshotPath = testInfo.outputPath(
        `main-stage-chat-first-${surface}-tabs.png`
      );
      await page.screenshot({ path: screenshotPath });
      await testInfo.attach(`main-stage-chat-first-${surface}-tabs`, {
        path: screenshotPath,
        contentType: "image/png",
      });
    });
  }

  test("keeps explicit My Votes and serial chat targets available when selection fails", async ({
    page,
  }) => {
    await installCompetitionApi(page);
    await page.route("**/v3/waves/**/default-competition", (route) =>
      route.fulfill({ status: 503, json: { message: "Unavailable" } })
    );
    await page.goto(`${ROOT}/alpha`);
    await expect(
      page.getByRole("heading", {
        name: /Local Composer Sandbox Wave/,
        level: 1,
      })
    ).toBeVisible({ timeout: 30000 });
    const myVotes = waveTabStrip(page).getByRole("tab", {
      name: "Votes",
      exact: true,
    });
    await expect(myVotes).toBeVisible();
    await myVotes.click();
    await expect(page).toHaveURL(/alpha\?tab=votes$/);
    await expect(
      waveTabStrip(page).getByRole("tab", {
        name: "Votes",
        exact: true,
      })
    ).toHaveAttribute("aria-selected", "true");
    await page.goto(`/waves/${WAVE}?tab=chat&competition=alpha`);
    await expect(myVotes).toBeVisible({ timeout: 30000 });
    await myVotes.click();
    await expect(page).toHaveURL(/alpha\?tab=votes$/);
    await page.goto(
      `/waves/${WAVE}?tab=leaderboard&competition=alpha&serialNo=1`
    );
    await expect(
      waveTabStrip(page).getByRole("tab", { name: "Chat", exact: true })
    ).toHaveAttribute("aria-selected", "true", { timeout: 30000 });
    await expect(page).toHaveURL(/serialNo=1$/);
    await expect(
      page.getByRole("heading", { name: "Parallel Alpha", level: 1 })
    ).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
  });

  test("refreshes implicit selection at server time boundaries and pins an open entry form", async ({
    page,
  }) => {
    const sandbox = await installCompetitionApi(page);
    sandbox.refreshAtBoundary();
    await page.goto(`/waves/${WAVE}?tab=leaderboard`);
    await expect(page).toHaveURL(
      /competitions\/alpha\?tab=leaderboard&default=1$/,
      {
        timeout: 30000,
      }
    );
    sandbox.setDefault("beta");
    await expect(page).toHaveURL(
      /competitions\/beta\?tab=leaderboard&default=1$/,
      {
        timeout: 15000,
      }
    );
    await expect(
      page.getByRole("button", { name: "Enter Beta", exact: true })
    ).toBeVisible();
    await page.getByRole("button", { name: "Enter Beta", exact: true }).click();
    const form = page.getByRole("region", {
      name: "Submit an entry",
      exact: true,
    });
    await expect(form).toBeVisible();
    await expect(page).toHaveURL(/competitions\/beta\?tab=leaderboard$/);
    sandbox.setDefault("alpha");
    const reads = sandbox.selectionReads();
    await expect.poll(() => sandbox.selectionReads()).toBeGreaterThan(reads);
    await expect(form).toBeVisible();
    await expect(page).toHaveURL(/competitions\/beta\?tab=leaderboard$/);
    await expect(
      page.getByRole("button", { name: "Enter Beta", exact: true })
    ).toBeVisible();
  });

  test("keeps a zero-competition wave usable as shared chat", async ({
    page,
  }) => {
    const sandbox = await installCompetitionApi(page, false, false);
    sandbox.clearCompetitions();
    await page.goto(`/waves/${WAVE}`);
    await expect(
      page.getByRole("tab", { name: "Chat", exact: true })
    ).toBeVisible({ timeout: 30000 });
    await expect(page).toHaveURL(new RegExp(`/waves/${WAVE}$`));
    await expect(
      waveTabStrip(page).getByRole("tab", { name: /^Competitions/ })
    ).toHaveCount(0);
    await expect(
      page.getByRole("heading", {
        name: /Parallel Alpha|Parallel Beta/,
        level: 1,
      })
    ).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
  });

  test("resolves legacy desktop and simulated app entry and keeps selection failure recoverable in shared chat", async ({
    page,
  }, testInfo) => {
    await installCompetitionApi(page);
    const mobile = testInfo.project.name === "web-mobile-chromium";
    if (mobile) {
      await installSurfaceSimulation(
        page.context(),
        "capacitor-ios-sim",
        testInfo.project.use.baseURL
      );
    }
    // Desktop retains the old alias; mobile app entry uses the canonical wave route.
    await page.goto(
      mobile
        ? `/waves/${WAVE}?tab=leaderboard`
        : `/my-stream?wave=${WAVE}&tab=leaderboard`
    );
    await expect(page).toHaveURL(
      /competitions\/alpha\?tab=leaderboard&default=1$/,
      {
        timeout: 30000,
      }
    );
    await expect(
      page.getByText("Immutable alpha entry content", { exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("main").locator("[data-competition-detail]")
    ).toHaveCount(0);
    if (mobile) {
      const navigation = page.getByRole("navigation", {
        name: "Wave sections",
        exact: true,
      });
      await expect(navigation).toHaveCount(1);
      await expect(
        navigation.getByRole("button", { name: "Leaderboard", exact: true })
      ).toHaveAttribute("aria-current", "true");
      await expect(
        page.getByRole("main").locator('[data-competition-navigation="detail"]')
      ).toHaveCount(0);
      await page.screenshot({
        path: testInfo.outputPath("flat-default-native-app.png"),
        fullPage: true,
      });
    }
    await page.route("**/v3/waves/**/default-competition", (route) =>
      route.fulfill({ status: 503, json: { message: "Unavailable" } })
    );
    await page.goto(`/waves/${WAVE}`);
    await expect(
      page.getByText("6529-composer-preview", { exact: false }).first()
    ).toBeVisible({ timeout: 30000 });
    await expect(page).toHaveURL(new RegExp(`/waves/${WAVE}$`));
    await expect(
      page.getByRole(mobile ? "button" : "tab", { name: "Chat", exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Save vote", exact: true })
    ).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
  });

  test("keeps failed deep links inside a recoverable competition state", async ({
    page,
  }) => {
    await installCompetitionApi(page);
    await page.goto(`${ROOT}/missing`);
    await expect(
      page.getByText(/This competition could not be loaded/)
    ).toBeVisible({ timeout: 30000 });
    await expect(
      page.getByRole("tab", { name: "Chat", exact: true })
    ).toBeVisible({ timeout: 30000 });
    await expect(
      page.getByRole("button", { name: "Try again", exact: true })
    ).toBeVisible({ timeout: 30000 });
    await expect(
      page.getByRole("button", { name: "Save vote", exact: true })
    ).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
  });
});

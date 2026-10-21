import { writeFile } from "node:fs/promises";
import composerSandboxConstants from "../support/composerSandboxConstants.json";
import { installSurfaceSimulation } from "../support/surfaceSimulation";
import type { Frame, Locator, Page, WebSocketRoute } from "@playwright/test";
import { expectCompetitionScroll } from "../support/competitionScroll";
import {
  monitorRememberedLeaderboard,
  retainDesktopWaveSidebar,
} from "../support/waveNavigationContinuity";
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

async function expectSheetTop(sheet: Locator, top: number) {
  await expect
    .poll(async () => {
      const header = await sheet
        .getByTestId("mobile-dialog-header")
        .boundingBox();
      return header ? Math.abs(header.y - top) : Number.POSITIVE_INFINITY;
    })
    .toBeLessThanOrEqual(1);
}

async function swipeVertically(page: Page, target: Locator, distance: number) {
  await target.click({ trial: true });
  const box = await target.boundingBox();
  expect(box).not.toBeNull();
  const x = box!.x + box!.width / 2;
  const y = box!.y + Math.min(box!.height / 2, 120);
  const touch = await page.context().newCDPSession(page);
  try {
    await touch.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x, y, id: 1 }],
    });
    for (const fraction of [0.2, 0.5, 0.8, 1]) {
      await touch.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x, y: y + distance * fraction, id: 1 }],
      });
    }
    await touch.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
  } finally {
    await touch.detach();
  }
}
async function openNewCompetition(page: Page) {
  await page.getByRole("link", { name: "Competition", exact: true }).click();
}
async function selectCompetitionFilter(page: Page, name: string) {
  const more = page.getByRole("button", { name: "More tabs", exact: true });
  const tab = page.getByRole("tab", { name, exact: true });
  await expect(more.or(tab)).toBeVisible();
  if (await more.isVisible()) {
    await more.click();
    await page.getByRole("menuitem", { name, exact: true }).click();
  } else {
    await tab.click();
  }
}
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
      entry_id:
        url.searchParams.get("entry_id") ??
        (resource.startsWith("entries/") ? resource.split("/")[1] : null),
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
          drop_type: "CHAT",
          title: `Recorded ${owner.id} entry`,
          content: `Immutable ${owner.id} entry content`,
        },
      },
    });
  });
  await page.route("**/v2/drops?**", async (route) => {
    const ids =
      new URL(route.request().url()).searchParams.get("ids")?.split(",") ?? [];
    const owners = competitions.filter((item) =>
      ids.includes(entryDropId(item.id))
    );
    if (!owners.length) return route.fallback();
    const response = await route.fetch();
    const body = await response.json();
    return route.fulfill({
      response,
      json: {
        ...body,
        data: [
          ...body.data,
          ...owners.map((owner) => ({
            ...entryFixture.drops[0],
            id: entryDropId(owner.id),
            wave: entryFixture.wave,
            drop_type: "CHAT",
            title: `Recorded ${owner.id} entry`,
            content: `Immutable ${owner.id} entry content`,
          })),
        ],
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

async function openAppearanceDraft(
  page: Page,
  viewport: { width: number; height: number }
) {
  const sandbox = await installCompetitionApi(page);
  await page.setViewportSize(viewport);
  await page.goto(`${ROOT}/new`);
  const name = page.getByLabel("Competition name", { exact: true });
  await name.fill("Appearance layout draft");
  await expect.poll(() => sandbox.requests.length).toBe(1);
  const footer = page
    .getByRole("button", { name: "Close editor", exact: true })
    .locator("..");
  return { name, footer };
}

test.describe("Native competition sandbox @auth @medium @local-only", () => {
  test("repairs live state after a refresh marker and a server normal close", async ({
    page,
  }) => {
    const sockets: WebSocketRoute[] = [];
    const apiPort = new URL(
      getSandboxApiOrigin(process.env["PLAYWRIGHT_BASE_URL"])
    ).port;
    await page.routeWebSocket(
      (url) => url.port === apiPort,
      (socket) => {
        sockets.push(socket);
        socket.onMessage((message) => {
          const frame = JSON.parse(String(message)) as { type?: string };
          if (frame.type === "AUTHENTICATE")
            socket.send(JSON.stringify({ type: "AUTHENTICATED", data: {} }));
          if (frame.type === "SYNC_NOTIFICATION_IDENTITIES")
            socket.send(
              JSON.stringify({
                type: "NOTIFICATION_IDENTITIES_SYNCED",
                data: { profile_ids: [PROFILE] },
              })
            );
        });
      }
    );
    await installCompetitionApi(page);
    let reads = 0;
    page.on("request", (request) => {
      if (new URL(request.url()).pathname.endsWith("/competitions/alpha"))
        reads++;
    });
    await page.goto(`${ROOT}/alpha`);
    await expect(
      page.getByText("Immutable alpha entry content", { exact: true })
    ).toBeVisible({ timeout: 30000 });
    await expect.poll(() => sockets.length).toBeGreaterThan(0);
    const beforeMarker = reads;
    sockets[sockets.length - 1]!.send(
      JSON.stringify({ type: "RESYNC_REQUIRED", data: {} })
    );
    await expect
      .poll(() => reads, { timeout: 15000 })
      .toBeGreaterThan(beforeMarker);
    const beforeClose = reads;
    const connectionCount = sockets.length;
    sockets[sockets.length - 1]!.close({
      code: 1000,
      reason: "Listener recovery",
    });
    await expect
      .poll(() => sockets.length, { timeout: 15000 })
      .toBeGreaterThan(connectionCount);
    // No competition event is sent after reconnect: recovery itself must refetch.
    await expect
      .poll(() => reads, { timeout: 15000 })
      .toBeGreaterThan(beforeClose);
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== testInfo.expectedStatus) {
      const failurePath = testInfo.outputPath(
        "competition-sandbox-failure.png"
      );
      await page.screenshot({ path: failurePath });
      await testInfo.attach("competition-sandbox-failure", {
        path: failurePath,
        contentType: "image/png",
      });
    }
    // Let fixture responses finish before Playwright disposes their request context.
    await page.unrouteAll({ behavior: "wait" });
  });
  useLocalSandboxMutationGuard(
    test,
    "PLAYWRIGHT_AUTH_SANDBOX",
    "Native competition tests require an isolated local mock API."
  );
  for (const app of [false, true]) {
    test(`keeps vote lists readable in the ${app ? "app" : "web"} layout`, async ({
      page,
    }, testInfo) => {
      const mobile = testInfo.project.name === "web-mobile-chromium";
      test.skip(app && !mobile, "The app variant uses the mobile viewport.");
      if (!mobile) await page.setViewportSize({ width: 1728, height: 1000 });
      const sandbox = await installCompetitionApi(page, false, false);
      if (app)
        await installSurfaceSimulation(
          page.context(),
          "capacitor-ios-sim",
          testInfo.project.use.baseURL
        );
      const profiles = [
        {
          id: "layout-positive",
          handle: "long-voter-handle-for-layout-checks",
        },
        { id: "layout-negative", handle: "downvoter" },
      ];
      let releaseVoters!: () => void;
      let releaseProfile!: () => void;
      let releaseActivity!: () => void;
      const votersGate = new Promise<void>((resolve) => {
        releaseVoters = resolve;
      });
      const profileGate = new Promise<void>((resolve) => {
        releaseProfile = resolve;
      });
      const activityGate = new Promise<void>((resolve) => {
        releaseActivity = resolve;
      });
      for (const profile of profiles) {
        await page.route(`**/identities/${profile.id}`, async (route) => {
          if (profile.id === profiles[0]!.id) await profileGate;
          await route.fulfill({
            json: { ...profile, pfp: null, primary_wallet: null },
          });
        });
      }
      await page.route(
        "**/v3/waves/*/competitions/alpha/voters?**",
        async (route) => {
          await votersGate;
          await route.fulfill({
            json: pageResult([
              {
                profile_id: profiles[0]!.id,
                votes: 123456789,
                credit_spent: 123456789,
              },
              { profile_id: profiles[1]!.id, votes: -1000, credit_spent: 1000 },
            ]),
          });
        }
      );
      await page.route(
        "**/v3/waves/*/competitions/alpha/activity?**",
        async (route) => {
          await activityGate;
          await route.fulfill({
            json: [0, 5000, -1000].map((value, index) => ({
              id: `layout-log-${index}`,
              action: "DROP_VOTE_EDIT",
              wave_id: WAVE,
              drop_id: entryDropId("alpha"),
              invoker: { ...profiles[0], pfp: null },
              drop_author: {
                id: "creator",
                handle: "long-drop-creator-handle",
                pfp: null,
              },
              created_at: Date.now(),
              contents: {
                oldVote: value,
                newVote: index ? -1234567 : 1234567,
                reason: index === 2 ? "CREDIT_OVERSPENT" : null,
              },
            })),
          });
        }
      );
      const voters = page.getByRole("tabpanel", {
        name: "All votes",
        exact: true,
      });
      let pendingVoterHeight = 0;
      try {
        await page.goto(`${ROOT}/alpha?tab=votes&voteTab=all`);
        await expect(voters.getByRole("status")).toHaveText(
          "Loading competition…"
        );
        const selectedTab = page.getByRole("tab", {
          name: "All votes",
          exact: true,
        });
        await expect(selectedTab).toHaveCSS("height", "32px");
        await expect(selectedTab).toHaveCSS("border-radius", "9999px");
        await expect(selectedTab).toHaveCSS("border-bottom-width", "0px");
        await expect(selectedTab).toHaveCSS("font-size", "12px");
        await expect(
          page
            .getByRole("tab", { name: "All votes", exact: true })
            .locator("../../..")
        ).toHaveCSS("background-color", "rgb(19, 19, 22)");
        await expect(selectedTab).toHaveCSS("padding-left", "12px");
        await expect(
          page
            .getByRole("tab", { name: "All votes", exact: true })
            .locator("..")
        ).toHaveCSS("column-gap", "10px");
        const skeletons = voters.getByTestId("competition-voter-skeleton");
        await expect(skeletons).toHaveCount(6);
        await page.emulateMedia({ reducedMotion: "reduce" });
        await expect(skeletons.first()).toHaveCSS("animation-name", "none");
        await expectNoHorizontalOverflow(page);
        await page.screenshot({
          path: testInfo.outputPath("all-votes-loading.png"),
        });
        releaseVoters();
        await expect(
          voters.getByRole("link", { name: profiles[1]!.handle, exact: true })
        ).toBeVisible();
        await expect(skeletons).toHaveCount(1);
        pendingVoterHeight = (await skeletons.first().boundingBox())!.height;
        await expect(voters.getByRole("status")).toHaveCount(0);
      } finally {
        releaseVoters();
        releaseProfile();
      }
      await expect(
        voters.getByRole("link", { name: profiles[0]!.handle, exact: true })
      ).toBeVisible();
      const loadedVoterRow = voters
        .getByRole("link", {
          name: profiles[0]!.handle,
          exact: true,
        })
        .locator("../..");
      expect((await loadedVoterRow.boundingBox())!.height).toBe(
        pendingVoterHeight
      );
      await expect(
        voters.getByText("+123,456,789", { exact: true })
      ).toBeVisible();
      await expect(voters.getByText("-1,000", { exact: true })).toBeVisible();
      const totals = voters.getByText("123,456,789", { exact: true });
      await expect(totals).toBeInViewport();
      const totalBox = await voters
        .getByText("1,000", { exact: true })
        .boundingBox();
      const totalLabelBox = await voters
        .getByText("TDH Total", { exact: true })
        .nth(1)
        .boundingBox();
      expect(totalBox).not.toBeNull();
      expect(totalLabelBox).not.toBeNull();
      expect(Math.abs(totalBox!.y - totalLabelBox!.y)).toBeLessThanOrEqual(2);
      expect(totalLabelBox!.x).toBeGreaterThan(totalBox!.x + totalBox!.width);
      await expectNoHorizontalOverflow(page);
      await page.screenshot({
        path: testInfo.outputPath("all-votes-layout.png"),
        animations: "disabled",
      });

      const activity = page.getByRole("tabpanel", {
        name: "Activity",
        exact: true,
      });
      let pendingActivityHeight = 0;
      try {
        await page.getByRole("tab", { name: "Activity", exact: true }).click();
        await expect(activity.getByRole("status")).toHaveText(
          "Loading competition…"
        );
        const skeletons = activity.getByTestId("competition-activity-skeleton");
        await expect(skeletons).toHaveCount(6);
        await expect(skeletons.first()).toHaveCSS("animation-name", "none");
        pendingActivityHeight = (await skeletons.first().boundingBox())!.height;
        await expectNoHorizontalOverflow(page);
        await page.screenshot({
          path: testInfo.outputPath("activity-loading.png"),
        });
        if (!mobile) {
          for (const width of [640, 767, 768]) {
            await page.setViewportSize({ width, height: 1000 });
            await expect
              .poll(() =>
                skeletons
                  .first()
                  .evaluate(
                    (element) =>
                      getComputedStyle(element).gridTemplateColumns.split(" ")
                        .length
                  )
              )
              .toBe(width < 768 ? 2 : 4);
            await expectNoHorizontalOverflow(page);
            await page.screenshot({
              path: testInfo.outputPath(`activity-loading-${width}.png`),
            });
          }
          await page.setViewportSize({ width: 1728, height: 1000 });
        }
      } finally {
        releaseActivity();
      }
      const voter = activity
        .getByRole("link", { name: profiles[0]!.handle, exact: true })
        .first();
      const creator = activity
        .getByRole("link", { name: "long-drop-creator-handle", exact: true })
        .first();
      const viewDrop = activity
        .getByRole("button", { name: "View drop in chat", exact: true })
        .first();
      await expect(voter).toBeVisible();
      const activityRow = activity
        .getByRole("link", { name: profiles[0]!.handle, exact: true })
        .first()
        .locator("..");
      expect((await activityRow.boundingBox())!.height).toBe(
        pendingActivityHeight
      );
      await expect(activity.getByRole("status")).toHaveCount(0);
      await expect(creator).toBeVisible();
      await expect(
        activity.getByText("System Adjustment", { exact: true })
      ).toBeVisible();
      const voterBox = await voter.boundingBox();
      const voteBox = await activity
        .getByText("1,234,567 TDH", { exact: true })
        .boundingBox();
      const creatorBox = await creator.boundingBox();
      const buttonBox = await viewDrop.boundingBox();
      expect(voterBox).not.toBeNull();
      expect(voteBox).not.toBeNull();
      expect(creatorBox).not.toBeNull();
      expect(buttonBox?.width).toBeGreaterThanOrEqual(40);
      expect(buttonBox?.height).toBeGreaterThanOrEqual(40);
      if (mobile) {
        expect(voteBox!.y).toBeGreaterThan(voterBox!.y + voterBox!.height);
        expect(creatorBox!.y).toBeGreaterThan(voteBox!.y + voteBox!.height);
      } else
        expect(
          Math.abs(
            creatorBox!.y +
              creatorBox!.height / 2 -
              voterBox!.y -
              voterBox!.height / 2
          )
        ).toBeLessThanOrEqual(1);
      await expectNoHorizontalOverflow(page);
      await page.screenshot({
        path: testInfo.outputPath("activity-layout.png"),
        animations: "disabled",
      });
      if (!mobile) {
        for (const width of [639, 640, 767, 768]) {
          await page.setViewportSize({ width, height: 1000 });
          const responsiveVoter = await voter.boundingBox();
          const responsiveCreator = await creator.boundingBox();
          expect(responsiveVoter).not.toBeNull();
          expect(responsiveCreator).not.toBeNull();
          if (width < 768) {
            const responsiveVote = await activity
              .getByText("1,234,567 TDH", { exact: true })
              .boundingBox();
            expect(responsiveVote).not.toBeNull();
            expect(responsiveCreator!.y).toBeGreaterThan(
              responsiveVote!.y + responsiveVote!.height
            );
          } else {
            expect(
              Math.abs(
                responsiveCreator!.y +
                  responsiveCreator!.height / 2 -
                  responsiveVoter!.y -
                  responsiveVoter!.height / 2
              )
            ).toBeLessThanOrEqual(1);
          }
          await expectNoHorizontalOverflow(page);
          await page.screenshot({
            path: testInfo.outputPath(`activity-${width}.png`),
            animations: "disabled",
          });
        }
      }
      await viewDrop.focus();
      await expect(viewDrop).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(new RegExp(`drop=${entryDropId("alpha")}`));
      expect(sandbox.requests).toHaveLength(0);
    });
  }

  test("loads voter profiles near the viewport and retries a failed profile in its row", async ({
    page,
  }, testInfo) => {
    const sandbox = await installCompetitionApi(page, false, false);
    const requestedProfiles: string[] = [];
    const voters = Array.from({ length: 50 }, (_, index) => ({
      profile_id: `nearby-voter-${index + 1}`,
      votes: 100000 + index,
      credit_spent: 100000 + index,
    }));
    await page.route("**/v3/waves/*/competitions/alpha/voters?**", (route) =>
      route.fulfill({ json: pageResult(voters) })
    );
    let failProfile = true;
    await page.route("**/identities/nearby-voter-*", (route) => {
      const id = new URL(route.request().url()).pathname.split("/").at(-1)!;
      requestedProfiles.push(id);
      if (id === "nearby-voter-4" && failProfile) {
        return route.fulfill({
          status: 429,
          headers: { "Retry-After": "1" },
          json: { error: "Rate limit exceeded" },
        });
      }
      return route.fulfill({
        json: { id, handle: id, pfp: null, primary_wallet: null },
      });
    });
    await page.goto(`${ROOT}/alpha?tab=votes&voteTab=all`);
    const panel = page.getByRole("tabpanel", {
      name: "All votes",
      exact: true,
    });
    await expect(
      panel.getByRole("link", { name: "nearby-voter-1", exact: true })
    ).toBeVisible();
    const failure = panel.getByRole("alert");
    await expect(failure).toContainText("Profile unavailable");
    await expect(failure).toContainText("100,003");
    await expect(panel).not.toContainText(
      "This competition could not be loaded"
    );
    const retry = failure.getByRole("button", {
      name: "Retry profile at rank 4",
    });
    await expect(retry).toHaveCSS("height", "32px");
    await expectNoHorizontalOverflow(page);
    await page.screenshot({
      path: testInfo.outputPath("voter-profile-retry.png"),
    });
    expect(requestedProfiles.length).toBeLessThan(25);
    expect(requestedProfiles).not.toContain("nearby-voter-50");

    failProfile = false;
    await retry.click();
    await expect(
      panel.getByRole("link", { name: "nearby-voter-4", exact: true })
    ).toBeVisible();
    await expect(failure).toHaveCount(0);
    expect(
      requestedProfiles.filter((id) => id === "nearby-voter-4")
    ).toHaveLength(2);
    await panel
      .getByTestId("competition-voter-skeleton")
      .last()
      .scrollIntoViewIfNeeded();
    await expect(
      panel.getByRole("link", { name: "nearby-voter-50", exact: true })
    ).toBeVisible();
    await expect(page).toHaveURL(new RegExp("tab=votes&voteTab=all"));
    expect(sandbox.requests).toHaveLength(0);
  });

  for (const legacy of [false, true]) {
    test(`fills the available width with ${legacy ? "legacy" : "native"} My Votes`, async ({
      page,
    }, testInfo) => {
      const sandbox = await installCompetitionApi(page);
      if (legacy) {
        await sandbox.legacyPrimary("alpha");
        const response = await page.request.get(
          `${getSandboxApiOrigin(process.env["PLAYWRIGHT_BASE_URL"])}/api/v2/waves/${WAVE}/drops`
        );
        expect(response.ok()).toBe(true);
        const fixture = await response.json();
        await page.route(`**/api/v2/waves/${WAVE}/leaderboard?**`, (route) =>
          route.fulfill({
            json: {
              wave: fixture.wave,
              drops: [
                {
                  ...fixture.drops[0],
                  drop_type: "SUBMISSION",
                  title: "My voted artwork",
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
                },
              ],
              count: 1,
              page: 1,
              next: false,
            },
          })
        );
      }
      const selected = competition("alpha", "Parallel Alpha");
      selected.permissions.submit = false;
      await page.route("**/v3/waves/*/competitions/alpha", (route) =>
        route.fulfill({ json: selected })
      );
      await page.route("**/v3/waves/*/competitions/alpha/pauses?**", (route) =>
        route.fulfill({
          json: pageResult([{ start_time: Date.now() - 1000, end_time: null }]),
        })
      );
      if (testInfo.project.name === "web-desktop-chromium")
        await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto(`${ROOT}/alpha?tab=votes`);
      const panel = page.getByRole("tabpanel", {
        name: "My Votes",
        exact: true,
      });
      const row = panel.getByRole("article").first();
      await expect(row).toBeVisible();
      const wavePane = page
        .getByRole("main")
        .locator("#my-stream-wave-tabpanel-my_votes");
      await expect(wavePane).toBeVisible();
      const pills = page
        .getByRole("tab", { name: "My Votes", exact: true })
        .locator("../../..");
      await expect(pills).toHaveCSS("padding-top", "6px");
      await expect(pills).toHaveCSS("padding-bottom", "6px");
      const submissionNotice = page.getByText(
        "Entries are currently closed or you are not eligible to submit.",
        { exact: true }
      );
      await expect(submissionNotice).toHaveCount(0);
      const pauseNotice = page.getByText(
        "Decisions are paused. Entries and voting continue within their configured periods.",
        { exact: true }
      );
      await expect(pauseNotice).toBeVisible();
      const pillBounds = (await pills.boundingBox())!;
      expect((await pauseNotice.boundingBox())!.y).toBeGreaterThanOrEqual(
        pillBounds.y + pillBounds.height
      );
      expect(
        Math.abs(
          (await pills.boundingBox())!.y - (await wavePane.boundingBox())!.y
        )
      ).toBeLessThanOrEqual(1);
      const available = await wavePane.evaluate((element) => {
        return {
          x: element.getBoundingClientRect().x,
          width: element.clientWidth,
        };
      });
      const bounds = (await row.boundingBox())!;
      expect(Math.abs(bounds.x - available.x)).toBeLessThanOrEqual(1);
      expect(Math.abs(bounds.width - available.width)).toBeLessThanOrEqual(1);
      const selectAll = panel.getByRole("button", {
        name: "Select all",
        exact: true,
      });
      const resetVotes = panel.getByRole("button", {
        name: "Reset votes",
        exact: true,
      });
      await expect(selectAll).toBeVisible();
      await expect(resetVotes).toBeDisabled();
      const createStyle = await page
        .getByRole("button", { name: "Open create menu", exact: true })
        .evaluate((button) => {
          const style = getComputedStyle(button.querySelector("span")!);
          return Object.fromEntries(
            [
              "height",
              "background-color",
              "border-color",
              "border-radius",
              "font-size",
              "font-weight",
              "padding-left",
              "padding-right",
              "color",
            ].map((property) => [property, style.getPropertyValue(property)])
          );
        });
      for (const name of ["Select all", "Reset votes"]) {
        const action = panel.getByRole("button", { name, exact: true });
        for (const [property, value] of Object.entries(createStyle)) {
          await expect(
            panel.getByRole("button", { name, exact: true }).locator("span")
          ).toHaveCSS(property, value);
        }
        await expect(action).toHaveCSS(
          "height",
          testInfo.project.name === "web-mobile-chromium" ? "44px" : "32px"
        );
      }
      await selectAll.click();
      await expect(
        panel.getByRole("button", { name: "Deselect all", exact: true })
      ).toBeVisible();
      await expect(
        panel.getByRole("button", { name: "Reset 1 vote", exact: true })
      ).toBeEnabled();
      await page.keyboard.press("Tab");
      for (const name of ["Open create menu", "Deselect all", "Reset 1 vote"]) {
        const action = page.getByRole("button", { name, exact: true });
        await action.focus();
        await expect(action).toBeFocused();
        const pill = page
          .getByRole("button", { name, exact: true })
          .locator("span")
          .first();
        await expect(pill).toHaveCSS("outline-style", "solid");
        await expect(pill).toHaveCSS("outline-width", "2px");
        await expect(pill).toHaveCSS("outline-color", "rgb(132, 173, 255)");
      }
      await panel
        .getByRole("button", { name: "Deselect all", exact: true })
        .click();
      await expect(resetVotes).toBeDisabled();
      await expectNoHorizontalOverflow(page);
      await page.screenshot({
        path: testInfo.outputPath("my-votes-full-width.png"),
      });
      if (!legacy && testInfo.project.name === "web-desktop-chromium") {
        await page.setViewportSize({ width: 320, height: 900 });
        for (const name of ["My Votes", "All votes", "Activity"]) {
          await expect(
            page.getByRole("tab", { name, exact: true })
          ).toBeInViewport({ ratio: 1 });
        }
        await expectNoHorizontalOverflow(page);
      }
      for (const name of ["All votes", "Activity"]) {
        await page.getByRole("tab", { name, exact: true }).click();
        await expect(
          page.getByRole("tabpanel", { name, exact: true })
        ).toBeVisible();
        await expect(submissionNotice).toHaveCount(0);
      }
      if (!legacy) {
        await page.goto(`${ROOT}/alpha?tab=leaderboard`);
        await expect(submissionNotice).toBeVisible();
      }
      expect(sandbox.requests).toHaveLength(0);
    });
  }

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
      const activity = page.getByRole("tabpanel", {
        name: "Activity",
        exact: true,
      });
      const dropControls = activity.getByRole("button", {
        name: "View drop in chat",
        exact: true,
      });
      await expect(dropControls).toHaveCount(30);
      await expect(dropControls.first()).toBeVisible();
      await expectCompetitionScroll(
        page,
        page
          .getByRole("main")
          .locator("#competition-alpha-votes")
          .locator(".."),
        dropControls.last()
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
        dialog.getByRole("button", { name: "Back", exact: true })
      ).toHaveCount(0);
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
      const content = page
        .getByRole("dialog")
        .locator(".tw-overflow-y-auto")
        .filter({
          has: page.getByRole("heading", { name: "Chat", exact: true }),
        })
        .last();
      await swipeVertically(page, content, -90);
      await expect
        .poll(() => content.evaluate((element) => element.scrollTop))
        .toBeGreaterThan(0);
      await expect(
        dialog.getByRole("button", { name: "Close", exact: true })
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
      const header = dialog.getByTestId("mobile-dialog-header");
      await swipeVertically(page, header, 10);
      await expect(header).toBeVisible();
      await swipeVertically(page, header, 90);
      await expect(dialog).toHaveCount(0);
      await expect(page).toHaveURL(destination);
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
  test("keeps native wave identity compact without a description", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "web-mobile-chromium",
      "Native touch header layout."
    );
    await installCompetitionApi(page);
    await installSurfaceSimulation(
      page.context(),
      "capacitor-ios-sim",
      testInfo.project.use.baseURL
    );
    const response = await page.request.get(
      `${getSandboxApiOrigin(process.env["PLAYWRIGHT_BASE_URL"])}/api/waves/${WAVE}`
    );
    expect(response.ok()).toBe(true);
    const wave = await response.json();
    wave.parent_wave = {
      ...wave,
      id: PROFILE,
      name: "Follow the repository with an intentionally long parent wave name",
      pfp: null,
      creator: wave.author,
      description_drop: { contents: null, media: [] },
    };
    wave.description_drop.parts = [];
    await page.route(`**/api/waves/${WAVE}`, (route) =>
      route.fulfill({ json: wave })
    );
    await page.goto(`${ROOT}/beta?tab=votes`);
    const title = page.getByRole("button", {
      name: /^About Local Composer Sandbox Wave/,
    });
    const parent = page
      .getByRole("navigation", { name: "Wave hierarchy", exact: true })
      .first();
    for (const width of [320, 430, 768]) {
      await page.setViewportSize({ width, height: 900 });
      await expect(title).toBeVisible();
      await expect(parent).toBeVisible();
      await expect
        .poll(async () => {
          const parentBox = await parent.boundingBox();
          const titleBox = await title.boundingBox();
          if (!parentBox || !titleBox) return Number.POSITIVE_INFINITY;
          return Math.abs(titleBox.y - parentBox.y - parentBox.height);
        })
        .toBeLessThanOrEqual(1);
      await expect
        .poll(() =>
          title.evaluate((element) => element.getBoundingClientRect().height)
        )
        .toBe(24);
      await expect
        .poll(() =>
          parent.evaluate(
            (element) => element.scrollWidth - element.clientWidth
          )
        )
        .toBeLessThanOrEqual(1);
      await expectNoHorizontalOverflow(page);
      await page.screenshot({
        path: testInfo.outputPath(`compact-native-header-${width}.png`),
      });
    }
  });
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
      page.getByRole("link", { name: "Competition", exact: true })
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

  test("renders frozen CHAT deep links with submission voting controls", async ({
    page,
  }, testInfo) => {
    const sandbox = await installCompetitionApi(page);
    await page.goto(`${ROOT}/alpha?drop=${entryDropId("alpha")}`);
    // The development-only indicator can cover the mobile Save vote button.
    await page.addStyleTag({
      content: "nextjs-portal { display: none !important; }",
    });
    const detail = page
      .getByRole("button", { name: "Close panel", exact: true })
      .locator("xpath=ancestor::div[@data-video-viewport][1]");
    await expect(
      detail.getByText("Recorded alpha entry", { exact: true })
    ).toBeVisible({ timeout: 30000 });
    await expect(
      detail.getByRole("button", { name: "Vote", exact: true })
    ).toBeVisible();
    // Finish the backing leaderboard's initial lookup before measuring modal requests.
    await expect(
      page
        .getByRole("main", { includeHidden: true })
        .locator('[data-competition-entry="entry-alpha"]')
    ).toBeAttached({ timeout: 30000 });
    let contextLookups = 0;
    await page.route(
      `**/v3/waves/${WAVE}/drops/${entryDropId("alpha")}/competition-context`,
      (route) => {
        contextLookups++;
        return route.fulfill({ status: 503, json: { message: "Unavailable" } });
      }
    );
    await detail.getByRole("button", { name: "Vote", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Vote for this artwork" });
    const save = dialog.getByRole("button", { name: "Save vote", exact: true });
    await expect(save).toBeVisible();
    expect(contextLookups).toBe(0);
    await expect(dialog.getByText(/Enter a whole number between/)).toHaveCount(
      0
    );
    for (const limit of ["-100", "+100"]) {
      const label = dialog.getByText(limit, { exact: true });
      await expect(label).toBeVisible();
      await expect
        .poll(async () => {
          const labelBox = await label.boundingBox();
          const saveBox = await save.boundingBox();
          return labelBox && saveBox
            ? saveBox.y - labelBox.y - labelBox.height
            : Number.NEGATIVE_INFINITY;
        })
        .toBeGreaterThanOrEqual(12);
    }
    await page.screenshot({
      path: testInfo.outputPath("competition-vote-slider.png"),
    });
    await save.click({ trial: true });
    await expectNoHorizontalOverflow(page);
    await dialog.getByRole("button", { name: "Numeric", exact: true }).click();
    const input = dialog.getByRole("spinbutton", { name: "Your vote" });
    await expect(input).toHaveAttribute("min", "-100");
    await expect(input).toHaveAttribute("max", "100");
    await expect(dialog.getByText(/Enter a whole number between/)).toHaveCount(
      0
    );
    await input.fill("-25");
    let holdRefresh = false;
    let releaseRefresh!: () => void;
    const refreshGate = new Promise<void>((resolve) => {
      releaseRefresh = resolve;
    });
    await page.route("**/api/**", async (route) => {
      const request = route.request();
      if (request.method() === "PUT" && request.url().endsWith("/votes/me")) {
        holdRefresh = true;
      } else if (holdRefresh && request.method() === "GET") {
        await refreshGate;
      }
      return route.fallback();
    });
    try {
      await save.click();
      await expect(dialog).toHaveCount(0);
      expect(sandbox.requests).toHaveLength(1);
      expect(sandbox.requests[0]?.body).toMatchObject({ value: -25 });
      await detail.getByRole("button", { name: "Vote", exact: true }).click();
      await dialog
        .getByRole("button", { name: "Numeric", exact: true })
        .click();
      await expect(input).toHaveValue("-25");
      await expect(dialog.getByText("75", { exact: true })).toBeVisible();
      await expect(
        dialog.getByText("Loading competition…", { exact: true })
      ).toHaveCount(0);
      const refreshed = page.waitForResponse(
        (response) =>
          response.url().includes("/competitions/alpha/credits/me") &&
          response.ok()
      );
      releaseRefresh();
      await refreshed;
      await expect(input).toHaveValue("-25");
      await expect(dialog.getByText("75", { exact: true })).toBeVisible();
    } finally {
      releaseRefresh();
    }
  });

  test("reuses competition entry context when voting from list and grid cards", async ({
    page,
  }) => {
    await installCompetitionApi(page);
    await page.goto(`${ROOT}/alpha`);
    const card = page
      .getByRole("main")
      .locator('[data-competition-entry="entry-alpha"]');
    await expect(
      card.getByRole("button", { name: "Vote", exact: true })
    ).toBeVisible({ timeout: 30000 });
    let contextLookups = 0;
    await page.route(
      `**/v3/waves/${WAVE}/drops/${entryDropId("alpha")}/competition-context`,
      (route) => {
        contextLookups++;
        return route.fulfill({ status: 503, json: { message: "Unavailable" } });
      }
    );
    for (const view of ["List view", "Grid view"]) {
      await page.getByRole("tab", { name: view, exact: true }).click();
      await card.getByRole("button", { name: "Vote", exact: true }).click();
      const dialog = page.getByRole("dialog", {
        name: "Vote for this artwork",
      });
      await expect(
        dialog.getByRole("button", { name: "Save vote", exact: true })
      ).toBeVisible();
      expect(contextLookups).toBe(0);
      await dialog.getByRole("button", { name: /^Close(?: modal)?$/ }).click();
      await expect(dialog).toHaveCount(0);
    }
  });

  test("saves and resumes a native draft through the existing configuration controls", async ({
    page,
  }) => {
    const sandbox = await installCompetitionApi(page);
    await page.goto(ROOT);
    await openNewCompetition(page);
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
    await selectCompetitionFilter(page, "Drafts");
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

  test("fades overflowing wave tabs without covering Create or changing selection", async ({
    page,
  }, testInfo) => {
    const app = testInfo.project.name === "web-mobile-chromium";
    await installCompetitionApi(page);
    if (app)
      await installSurfaceSimulation(
        page.context(),
        "capacitor-ios-sim",
        testInfo.project.use.baseURL
      );
    await page.setViewportSize({ width: app ? 390 : 720, height: 900 });
    await page.goto(`${ROOT}/alpha?tab=rules`);
    const selected = page.getByRole(app ? "button" : "tab", {
      name: "Settings",
      exact: true,
    });
    const scroller = page
      .getByRole(app ? "button" : "tab", { name: "Settings", exact: true })
      .locator("xpath=ancestor::div[@data-wave-tabs-scroll]");
    const leftFade = page
      .getByRole(app ? "button" : "tab", { name: "Settings", exact: true })
      .locator("xpath=ancestor::div[@data-wave-tabs-scroll]/..")
      .locator('[data-wave-tabs-fade="left"]');
    const rightFade = page
      .getByRole(app ? "button" : "tab", { name: "Settings", exact: true })
      .locator("xpath=ancestor::div[@data-wave-tabs-scroll]/..")
      .locator('[data-wave-tabs-fade="right"]');
    await expect(selected).toHaveAttribute(
      app ? "aria-current" : "aria-selected",
      "true"
    );
    await expect(selected).toHaveText("Settings");
    await expect
      .poll(() =>
        scroller.evaluate(
          (element) => element.scrollWidth - element.clientWidth
        )
      )
      .toBeGreaterThan(2);
    await scroller.evaluate((element) =>
      element.scrollTo({ left: 0, behavior: "instant" })
    );
    await expect(leftFade).toHaveCSS("opacity", "0");
    await expect(rightFade).toHaveCSS("opacity", "1");
    await expect(rightFade).toHaveCSS("pointer-events", "none");
    const colors = await rightFade.evaluate((element) => {
      let ancestor = element.parentElement;
      while (ancestor) {
        const background = getComputedStyle(ancestor).backgroundColor;
        if (background !== "rgba(0, 0, 0, 0)" && background !== "transparent")
          return {
            background,
            gradient: getComputedStyle(element).backgroundImage,
          };
        ancestor = ancestor.parentElement;
      }
      throw new Error("Tab strip background missing");
    });
    expect(colors.gradient).toContain(colors.background);
    const create = page.getByRole("button", {
      name: "Open create menu",
      exact: true,
    });
    await expect(create).toBeInViewport({ ratio: 1 });
    const fadeBounds = await rightFade.boundingBox();
    const createBounds = await create.boundingBox();
    expect(fadeBounds).not.toBeNull();
    expect(createBounds).not.toBeNull();
    expect(fadeBounds!.x + fadeBounds!.width).toBeLessThanOrEqual(
      createBounds!.x
    );
    await page.screenshot({
      path: testInfo.outputPath("wave-tabs-overflow-fade.png"),
      animations: "disabled",
      style: "nextjs-portal { visibility: hidden; }",
    });
    await scroller.evaluate((element) =>
      element.scrollTo({ left: element.scrollWidth, behavior: "instant" })
    );
    await expect(leftFade).toHaveCSS("opacity", "1");
    await expect(rightFade).toHaveCSS("opacity", "0");
    await expect(selected).toHaveAttribute(
      app ? "aria-current" : "aria-selected",
      "true"
    );
    await expect(selected).toHaveText("Settings");
    await create.click();
    await expect(page.getByText("New curation", { exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect
      .poll(() =>
        scroller.evaluate(
          (element) => element.scrollWidth - element.clientWidth
        )
      )
      .toBeLessThanOrEqual(2);
    await expect(leftFade).toHaveCSS("opacity", "0");
    await expect(rightFade).toHaveCSS("opacity", "0");
    await expect(selected).toHaveAttribute(
      app ? "aria-current" : "aria-selected",
      "true"
    );
    await expect(selected).toHaveText("Settings");
    await expectNoHorizontalOverflow(page);
  });

  test("separates wave and competition creation while preserving the filter pills", async ({
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
    await expect(active).toHaveCSS("height", "32px");
    await expect(active).toHaveCSS("border-radius", "9999px");
    const activePanel = collection.getByRole("tabpanel", {
      name: "Active and upcoming",
      exact: true,
    });
    const firstCard = activePanel.getByRole("listitem").first();
    await expect(firstCard).toBeVisible();
    const panelBounds = await activePanel.boundingBox();
    const cardBounds = await firstCard.boundingBox();
    expect(panelBounds).not.toBeNull();
    expect(cardBounds).not.toBeNull();
    expect(cardBounds!.y - panelBounds!.y).toBeCloseTo(16, 0);
    if (app) {
      const viewport = page.viewportSize();
      await page.setViewportSize({ width: 320, height: 780 });
      const filtersScroller = page
        .getByRole("region", { name: "Competitions", exact: true })
        .locator("[data-competition-filters-scroll]");
      const rightFade = page
        .getByRole("region", { name: "Competitions", exact: true })
        .locator("[data-competition-filters-scroll]")
        .locator("..")
        .locator('[data-wave-tabs-fade="right"]');
      const leftFade = page
        .getByRole("region", { name: "Competitions", exact: true })
        .locator("[data-competition-filters-scroll]")
        .locator("..")
        .locator('[data-wave-tabs-fade="left"]');
      await expect(rightFade).toHaveCSS("opacity", "1");
      await expect(rightFade).toHaveCSS("pointer-events", "none");
      await expect(leftFade).toHaveCSS("opacity", "0");
      await page.screenshot({
        path: testInfo.outputPath("competition-filter-fade.png"),
        animations: "disabled",
        style: "nextjs-portal { visibility: hidden; }",
      });
      const competitionAction = collection.getByRole("link", {
        name: "Competition",
        exact: true,
      });
      await expect(competitionAction).toBeInViewport({ ratio: 1 });
      const filterBounds = await active.boundingBox();
      const actionBounds = await competitionAction.boundingBox();
      expect(filterBounds).not.toBeNull();
      expect(actionBounds).not.toBeNull();
      expect(
        Math.abs(
          filterBounds!.y +
            filterBounds!.height / 2 -
            (actionBounds!.y + actionBounds!.height / 2)
        )
      ).toBeLessThanOrEqual(1);
      await collectionMore.scrollIntoViewIfNeeded();
      await expect(collectionMore).toBeInViewport({ ratio: 1 });
      await expect(rightFade).toHaveCSS("opacity", "0");
      await expect(leftFade).toHaveCSS("opacity", "1");
      await expect(active).toHaveAttribute("aria-selected", "true");
      await expect(
        page.getByRole("button", { name: "Open create menu", exact: true })
      ).toBeInViewport({ ratio: 1 });
      await page.setViewportSize({ width: 430, height: 932 });
      await collectionMore.tap();
      await page.keyboard.press("Escape");
      await expect(collectionMore).toBeFocused();
      await expect(active).toHaveAttribute("aria-selected", "true");
      await collectionMore.press("Enter");
      await page
        .getByRole("menuitem", { name: "Completed", exact: true })
        .tap();
      await expect(collectionMore).toHaveText("Completed");
      await expect(
        collection.getByRole("tabpanel", { name: "Completed", exact: true })
      ).toBeVisible();
      await expect
        .poll(() =>
          filtersScroller.evaluate(
            (element) => element.scrollWidth - element.clientWidth
          )
        )
        .toBeGreaterThan(0);
      await expect
        .poll(async () => {
          const pill = await collectionMore.boundingBox();
          const row = await filtersScroller.boundingBox();
          return Boolean(
            pill &&
            row &&
            pill.x >= row.x - 1 &&
            pill.x + pill.width <= row.x + row.width + 1
          );
        })
        .toBe(true);
      await expect(rightFade).toHaveCSS("opacity", "0");
      await page.screenshot({
        path: testInfo.outputPath("completed-filter-in-view.png"),
        animations: "disabled",
        style: "nextjs-portal { visibility: hidden; }",
      });
      await collectionMore.press("Enter");
      await page.getByRole("menuitem", { name: "Drafts", exact: true }).tap();
      await expect(collectionMore).toHaveText("Drafts");
      await expect(collectionMore).toHaveAttribute("aria-expanded", "false");
      if (viewport) await page.setViewportSize(viewport);
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
    const newCompetition = collection.getByRole("link", {
      name: "Competition",
      exact: true,
    });
    await expect(newCompetition).toBeVisible();
    await expect(newCompetition).toHaveAttribute("href", `${ROOT}/new`);
    const create = page.getByRole("button", {
      name: "Open create menu",
      exact: true,
    });
    await expect(create).toHaveCount(1);
    await expect(create).toHaveText("Create");
    await expect(create).toHaveCSS("height", app ? "44px" : "32px");
    await expect(
      page
        .getByRole("button", { name: "Open create menu", exact: true })
        .locator(":scope > span")
    ).toHaveCSS("height", "32px");
    await create.click();
    const createOptions = app
      ? page.getByRole("dialog", { name: "Create", exact: true })
      : page.getByRole("menu");
    await expect(
      createOptions.getByText("New competition", { exact: true })
    ).toHaveCount(0);
    await expect(
      createOptions.getByText("New curation", { exact: true })
    ).toBeVisible();
    await expect(
      createOptions.getByText("Local Composer Sandbox Wave", { exact: true })
    ).toHaveCount(0);
    if (!app) {
      await expect(createOptions).toHaveCSS("opacity", "1");
      await expect(createOptions).toBeFocused();
      await expect(createOptions).not.toHaveAttribute("aria-activedescendant");
      await expect(page.getByRole("menu").locator("[data-focus]")).toHaveCount(
        0
      );
    }
    await page.screenshot({
      path: testInfo.outputPath("wave-create-menu.png"),
      animations: "disabled",
      style: "nextjs-portal { visibility: hidden; }",
    });
    await page.keyboard.press("Escape");
    await expect(createOptions).toBeHidden();
    await expect(create).toBeFocused();
    if (!app) {
      for (const key of ["Enter", "ArrowDown"]) {
        await create.press(key);
        const curation = createOptions.getByRole("menuitem", {
          name: /^New curation/,
        });
        await expect(curation).toHaveAttribute("data-focus", "");
        await expect(createOptions).toHaveAttribute(
          "aria-activedescendant",
          (await curation.getAttribute("id")) ?? ""
        );
        await page.keyboard.press("Escape");
        await expect(createOptions).toBeHidden();
        await expect(create).toBeFocused();
      }
      await create.click();
      await page.keyboard.press("ArrowDown");
      await expect(
        createOptions.getByRole("menuitem", { name: /^New curation/ })
      ).toHaveAttribute("data-focus", "");
      await page.keyboard.press("Enter");
    } else {
      await create.click();
      await createOptions.getByText("New curation", { exact: true }).click();
    }
    const curationDialog = page.getByRole("dialog", {
      name: "Create curation",
      exact: true,
    });
    await expect(
      curationDialog.getByRole("textbox", { name: "Name", exact: true })
    ).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(1);
    await expect(
      page.getByRole("dialog", { name: "Create", exact: true })
    ).toHaveCount(0);
    const cancelCuration = curationDialog.getByRole("button", {
      name: "Cancel",
      exact: true,
    });
    if (testInfo.project.name === "web-mobile-chromium")
      await expect(cancelCuration).toBeHidden();
    else await expect(cancelCuration).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath("wave-create-curation-handoff.png"),
      animations: "disabled",
      style: "nextjs-portal { visibility: hidden; }",
    });
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expectNoHorizontalOverflow(page);

    // Published competitions share the primary row; Votes owns its secondary tabs.
    await page.goto(`${ROOT}/beta?tab=votes`);
    await expect(
      page.getByRole("link", { name: "Competition", exact: true })
    ).toHaveCount(0);
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
    await expect(mine).toHaveCSS("border-radius", "9999px");
    await expect(mine).toHaveCSS("height", "32px");
    await expect(mine).toHaveCSS("border-bottom-width", "0px");
    if (!app) {
      await expect(
        waveTabStrip(page).getByRole("tab", { name: "Votes", exact: true })
      ).toHaveCSS("border-bottom-width", "2px");
    }
    await mine.focus();
    await page.keyboard.press("ArrowRight");
    await expect(allVotes).toBeFocused();
    await expect(mine).toHaveAttribute("aria-selected", "true");
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

  test("keeps joined waves complete across pagination failure, refresh, and the DMs round trip", async ({
    page,
  }, testInfo) => {
    // This scenario exercises four independent page initializations on both
    // desktop and the simulated native shell.
    test.setTimeout(120000);
    const app = testInfo.project.name === "web-mobile-chromium";
    await installCompetitionApi(page);
    if (app)
      await installSurfaceSimulation(
        page.context(),
        "capacitor-ios-sim",
        testInfo.project.use.baseURL
      );
    const fixture = await page.request.get(
      `${getSandboxApiOrigin(process.env["PLAYWRIGHT_BASE_URL"])}/api/v2/waves/${WAVE}/drops`
    );
    const { wave: overview } = await fixture.json();
    const joined = Array.from({ length: 45 }, (_, index) => ({
      ...overview,
      id: `00000000-0000-4000-8000-${String(index + 700).padStart(12, "0")}`,
      name: `Joined wave ${String(index + 1).padStart(2, "0")}`,
      parent_wave: null,
      has_subwaves: false,
      last_drop_time: Date.now() - index * 1000,
      context_profile_context: {
        ...overview.context_profile_context,
        subscribed: true,
        pinned: false,
        followed_subwaves_count: 0,
      },
    }));
    let failContinuation = true;
    const requested: string[] = [];
    const offsets = new Map([
      ["joined-continuation-alpha", 20],
      ["joined-continuation-beta", 40],
    ]);
    await page.route("**/api/v2/waves/joined?**", async (route) => {
      const cursor = new URL(route.request().url()).searchParams.get("cursor");
      requested.push(cursor ?? "first");
      if (cursor && failContinuation) {
        await route.fulfill({
          status: 503,
          json: { error: "Joined waves temporarily unavailable" },
        });
        return;
      }
      const offset = cursor ? offsets.get(cursor) : 0;
      if (offset === undefined) {
        await route.fulfill({ status: 400, json: { error: "Unknown cursor" } });
        return;
      }
      await route.fulfill({
        json: {
          data: joined.slice(offset, offset + 20),
          next_cursor:
            offset === 0
              ? "joined-continuation-alpha"
              : offset === 20
                ? "joined-continuation-beta"
                : null,
          snapshot_expires_at: Date.now() + 900000,
        },
      });
    });
    const selectJoined = async () => {
      await page
        .getByRole("button", { name: "Joined", exact: true })
        .filter({ visible: true })
        .click();
    };
    const finishPagination = async () => {
      const lastWave = page
        .getByRole("link", { name: "Joined wave 45", exact: true })
        .filter({ visible: true });
      for (let attempt = 0; attempt < 4; attempt += 1) {
        await page
          .getByRole("region", { name: "Following waves list", exact: true })
          .evaluate((list) => {
            let container = list.parentElement;
            while (
              container &&
              !["auto", "scroll"].includes(
                getComputedStyle(container).overflowY
              )
            )
              container = container.parentElement;
            if (container) container.scrollTop = container.scrollHeight;
          });
        const more = page.getByRole("button", {
          name: "Load more joined waves",
          exact: true,
        });
        if (await more.count()) {
          // Reaching the button can itself start automatic pagination. The final
          // response may remove it before Playwright finishes the click.
          await more.click({ timeout: 1500 }).catch(async (error: unknown) => {
            if (await more.count()) throw error;
          });
        }
        if (await lastWave.count()) break;
      }
      await expect(lastWave).toBeVisible();
      await expect(
        page.getByRole("button", {
          name: "Load more joined waves",
          exact: true,
        })
      ).toHaveCount(0);
    };
    await page.goto("/waves", { waitUntil: "domcontentloaded" });
    await selectJoined();
    const more = page.getByRole("button", {
      name: "Load more joined waves",
      exact: true,
    });
    await more.click();
    const retry = page.getByRole("button", {
      name: "Retry loading joined waves",
      exact: true,
    });
    await expect(retry).toBeVisible({ timeout: 30000 });
    await expect(
      page
        .getByRole("status")
        .filter({ hasText: "Some joined waves could not be loaded." })
    ).toBeVisible();
    failContinuation = false;
    await retry.click();
    await finishPagination();
    await page.reload({ waitUntil: "domcontentloaded" });
    await finishPagination();
    // Both destinations rebuild the real sidebar and retain the saved collection.
    await page.goto("/messages", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/messages$/);
    await page.goto("/waves", { waitUntil: "domcontentloaded" });
    await finishPagination();
    expect(requested).toContain("joined-continuation-alpha");
    expect(requested).toContain("joined-continuation-beta");
    await expectNoHorizontalOverflow(page);
    await page.screenshot({
      path: testInfo.outputPath("joined-waves-pagination.png"),
      animations: "disabled",
      style: "nextjs-portal { visibility: hidden; }",
    });
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

  test("offers Join in the wave header and keeps the first row pin tooltip above the list filter", async ({
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
    await page.goto(`/waves/${WAVE}`);

    // The sandbox profile has not joined this wave, so Join is the header CTA
    // in both the web header and the native app header.
    const join = page
      .getByRole("button", {
        name: "Join Local Composer Sandbox Wave",
        exact: true,
      })
      .filter({ visible: true });
    await expect(join).toBeVisible({ timeout: 30000 });
    await expect(join).toHaveText("Join");
    await expect(join).toBeInViewport({ ratio: 1 });
    const joinBox = await join.boundingBox();
    expect(joinBox?.height).toBeGreaterThanOrEqual(24);
    expect(joinBox?.width).toBeGreaterThanOrEqual(24);
    await expectNoHorizontalOverflow(page);

    if (!app) {
      // The first row sits directly under the sticky All/Pinned/Joined filter.
      const waveList = page.getByRole("region", {
        name: /^(All recent waves list|Following waves list|Pinned)$/,
      });
      await waveList.getByRole("link").first().hover();
      const pin = waveList
        .getByRole("button", { name: /^(Pin|Unpin) wave$/ })
        .first();
      await pin.hover();
      const tooltip = page
        .getByRole("tooltip")
        .filter({ hasText: /^(Pin|Unpin)$/ });
      await expect(tooltip).toBeVisible();
      await expect
        .poll(() =>
          tooltip.evaluate((element) => {
            const box = element.getBoundingClientRect();
            const previous = (element as HTMLElement).style.pointerEvents;
            // Tooltips ignore the pointer; enable hit-testing briefly.
            (element as HTMLElement).style.pointerEvents = "auto";
            const hits = [0.15, 0.5, 0.85].map((fraction) => {
              const hit = document.elementFromPoint(
                box.left + box.width * fraction,
                box.top + box.height / 2
              );
              return hit !== null && element.contains(hit);
            });
            (element as HTMLElement).style.pointerEvents = previous;
            return hits.every(Boolean);
          })
        )
        .toBe(true);
    }
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

  test("keeps the editor in place when option cards receive focus", async ({
    page,
  }, testInfo) => {
    const viewport = page.viewportSize();
    if (!viewport) throw new Error("Viewport missing");
    const { name, footer } = await openAppearanceDraft(page, {
      width: Math.min(viewport.width, 730),
      height: 800,
    });
    for (const draft of ["new", "reopened"]) {
      if (draft === "reopened") {
        await page.goto(`${ROOT}/draft`);
        await expect(name).toHaveValue("Appearance layout draft");
      }
      const restingBottom = await footer.evaluate(
        (element) => element.getBoundingClientRect().bottom
      );
      await page.getByText("Perpetual Ranking", { exact: true }).click();
      await page
        .getByRole("button", { name: /^Appearance and labels/ })
        .click();
      for (const { mode, key } of [
        { mode: "Summary card", key: null },
        { mode: "Full proposal", key: null },
        { mode: "Summary card", key: "ArrowDown" },
        { mode: "Full proposal", key: "ArrowUp" },
      ]) {
        if (key) await page.keyboard.press(key);
        else await page.getByText(mode, { exact: true }).click();
        const radio = page.getByRole("radio", { name: new RegExp(`^${mode}`) });
        await expect(radio).toBeChecked();
        await expect(radio).toBeFocused();
        // Compare with the resting viewport position, not the scroll container:
        // an out-of-bounds radio can scroll a hidden ancestor and move both.
        const largestDrift = await footer.evaluate(
          async (element, bottom) =>
            new Promise<number>((resolve) => {
              const startedAt = performance.now();
              let maximum = 0;
              const sample = () => {
                maximum = Math.max(
                  maximum,
                  Math.abs(element.getBoundingClientRect().bottom - bottom)
                );
                if (performance.now() - startedAt >= 750) resolve(maximum);
                else requestAnimationFrame(sample);
              };
              requestAnimationFrame(sample);
            }),
          restingBottom
        );
        expect(largestDrift).toBeLessThanOrEqual(1);
      }
      await page.screenshot({
        path: testInfo.outputPath(`${draft}-option-focus-footer.png`),
      });
      await expectNoHorizontalOverflow(page);
    }
  });

  test("keeps the draft footer at the bottom when proposal appearance changes", async ({
    page,
  }, testInfo) => {
    const viewport = page.viewportSize();
    if (!viewport) throw new Error("Viewport missing");
    const { name, footer } = await openAppearanceDraft(page, {
      ...viewport,
      height: 1600,
    });

    for (const draft of ["new", "reopened"]) {
      if (draft === "reopened") {
        await page.goto(`${ROOT}/draft`);
        await expect(name).toHaveValue("Appearance layout draft");
      }
      await page
        .getByRole("button", { name: /^Appearance and labels/ })
        .click();
      for (const mode of ["Full proposal", "Summary card", "Full proposal"]) {
        await page.getByText(mode, { exact: true }).click();
        await expect(
          page.getByRole("radio", { name: new RegExp(`^${mode}`) })
        ).toBeChecked();
        // Sample throughout the height animation so a passing initial position
        // cannot hide a footer jump after the appearance controls settle.
        const largestGap = await footer.evaluate(async (element) => {
          let container = element.parentElement;
          while (
            container &&
            !/(auto|scroll)/.test(getComputedStyle(container).overflowY)
          ) {
            container = container.parentElement;
          }
          if (!container) throw new Error("Draft scroll container missing");
          const scrollContainer = container;
          return new Promise<number>((resolve) => {
            const startedAt = performance.now();
            let maximum = 0;
            const sample = () => {
              maximum = Math.max(
                maximum,
                Math.abs(
                  scrollContainer.getBoundingClientRect().bottom -
                    element.getBoundingClientRect().bottom
                )
              );
              if (performance.now() - startedAt >= 750) resolve(maximum);
              else requestAnimationFrame(sample);
            };
            requestAnimationFrame(sample);
          });
        });
        expect(largestGap).toBeLessThanOrEqual(1);
        await expect(
          footer.getByRole("button", { name: "Next", exact: true })
        ).toBeInViewport({ ratio: 1 });
        await page
          .getByRole("group", { name: "Proposal card appearance", exact: true })
          .screenshot({
            path: testInfo.outputPath(
              `${draft}-${mode === "Full proposal" ? "full" : "summary"}-appearance.png`
            ),
            animations: "disabled",
          });
      }
      await page.screenshot({
        path: testInfo.outputPath(`${draft}-appearance-footer.png`),
      });
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
    const name = page.getByLabel("Competition name", { exact: true });
    await name.focus();
    await page.keyboard.press("Tab");
    await expect(trigger).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Description", { exact: true })).toBeFocused();
    await expect
      .poll(async () => {
        const nameBox = await name.boundingBox();
        const typeBox = await trigger.boundingBox();
        if (!nameBox || !typeBox) return false;
        return app
          ? typeBox.y >= nameBox.y + nameBox.height
          : Math.abs(typeBox.y - nameBox.y) <= 1;
      })
      .toBe(true);
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
    const appearanceSettings = page.getByRole("button", {
      name: /^Appearance and labels/,
    });
    await appearanceSettings.click();
    await page
      .getByLabel("Submission button label", { exact: true })
      .locator("..")
      .screenshot({
        animations: "disabled",
        path: testInfo.outputPath("submission-label-input.png"),
      });
    await page
      .getByRole("heading", { name: "Tab labels", exact: true })
      .locator("..")
      .screenshot({
        animations: "disabled",
        path: testInfo.outputPath("approval-label-inputs.png"),
      });
    await appearanceSettings.click();
    await trigger.focus();
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
    await page.getByText("Perpetual Ranking", { exact: true }).click();
    const ranking = page.getByRole("group", {
      name: "Ranking mode",
      exact: true,
    });
    await ranking.screenshot({
      animations: "disabled",
      path: testInfo.outputPath("compact-ranking-options.png"),
    });
    await page
      .getByRole("button", { name: "Appearance and labels", exact: true })
      .click();
    const appearance = page.getByRole("group", {
      name: "Proposal card appearance",
      exact: true,
    });
    await appearance.screenshot({
      animations: "disabled",
      path: testInfo.outputPath("compact-appearance-options.png"),
    });
    const viewport = page.viewportSize();
    if (!viewport) throw new Error("Viewport missing");
    for (const width of app ? [viewport.width] : [viewport.width, 639, 640]) {
      await page.setViewportSize({ ...viewport, width });
      for (const options of [ranking, appearance]) {
        await expect
          .poll(() =>
            options.getByRole("radio").evaluateAll(
              (radios, stacked) =>
                radios.every((radio) => {
                  const preview = radio.closest("label")?.firstElementChild;
                  const content = radio.parentElement;
                  if (!preview || !content) return false;
                  const previewBox = preview.getBoundingClientRect();
                  const contentBox = content.getBoundingClientRect();
                  return stacked
                    ? previewBox.bottom <= contentBox.top &&
                        Math.abs(previewBox.width - contentBox.width) <= 1
                    : previewBox.right <= contentBox.left;
                }),
              width < 640
            )
          )
          .toBe(true);
      }
      await expectNoHorizontalOverflow(page);
      if (width === 639 || width === 640) {
        await ranking.screenshot({
          animations: "disabled",
          path: testInfo.outputPath(`ranking-options-${width}px.png`),
        });
        await appearance.screenshot({
          animations: "disabled",
          path: testInfo.outputPath(`appearance-options-${width}px.png`),
        });
      }
    }
    await page.setViewportSize(viewport);
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
    await openNewCompetition(page);
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

  for (const app of [false, true]) {
    for (const view of ["List view", "Grid view"]) {
      test(`keeps live Main Stage artwork anchored after ranking refresh (${app ? "app" : "web"}, ${view})`, async ({
        page,
      }, testInfo) => {
        test.skip(
          app && testInfo.project.name !== "web-mobile-chromium",
          "Native branch simulation uses the mobile viewport."
        );
        if (app)
          await installSurfaceSimulation(
            page.context(),
            "capacitor-android-sim",
            process.env["PLAYWRIGHT_BASE_URL"]
          );
        const sockets: WebSocketRoute[] = [];
        await page.routeWebSocket(
          (url) =>
            url.port ===
            new URL(getSandboxApiOrigin(process.env["PLAYWRIGHT_BASE_URL"]))
              .port,
          (socket) => {
            sockets.push(socket);
            socket.onMessage((message) => {
              const frame = JSON.parse(String(message)) as { type?: string };
              if (frame.type === "AUTHENTICATE")
                socket.send(
                  JSON.stringify({ type: "AUTHENTICATED", data: {} })
                );
              if (frame.type === "SYNC_NOTIFICATION_IDENTITIES")
                socket.send(
                  JSON.stringify({
                    type: "NOTIFICATION_IDENTITIES_SYNCED",
                    data: { profile_ids: [PROFILE] },
                  })
                );
            });
          }
        );
        const sandbox = await installCompetitionApi(
          page,
          false,
          true,
          MEMES_WAVE
        );
        sandbox.onlyCompetition("alpha");
        await sandbox.legacyPrimary("alpha");
        const response = await page.request.get(
          `${getSandboxApiOrigin(process.env["PLAYWRIGHT_BASE_URL"])}/api/v2/waves/${MEMES_WAVE}/drops`
        );
        const fixture = await response.json();
        fixture.wave.id = MEMES_WAVE;
        let order = Array.from({ length: 80 }, (_, index) => index);
        let refreshed = false;
        let leaderboardReads = 0;
        await page.route(
          `**/api/v2/waves/${MEMES_WAVE}/leaderboard*`,
          (route) => {
            leaderboardReads++;
            const pageNumber = Number(
              new URL(route.request().url()).searchParams.get("page") ?? 1
            );
            return route.fulfill({
              json: {
                wave: fixture.wave,
                drops: order
                  .slice((pageNumber - 1) * 50, pageNumber * 50)
                  .map((index) => ({
                    ...fixture.drops[0],
                    id: `00000000-0000-4000-8000-${String(index + 9000).padStart(12, "0")}`,
                    serial_no: index + 9000,
                    title: `Live artwork ${index}`,
                    media: [
                      {
                        url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aS5cAAAAASUVORK5CYII=",
                        mime_type: "image/png",
                      },
                    ],
                    drop_type: "SUBMISSION",
                    submission_context: {
                      status: "ACTIVE",
                      has_metadata: false,
                      voting: {
                        is_open: true,
                        total_votes_given: refreshed ? 900000 : 1000,
                        current_calculated_vote: refreshed ? 900000 : 1000,
                        predicted_final_vote: refreshed ? 900000 : 1000,
                        voters_count: 1,
                        place: order.indexOf(index) + 1,
                        context_profile_context: {
                          can_vote: true,
                          min: -1000,
                          max: 1000,
                          current: 0,
                        },
                      },
                    },
                  })),
                count: 80,
                page: pageNumber,
                next: pageNumber === 1,
              },
            });
          }
        );
        await page.goto(
          `/waves/${MEMES_WAVE}/competitions/alpha?tab=leaderboard`
        );
        await page.getByRole("tab", { name: view, exact: true }).click();
        const list = page.getByRole("list", {
          name: "Leaderboard drops",
          exact: true,
        });
        await expect(list).toBeVisible({ timeout: 30000 });
        const scroller = page
          .getByRole("list", { name: "Leaderboard drops", exact: true })
          .locator(
            'xpath=ancestor::div[contains(@class,"tw-overflow-y-auto")][1]'
          );
        await scroller.evaluate((element) =>
          element.scrollTo({ top: element.scrollHeight, behavior: "instant" })
        );
        if (view === "Grid view")
          await page
            .getByRole("button", { name: "Load more drops", exact: true })
            .click();
        await expect.poll(() => leaderboardReads).toBeGreaterThanOrEqual(2);
        await expect(list.getByRole("listitem").first()).toHaveAttribute(
          "aria-setsize",
          "80"
        );
        await scroller.evaluate((element) => {
          element.setAttribute("data-scroll-visit", "original");
          element.scrollTo({
            top: element.scrollHeight * 0.6,
            behavior: "instant",
          });
        });
        await expect
          .poll(() => scroller.evaluate((element) => element.scrollTop))
          .toBeGreaterThan(1000);
        const readAnchor = () =>
          list.evaluate((element) => {
            const container = element.closest(".tw-overflow-y-auto")!;
            const viewport = container.getBoundingClientRect();
            const card = Array.from(
              element.querySelectorAll<HTMLElement>(
                "[data-leaderboard-drop-id]"
              )
            ).find((candidate) => {
              const bounds = candidate.getBoundingClientRect();
              return (
                bounds.bottom > viewport.top + 100 &&
                bounds.top < viewport.bottom - 100
              );
            });
            return card
              ? {
                  id: card.dataset["leaderboardDropId"]!,
                  offset: card.getBoundingClientRect().top - viewport.top,
                }
              : null;
          });
        let currentAnchor = await readAnchor();
        await expect
          .poll(async () => {
            currentAnchor = await readAnchor();
            return currentAnchor !== null;
          })
          .toBe(true);
        const anchor = currentAnchor;
        if (!anchor) throw new Error("Visible artwork anchor missing");
        await list.evaluate((element) =>
          element.setAttribute("data-list-visit", "original")
        );
        const anchorCard = page
          .getByRole("list", { name: "Leaderboard drops", exact: true })
          .locator(`[data-leaderboard-drop-id="${anchor.id}"]`);
        const originalPosition = await anchorCard.getAttribute(
          "data-leaderboard-logical-index"
        );
        const readsBefore = leaderboardReads;
        const touch = app ? await page.context().newCDPSession(page) : null;
        if (touch) {
          await scroller.evaluate((element) => {
            for (const type of ["touchstart", "touchend", "touchcancel"])
              element.addEventListener(
                type,
                () => element.setAttribute("data-last-touch", type),
                { passive: true }
              );
          });
          const box = await scroller.boundingBox();
          await touch.send("Input.dispatchTouchEvent", {
            type: "touchStart",
            touchPoints: [{ x: box!.x + 2, y: box!.y + 200, id: 1 }],
          });
          await expect(scroller).toHaveAttribute(
            "data-last-touch",
            "touchstart"
          );
        }
        order = [...order.slice(12), ...order.slice(0, 12)];
        refreshed = true;
        await expect.poll(() => sockets.length).toBeGreaterThan(0);
        sockets[sockets.length - 1]!.send(
          JSON.stringify({
            type: "COMPETITION_UPDATE",
            data: {
              event_id: "live-ranking",
              event_version: 1,
              event_type: "COMPETITION_LEADERBOARD_UPDATED",
              wave_id: MEMES_WAVE,
              competition_id: "alpha",
            },
          })
        );
        await expect.poll(() => leaderboardReads).toBeGreaterThan(readsBefore);
        await expect(anchorCard).toContainText("900,000");
        await expect(scroller).toHaveAttribute("data-scroll-visit", "original");
        await expect(list).toHaveAttribute("data-list-visit", "original");
        if (touch) {
          await expect(scroller).toHaveAttribute(
            "data-last-touch",
            "touchstart"
          );
          await expect(anchorCard).toHaveAttribute(
            "data-leaderboard-logical-index",
            originalPosition!
          );
          await touch.send("Input.dispatchTouchEvent", {
            type: "touchEnd",
            touchPoints: [],
          });
          await touch.detach();
        }
        await expect(anchorCard).not.toHaveAttribute(
          "data-leaderboard-logical-index",
          originalPosition!
        );
        await expect
          .poll(() =>
            anchorCard.evaluate((element) => {
              const container = element.closest(".tw-overflow-y-auto")!;
              return (
                element.getBoundingClientRect().top -
                container.getBoundingClientRect().top
              );
            })
          )
          .toBeCloseTo(anchor.offset, 0);
        await expect(scroller).toHaveAttribute("data-scroll-visit", "original");
        await page.screenshot({
          path: testInfo.outputPath(
            `live-scroll-${app ? "app" : "web"}-${view.split(" ")[0]}.png`
          ),
        });
        expect(sandbox.requests).toHaveLength(0);
      });
    }
  }

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
      mainStage.onlyCompetition("alpha");
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
      const waveResponse = await page.request.get(
        `${getSandboxApiOrigin(process.env["PLAYWRIGHT_BASE_URL"])}/api/waves/${WAVE}`
      );
      expect(waveResponse.ok()).toBe(true);
      const wave = await waveResponse.json();
      await page.route(`**/api/waves/${BAR}`, (route) =>
        route.fulfill({
          json: {
            ...wave,
            id: BAR,
            name: bar.name,
            description_drop: {
              ...wave.description_drop,
              wave: { ...wave.description_drop.wave, id: BAR, name: bar.name },
            },
          },
        })
      );
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
      const desktopSidebar =
        testInfo.project.name === "web-desktop-chromium"
          ? await retainDesktopWaveSidebar(page)
          : null;
      const prepareWaveSwitch = async () => {
        if (!desktopSidebar) await returnToList();
      };
      await openWaveFromList("The Memes - Main Stage");
      await expect(chat).toBeVisible({ timeout: 30000 });
      await leaderboard.click();
      if (mode === "native")
        await expect(
          page.getByText("Immutable alpha entry content", { exact: true })
        ).toBeVisible();
      else await expectLegacySectionContent(page, "leaderboard");
      await desktopSidebar?.expectRetained();
      await prepareWaveSwitch();
      await openWaveFromList("The Memes - Maybes Bar");
      await expect(chat).toBeVisible({ timeout: 30000 });
      await page
        .getByRole(mode === "app" ? "button" : "tab", {
          name: "Chat",
          exact: true,
        })
        .click();
      await desktopSidebar?.expectRetained();
      await prepareWaveSwitch();
      const expectNoDetour = await monitorRememberedLeaderboard(
        page,
        `/waves/${WAVE}`,
        wave.name
      );
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
      await expectNoDetour();
      await desktopSidebar?.expectRetained();
      if (mode === "app") {
        try {
          await expect(
            leaderboard.getByText("Leaderboard", { exact: true })
          ).toBeInViewport({ ratio: 1 });
        } finally {
          await testInfo.attach("remembered-app-tab-geometry", {
            body: JSON.stringify(
              await leaderboard.evaluate((button) => {
                const row = button.closest('[data-wave-tabs-scroll="app"]');
                const label = button.querySelector("span");
                return {
                  row: row?.getBoundingClientRect().toJSON(),
                  button: button.getBoundingClientRect().toJSON(),
                  label: label?.getBoundingClientRect().toJSON(),
                  scrollLeft: row?.scrollLeft,
                  scrollWidth: row?.scrollWidth,
                  clientWidth: row?.clientWidth,
                };
              })
            ),
            contentType: "application/json",
          });
        }
      }
      await expect(
        page.getByRole(mode === "app" ? "button" : "tab", {
          name: /^Competitions(?:\s+\d+\+?)?$/,
        })
      ).toHaveCount(0);
      await page.screenshot({
        path: testInfo.outputPath(`remembered-${mode}-leaderboard.png`),
        fullPage: true,
      });
      await desktopSidebar?.dispose();
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

  test("keeps one desktop wave sidebar while an unvisited wave page streams", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "web-desktop-chromium",
      "The page-loading sidebar is only rendered in the desktop layout."
    );
    const targetWaveId = "00000000-0000-4000-8000-000000000536";
    const sandbox = await installCompetitionApi(page, false, false);
    sandbox.onlyCompetition("alpha");
    const response = await page.request.get(
      `${getSandboxApiOrigin(process.env["PLAYWRIGHT_BASE_URL"])}/api/v2/waves/${targetWaveId}/drops`
    );
    expect(response.ok()).toBe(true);
    const { wave: overview } = await response.json();
    const waves = [
      { ...overview, id: WAVE, name: "Warmed Competition Wave" },
      { ...overview, id: targetWaveId, name: "Previously Unvisited Wave" },
    ];
    await page.route(/\/api\/v2\/waves(?:\?|$)/, (route) =>
      route.fulfill({ json: { data: waves, page: 1, next: false } })
    );
    await page.route("**/api/v2/official-waves", (route) =>
      route.fulfill({ json: waves })
    );
    await page.goto(`${ROOT}/alpha?tab=leaderboard`);
    const entry = page.getByText("Immutable alpha entry content", {
      exact: true,
    });
    await expect(entry).toBeVisible();
    const sidebar = await retainDesktopWaveSidebar(page);
    const pane = page
      .getByRole("region", {
        name: /All recent waves list|Regular waves list/,
      })
      .filter({ visible: true })
      .locator(
        "xpath=ancestor::div[contains(concat(' ', normalize-space(@class), ' '), ' tw-h-full ') and contains(concat(' ', normalize-space(@class), ' '), ' tw-border-r ')][1]"
      );
    const monitor = await pane.evaluateHandle((retainedPane) => {
      const loadingFrames: {
        sidebarRight: number;
        shellLeft: number;
        placeholderAsideWidths: number[];
      }[] = [];
      let frameId = 0;
      const sample = () => {
        const paneRect = retainedPane.getBoundingClientRect();
        if (retainedPane.isConnected && paneRect.width > 0) {
          for (const shell of document.querySelectorAll(
            '[data-testid="stream-route-loading-shell"]'
          )) {
            const shellRect = shell.getBoundingClientRect();
            if (
              shellRect.width > 0 &&
              shellRect.height > 0 &&
              shellRect.left >= paneRect.right - 1
            ) {
              loadingFrames.push({
                sidebarRight: paneRect.right,
                shellLeft: shellRect.left,
                placeholderAsideWidths: Array.from(
                  shell.querySelectorAll("aside"),
                  (aside) => aside.getBoundingClientRect().width
                ).filter((width) => width > 0),
              });
            }
          }
        }
        frameId = requestAnimationFrame(sample);
      };
      frameId = requestAnimationFrame(sample);
      return {
        stop: () => {
          cancelAnimationFrame(frameId);
          return loadingFrames;
        },
      };
    });
    let releasePage!: () => void;
    const pendingPage = new Promise<void>((resolve) => {
      releasePage = resolve;
    });
    let pageHeld = false;
    await page.route(
      (url) =>
        url.pathname === `/waves/${targetWaveId}` &&
        url.searchParams.has("_rsc"),
      async (route) => {
        pageHeld = true;
        await pendingPage;
        await route.continue();
      }
    );
    try {
      await page
        .getByRole("region", {
          name: /All recent waves list|Regular waves list/,
        })
        .getByRole("link")
        .filter({ hasText: "Previously Unvisited Wave" })
        .first()
        .click();
      await expect.poll(() => pageHeld).toBe(true);
      await expect(page).toHaveURL(`${ROOT}/alpha?tab=leaderboard`);
      await expect(entry).toBeVisible();
      await sidebar.expectRetained();
      releasePage();
      await expect(page).toHaveURL(`/waves/${targetWaveId}`);
      await expect(
        page.getByRole("region", {
          name: "Wave chat file upload area",
          exact: true,
        })
      ).toBeVisible();
      await sidebar.expectRetained();
      const loadingFrames = await monitor.evaluate(async (state) => {
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => resolve())
        );
        return state.stop();
      });
      await testInfo.attach("streamed-page-loading-frames", {
        body: JSON.stringify(loadingFrames),
        contentType: "application/json",
      });
      expect(
        loadingFrames.filter((frame) => frame.placeholderAsideWidths.length),
        "A page loader beside the mounted wave sidebar must not paint another sidebar"
      ).toEqual([]);
      expect(sandbox.requests).toEqual([]);
    } finally {
      releasePage();
      await monitor.evaluate((state) => state.stop());
      await monitor.dispose();
      await sidebar.dispose();
    }
  });

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
        await expect(
          page
            .getByRole(role, { name: "Leaderboard", exact: true })
            .locator(':scope > [aria-hidden="true"]')
        ).toHaveCount(0);
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

  test("keeps Cancel in desktop Wave setting popovers", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "web-desktop-chromium",
      "Desktop popover coverage."
    );
    await installCompetitionApi(page);
    await page.goto(`/waves/${WAVE}?tab=chat`);
    await openWaveInformation(page);
    await page.getByRole("tab", { name: "Configuration", exact: true }).click();
    const trigger = page.getByRole("button", {
      name: "Edit links",
      exact: true,
    });
    await trigger.click();
    const editor = page.getByRole("dialog", {
      name: "Edit links",
      exact: true,
    });
    const checkbox = editor.getByRole("checkbox", {
      name: "Disable links",
      exact: true,
    });
    const checked = await checkbox.isChecked();
    await checkbox.setChecked(!checked);
    await editor.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(editor).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await trigger.click();
    await expect(checkbox).toBeChecked({ checked });
  });

  test("keeps Configuration editors inside the tablet information panel", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "web-mobile-chromium",
      "Tablet touch coverage."
    );
    await page.setViewportSize({ width: 768, height: 1024 });
    await installCompetitionApi(page);
    await page.route(`**/api/waves/${WAVE}/curations`, (route) =>
      route.fulfill({
        json: [
          {
            id: "tablet-art",
            name: "Art",
            wave_id: WAVE,
            group_id: composerSandboxConstants.previewGroupId,
            created_at: 1,
            updated_at: 1,
            priority_order: 1,
          },
        ],
      })
    );
    await page.goto(`/waves/${WAVE}?tab=chat`);
    await openWaveInformation(page);
    const panel = page.getByRole("dialog");
    const configuration = panel.getByRole("tab", {
      name: "Configuration",
      exact: true,
    });
    await configuration.click();
    for (const label of [
      "Edit links",
      "Edit Visibility access",
      "Edit Chat access",
      "Edit Admins access",
    ]) {
      const trigger = panel.getByRole("button", { name: label, exact: true });
      await trigger.click();
      await expect(panel).toHaveCount(1);
      await expect(panel).toHaveAccessibleName(label);
      await expect(configuration).toBeHidden();
      if (label === "Edit links")
        await expect(
          panel.getByRole("button", { name: "Cancel", exact: true })
        ).toHaveCount(0);
      await panel
        .getByRole("button", {
          name: label === "Edit links" ? "Save" : "Save changes",
          exact: true,
        })
        .click({ trial: true });
      await page.screenshot({
        path: testInfo.outputPath(`tablet-${label.split(" ")[1]}.png`),
      });
      if (label === "Edit Admins access") await page.keyboard.press("Escape");
      else
        await panel.getByRole("button", { name: "Back", exact: true }).click();
      await expect(trigger).toBeFocused();
      await expect(configuration).toHaveAttribute("aria-selected", "true");
      await expectNoHorizontalOverflow(page);
    }
    await panel
      .getByRole("button", { name: "Edit links", exact: true })
      .click();
    await panel
      .getByRole("button", { name: "Close wave details", exact: true })
      .click();
    await expect(panel).toHaveCount(0);
    await openWaveInformation(page);
    await expect(configuration).toBeVisible();
    await configuration.click();
    const curationTrigger = panel.getByRole("button", {
      name: "Configure Art",
      exact: true,
    });
    await curationTrigger.click();
    await page
      .getByRole("menuitem", { name: "Edit Curation", exact: true })
      .click();
    const curationEditor = page.getByRole("dialog", {
      name: "Edit curation",
      exact: true,
    });
    await expect(
      curationEditor.getByRole("textbox", { name: "Name", exact: true })
    ).toHaveValue("Art");
    await expect(page.getByRole("dialog")).toHaveCount(1);
    await expect(
      curationEditor.getByRole("button", { name: "Cancel", exact: true })
    ).toHaveCount(0);
    await curationEditor
      .getByRole("button", { name: "Back", exact: true })
      .click();
    await expect(curationEditor).toHaveCount(0);
    await expect(configuration).toHaveAttribute("aria-selected", "true");
    await expect(curationTrigger).toBeFocused();
  });

  for (const surface of ["web", "ios", "android"] as const) {
    test(`keeps curation create and edit inside the ${surface} Wave sheet`, async ({
      page,
      baseURL,
    }, testInfo) => {
      test.skip(
        testInfo.project.name !== "web-mobile-chromium",
        "Touch sheet coverage."
      );
      if (surface !== "web")
        await installSurfaceSimulation(
          page.context(),
          surface === "ios" ? "capacitor-ios-sim" : "capacitor-android-sim",
          baseURL
        );
      await installCompetitionApi(page);
      let curation = {
        id: "sheet-art",
        name: "Art",
        wave_id: WAVE,
        group_id: composerSandboxConstants.previewGroupId,
        created_at: 1,
        updated_at: 1,
        priority_order: 1,
      };
      await page.route(`**/api/waves/${WAVE}/curations`, (route) =>
        route.fulfill({ json: [curation] })
      );
      let failSave = true;
      let writes = 0;
      await page.route(
        `**/api/waves/${WAVE}/curations/${curation.id}`,
        async (route) => {
          expect(route.request().method()).toBe("POST");
          writes++;
          if (failSave)
            return route.fulfill({
              status: 500,
              json: { error: "Sandbox curation save failed" },
            });
          const body = route.request().postDataJSON();
          curation = { ...curation, name: body.name, group_id: body.group_id };
          await route.fulfill({ json: curation });
        }
      );
      await page.goto(`/waves/${WAVE}?tab=chat`);
      await openWaveInformation(page);
      const sheet = page.getByRole("dialog");
      const configuration = sheet.getByRole("tab", {
        name: "Configuration",
        exact: true,
      });
      await configuration.click();
      const create = sheet.getByRole("button", {
        name: "Create curation",
        exact: true,
      });
      await create.click({ trial: true });
      const header = await sheet
        .getByTestId("mobile-dialog-header")
        .boundingBox();
      expect(header).not.toBeNull();
      await create.click();
      await expect(sheet).toHaveCount(1);
      await expect(sheet).toHaveAccessibleName("Create curation");
      await expectSheetTop(sheet, header!.y);
      await expect(
        sheet.getByRole("button", { name: "Cancel", exact: true })
      ).toHaveCount(0);
      const name = sheet.getByRole("textbox", { name: "Name", exact: true });
      await name.fill("Unsaved curation");
      await expect(
        sheet.getByRole("button", { name: "Create", exact: true })
      ).toBeDisabled();
      await sheet.getByRole("button", { name: /Active collectors/ }).click();
      await sheet
        .getByRole("button", { name: "Change group", exact: true })
        .click();
      const groupSearch = sheet.getByRole("textbox", {
        name: "Search by group name",
        exact: true,
      });
      await expect(groupSearch).toBeVisible();
      await expect(groupSearch).toBeFocused();
      await page.evaluate(() => {
        const viewport = globalThis.visualViewport!;
        Object.defineProperty(viewport, "height", {
          configurable: true,
          value: globalThis.innerHeight - 350,
        });
        viewport.dispatchEvent(new Event("resize"));
      });
      await expect
        .poll(() =>
          groupSearch.evaluate((element) => {
            const bounds = element.getBoundingClientRect();
            let container = element.parentElement;
            while (
              container &&
              !/(auto|scroll)/.test(getComputedStyle(container).overflowY)
            )
              container = container.parentElement;
            if (!container)
              throw new Error("Curation scroll container missing");
            const visible = container.getBoundingClientRect();
            return bounds.top >= visible.top && bounds.bottom <= visible.bottom;
          })
        )
        .toBe(true);
      await page.evaluate(() => {
        const viewport = globalThis.visualViewport!;
        Object.defineProperty(viewport, "height", {
          configurable: true,
          value: globalThis.innerHeight,
        });
        viewport.dispatchEvent(new Event("resize"));
      });
      await expect(sheet).toHaveCount(1);
      await sheet
        .getByRole("button", { name: "Back to selected group", exact: true })
        .click();
      await expect(name).toHaveValue("Unsaved curation");
      await sheet.getByRole("button", { name: "Back", exact: true }).click();
      await expect(create).toBeFocused();
      await expect(configuration).toHaveAttribute("aria-selected", "true");
      await create.click();
      await expect(name).toHaveValue("");
      await page.goBack();
      await expect(create).toBeFocused();
      const configure = sheet.getByRole("button", {
        name: "Configure Art",
        exact: true,
      });
      await configure.click();
      await page
        .getByRole("menuitem", { name: "Edit Curation", exact: true })
        .click();
      await expect(sheet).toHaveCount(1);
      await expect(sheet).toHaveAccessibleName("Edit curation");
      await expectSheetTop(sheet, header!.y);
      await expect(name).toHaveValue("Art");
      await name.fill("Updated art");
      await sheet.getByRole("button", { name: "Save", exact: true }).click();
      await expect(
        page
          .getByRole("alert")
          .filter({ hasText: "Sandbox curation save failed" })
      ).toBeVisible();
      await expect(name).toHaveValue("Updated art");
      await expect(sheet).toHaveAccessibleName("Edit curation");
      failSave = false;
      await sheet.getByRole("button", { name: "Save", exact: true }).click();
      await expect(configuration).toHaveAttribute("aria-selected", "true");
      await expect(
        sheet.getByRole("button", {
          name: "Configure Updated art",
          exact: true,
        })
      ).toBeFocused();
      expect(writes).toBe(2);
      await create.click();
      await page.screenshot({
        path: testInfo.outputPath(`embedded-curation-${surface}.png`),
      });
      await swipeVertically(
        page,
        sheet.getByTestId("mobile-dialog-header"),
        180
      );
      await expect(sheet).toHaveCount(0);
      await openWaveInformation(page);
      await expect(configuration).toBeVisible();
      await expectNoHorizontalOverflow(page);
    });

    test(`opens owner options inside the ${surface} Wave sheet and returns with Back`, async ({
      page,
      baseURL,
    }, testInfo) => {
      test.skip(
        testInfo.project.name !== "web-mobile-chromium",
        "Touch sheet coverage."
      );
      if (surface !== "web")
        await installSurfaceSimulation(
          page.context(),
          surface === "ios" ? "capacitor-ios-sim" : "capacitor-android-sim",
          baseURL
        );
      await installCompetitionApi(page);
      await page.goto(`/waves/${WAVE}?tab=chat`);
      const originalUrl = page.url();
      await openWaveInformation(page);
      const options = page.getByRole("button", {
        name: "Open options",
        exact: true,
      });
      await options.click({ trial: true });
      const initialHeader = await page
        .getByTestId("mobile-dialog-header")
        .boundingBox();
      expect(initialHeader).not.toBeNull();
      for (const backAction of ["button", "escape", "browser"] as const) {
        await options.click();
        const sheet = page.getByRole("dialog", {
          name: "Wave options",
          exact: true,
        });
        await expect(page.getByRole("dialog")).toHaveCount(1);
        await expectSheetTop(sheet, initialHeader!.y);
        await expect(
          sheet.getByRole("heading", { name: "Wave options", exact: true })
        ).toBeVisible();
        await sheet
          .getByRole("button", { name: "Delete", exact: true })
          .click();
        const confirmation = page.getByRole("dialog", {
          name: "Delete wave",
          exact: true,
        });
        await expect(
          confirmation.getByRole("heading", {
            name: "Delete wave",
            exact: true,
          })
        ).toBeVisible();
        await confirmation
          .getByRole("button", { name: "Cancel", exact: true })
          .click();
        await expect(confirmation).toHaveCount(0);
        await expectSheetTop(sheet, initialHeader!.y);
        await expect(
          sheet.getByRole("heading", { name: "Wave options", exact: true })
        ).toBeVisible();
        await sheet
          .getByRole("button", { name: "Delete", exact: true })
          .click({ trial: true });
        if (backAction === "button")
          await sheet
            .getByRole("button", { name: "Back", exact: true })
            .click();
        else if (backAction === "escape") await page.keyboard.press("Escape");
        else await page.goBack();
        await expect(options).toBeFocused();
        await expectSheetTop(page.getByRole("dialog"), initialHeader!.y);
        await expect(
          page.getByRole("tab", { name: "About", exact: true })
        ).toBeVisible();
      }
      await options.click();
      await page.screenshot({
        path: testInfo.outputPath(`owner-options-${surface}.png`),
      });
      await page.getByRole("button", { name: "Close", exact: true }).click();
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expect(page).toHaveURL(originalUrl);
      await openWaveInformation(page);
      await expect(options).toBeVisible();
      await expectNoHorizontalOverflow(page);
    });

    test(`returns from Network to the ${surface} Wave Configuration sheet`, async ({
      page,
      baseURL,
    }, testInfo) => {
      test.skip(
        testInfo.project.name !== "web-mobile-chromium",
        "Touch sheet coverage."
      );
      if (surface !== "web")
        await installSurfaceSimulation(
          page.context(),
          surface === "ios" ? "capacitor-ios-sim" : "capacitor-android-sim",
          baseURL
        );
      await installCompetitionApi(page);
      const response = await page.request.get(
        `${getSandboxApiOrigin(baseURL)}/api/waves/${WAVE}`
      );
      const wave = await response.json();
      wave.wave.admin_group.group = {
        id: composerSandboxConstants.previewGroupId,
        name: "Active collectors",
        is_hidden: false,
      };
      await page.route(`**/api/waves/${WAVE}`, (route) =>
        route.fulfill({ json: wave })
      );
      await page.goto(`/waves/${WAVE}?tab=chat&search=art%20work`);
      await openWaveInformation(page);
      const sheet = page.getByRole("dialog");
      const configuration = sheet.getByRole("tab", {
        name: "Configuration",
        exact: true,
      });
      await configuration.click();
      const memberLink = sheet.getByRole("link", {
        name: /^Inspect Active collectors group criteria and members:/,
      });
      await expect(memberLink).toBeVisible();
      const scrollTop = await memberLink.evaluate((element) => {
        let parent = element.parentElement;
        while (parent && getComputedStyle(parent).overflowY !== "auto")
          parent = parent.parentElement;
        if (!parent)
          throw new Error("Wave information scroll container missing");
        parent.scrollTop = 60;
        return parent.scrollTop;
      });
      expect(scrollTop).toBeGreaterThan(0);
      const originalUrl = page.url();
      await memberLink.click();
      await expect(page).toHaveURL(
        new RegExp(
          `/network\\?.*group=${composerSandboxConstants.previewGroupId}`
        ),
        { timeout: 30000 }
      );
      await expect(
        page.getByRole("button", { name: "Clear selected group", exact: true })
      ).toBeVisible();
      await expect(sheet).toHaveCount(0);
      if (surface === "web") await page.goBack();
      else
        await page.getByRole("button", { name: "Back", exact: true }).click();
      await expect(page).toHaveURL(originalUrl);
      await expect(configuration).toHaveAttribute("aria-selected", "true");
      await expect(memberLink).toBeVisible();
      await expect
        .poll(() =>
          memberLink.evaluate((element) => {
            let parent = element.parentElement;
            while (parent && getComputedStyle(parent).overflowY !== "auto")
              parent = parent.parentElement;
            return parent?.scrollTop;
          })
        )
        .toBe(scrollTop);
      await page.screenshot({
        path: testInfo.outputPath(`network-return-${surface}.png`),
      });
      await sheet.getByRole("button", { name: "Close", exact: true }).click();
      await expect(sheet).toHaveCount(0);
      await expect(page).toHaveURL(originalUrl);
    });

    test(`edits Configuration inside the ${surface} Wave sheet and returns with Back`, async ({
      page,
      baseURL,
    }, testInfo) => {
      test.skip(
        testInfo.project.name !== "web-mobile-chromium",
        "Touch sheet coverage."
      );
      if (surface !== "web")
        await installSurfaceSimulation(
          page.context(),
          surface === "ios" ? "capacitor-ios-sim" : "capacitor-android-sim",
          baseURL
        );
      await installCompetitionApi(page);
      const response = await page.request.get(
        `${getSandboxApiOrigin(baseURL)}/api/waves/${WAVE}`
      );
      const wave = await response.json();
      wave.chat.links_disabled = false;
      wave.visibility.scope.group = {
        id: composerSandboxConstants.previewGroupId,
        name: "Active collectors",
        is_hidden: false,
      };
      let failSave = true;
      let writes = 0;
      await page.route(`**/api/waves/${WAVE}`, async (route) => {
        if (route.request().method() === "POST") {
          writes++;
          if (failSave)
            return route.fulfill({
              status: 500,
              json: { error: "Sandbox save failed" },
            });
          wave.chat = { ...wave.chat, ...route.request().postDataJSON().chat };
        }
        await route.fulfill({ json: wave });
      });
      await page.goto(`/waves/${WAVE}?tab=chat`);
      await openWaveInformation(page);
      const sheet = page.getByRole("dialog");
      await sheet
        .getByRole("tab", { name: "Configuration", exact: true })
        .click();
      const links = sheet.getByRole("button", {
        name: "Edit links",
        exact: true,
      });
      await links.scrollIntoViewIfNeeded();
      const row = sheet
        .getByRole("button", { name: "Edit links", exact: true })
        .locator("..");
      const labelBox = await row
        .getByText("Links", { exact: true })
        .boundingBox();
      const iconBox = await sheet
        .getByRole("button", { name: "Edit links", exact: true })
        .locator("svg")
        .boundingBox();
      expect(labelBox).not.toBeNull();
      expect(iconBox).not.toBeNull();
      expect(
        Math.abs(
          labelBox!.y + labelBox!.height / 2 - iconBox!.y - iconBox!.height / 2
        )
      ).toBeLessThanOrEqual(1);
      const originalUrl = page.url();
      await page.screenshot({
        path: testInfo.outputPath(`configuration-${surface}.png`),
      });
      const initialHeader = await sheet
        .getByTestId("mobile-dialog-header")
        .boundingBox();
      expect(initialHeader).not.toBeNull();

      await links.click();
      await expect(sheet).toHaveCount(1);
      await expect(sheet).toHaveAccessibleName("Edit links");
      await expectSheetTop(sheet, initialHeader!.y);
      await expect(
        sheet.getByRole("button", { name: "Back", exact: true })
      ).toBeVisible();
      const checkbox = sheet.getByRole("checkbox", {
        name: "Disable links",
        exact: true,
      });
      await expect(checkbox).toHaveCSS("appearance", "none");
      await expect(checkbox).toHaveCSS("background-color", "rgb(28, 28, 33)");
      await expect(
        sheet.getByRole("button", { name: "Cancel", exact: true })
      ).toHaveCount(0);
      await checkbox.check();
      await expect(checkbox).toHaveCSS("background-image", /data:image/);
      await sheet.getByRole("button", { name: "Back", exact: true }).click();
      await expect(links).toBeFocused();
      await expectSheetTop(sheet, initialHeader!.y);
      expect(writes).toBe(0);
      await expect(
        sheet.getByRole("tab", { name: "Configuration", exact: true })
      ).toHaveAttribute("aria-selected", "true");
      await links.click();
      await expect(checkbox).not.toBeChecked();
      await checkbox.check();
      await sheet.getByRole("button", { name: "Save", exact: true }).click();
      await expect(
        page.getByText("Couldn't save these wave settings.", { exact: true })
      ).toBeVisible();
      await expect(checkbox).toBeChecked();
      await expect(sheet).toHaveAccessibleName("Edit links");
      failSave = false;
      await sheet.getByRole("button", { name: "Save", exact: true }).click();
      await expect(links).toBeFocused();
      await expect(row.getByText("Disabled", { exact: true })).toBeVisible();
      expect(writes).toBe(2);

      for (const label of [
        "Edit Visibility access",
        "Edit Chat access",
        "Edit Admins access",
      ]) {
        const trigger = sheet.getByRole("button", { name: label, exact: true });
        await trigger.click();
        await expect(sheet).toHaveCount(1);
        await expect(sheet).toHaveAccessibleName(label);
        await expectSheetTop(sheet, initialHeader!.y);
        await expect(
          sheet.getByRole("button", { name: "Back", exact: true })
        ).toBeVisible();
        await expect(
          sheet.getByRole("button", { name: "Save changes", exact: true })
        ).toBeVisible();
        await expectNoHorizontalOverflow(page);
        if (label === "Edit Visibility access") {
          await sheet
            .getByRole("button", { name: "Make wave public", exact: true })
            .click();
          const confirmation = page.getByRole("dialog", {
            name: "Make wave public?",
            exact: true,
          });
          await expect(
            confirmation.getByRole("heading", {
              name: "Make wave public?",
              exact: true,
            })
          ).toBeVisible();
          await confirmation
            .getByRole("button", { name: "Make public", exact: true })
            .click({ trial: true });
          await confirmation
            .getByRole("button", { name: "Cancel", exact: true })
            .click();
          await expect(confirmation).toHaveCount(0);
          await expect(sheet).toHaveCount(1);
          await expect(sheet).toHaveAccessibleName(label);
        }
        await page.screenshot({
          path: testInfo.outputPath(
            `configuration-${surface}-${label.split(" ")[1]}.png`
          ),
        });
        if (label === "Edit Chat access") await page.goBack();
        else if (label === "Edit Admins access")
          await page.keyboard.press("Escape");
        else
          await sheet
            .getByRole("button", { name: "Back", exact: true })
            .click();
        await expect(trigger).toBeFocused();
        await expect(
          sheet.getByRole("tab", { name: "Configuration", exact: true })
        ).toHaveAttribute("aria-selected", "true");
        await expect(page).toHaveURL(originalUrl);
      }
      expect(writes).toBe(2);
      await links.click();
      if (surface === "web") {
        // A history entry without its optional title still needs a named sheet.
        await page.evaluate(() => {
          const state = { ...window.history.state };
          delete state.waveInformationViewTitle;
          window.history.replaceState(state, "");
        });
        await page.goBack();
        await expect(links).toBeFocused();
        await page.goForward();
        await expect(sheet).toHaveAccessibleName(`About ${wave.name}`);
        await expect(checkbox).toBeVisible();
      }
      await swipeVertically(
        page,
        sheet.getByTestId("mobile-dialog-header"),
        90
      );
      await expect(sheet).toHaveCount(0);
      await expect(page).toHaveURL(originalUrl);
      await expect
        .poll(() => page.evaluate(() => window.history.state?.waveInformation))
        .toBeUndefined();
    });
  }

  test("keeps wave Configuration in the information panel and competition appearance in Settings", async ({
    page,
  }) => {
    const sandbox = await installCompetitionApi(page);
    sandbox.onlyCompetition("alpha");
    await sandbox.legacyPrimary("alpha");
    await page.goto(`/waves/${WAVE}?tab=chat`);
    const information = await openWaveInformation(page);
    for (const name of ["About", "REP", "Configuration"]) {
      const section = information.getByRole("tab", { name, exact: true });
      await expect(section).toHaveCSS("height", "32px");
      await expect(section).toHaveCSS("border-radius", "9999px");
    }
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
    test(`recovers the selected Leaderboard after an initial missing wave metadata response (${app ? "app" : "web"})`, async ({
      page,
    }, testInfo) => {
      test.skip(
        app && testInfo.project.name !== "web-mobile-chromium",
        "The native app layout is covered in the mobile project."
      );
      const sandbox = await installCompetitionApi(page, false, false);
      sandbox.onlyCompetition("alpha");
      if (app)
        await installSurfaceSimulation(
          page.context(),
          "capacitor-ios-sim",
          testInfo.project.use.baseURL
        );
      let waveMissing = true;
      let metadataReads = 0;
      let releaseRecovery!: () => void;
      const recoveryGate = new Promise<void>((resolve) => {
        releaseRecovery = resolve;
      });
      await page.route(`**/api/waves/${WAVE}`, async (route) => {
        metadataReads += 1;
        if (waveMissing)
          return route.fulfill({
            status: 404,
            json: { message: `Wave ${WAVE} not found` },
          });
        await recoveryGate;
        return route.fallback();
      });
      try {
        await page.goto(`${ROOT}/alpha?tab=leaderboard`);
        const unavailable = page
          .getByRole("alert")
          .filter({ hasText: "This competition could not be loaded" });
        const retry = unavailable.getByRole("button", {
          name: "Try again",
          exact: true,
        });
        await expect(unavailable).toBeVisible();
        expect(metadataReads).toBeGreaterThan(0);
        await expect(page).toHaveURL(`${ROOT}/alpha?tab=leaderboard`);
        if (app)
          await expect(
            page.getByRole("button", { name: "Back", exact: true })
          ).toBeVisible();
        const entry = page.getByText("Immutable alpha entry content", {
          exact: true,
        });
        const chat = page.getByRole("region", {
          name: "Wave chat file upload area",
          exact: true,
        });
        await expect(entry).toHaveCount(0);
        await expect(chat).toHaveCount(0);
        waveMissing = false;
        // Keep successful metadata pending while late 404 observers settle.
        // The user must retain the selected route and its retry action.
        await page.waitForTimeout(500);
        await expect(page).toHaveURL(`${ROOT}/alpha?tab=leaderboard`);
        await expect(unavailable).toBeVisible();
        await expect(retry).toBeVisible();
        await expect(entry).toHaveCount(0);
        await expect(chat).toHaveCount(0);
        await page.screenshot({
          path: testInfo.outputPath("selected-competition-metadata-error.png"),
        });
        await retry.click();
        releaseRecovery();
        await expect(entry).toBeVisible();
        await expect(unavailable).toHaveCount(0);
        await expect(page).toHaveURL(`${ROOT}/alpha?tab=leaderboard`);
        await expect(
          page.getByRole(app ? "button" : "tab", {
            name: "Leaderboard",
            exact: true,
          })
        ).toHaveAttribute(app ? "aria-current" : "aria-selected", "true");
        await expect(chat).toHaveCount(0);
        await expect(
          page.getByRole(app ? "button" : "tab", {
            name: /^Competitions(?:\s+\d+\+?)?$/,
          })
        ).toHaveCount(0);
        expect(sandbox.requests).toEqual([]);
      } finally {
        releaseRecovery();
      }
    });

    test(`ignores a previous ordinary wave's delayed missing metadata after another competition commits (${app ? "app" : "web"})`, async ({
      page,
    }, testInfo) => {
      test.skip(
        app && testInfo.project.name !== "web-mobile-chromium",
        "The native app layout is covered in the mobile project."
      );
      const previousWave = "00000000-0000-4000-8000-000000000536";
      const sandbox = await installCompetitionApi(page, false, false);
      sandbox.onlyCompetition("alpha");
      if (app)
        await installSurfaceSimulation(
          page.context(),
          "capacitor-ios-sim",
          testInfo.project.use.baseURL
        );
      await page.route(`**/v3/waves/${previousWave}**`, (route) => {
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
            id: previousWave,
            name: "Pending ordinary wave",
            legacy_primary_competition_id: null,
            permissions: {
              view: true,
              administer: false,
              create_competition: false,
            },
          },
        });
      });
      const overviewResponse = await page.request.get(
        `${getSandboxApiOrigin(process.env["PLAYWRIGHT_BASE_URL"])}/api/v2/waves/${WAVE}/drops`
      );
      expect(overviewResponse.ok()).toBe(true);
      const overview = (await overviewResponse.json()).wave;
      const targetWave = {
        ...overview,
        id: WAVE,
        name: "Selected competition wave",
      };
      await page.route(/\/api\/v2\/waves(?:\?|$)/, (route) =>
        route.fulfill({ json: { data: [targetWave], page: 1, next: false } })
      );
      await page.route("**/api/v2/official-waves", (route) =>
        route.fulfill({ json: [targetWave] })
      );
      const metadataResponse = await page.request.get(
        `${getSandboxApiOrigin(process.env["PLAYWRIGHT_BASE_URL"])}/api/waves/${WAVE}`
      );
      expect(metadataResponse.ok()).toBe(true);
      const metadata = await metadataResponse.json();
      const ordinaryWave = {
        ...metadata,
        id: previousWave,
        name: "Pending ordinary wave",
        description_drop: {
          ...metadata.description_drop,
          wave: {
            ...metadata.description_drop.wave,
            id: previousWave,
            name: "Pending ordinary wave",
          },
        },
      };
      await page.clock.install();
      let waveMissing = false;
      let metadataPending = false;
      let releaseMissing!: () => void;
      const missingGate = new Promise<void>((resolve) => {
        releaseMissing = resolve;
      });
      await page.route(`**/api/waves/${previousWave}`, async (route) => {
        if (!waveMissing) return route.fulfill({ json: ordinaryWave });
        metadataPending = true;
        await missingGate;
        return route.fulfill({
          status: 404,
          json: { message: `Wave ${previousWave} not found` },
        });
      });
      const committedRoutes: string[] = [];
      const observeRoute = (frame: Frame) => {
        if (frame === page.mainFrame()) committedRoutes.push(page.url());
      };
      try {
        await page.goto(`/waves/${previousWave}`);
        await expect(
          page.getByRole("button", {
            name: "About Pending ordinary wave",
            exact: true,
          })
        ).toBeVisible();
        waveMissing = true;
        // Reconnecting refetches mounted, stale metadata. Unlike a cold
        // ViewContext lookup, this request survives leaving its view.
        await page.clock.fastForward(60_100);
        await page.context().setOffline(true);
        await page.context().setOffline(false);
        await expect.poll(() => metadataPending).toBe(true);
        if (app) {
          await page.getByRole("button", { name: "Back", exact: true }).click();
          await expect(page).toHaveURL(/\/waves$/);
        } else if (testInfo.project.name === "web-mobile-chromium") {
          await page
            .getByRole("button", { name: "Open menu", exact: true })
            .click();
          await page
            .getByRole("navigation", {
              name: "Desktop navigation",
              exact: true,
            })
            .getByRole("link", { name: "Waves", exact: true })
            .click();
          await expect(page).toHaveURL(/\/waves$/);
        }
        await page
          .getByRole("region", {
            name: /All recent waves list|Regular waves list/,
          })
          .getByRole("link")
          .filter({ hasText: targetWave.name })
          .first()
          .click();
        const leaderboard = page.getByRole(app ? "button" : "tab", {
          name: "Leaderboard",
          exact: true,
        });
        await leaderboard.click();
        const selectedUrl = `${ROOT}/alpha?tab=leaderboard`;
        const entry = page.getByText("Immutable alpha entry content", {
          exact: true,
        });
        await expect(page).toHaveURL(selectedUrl);
        await expect(entry).toBeVisible();
        await expect(leaderboard).toHaveAttribute(
          app ? "aria-current" : "aria-selected",
          "true"
        );
        const missingResponse = page.waitForResponse(
          (response) =>
            new URL(response.url()).pathname === `/api/waves/${previousWave}` &&
            response.status() === 404
        );
        committedRoutes.push(page.url());
        page.on("framenavigated", observeRoute);
        releaseMissing();
        const response = await missingResponse;
        expect(await response.finished()).toBeNull();
        // Exercise callbacks from the previous wave after the new route is ready.
        await page.waitForTimeout(500);
        await expect(page).toHaveURL(selectedUrl);
        await expect(entry).toBeVisible();
        await expect(leaderboard).toHaveAttribute(
          app ? "aria-current" : "aria-selected",
          "true"
        );
        page.off("framenavigated", observeRoute);
        expect(committedRoutes).toEqual(
          committedRoutes.map(() => new URL(selectedUrl, page.url()).href)
        );
        await writeFile(
          testInfo.outputPath("stale-wave-response-sequence.json"),
          JSON.stringify({
            previousWave,
            selectedUrl,
            responseUrl: response.url(),
            responseStatus: response.status(),
            committedRoutes,
          })
        );
        await expect(
          page.getByRole("region", {
            name: "Wave chat file upload area",
            exact: true,
          })
        ).toHaveCount(0);
        await page.screenshot({
          path: testInfo.outputPath("selected-competition-after-stale-404.png"),
        });
        expect(sandbox.requests).toEqual([]);
      } finally {
        page.off("framenavigated", observeRoute);
        releaseMissing();
      }
    });

    test(`keeps the selected Leaderboard during loading and transient refresh errors, and rejects revoked access (${app ? "app" : "web"})`, async ({
      page,
    }, testInfo) => {
      test.skip(
        app && testInfo.project.name !== "web-mobile-chromium",
        "The native app layout is covered in the mobile project."
      );
      const sandbox = await installCompetitionApi(page, false, false);
      sandbox.onlyCompetition("alpha");
      await sandbox.legacyPrimary("alpha");
      if (app)
        await installSurfaceSimulation(
          page.context(),
          "capacitor-ios-sim",
          testInfo.project.use.baseURL
        );
      // Advance the actual query refresh interval without adding a 30-second
      // sleep or loosening the test's timeout.
      await page.clock.install();
      let releaseInitial!: () => void;
      const initialGate = new Promise<void>((resolve) => {
        releaseInitial = resolve;
      });
      let loading = true;
      let refreshStatus = 200;
      await page.route("**/v3/waves/*/competitions/alpha", async (route) => {
        if (loading) await initialGate;
        if (refreshStatus !== 200)
          return route.fulfill({
            status: refreshStatus,
            json: { message: "Selected competition refresh failed" },
          });
        return route.fallback();
      });
      const tabs = app
        ? page.getByRole("navigation", { name: "Wave sections" })
        : waveTabStrip(page).filter({ visible: true });
      const leaderboard = tabs.getByRole(app ? "button" : "tab", {
        name: "Leaderboard",
        exact: true,
      });
      const collection = tabs.getByRole(app ? "button" : "tab", {
        name: /^Competitions(?:\s+\d+\+?)?$/,
      });
      const modes = page.getByRole("tablist", {
        name: "Leaderboard view modes",
      });
      const expectSelectedSection = async () => {
        await expect(leaderboard).toHaveAttribute(
          app ? "aria-current" : "aria-selected",
          "true"
        );
        await expect(collection).toHaveCount(0);
        await expect(
          page.getByRole("region", {
            name: "Wave chat file upload area",
            exact: true,
          })
        ).toHaveCount(0);
        await expect(page).toHaveURL(`${ROOT}/alpha?tab=leaderboard`);
      };
      try {
        await page.goto(`${ROOT}/alpha?tab=leaderboard`);
        await expect(
          page.getByRole("status").filter({ hasText: "Loading competition…" })
        ).toBeVisible({ timeout: 30000 });
        await expectSelectedSection();
        loading = false;
        releaseInitial();
        await expectLegacySectionContent(page, "leaderboard");
        await expectSelectedSection();
        const retainedModes = await modes.elementHandle();
        expect(retainedModes).not.toBeNull();
        const refresh = async (status: number) => {
          refreshStatus = status;
          const response = page.waitForResponse(
            (candidate) =>
              new URL(candidate.url()).pathname ===
                `/api/v3/waves/${WAVE}/competitions/alpha` &&
              candidate.status() === status
          );
          await page.clock.fastForward(30_100);
          await (await response).finished();
        };
        await refresh(503);
        await expectSelectedSection();
        await expect(modes).toBeVisible();
        expect(
          await retainedModes!.evaluate((element) => element.isConnected),
          "A transient refresh failure must retain the mounted Leaderboard"
        ).toBe(true);
        await expect(
          page.getByText(/This competition could not be loaded/)
        ).toHaveCount(0);
        await refresh(403);
        await expectSelectedSection();
        await expect(
          page.getByText(/This competition could not be loaded/)
        ).toBeVisible();
        await expect(modes).toHaveCount(0);
        await expect(
          page.getByText("No drops to show", { exact: true })
        ).toHaveCount(0);
        refreshStatus = 200;
        await page
          .getByRole("button", { name: "Try again", exact: true })
          .click();
        await expectLegacySectionContent(page, "leaderboard");
        await expectSelectedSection();
        await retainedModes!.dispose();
        expect(sandbox.requests).toEqual([]);
        await expectNoHorizontalOverflow(page);
      } finally {
        loading = false;
        releaseInitial();
      }
    });

    test(`keeps settled tabs still during an unchanged competition refresh (${app ? "app" : "web"})`, async ({
      page,
    }, testInfo) => {
      test.skip(
        app && testInfo.project.name !== "web-mobile-chromium",
        "The native app layout is covered in the mobile project."
      );
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
      await selectCompetitionFilter(page, "All");
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

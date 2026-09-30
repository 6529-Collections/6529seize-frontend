import { writeFile } from "node:fs/promises";
import type { Page } from "@playwright/test";
import { expect, expectNoHorizontalOverflow, test } from "../testHelpers";
import {
  dismissNextDevTools,
  getSandboxApiOrigin,
  useLocalSandboxMutationGuard,
} from "../support/localSandbox";

const WAVE = "00000000-0000-4000-8000-000000000529";
const PROFILE = "00000000-0000-4000-8000-000000000531";
const entryDropId = (id: string) =>
  id === "alpha"
    ? "00000000-0000-4000-8000-000000000532"
    : "00000000-0000-4000-8000-000000000533";
const ROOT = `/waves/${WAVE}/competitions`;
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

async function installCompetitionApi(page: Page, selfNomination = false) {
  const fixtureResponse = await page.request.get(
    `${getSandboxApiOrigin(process.env["PLAYWRIGHT_BASE_URL"])}/api/v2/waves/${WAVE}/drops`
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
  if (selfNomination) {
    Object.assign(competitions[0]!.participation, {
      submission_type: "IDENTITY",
      identity_submission_strategy: "ONLY_MYSELF",
      terms: "Keep submissions original and follow this competition’s rules.",
    });
  }
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
        id: WAVE,
        name: request["name"],
        legacy_primary_competition_id: null,
        permissions: { view: true, administer: true, create_competition: true },
      },
    });
  });
  const entry = (id: string) => ({
    id: `entry-${id}`,
    wave_id: WAVE,
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
    const suffix = url.pathname.split(`/v3/waves/${WAVE}`)[1];
    if (suffix === undefined) return route.fallback();
    const method = route.request().method();
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
        id: WAVE,
        name: "Sandbox Composer Wave",
        legacy_primary_competition_id: null,
        permissions: { view: true, administer: true, create_competition: true },
      };
    else if (suffix === "/competitions") body = pageResult(competitions);
    else if (!selected)
      return route.fulfill({ status: 404, json: { message: "Not found" } });
    else if (!resource) body = selected;
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
        wave_id: WAVE,
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
  return { requests };
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
      page.getByRole("tab", { name: /^Competitions(?:\s+\d+\+?)?$/ })
    ).toHaveAttribute("aria-selected", "true");
    await expect(
      page.getByRole("heading", {
        name: "Parallel Alpha",
        exact: true,
        level: 1,
      })
    ).toBeVisible({ timeout: 30000 });
    await expect(
      page.getByText("Immutable alpha entry content", { exact: true })
    ).toBeVisible({ timeout: 30000 });
    await page.getByRole("tab", { name: "My votes", exact: true }).click();
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
      .getByRole("link", { name: "All competitions", exact: true })
      .click();
    await page.getByRole("link", { name: /Parallel Beta/ }).click();
    await expect(
      page.getByRole("tab", { name: "Entries", exact: true })
    ).toHaveCount(0);
    await expect(
      page.getByRole("tab", { name: "Leaderboard", exact: true })
    ).toHaveAttribute("aria-selected", "true");
    await expect(
      page.getByRole("heading", {
        name: "Parallel Beta",
        exact: true,
        level: 1,
      })
    ).toBeVisible({ timeout: 30000 });
    const backLink = page.getByRole("link", {
      name: "All competitions",
      exact: true,
    });
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
            ?.closest("a") === element,
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
    await page.getByRole("tab", { name: "My votes", exact: true }).click();
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
      page.getByRole("tab", { name: "Leaderboard", exact: true })
    ).toHaveAttribute("aria-selected", "true");
    await expect(
      page.getByRole("spinbutton", { name: "Your vote" })
    ).toHaveCount(0);
    await page.goForward();
    await expect(page).toHaveURL(/beta\?tab=votes$/);
    await expect(
      page.getByRole("tab", { name: "My votes", exact: true })
    ).toHaveAttribute("aria-selected", "true");
    await expect(
      page.getByRole("spinbutton", { name: "Your vote" })
    ).toHaveValue("0");
    await page.getByRole("tab", { name: "Chat", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/waves/${WAVE}$`), {
      timeout: 30000,
    });
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
        name: "Parallel Beta",
        exact: true,
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
    await expect(
      page.getByRole("tab", { name: "Leaderboard", exact: true })
    ).toHaveCount(0);
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
      .selectOption("APPROVE");
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
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Access", level: 2 })
    ).toBeVisible({ timeout: 30000 });
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Guidelines", level: 2, exact: true })
    ).toBeVisible();
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page
      .getByRole("textbox", { name: "Describe your wave", exact: true })
      .fill("A shared chat with independently configured competitions.");
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page
      .getByRole("button", { name: "Confirm and create", exact: true })
      .click();
    await expect(page).toHaveURL(new RegExp(`/waves/${WAVE}$`), {
      timeout: 30000,
    });
    expect(sandbox.requests).toHaveLength(1);
    expect(sandbox.requests[0]?.path).toBe("/api/v3/waves");
    expect(sandbox.requests[0]?.body).toMatchObject({
      name: "Native shared hub",
      chat: { enabled: true },
    });
    expect(sandbox.requests[0]?.body).not.toHaveProperty("participation");
    expect(sandbox.requests[0]?.body).not.toHaveProperty("voting");
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

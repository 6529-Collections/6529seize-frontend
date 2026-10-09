import type { Locator, Page, Route } from "@playwright/test";

import {
  expect,
  captureSafeScreenshot,
  expectNoHorizontalOverflow,
  test,
  waitForRouteReady,
} from "../testHelpers";
import { gotoDocumentWithTransientRetry } from "../support/routeReadiness";

const NAVIGATION_TIMEOUT_MS = 15000;
const GLOBAL_SEARCH_QUERY = "wave score";
const GLOBAL_SEARCH_RESULT = /Wave Score.*Network/i;
const UNMATCHABLE_WAVE_QUERY = "zzzzzz-wave-e2e-no-match-6529";
const LOCAL_ACTIVE_WAVE_ID = "00000000-0000-4000-8000-000000000529";

const publicScope = { group: null };
const localFixtureProfile = {
  id: "00000000-0000-4000-8000-000000000001",
  handle: "playwright",
  pfp: null,
  banner1_color: null,
  banner2_color: null,
  cic: 0,
  rep: 0,
  tdh: 0,
  tdh_rate: 0,
  xtdh: 0,
  xtdh_rate: 0,
  level: 0,
  classification: "BOT",
  sub_classification: null,
  primary_address: "0x0000000000000000000000000000000000000000",
  subscribed_actions: [],
  archived: false,
  active_main_stage_submission_ids: [],
  winner_main_stage_drop_ids: [],
  artist_of_prevote_cards: [],
  profile_wave_id: null,
  is_wave_creator: false,
};
const localFixtureWaveMin = {
  id: LOCAL_ACTIVE_WAVE_ID,
  name: "Local Search Fixture Wave",
  picture: null,
  description_drop_id: "local-search-fixture-description-drop",
  last_drop_time: 1713744000000,
  authenticated_user_eligible_to_vote: false,
  authenticated_user_eligible_to_participate: false,
  authenticated_user_eligible_to_chat: false,
  authenticated_user_admin: false,
  visibility_group_id: null,
  participation_group_id: null,
  chat_group_id: null,
  voting_group_id: null,
  admin_group_id: null,
  voting_period_start: null,
  voting_period_end: null,
  voting_credit_type: "REP",
  admin_drop_deletion_enabled: false,
  forbid_negative_votes: false,
  pinned: false,
  identity_wave: false,
  submission_type: null,
  voting_credit_nfts: null,
  links_disabled: false,
  wave_author_handle: "playwright",
  voting_credit_scope: "WAVE",
};
const localFixtureWaveOverview = {
  id: LOCAL_ACTIVE_WAVE_ID,
  name: localFixtureWaveMin.name,
  pfp: null,
  last_drop_time: localFixtureWaveMin.last_drop_time,
  is_private: false,
  links_disabled: false,
  forbid_negative_votes: false,
  context_profile_context: {
    can_chat: false,
    pinned: false,
  },
};
const localFixtureWave = {
  id: LOCAL_ACTIVE_WAVE_ID,
  serial_no: 6529,
  author: localFixtureProfile,
  name: "Local Search Fixture Wave",
  picture: null,
  created_at: 1713744000000,
  last_drop_time: 1713744000000,
  description_drop: {
    id: localFixtureWaveMin.description_drop_id,
    serial_no: 1,
    drop_type: "CHAT",
    rank: null,
    wave: localFixtureWaveMin,
    author: localFixtureProfile,
    created_at: 1713744000000,
    updated_at: null,
    title: null,
    parts: [],
    parts_count: 1,
    referenced_nfts: [],
    mentioned_users: [],
    mentioned_groups: [],
    mentioned_waves: [],
    metadata: [],
    rating: 0,
    realtime_rating: 0,
    rating_prediction: 0,
    top_raters: [],
    raters_count: 0,
    context_profile_context: null,
    subscribed_actions: [],
    is_signed: false,
    reactions: [],
    boosts: 0,
    is_additional_action_promised: false,
    hide_link_preview: false,
  },
  voting: {
    scope: publicScope,
    credit_type: "REP",
    credit_scope: "WAVE",
    credit_category: null,
    credit_nfts: null,
    creditor: null,
    signature_required: false,
    authenticated_user_eligible: false,
    forbid_negative_votes: false,
  },
  visibility: { scope: publicScope },
  participation: {
    scope: publicScope,
    no_of_applications_allowed_per_participant: null,
    required_metadata: [],
    required_media: [],
    signature_required: false,
    authenticated_user_eligible: false,
    terms: null,
    submission_strategy: null,
  },
  chat: {
    scope: publicScope,
    enabled: true,
    links_disabled: false,
    authenticated_user_eligible: false,
  },
  wave: {
    type: "CHAT",
    winning_threshold: null,
    winning_threshold_min_duration_ms: null,
    max_winners: null,
    max_votes_per_identity_to_drop: null,
    time_lock_ms: null,
    admin_group: publicScope,
    authenticated_user_eligible_for_admin: false,
    decisions_strategy: null,
    next_decision_time: null,
    admin_drop_deletion_enabled: false,
    total_no_of_decisions: null,
    no_of_decisions_done: null,
    no_of_decisions_left: null,
  },
  contributors_overview: [],
  subscribed_actions: [],
  metrics: {},
  pauses: [],
  pinned: false,
  identity_wave: false,
};

async function gotoReady(page: Page, path: string) {
  await gotoDocumentWithTransientRetry(page, path);
  await waitForRouteReady(page);
  await expectNoHorizontalOverflow(page);
}

async function firstVisible(locator: Locator) {
  // Server-rendered content can precede the interactive navigation shell.
  const candidate = locator.filter({ visible: true }).first();
  await expect(candidate).toBeVisible({ timeout: NAVIGATION_TIMEOUT_MS });
  return candidate;
}

async function openHeaderSearch(page: Page) {
  const searchButton = await firstVisible(
    page.getByRole("button", { name: /^Search(?: 6529)?$/ })
  );
  await expect(searchButton).toBeEnabled({ timeout: NAVIGATION_TIMEOUT_MS });
  await searchButton.click();
  const searchInput = page.locator("#header-search-input");
  await expect(searchInput).toBeVisible();
  await expect(searchInput).toBeFocused();
  return { searchButton, searchInput };
}

function isLocalBaseURL(baseURL: string | undefined) {
  if (!baseURL) {
    return false;
  }

  try {
    const hostname = new URL(baseURL).hostname;
    return (
      hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1"
    );
  } catch {
    return false;
  }
}

async function installLocalActiveWaveSearchFixture(page: Page) {
  await page.route(`**/api/waves/${LOCAL_ACTIVE_WAVE_ID}**`, async (route) => {
    await fulfillLocalReadOnlyFixture(route, {
      contentType: "application/json",
      json: localFixtureWave,
      status: 200,
    });
  });

  await page.route(
    `**/api/v2/waves/${LOCAL_ACTIVE_WAVE_ID}/search**`,
    async (route) => {
      await fulfillLocalReadOnlyFixture(route, {
        contentType: "application/json",
        json: {
          data: [],
          next: false,
          page: 1,
        },
        status: 200,
      });
    }
  );

  await page.route(
    `**/api/v2/waves/${LOCAL_ACTIVE_WAVE_ID}/drops**`,
    async (route) => {
      await fulfillLocalReadOnlyFixture(route, {
        contentType: "application/json",
        json: {
          drops: [],
          wave: localFixtureWaveOverview,
        },
        status: 200,
      });
    }
  );
}

async function installSidebarScoreFixture(
  page: Page,
  votesReady?: Promise<void>
) {
  await page.route("**/api/v2/waves/active-votes**", async (route) => {
    await votesReady;
    await fulfillLocalReadOnlyFixture(route, {
      contentType: "application/json",
      status: 200,
      json: {
        page: 1,
        next: false,
        count: 3,
        data: [0, 1, 2].map((index) => ({
          wave: {
            ...localFixtureWaveOverview,
            id: `00000000-0000-4000-8000-00000000053${index}`,
            name: `Search score fixture ${index + 1}`,
            wave_score: {
              visibility_score: 83,
              quality_score: 78,
              hotness_score: 92,
              rep_sort_score: 41,
            },
          },
          voting_ends_at: null,
          next_decision_at: null,
        })),
      },
    });
  });
}

async function fulfillLocalReadOnlyFixture(
  route: Route,
  response: Parameters<Route["fulfill"]>[0]
) {
  const method = route.request().method().toUpperCase();

  if (method !== "GET" && method !== "HEAD") {
    const pathname = new URL(route.request().url()).pathname;
    throw new Error(
      `Local read-only wave fixture refused ${method} ${pathname}.`
    );
  }

  await route.fulfill(response);
}

async function openLocalWaveSearchModal(page: Page) {
  await installLocalActiveWaveSearchFixture(page);
  await gotoReady(page, `/waves?wave=${LOCAL_ACTIVE_WAVE_ID}`);

  await page
    .getByRole("button", {
      exact: true,
      name: "Search messages in this wave",
    })
    .click();
  const searchInput = page.locator("#wave-drops-search-input");
  await expect(searchInput).toBeVisible();
  await expect(searchInput).toBeFocused();

  return {
    expectedQueryWaveId: LOCAL_ACTIVE_WAVE_ID,
    expectedPath: `/waves/${LOCAL_ACTIVE_WAVE_ID}`,
    searchInput,
  };
}

async function getRecentPublicWavePaths(page: Page) {
  await gotoReady(page, "/waves");

  const waveList = page.getByRole("region", {
    name: /All recent waves list|Regular waves list/,
  });
  await expect(waveList).toBeVisible({ timeout: NAVIGATION_TIMEOUT_MS });

  const hrefs = await waveList
    .locator('a[href^="/waves/"]')
    .evaluateAll((links) =>
      links
        .map((link) => link.getAttribute("href"))
        .filter((href): href is string => Boolean(href))
    );

  const paths = Array.from(
    new Set(
      hrefs
        .map((href) => new URL(href, page.url()).pathname)
        .filter((pathname) => /^\/waves\/[0-9a-f-]{36}$/i.test(pathname))
    )
  );

  expect(
    paths.length,
    "Expected at least one public wave detail link"
  ).toBeGreaterThan(0);
  return paths;
}

async function openSearchOnFirstWaveWithSearch(page: Page) {
  const candidateWavePaths = await getRecentPublicWavePaths(page);

  for (const wavePath of candidateWavePaths.slice(0, 6)) {
    await gotoReady(page, wavePath);

    const searchMessagesButton = page.getByRole("button", {
      exact: true,
      name: "Search messages in this wave",
    });
    const hasWaveSearch = await searchMessagesButton
      .waitFor({ state: "visible", timeout: 5000 })
      .then(() => true)
      .catch(() => false);

    if (hasWaveSearch) {
      await searchMessagesButton.click();
      const searchInput = page.locator("#wave-drops-search-input");
      await expect(searchInput).toBeVisible();
      await expect(searchInput).toBeFocused();
      return { searchInput, wavePath };
    }
  }

  throw new Error(
    "Expected at least one public wave detail route with wave search."
  );
}

test.describe("Search and wave-detail read-only coverage @surface @medium @large @readonly", () => {
  test("mobile wave shortcuts keep generous touch areas around compact buttons", async ({
    page,
  }, testInfo) => {
    // Desktop keeps its smaller controls; 44px targets apply to touch input.
    test.skip(
      !testInfo.project.use.hasTouch,
      "Touch target geometry is mobile-only"
    );
    await gotoReady(page, "/waves");
    const shortcuts = [
      page.getByRole("link", { name: "Profile Waves Feed", exact: true }),
      page.getByRole("button", { name: "Find a wave…", exact: true }),
    ];
    for (const shortcut of shortcuts) {
      const visibleShortcut = shortcut.filter({ visible: true });
      await visibleShortcut.scrollIntoViewIfNeeded();
      const geometry = await visibleShortcut.evaluate((element) => {
        const target = element.getBoundingClientRect();
        const surface = element.firstElementChild?.getBoundingClientRect();
        const icon = element.querySelector("svg")?.getBoundingClientRect();
        const corners = [
          [target.left + 1, target.top + 1],
          [target.right - 1, target.top + 1],
          [target.left + 1, target.bottom - 1],
          [target.right - 1, target.bottom - 1],
        ] as const;
        return {
          target: [target.width, target.height],
          surface: [surface?.width, surface?.height],
          icon: [icon?.width, icon?.height],
          cornersReachTarget: corners.every(([x, y]) =>
            element.contains(document.elementFromPoint(x, y))
          ),
        };
      });
      expect(geometry).toEqual({
        target: [44, 44],
        surface: [40, 40],
        icon: [16, 16],
        cornersReachTarget: true,
      });
    }
    await page.screenshot({
      path: testInfo.outputPath("mobile-shortcuts.png"),
    });
  });

  test("sidebar score details close while wave search is open and return afterwards", async ({
    page,
  }, testInfo) => {
    await installSidebarScoreFixture(page);
    await gotoReady(page, "/waves");
    const votes = page
      .getByRole("region", { name: "Active voting waves" })
      .filter({ visible: true });
    const score = votes.getByRole("button", { name: /^Wave score / }).first();
    await expect(score).toBeEnabled({ timeout: NAVIGATION_TIMEOUT_MS });
    await score.click();
    const details = page.getByRole("dialog", { name: "Wave score details" });
    await expect(details).toBeVisible();
    const searchToggle = page
      .getByRole("button", { name: "Find a wave…", exact: true })
      .filter({ visible: true });
    await searchToggle.focus();
    await searchToggle.press("Enter");
    const search = page
      .getByRole("searchbox", { name: "Find a wave…" })
      .filter({ visible: true });
    await expect(search).toBeFocused();
    await expect(details).toHaveCount(0);
    await expect(score).toBeDisabled();
    await score.hover();
    await search.fill(UNMATCHABLE_WAVE_QUERY);
    await expect(
      page
        .getByRole("region", { name: "Search results · All waves" })
        .filter({ visible: true })
        .getByRole("status")
    ).toHaveText(`No waves found for “${UNMATCHABLE_WAVE_QUERY}”.`, {
      timeout: NAVIGATION_TIMEOUT_MS,
    });
    await expect(details).toHaveCount(0);
    await expect(score).toBeDisabled();
    await captureSafeScreenshot(
      page,
      testInfo,
      "wave-search-score-details-suppressed"
    );
    await page
      .getByRole("button", { name: "Close wave search" })
      .filter({ visible: true })
      .click();
    await expect(search).toHaveCount(0);
    await expect(score).toBeEnabled();
    await score.click();
    await expect(details).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(details).toHaveCount(0);
  });

  test("late-loading vote scores cannot obstruct closing an empty wave search", async ({
    page,
  }) => {
    let releaseVotes!: () => void;
    const votesReleased = new Promise<void>((resolve) => {
      releaseVotes = resolve;
    });
    await installSidebarScoreFixture(page, votesReleased);
    try {
      await gotoReady(page, "/waves");
      await page
        .getByRole("button", { name: "Find a wave…", exact: true })
        .filter({ visible: true })
        .click();
      const search = page
        .getByRole("searchbox", { name: "Find a wave…" })
        .filter({ visible: true });
      await expect(search).toBeFocused();
      await expect(search).toHaveValue("");
      releaseVotes();
      const score = page
        .getByRole("region", { name: "Active voting waves" })
        .filter({ visible: true })
        .getByRole("button", { name: /^Wave score / })
        .first();
      await expect(score).toBeDisabled({ timeout: NAVIGATION_TIMEOUT_MS });
      await score.hover();
      await expect(
        page.getByRole("dialog", { name: "Wave score details" })
      ).toHaveCount(0);
      await page
        .getByRole("button", { name: "Close wave search" })
        .filter({ visible: true })
        .click();
      await expect(search).toHaveCount(0);
      await expect(score).toBeEnabled();
      await score.click();
      await expect(
        page.getByRole("dialog", { name: "Wave score details" })
      ).toBeVisible();
    } finally {
      releaseVotes();
      await page.unrouteAll({ behavior: "ignoreErrors" });
    }
  });

  test("sidebar discovery and cross-collection search remain directly accessible", async ({
    page,
  }) => {
    await gotoReady(page, "/waves");
    const searchToggle = page
      .getByRole("button", { name: "Find a wave…", exact: true })
      .filter({ visible: true });
    const publicListLabel = page
      .getByText("All Waves", { exact: true })
      .filter({ visible: true });
    await expect(publicListLabel).toBeVisible();
    await searchToggle.click();
    const search = page
      .getByRole("searchbox", { name: "Find a wave…" })
      .filter({ visible: true });
    await expect(search).toBeEnabled();
    await expect(search).toBeFocused();
    await search.fill("xx");
    await expect(search).toHaveValue("xx");
    await expect(
      page
        .getByRole("button", { name: "Close wave search" })
        .filter({ visible: true })
    ).toHaveCount(1);
    await expect(page.getByText("Search results · All waves")).toHaveCount(0);
    await expect(
      page.getByText("Type at least 3 characters to search all waves.").first()
    ).toBeVisible();
    const searchFeedback = page
      .getByRole("region", { name: "Search results · All waves" })
      .filter({ visible: true })
      .getByRole("status");
    await expect(searchFeedback).toHaveAttribute("aria-live", "polite");
    await search.fill(UNMATCHABLE_WAVE_QUERY);
    await expect(searchFeedback).toHaveText(
      `No waves found for “${UNMATCHABLE_WAVE_QUERY}”.`,
      { timeout: NAVIGATION_TIMEOUT_MS }
    );
    await expect(search).toHaveAttribute("aria-busy", "false");
    await (
      await firstVisible(
        page.getByRole("button", { name: "Close wave search" })
      )
    ).click();
    await expect(search).toHaveCount(0);
    await expect(publicListLabel).toBeVisible();
    const discovery = page
      .getByRole("region", { name: "Wave discovery", exact: true })
      .filter({ visible: true });
    const activeToggle = discovery.getByRole("button", {
      name: /(?:Expand|Collapse) Active Votes/,
    });
    const recommendationsToggle = discovery.getByRole("button", {
      name: /(?:Expand|Collapse) Worth Checking Out/,
    });
    if ((await activeToggle.getAttribute("aria-expanded")) === "false")
      await activeToggle.click();
    if ((await recommendationsToggle.getAttribute("aria-expanded")) === "false")
      await recommendationsToggle.click();
    await expect(
      discovery.getByText("Community decisions powered by TDH.")
    ).toBeVisible();
    await expect(
      discovery.getByText("Highly rated waves.", { exact: true })
    ).toBeVisible();
    const voteList = discovery.getByRole("region", {
      name: "Active voting waves",
    });
    await expect(voteList).toBeVisible();
    expect((await voteList.boundingBox())!.height).toBeLessThanOrEqual(145);
    await activeToggle.click();
    await expect(
      discovery.getByRole("link", { name: "View all active votes" })
    ).toBeVisible();
    await expect(
      discovery.getByRole("link", { name: "View all recommendations" })
    ).toBeVisible();
    await searchToggle.click();
    await search.fill("refresh query");
    await page.reload();
    await expect(searchToggle).toBeEnabled();
    await expect(search).toHaveCount(0);
    await expect(activeToggle).toHaveAttribute("aria-expanded", "false");
    await expect(recommendationsToggle).toHaveAttribute(
      "aria-expanded",
      "true"
    );
    await activeToggle.click();
    const allVotes = discovery.getByRole("link", {
      name: "View all active votes",
    });
    await expect(allVotes).toHaveAttribute(
      "href",
      "/discover?view=active-votes"
    );
    await allVotes.click();
    await expect(page).toHaveURL(/\/discover\?view=active-votes$/);
    await expect(
      page.getByRole("heading", { level: 1, name: /^Active Votes/ })
    ).toBeVisible();
    const voteCards = page.getByRole("link", { name: /^View wave / });
    if ((await voteCards.count()) > 0) {
      await expect(
        voteCards
          .first()
          .getByText(/^(Next decision |Voting ends |Voting open$)/)
      ).toBeVisible();
    }
    await expectNoHorizontalOverflow(page);
    await page.getByRole("tab", { name: "Worth Checking Out" }).click();
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Active discussions",
        exact: true,
      })
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("global header search preserves keyboard flow and page navigation", async ({
    page,
  }) => {
    await gotoReady(page, "/");

    const { searchButton, searchInput } = await openHeaderSearch(page);
    await expect(
      page.getByText(/Start typing to search 6529\.io/)
    ).toBeVisible();

    await searchInput.fill("wa");
    await expect(page.getByText(/1 more character/)).toBeVisible();

    await searchInput.fill(GLOBAL_SEARCH_QUERY);
    const waveScoreResult = page
      .getByRole("option", { name: GLOBAL_SEARCH_RESULT })
      .first();
    await expect(waveScoreResult).toBeVisible({
      timeout: NAVIGATION_TIMEOUT_MS,
    });

    await page.keyboard.press("Escape");
    await expect(searchInput).toBeHidden();
    await expect(searchButton).toBeFocused();

    await searchButton.click();
    const reopenedInput = page.locator("#header-search-input");
    await expect(reopenedInput).toBeVisible();
    await reopenedInput.fill(GLOBAL_SEARCH_QUERY);
    await page
      .getByRole("option", { name: GLOBAL_SEARCH_RESULT })
      .first()
      .click();

    await expect(page).toHaveURL(/\/network\/wave-score$/, {
      timeout: NAVIGATION_TIMEOUT_MS,
    });
    await waitForRouteReady(page);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Wave score transparency",
      })
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("wave search exposes read-only message search safely", async ({
    baseURL,
    page,
  }) => {
    const { expectedPath, expectedQueryWaveId, searchInput } = isLocalBaseURL(
      baseURL
    )
      ? await openLocalWaveSearchModal(page)
      : await openSearchOnFirstWaveWithSearch(page).then(
          ({ searchInput, wavePath }) => ({
            expectedPath: wavePath,
            expectedQueryWaveId: null,
            searchInput,
          })
        );

    // The search dialog is ready; pending media must not make the URL check
    // wait for the unrelated page load event.
    await expect
      .poll(
        () => {
          const url = new URL(page.url());
          return (
            url.pathname === expectedPath ||
            (expectedQueryWaveId !== null &&
              url.searchParams.get("wave") === expectedQueryWaveId)
          );
        },
        { message: "Wave search must remain on the selected wave route" }
      )
      .toBe(true);
    await expect(searchInput).toHaveAttribute("placeholder", "Search messages");
    const minimumQueryMessage = page
      .locator("#wave-drops-search-idle-status")
      .getByText(
        "Type at least 3 characters or add a filter to search this wave.",
        { exact: true }
      );
    await expect(minimumQueryMessage).toBeVisible();

    await searchInput.fill("xx");
    await expect(minimumQueryMessage).toBeVisible();

    await searchInput.fill(UNMATCHABLE_WAVE_QUERY);
    await expect(searchInput).toHaveValue(UNMATCHABLE_WAVE_QUERY);
    await expect(
      page
        .locator("#wave-drops-search-empty-status")
        .getByText("No messages found", { exact: true })
    ).toBeVisible({ timeout: NAVIGATION_TIMEOUT_MS });

    await page.getByRole("button", { name: "Clear search" }).click();
    await expect(searchInput).toHaveValue("");
    await expectNoHorizontalOverflow(page);
  });
});

import type { Locator, Page, Route } from "@playwright/test";

import {
  expect,
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
  const count = await locator.count();
  for (let index = 0; index < count; index += 1) {
    const candidate = locator.nth(index);
    if (await candidate.isVisible().catch(() => false)) {
      return candidate;
    }
  }
  throw new Error("Expected at least one visible locator match.");
}

async function openHeaderSearch(page: Page) {
  const searchButton = await firstVisible(
    page.getByRole("button", { name: /^Search(?: 6529)?$/ })
  );
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

    await expect(page).toHaveURL(
      (url) =>
        url.pathname === expectedPath ||
        (expectedQueryWaveId !== null &&
          url.searchParams.get("wave") === expectedQueryWaveId)
    );
    await expect(searchInput).toHaveAttribute("placeholder", "Search messages");
    const minimumQueryMessage = page
      .locator("#wave-drops-search-idle-status")
      .getByText("Type at least 2 characters to search this wave.", {
        exact: true,
      });
    await expect(minimumQueryMessage).toBeVisible();

    await searchInput.fill("x");
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

import type { Locator, Page } from "@playwright/test";
import { ApiProfileClassification } from "../../generated/models/ApiProfileClassification";
import type { ApiXTdhGrantsPage } from "../../generated/models/ApiXTdhGrantsPage";
import { ApiXTdhGrantStatus } from "../../generated/models/ApiXTdhGrantStatus";
import { ApiXTdhGrantTargetChain } from "../../generated/models/ApiXTdhGrantTargetChain";
import { ApiXTdhGrantTargetTokenMode } from "../../generated/models/ApiXTdhGrantTargetTokenMode";
import type { ApiXTdhGrantTokensPage } from "../../generated/models/ApiXTdhGrantTokensPage";
import { expectUrlState } from "../support/urlState";
import { installSurfaceSimulation } from "../support/surfaceSimulation";
import { expectCompetitionScroll } from "../support/competitionScroll";
import {
  expectNativeLeaderboardArtwork,
  expectNativeLeaderboardReady,
  observeNativeLeaderboard,
} from "../support/nativeLeaderboard";
import {
  monitorRememberedLeaderboard,
  retainDesktopWaveSidebar,
} from "../support/waveNavigationContinuity";
import {
  gotoDocumentWithTransientRetry,
  gotoReadyWithApiResponse,
  RESPONSE_TIMEOUT_MS,
} from "../support/routeReadiness";

import { EN_US_MESSAGES } from "../../i18n/messages/en-US";
import {
  captureSafeScreenshot,
  expect,
  expectNoHorizontalOverflow,
  test,
  waitForRouteReady,
} from "../testHelpers";
import {
  expectProfileShell,
  expectProfileTabLinks,
  gotoReady,
  PROFILE_HANDLE,
} from "./profileReadonlyHelpers";

const englishMessages: Readonly<Record<string, string>> = EN_US_MESSAGES;
// Staging can include the localized Profile Waves feed before it reaches main.
const PROFILE_FEED_DESCRIPTION =
  englishMessages["waves.profileFeed.description"] ??
  "Drops 6529 users are featuring from their own profile waves.";
const APP_SECTIONS_LABEL =
  englishMessages["wave.navigation.appSections"] ?? "App sections";
const PROFILE_FEED_TITLE = "Latest From Profile Waves";
const EMPTY_COMPETITION_ACTIVITY =
  englishMessages["competitions.emptyResource"] ?? "Nothing to show yet.";

const PROFILE_TAB_PATHS = [
  {
    path: `/${PROFILE_HANDLE}/curations`,
    title: /curations|waves|punk6529/i,
    activeTab: "Curation",
  },
  {
    path: `/${PROFILE_HANDLE}/collected`,
    title: /collected|punk6529/i,
    activeTab: "Collected",
  },
  {
    path: `/${PROFILE_HANDLE}/xtdh`,
    title: /xtdh|punk6529/i,
    activeTab: /xTDH/,
  },
];

async function getFirstWaveId(page: Page) {
  await gotoReady(page, "/waves");

  const waveList = page.getByRole("region", {
    name: /All recent waves list|Regular waves list/,
  });
  await expect(waveList).toBeVisible({ timeout: 15000 });
  // The region mounts with its loading shell. Await a rendered data row before
  // inspecting its href; shell readiness does not establish API/data readiness.
  const waveLinks = page
    .getByRole("region", {
      name: /All recent waves list|Regular waves list/,
    })
    .locator('a[href^="/waves/"]')
    .filter({ visible: true });
  let href: string | null = null;
  await expect
    .poll(
      async () => {
        href = await waveLinks.evaluateAll(
          (links, baseUrl) =>
            links
              .map((link) => link.getAttribute("href"))
              .filter((candidate): candidate is string => Boolean(candidate))
              .find((candidate) =>
                /^\/waves\/[0-9a-f-]{36}$/i.test(
                  new URL(candidate, baseUrl).pathname
                )
              ) ?? null,
          page.url()
        );
        return href !== null;
      },
      {
        timeout: RESPONSE_TIMEOUT_MS,
        message: "Expected wave list to contain a rendered wave detail link",
      }
    )
    .toBe(true);
  const pathname = href ? new URL(href, page.url()).pathname : "";
  const match = pathname.match(/^\/waves\/([0-9a-f-]{36})$/i);

  expect(
    match,
    `Expected first wave href to use /waves/{id}; got ${href}`
  ).not.toBeNull();
  return match?.[1] ?? "";
}

function getProfileFeed(page: Page): Locator {
  return page
    .getByRole("heading", { level: 1, name: PROFILE_FEED_TITLE })
    .locator("xpath=ancestor::section[1]");
}

test.describe("Waves and profile read-only coverage @surface @medium @large @readonly", () => {
  test("keeps received collection loading rows aligned with loaded content", async ({
    page,
  }) => {
    let releaseCollections: () => void;
    const collectionsReady = new Promise<void>((resolve) => {
      releaseCollections = resolve;
    });
    await page.route("**/api/xtdh/collections?**", async (route) => {
      await collectionsReady;
      await route.continue();
    });
    await gotoReady(page, `/${PROFILE_HANDLE}/xtdh?tab=received`);
    const section = page
      .getByRole("heading", { name: "xTDH Collections", exact: true })
      .locator("xpath=ancestor::section[1]");
    const controls = section.getByRole("region", {
      name: "Sort and search received collections",
    });
    const skeleton = section.getByTestId("xtdh-collection-skeleton").first();
    const measureCard = (element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      const sectionRect = element.closest("section")!.getBoundingClientRect();
      const grid = element.lastElementChild!;
      return {
        x: rect.x,
        y: rect.y - sectionRect.y,
        width: rect.width,
        columns: getComputedStyle(grid).gridTemplateColumns,
        gridOffset: grid.getBoundingClientRect().x - rect.x,
      };
    };
    let loadingLayout: ReturnType<typeof measureCard>;
    try {
      await expect(skeleton).toBeVisible();
      await expect(controls.getByRole("textbox")).toBeDisabled();
      const sortControl = controls
        .getByRole("button", {
          name: "Sort collections by: xTDH",
          exact: true,
        })
        .or(controls.getByRole("tab", { name: "xTDH", exact: true }));
      await expect(sortControl).toHaveCount(1);
      await expect(sortControl).toBeDisabled();
      loadingLayout = await skeleton.evaluate(measureCard);
      await expectNoHorizontalOverflow(page);
      await captureSafeScreenshot(
        page,
        test.info(),
        "received-collections-loading"
      );
    } finally {
      releaseCollections!();
    }
    await expect(skeleton).toHaveCount(0);
    await expect(controls.getByRole("textbox")).toBeEnabled();
    const card = section
      .getByRole("list")
      .getByRole("button")
      .first()
      .locator(":scope > div");
    await expect(card).toBeVisible();
    const loadedLayout = await card.evaluate(measureCard);
    expect(loadedLayout.width).toBeCloseTo(loadingLayout.width, 1);
    expect(loadedLayout.x).toBeCloseTo(loadingLayout.x, 1);
    expect(loadedLayout.y).toBeCloseTo(loadingLayout.y, 1);
    expect(loadedLayout.columns).toBe(loadingLayout.columns);
    expect(loadedLayout.gridOffset).toBeCloseTo(loadingLayout.gridOffset, 1);
    await expectNoHorizontalOverflow(page);
    await captureSafeScreenshot(
      page,
      test.info(),
      "received-collections-loaded"
    );
  });

  test("loads granted collection metadata through the desktop batch proxy fallback", async ({
    page,
  }) => {
    const address = "0xa94161fbe69e08ff5a36dfafa61bdf29dd2fb928";
    // Keep grants stable without creating any real grant. Metadata uses the real
    // backend in deployed environments; local/PR coverage controls that boundary.
    await page.route("**/api/xtdh/grants?**", (route) =>
      route.fulfill({
        json: {
          count: 1,
          page: 1,
          next: false,
          data: [
            {
              id: "alchemy-proxy-regression",
              grantor: { handle: PROFILE_HANDLE },
              target_chain: "ETHEREUM_MAINNET",
              target_contract: address,
              target_token_mode: "ALL",
              target_tokens_count: 274,
              rate: 3,
              status: "GRANTED",
              error_details: null,
              created_at: 1791642831943,
              updated_at: 1791642976046,
              valid_from: 1791642976046,
              valid_to: null,
              is_irrevocable: false,
              total_granted: 11,
            },
          ],
        },
      })
    );
    await page.route("**/api/alchemy/contracts", (route) =>
      route.fulfill({ status: 500, json: { error: "Required" } })
    );
    const deployedEnvironment = ["staging", "production"].includes(
      process.env["PLAYWRIGHT_ENV"] ?? "local"
    );
    if (!deployedEnvironment) {
      await page.route("**/alchemy-proxy/contracts", (route) =>
        route.fulfill({
          json: {
            contracts: [
              {
                address,
                chain: "ethereum",
                metadata: {
                  address,
                  _checksum: address,
                  name: "Voxelglyph",
                  tokenType: "ERC721",
                  totalSupply: "273",
                },
              },
            ],
          },
        })
      );
    }
    const fallbackResponse = page.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === "/alchemy-proxy/contracts" &&
        response.request().method() === "POST"
    );
    await gotoReady(page, `/${PROFILE_HANDLE}/xtdh?tab=granted`);
    const response = await fallbackResponse;
    expect(response.status()).toBe(200);
    // The picker converts the lowercase grant address to its EIP-55 checksum.
    expect(response.request().postDataJSON()).toEqual({
      contracts: [
        {
          address: "0xA94161fBE69E08fF5a36DfAfa61BdF29DD2Fb928",
          chain: "ethereum",
        },
      ],
    });
    await expect(page.getByText("Voxelglyph", { exact: true })).toBeVisible();
    await expect(page.getByText("ERC721", { exact: true })).toBeVisible();
    await expect(
      page.getByText("Contract details unavailable", { exact: true })
    ).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
    await captureSafeScreenshot(
      page,
      test.info(),
      "granted-metadata-proxy-fallback"
    );
  });

  test("renders grant thumbnails from both Alchemy CDNs with an intentional failure fallback", async ({
    page,
  }) => {
    const alchemyThumbnail =
      "https://nft2-cdn.alchemy.com/cdn-cgi/image/width=250,height=250,fit=scale-down/eth-mainnet/a3062b74e1b4d79fdab0ca1ec5a92615";
    const cloudinaryThumbnail =
      "https://res.cloudinary.com/alchemyapi/image/upload/thumbnailv2/eth-mainnet/136dc79022a5b971800cf8405adb5cea_ea0b833e";
    const thumbnails = [
      alchemyThumbnail,
      cloudinaryThumbnail,
      null,
      null,
      null,
    ];
    const tokenUri =
      "https://arweave.net/fLAMSnWmzM9tAso6xMRSSPC2ZYaRoqjRnqGKaxk7vRQ";
    let collectionImageUrl = "null";
    let releaseMetadata: () => void;
    const metadataReady = new Promise<void>((resolve) => {
      releaseMetadata = resolve;
    });
    // Production and staging can have different (or no) grants for this profile.
    // Control grant/token data while exercising the deployed disclosure, grid,
    // real CDN responses and image optimizer in both environments.
    const grantId = "thumbnail-fixture";
    const tokens = ["1", "2", "3", "17", "18"].map((token) => ({
      token,
      xtdh: 1,
    }));
    const grantsPage: ApiXTdhGrantsPage = {
      data: [
        {
          id: grantId,
          grantor: {
            id: "thumbnail-grantor",
            handle: PROFILE_HANDLE,
            primary_address: "0x0000000000000000000000000000000000000001",
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
            classification: ApiProfileClassification.Pseudonym,
            sub_classification: null,
            subscribed_actions: [],
            archived: false,
            active_main_stage_submission_ids: [],
            winner_main_stage_drop_ids: [],
            artist_of_prevote_cards: [],
            profile_wave_id: null,
            is_wave_creator: false,
          },
          target_chain: ApiXTdhGrantTargetChain.EthereumMainnet,
          target_contract: "0x0c58ef43ff3032005e472cb5709f8908acb00205",
          target_token_mode: ApiXTdhGrantTargetTokenMode.Include,
          target_tokens_count: tokens.length,
          target_collection_name: "Thumbnail fixture collection",
          created_at: 1_760_000_000_000,
          updated_at: 1_760_000_000_000,
          valid_from: 1_760_000_000_000,
          valid_to: null,
          rate: 3,
          error_details: null,
          status: ApiXTdhGrantStatus.Granted,
          is_irrevocable: false,
          total_granted: 3,
        },
      ],
      count: 1,
      page: 1,
      next: false,
    };
    const tokensPage: ApiXTdhGrantTokensPage = {
      data: tokens,
      count: tokens.length,
      page: 1,
      next: false,
    };
    await page.route("**/api/xtdh/grants?**", (route) =>
      route.fulfill({ json: grantsPage })
    );
    const tokensRoute = `**/api/xtdh/grants/${grantId}/tokens?**`;
    await page.route(tokensRoute, (route) =>
      route.fulfill({ json: tokensPage })
    );
    await page.route("**/api/alchemy/contracts", (route) => {
      const body = route.request().postDataJSON() as {
        contracts: { address: string; chain: string }[];
      };
      return route.fulfill({
        json: {
          contracts: body.contracts.map((contract) => ({
            ...contract,
            metadata: {
              address: contract.address,
              name: "Thumbnail fixture collection",
              tokenType: "ERC721",
              openSeaMetadata: { imageUrl: collectionImageUrl },
            },
          })),
        },
      });
    });
    await page.route(
      "https://media.6529.io/arweave/fLAMSnWmzM9tAso6xMRSSPC2ZYaRoqjRnqGKaxk7vRQ",
      (route) =>
        route.fulfill({
          json: {
            name: "Recovered original artwork",
            image: cloudinaryThumbnail,
          },
        })
    );
    await page.route("**/api/alchemy/token-metadata", async (route) => {
      await metadataReady;
      const body = route.request().postDataJSON() as { tokenIds: string[] };
      await route.fulfill({
        json: {
          tokens: body.tokenIds.map((tokenId, index) => ({
            tokenId,
            name: tokenId === "18" ? "#18" : `Thumbnail fixture ${index}`,
            ...(tokenId === "18" ? { tokenUri } : {}),
            image: { thumbnailUrl: thumbnails[index % thumbnails.length] },
            ...(tokenId === "17"
              ? {
                  raw: {
                    metadata: { original_image_url: cloudinaryThumbnail },
                  },
                }
              : {}),
          })),
        },
      });
    });
    await gotoReady(page, `/${PROFILE_HANDLE}/xtdh?tab=granted`);
    await expect(page.getByText("NFT", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("img", {
        name: "Thumbnail fixture collection",
        exact: true,
      })
    ).toHaveCount(0);
    await page
      .getByRole("button", { name: /^Show [\d,]+ tokens$/ })
      .first()
      .click();
    const tokenList = page.getByRole("list", { name: "Selected tokens" });
    try {
      await expect(
        tokenList.getByLabel("Loading thumbnail").first()
      ).toBeVisible();
      await captureSafeScreenshot(page, test.info(), "grant-thumbnail-loading");
    } finally {
      releaseMetadata!();
    }
    for (const name of [
      "Thumbnail fixture 0",
      "Thumbnail fixture 1",
      "Thumbnail fixture 3",
      "Recovered original artwork",
    ]) {
      const image = tokenList.getByRole("img", { name, exact: true });
      await image.scrollIntoViewIfNeeded();
      await expect(image).toBeVisible();
      await expect
        .poll(
          () =>
            image.evaluate(
              (element: HTMLImageElement) =>
                element.complete && element.naturalWidth > 0
            ),
          { timeout: 30000 }
        )
        .toBe(true);
    }
    await expect(
      tokenList
        .getByText("#3", { exact: true })
        .and(page.getByRole("list", { name: "Selected tokens" }).locator("div"))
    ).toBeVisible();
    const source = await tokenList
      .getByRole("img", { name: "Thumbnail fixture 0", exact: true })
      .getAttribute("src");
    expect(new URL(source!, page.url()).pathname).toBe("/_next/image");
    await expectNoHorizontalOverflow(page);

    await captureSafeScreenshot(page, test.info(), "grant-thumbnail-artwork");

    // A fresh browser load must also replace real collection/token image failures.
    collectionImageUrl = alchemyThumbnail;
    await page.route("**/_next/image?**", async (route) => {
      const sourceUrl = new URL(route.request().url()).searchParams.get("url");
      if (sourceUrl === alchemyThumbnail) {
        await route.abort("failed");
      } else {
        await route.fallback();
      }
    });
    await page.reload();
    await waitForRouteReady(page);
    await page
      .getByRole("button", { name: /^Show [\d,]+ tokens$/ })
      .first()
      .click();
    await expect(page.getByText("NFT", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("img", {
        name: "Thumbnail fixture collection",
        exact: true,
      })
    ).toHaveCount(0);
    await expect(
      tokenList.getByRole("img", { name: "Failed to load thumbnail" }).first()
    ).toBeVisible();
    await expect(
      tokenList.getByRole("img", { name: "Thumbnail fixture 0", exact: true })
    ).toHaveCount(0);
    await expect(
      tokenList.getByText("Thumbnail fixture 0", { exact: true })
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await captureSafeScreenshot(page, test.info(), "grant-thumbnail-error");

    await page.route(tokensRoute, (route) =>
      route.fulfill({ json: { data: [], count: 0, page: 1, next: false } })
    );
    await page.reload();
    await waitForRouteReady(page);
    await page
      .getByRole("button", { name: /^Show [\d,]+ tokens$/ })
      .first()
      .click();
    await expect(
      page.getByText("No specific token IDs were returned for this grant.")
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await captureSafeScreenshot(page, test.info(), "grant-token-empty");
  });

  test("keeps the full subscription airdrop address available on touch and keyboard", async ({
    page,
    isMobile,
  }) => {
    await gotoReady(page, `/${PROFILE_HANDLE}/subscriptions`);
    await expectProfileShell(page, "Subscriptions");
    const address = page.getByRole("button", {
      name: /^0x[0-9a-fA-F]{40}$/,
    });
    // The address comes from the subscriptions API after the shell renders.
    await expect(address).toBeVisible({ timeout: RESPONSE_TIMEOUT_MS });
    const fullAddress = (await address.textContent())!.trim();
    if (isMobile) {
      await address.tap();
    } else {
      await address.focus();
    }
    await expect(
      page.getByRole("tooltip", { name: fullAddress })
    ).toBeVisible();
    await page
      .getByRole("heading", { name: "Airdrop Address", exact: true })
      .click();
    await expect(page.getByRole("tooltip", { name: fullAddress })).toHaveCount(
      0
    );
    await expectNoHorizontalOverflow(page);
  });

  test("keeps subscription history defaults responsive and preserves user toggles", async ({
    page,
  }) => {
    await gotoReadyWithApiResponse(
      page,
      `/${PROFILE_HANDLE}/subscriptions`,
      (url) => url.pathname.includes("/subscriptions/consolidation/logs/")
    );
    await expectProfileShell(page, "Subscriptions");
    const isPhone = (page.viewportSize()?.width ?? 0) < 640;
    const disclosures = page
      .getByRole("region", { name: "Subscription History", exact: true })
      .locator("details");
    await expect(disclosures).toHaveCount(3);
    for (const disclosure of await disclosures.all()) {
      await expect(disclosure).toHaveJSProperty("open", !isPhone);
      await expect(disclosure).toHaveAttribute("aria-busy", "false");
    }
    const logs = disclosures.filter({ hasText: "Log History" });
    const summary = page
      .getByRole("region", { name: "Subscription History", exact: true })
      .locator("summary")
      .filter({ hasText: "Log History" });
    await summary.click();
    await expect(logs).toHaveJSProperty("open", isPhone);
    const viewport = page.viewportSize()!;
    await page.setViewportSize({
      width: isPhone ? 900 : 390,
      height: viewport.height,
    });
    await expect(logs).toHaveJSProperty("open", isPhone);
    await page.setViewportSize(viewport);
    await expect(logs).toHaveJSProperty("open", isPhone);
    await summary.press("Enter");
    await expect(logs).toHaveJSProperty("open", !isPhone);
    await summary.press("Space");
    await expect(logs).toHaveJSProperty("open", isPhone);
    await expectNoHorizontalOverflow(page);
  });

  test("scrolls Main Stage Settings and validates live vote Activity in the app", async ({
    page,
  }, testInfo) => {
    test.setTimeout(120000);
    test.skip(
      testInfo.project.name !== "web-mobile-chromium",
      "The native app layout uses the mobile viewport."
    );
    await installSurfaceSimulation(
      page.context(),
      "capacitor-ios-sim",
      testInfo.project.use.baseURL
    );
    const settingsResponse = page.waitForResponse(
      (response) => new URL(response.url()).pathname === "/api/settings"
    );
    await gotoReady(page, "/waves");
    const settings = await (await settingsResponse).json();
    expect(settings.memes_wave_id).toMatch(/^[0-9a-f-]{36}$/i);
    await gotoReady(page, `/waves/${settings.memes_wave_id}`);
    await page
      .getByRole("navigation", { name: "Wave sections" })
      .getByRole("button", { name: "Settings", exact: true })
      .click();
    const rules = page
      .getByRole("main")
      .locator('section[id^="competition-"][id$="-rules"]');
    await expect(
      rules.getByRole("heading", { name: "Participation", exact: true })
    ).toBeVisible();
    await expectCompetitionScroll(
      page,
      page
        .getByRole("main")
        .locator('section[id^="competition-"][id$="-rules"]')
        .locator(".."),
      page
        .getByRole("main")
        .locator('section[id^="competition-"][id$="-rules"]')
        .locator("dl > div")
        .last()
    );
    await testInfo.attach("main-stage-settings-scrolled", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    const competitionPath = new URL(page.url()).pathname;
    expect(competitionPath).toMatch(/\/competitions\/[^/]+$/);
    const activityResponse = await gotoReadyWithApiResponse(
      page,
      `${competitionPath}?tab=votes&voteTab=activity`,
      (url) =>
        url.pathname === `/api/v3${competitionPath}/activity` &&
        url.searchParams.get("offset") === "0"
    );
    const logs: readonly unknown[] = await activityResponse.json();
    expect(Array.isArray(logs), "Vote Activity must return an array").toBe(
      true
    );
    const activity = page.getByRole("tabpanel", {
      name: "Activity",
      exact: true,
    });
    await expect(activity).toBeVisible();
    await expect(activity.getByRole("alert")).toHaveCount(0);
    const dropControls = activity.getByRole("button", {
      name: "View drop in chat",
      exact: true,
    });
    const emptyState = activity.getByText(EMPTY_COMPETITION_ACTIVITY, {
      exact: true,
    });
    await expect(dropControls).toHaveCount(logs.length);
    if (logs.length === 0) {
      await expect(activity.getByRole("status")).toHaveText(
        EMPTY_COMPETITION_ACTIVITY
      );
      await expect(emptyState).toBeVisible();
    } else {
      await expect(emptyState).toHaveCount(0);
      await expect(dropControls.first()).toBeVisible();
    }
    // Live competitions can have no votes or too few rows to overflow. The
    // native-competition sandbox exercises scrolling with 30 fixture rows.
    await expectNoHorizontalOverflow(page);
    await testInfo.attach("main-stage-live-activity", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  });

  for (const surface of ["web", "app"] as const) {
    test(`remembers Main Stage Leaderboard and another wave's Chat (${surface})`, async ({
      page,
    }, testInfo) => {
      test.setTimeout(120000);
      // The app simulation is mobile-only; the web case covers the desktop viewport.
      test.skip(
        surface === "app" && testInfo.project.name !== "web-mobile-chromium",
        "The shared app layout uses the mobile viewport."
      );
      if (surface === "app")
        await installSurfaceSimulation(
          page.context(),
          "capacitor-ios-sim",
          testInfo.project.use.baseURL
        );
      const section = (name: string) =>
        page.getByRole(surface === "app" ? "button" : "tab", {
          name,
          exact: true,
        });
      const chat = page.getByRole("region", {
        name: "Wave chat file upload area",
        exact: true,
      });
      const leaderboardContent = page.getByRole("tablist", {
        name: "Leaderboard view modes",
      });
      const expectLeaderboard = async () => {
        await expect(section("Leaderboard")).toHaveAttribute(
          surface === "app" ? "aria-current" : "aria-selected",
          "true",
          { timeout: 30000 }
        );
        await expect(leaderboardContent).toBeVisible({ timeout: 30000 });
        await expectNativeLeaderboardReady(page);
        await expect(chat).toHaveCount(0);
        await expect(
          page.getByText(
            "This competition could not be loaded. It may be unavailable or you may not have access.",
            { exact: true }
          )
        ).toHaveCount(0);
      };
      const openWave = async (name: string) => {
        const toggle = page
          .getByRole("button", { name: "Find a wave…", exact: true })
          .filter({ visible: true });
        const search = page
          .getByRole("searchbox", { name: "Find a wave…" })
          .filter({ visible: true });
        await expect(search.or(toggle)).toBeVisible();
        if (!(await search.isVisible())) await toggle.click();
        await search.fill(name);
        const results = page
          .getByRole("region", { name: "Search results · All waves" })
          .filter({ visible: true });
        const link = results
          .getByRole("link")
          .filter({ hasText: name })
          .first();
        await expect(link).toBeVisible({ timeout: 15000 });
        const href = await link.getAttribute("href");
        expect(href).toMatch(/^\/waves\/[0-9a-f-]{36}$/i);
        await link.click();
        return href;
      };
      const returnToWaves = async () => {
        if (surface === "app")
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
        await expectUrlState(page, (url) => url.pathname === "/waves");
      };
      await gotoReady(page, "/waves");
      const desktopSidebar =
        testInfo.project.name === "web-desktop-chromium"
          ? await retainDesktopWaveSidebar(page)
          : null;
      const prepareWaveSwitch = async () => {
        // Desktop users switch directly in the persistent left pane. Mobile
        // returns to the wave list because detail views occupy its viewport.
        if (!desktopSidebar) await returnToWaves();
      };
      // Staging has its own wave data and no Maybes Bar. Use its public chat
      // counterpart; production and local production-data runs keep the exact journey.
      const chatWaveName =
        new URL(page.url()).hostname === "staging.6529.io"
          ? "Memes-Chat"
          : "maybe's dive bar";
      const mainStage = await openWave("The Memes - Main Stage");
      await expect(chat).toBeVisible({ timeout: 15000 });
      await section("Leaderboard").click();
      await expectLeaderboard();
      await desktopSidebar?.expectRetained();
      await prepareWaveSwitch();
      const chatWave = await openWave(chatWaveName);
      expect(chatWave).not.toBe(mainStage);
      await expect(chat).toBeVisible({ timeout: 15000 });
      await section("Chat").click();
      await desktopSidebar?.expectRetained();
      await prepareWaveSwitch();
      const expectNoDetour = await monitorRememberedLeaderboard(
        page,
        mainStage!,
        "The Memes - Main Stage"
      );
      expect(await openWave("The Memes - Main Stage")).toBe(mainStage);
      await expectLeaderboard();
      await expectNoDetour();
      await desktopSidebar?.expectRetained();
      await page.screenshot({
        path: testInfo.outputPath(`remembered-${surface}-main-stage.png`),
        fullPage: true,
      });
      await desktopSidebar?.dispose();
      await page.reload();
      await expectLeaderboard();
      await returnToWaves();
      expect(await openWave(chatWaveName)).toBe(chatWave);
      await expect(section("Chat")).toHaveAttribute(
        surface === "app" ? "aria-current" : "aria-selected",
        "true"
      );
      await expect(chat).toBeVisible({ timeout: 15000 });
      await expect(leaderboardContent).toHaveCount(0);
      await page.screenshot({
        path: testInfo.outputPath(`remembered-${surface}-chat-wave.png`),
        fullPage: true,
      });
      await testInfo.attach("remembered-wave-journey", {
        body: JSON.stringify({ mainStage, chatWave, chatWaveName, surface }),
        contentType: "application/json",
      });
    });
  }

  test("matches Main Stage app artwork to its leaderboard response", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "web-mobile-chromium");
    await installSurfaceSimulation(
      page.context(),
      "capacitor-ios-sim",
      testInfo.project.use.baseURL
    );
    const settingsResponse = page.waitForResponse(
      (response) =>
        response.request().method() === "GET" &&
        new URL(response.url()).pathname === "/api/settings",
      { timeout: RESPONSE_TIMEOUT_MS }
    );
    await gotoReady(page, "/waves");
    const settingsResult = await settingsResponse;
    expect(
      settingsResult.ok(),
      `Main Stage settings returned HTTP ${settingsResult.status()}`
    ).toBe(true);
    const settings = await settingsResult.json();
    expect(settings.memes_wave_id).toMatch(/^[0-9a-f-]{36}$/i);
    const observed = observeNativeLeaderboard(page, settings.memes_wave_id);
    try {
      await gotoReady(page, `/waves/${settings.memes_wave_id}`);
      const navigation = page.getByRole("navigation", {
        name: "Wave sections",
      });
      await expect(
        navigation.getByRole("button", { name: /^(Chat|Leaderboard|Winners)$/ })
      ).toHaveText(["Chat", "Leaderboard", "Winners"], {
        timeout: RESPONSE_TIMEOUT_MS,
      });
      await testInfo.attach("main-stage-chat-first-app-tabs", {
        body: await page.screenshot(),
        contentType: "image/png",
      });
      await navigation
        .getByRole("button", { name: "Leaderboard", exact: true })
        .click();
      const { competition, data } = await observed.originalLeaderboard();
      await testInfo.attach("main-stage-leaderboard-counts", {
        body: JSON.stringify({
          waveId: settings.memes_wave_id,
          competitionId: competition.id,
          route: new URL(page.url()).pathname,
          sort: "rating",
          returned: data.data.length,
          hasMore: data.has_more,
          entries: data.data.map((entry) => ({
            entryId: entry.entry_id,
            dropId: entry.drop_id,
          })),
        }),
        contentType: "application/json",
      });
      await expectNativeLeaderboardArtwork(
        page,
        competition,
        data,
        observed.reads
      );
      await testInfo.attach("main-stage-app-leaderboard", {
        body: await page.screenshot(),
        contentType: "image/png",
      });
    } finally {
      observed.dispose();
    }
  });

  test("preserves Main Stage's dedicated tabs, timeline, and winner cards", async ({
    page,
  }, testInfo) => {
    const settingsResponse = page.waitForResponse(
      (response) => new URL(response.url()).pathname === "/api/settings"
    );
    await gotoReady(page, "/waves");
    const response = await settingsResponse;
    expect(response.ok()).toBe(true);
    const settings = await response.json();
    expect(settings.memes_wave_id).toMatch(/^[0-9a-f-]{36}$/i);

    await gotoReady(page, `/waves/${settings.memes_wave_id}`);
    await expect(
      page.getByRole("heading", { level: 1, name: "The Memes - Main Stage" })
    ).toBeVisible({ timeout: 15000 });
    const waveTabs = page.getByRole("tablist").filter({
      has: page.getByRole("tab", { name: "Chat", exact: true }),
    });
    for (const name of ["Chat", "Leaderboard", "Winners", "Outcome", "FAQ"]) {
      await expect(
        waveTabs.getByRole("tab", { name, exact: true })
      ).toBeAttached();
    }
    await expect(waveTabs.getByRole("tab").nth(0)).toHaveText("Chat");
    await expect(waveTabs.getByRole("tab").nth(1)).toHaveText("Leaderboard");
    await expect(waveTabs.getByRole("tab").nth(2)).toHaveText("Winners");
    await expect(
      waveTabs.getByRole("tab", { name: "Chat", exact: true })
    ).toHaveAttribute("aria-selected", "true");
    await expect(
      page.getByRole("region", {
        name:
          englishMessages["waves.chat.fileUploadAreaAriaLabel"] ??
          "Wave chat file upload area",
        exact: true,
      })
    ).toBeVisible();
    await expect(page).toHaveURL(
      new RegExp(`/waves/${settings.memes_wave_id}$`)
    );
    await testInfo.attach("main-stage-chat-first-web-tabs", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    // This pack runs signed out; personal voting controls remain authenticated.
    await expect(
      page.getByRole("tab", { name: "My Votes", exact: true })
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", {
        name: /^(How to Submit|Submit Work|Submit Work to The Memes)$/,
      })
    ).toBeVisible();

    await waveTabs
      .getByRole("tab", { name: "Leaderboard", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Toggle decision timeline" })
    ).toBeVisible({ timeout: RESPONSE_TIMEOUT_MS });
    await expect(waveTabs.filter({ visible: true })).toHaveCount(1);
    await expect(
      page.getByRole("main").locator("[data-competition-detail]")
    ).toHaveCount(0);
    await expect(
      page.getByRole("main").locator('[data-competition-navigation="detail"]')
    ).toHaveCount(0);
    const projectedVote = page.getByRole("tab", {
      name: "Projected Vote",
      exact: true,
    });
    const sortDropdown = page.getByRole("button", {
      name: "Sort: Current Vote",
      exact: true,
    });
    await expect(projectedVote.or(sortDropdown)).toBeVisible();
    if (await sortDropdown.isVisible()) {
      await sortDropdown.click();
      const projectedVoteItem = page.getByRole("menuitem", {
        name: "Projected Vote",
        exact: true,
      });
      // The mobile sort sheet starts below the viewport during its entrance.
      // Wait for the target to enter before click's automatic scrolling.
      await expect(projectedVoteItem).toBeInViewport({ ratio: 1 });
      await projectedVoteItem.click();
      await expect(
        page.getByRole("button", { name: "Sort: Projected Vote", exact: true })
      ).toBeVisible();
    } else {
      await projectedVote.click();
      await expect(projectedVote).toHaveAttribute("aria-selected", "true");
    }
    await waveTabs.getByRole("tab", { name: "Winners", exact: true }).click();
    const winners = page.getByRole("tabpanel");
    await expect(
      winners.getByRole("link", { name: /^The Memes #\d+$/ }).first()
    ).toBeVisible({ timeout: RESPONSE_TIMEOUT_MS });
    await expect(
      winners.getByText("Mint date:", { exact: true }).first()
    ).toBeVisible();
    await expect(waveTabs.filter({ visible: true })).toHaveCount(1);
    await expect(
      page.getByRole("main").locator("[data-competition-detail]")
    ).toHaveCount(0);
    await testInfo.attach("main-stage-winners", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
  });

  test("renders the public Waves landing without write interaction", async ({
    page,
  }) => {
    await gotoReady(page, "/waves");

    await expectUrlState(page, (url) => url.pathname === "/waves");
    await expect(page).toHaveTitle(/Waves/i);

    const viewport = page.viewportSize();
    if (viewport && viewport.width < 1024) {
      await expect(
        page.locator("main").getByText("Waves").first()
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: /Profile Waves Feed/ })
      ).toHaveAttribute("href", "/waves?view=profile-feed");
      await expect(
        page.getByRole("region", {
          name: /All recent waves list|Regular waves list/,
        })
      ).toBeVisible();
    } else {
      await expect(
        page.getByRole("heading", {
          level: 1,
          name: "Latest From Profile Waves",
        })
      ).toBeVisible();
      await expect(page.getByText(PROFILE_FEED_DESCRIPTION)).toBeVisible();
      await expect(
        page.getByRole("link", { name: /Profile Waves Feed/ })
      ).toHaveAttribute("href", "/waves");
    }
  });

  test("opens the Profile Waves Feed across the exact web breakpoint", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1023, height: 900 });
    await gotoReady(page, "/waves");

    const profileFeedLink = page.getByRole("link", {
      name: /Profile Waves Feed/,
    });
    await expect(profileFeedLink).toBeVisible();
    const wavesMain = page.getByRole("main");
    await expect(
      page.getByRole("region", {
        name: /All recent waves list|Regular waves list/,
      })
    ).toBeVisible({ timeout: RESPONSE_TIMEOUT_MS });
    // Global navigation can still expose Waves here. The list header is plain
    // text on web, so scope its navigation invariant to main without a heading.
    await expect(
      wavesMain.getByRole("link", { name: "Waves", exact: true })
    ).toHaveCount(0);
    await expect(
      wavesMain.getByRole("link", { name: "Discover Waves", exact: true })
    ).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: /Profile Waves Feed/ }).locator("svg")
    ).toBeVisible();
    await expect(
      page.getByText("Profile Waves Feed", { exact: true })
    ).toHaveCount(0);
    await expect(profileFeedLink).toHaveAttribute(
      "href",
      "/waves?view=profile-feed"
    );
    await profileFeedLink.click();

    await expectUrlState(
      page,
      (url) =>
        url.pathname === "/waves" &&
        url.searchParams.get("view") === "profile-feed"
    );
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Latest From Profile Waves",
      })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Discover Waves", exact: true })
    ).toHaveAttribute("href", "/discover");
    const feedNavigation = page.getByRole("navigation", {
      name: APP_SECTIONS_LABEL,
    });
    await expect(
      feedNavigation.getByRole("link", { name: "Waves" })
    ).toHaveAttribute("href", "/waves");

    const profileFeed = getProfileFeed(page);
    const feedPostButtons = profileFeed
      .getByRole("article")
      .locator('[role="button"][tabindex="0"]');
    await expect(feedPostButtons.first()).toBeVisible({ timeout: 15000 });
    const feedScrollOffset = await profileFeed.evaluate((element) => {
      const maxScrollOffset = element.scrollHeight - element.clientHeight;
      element.scrollTop = Math.min(320, maxScrollOffset);
      element.dispatchEvent(new Event("scroll"));
      return element.scrollTop;
    });
    expect(feedScrollOffset).toBeGreaterThan(0);

    const visibleFeedPostIndex = await feedPostButtons.evaluateAll(
      (buttons) => {
        const feed = buttons[0]?.closest("section");
        if (!feed) {
          return -1;
        }

        const feedRect = feed.getBoundingClientRect();
        return buttons.findIndex((button) => {
          const rect = button.getBoundingClientRect();
          return rect.bottom > feedRect.top && rect.top < feedRect.bottom;
        });
      }
    );
    expect(visibleFeedPostIndex).toBeGreaterThanOrEqual(0);
    const visibleFeedPost = feedPostButtons.nth(visibleFeedPostIndex);
    await visibleFeedPost.focus();
    await visibleFeedPost.press("Enter");
    await expectUrlState(
      page,
      (url) =>
        /^\/waves\/[0-9a-f-]{36}$/i.test(url.pathname) &&
        Boolean(url.searchParams.get("serialNo"))
    );

    await page.goBack();
    await expectUrlState(
      page,
      (url) =>
        url.pathname === "/waves" &&
        url.searchParams.get("view") === "profile-feed"
    );
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Latest From Profile Waves",
      })
    ).toBeVisible();
    const restoredProfileFeed = getProfileFeed(page);
    await expect
      .poll(() => restoredProfileFeed.evaluate((element) => element.scrollTop))
      .toBeGreaterThan(0);

    await page.goBack();
    await expectUrlState(
      page,
      (url) => url.pathname === "/waves" && !url.search
    );
    await expect(
      page.getByRole("region", {
        name: /All recent waves list|Regular waves list/,
      })
    ).toBeVisible();

    const waveId = await getFirstWaveId(page);
    const waveList = page.getByRole("region", {
      name: /All recent waves list|Regular waves list/,
    });
    const waveLinks = waveList.getByRole("link");
    const waveLinkCount = await waveLinks.count();
    let matchingWaveLink: Locator | null = null;
    for (let index = 0; index < waveLinkCount; index += 1) {
      const candidate = waveLinks.nth(index);
      const href = await candidate.getAttribute("href");
      if (href?.startsWith(`/waves/${waveId}`)) {
        matchingWaveLink = candidate;
        break;
      }
    }
    expect(
      matchingWaveLink,
      `Expected a link for Wave ${waveId}`
    ).not.toBeNull();
    await matchingWaveLink!.click();
    await expectUrlState(page, (url) => url.pathname === `/waves/${waveId}`);
    await page.goBack();
    await expectUrlState(
      page,
      (url) => url.pathname === "/waves" && !url.search
    );

    await gotoReady(page, "/waves?view=profile-feed");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Latest From Profile Waves",
      })
    ).toBeVisible();

    await page.setViewportSize({ width: 1024, height: 900 });
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Latest From Profile Waves",
      })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Profile Waves Feed/ })
    ).toHaveAttribute("href", "/waves");
    await expect(feedNavigation).toBeHidden();

    await expect(feedNavigation).toBeHidden();

    await page.setViewportSize({ width: 1023, height: 900 });
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Latest From Profile Waves",
      })
    ).toBeVisible();
    await expect(
      feedNavigation.getByRole("link", { name: "Waves" })
    ).toBeVisible();
  });

  test("keeps wave identity compact and sharing reachable through details", async ({
    page,
  }, testInfo) => {
    const waveId = await getFirstWaveId(page);
    await gotoReady(page, `/waves/${waveId}`);

    const compact = (page.viewportSize()?.width ?? 1280) < 768;
    const details = page.getByRole("button", {
      name: compact ? "Wave details" : "Show right sidebar",
      exact: true,
    });
    await expect(details).toBeVisible();
    const header = page
      .getByRole("button", {
        name: compact ? "Wave details" : "Show right sidebar",
        exact: true,
      })
      .locator("../..");
    await expect(header.getByRole("heading", { level: 1 })).toBeVisible();
    const headerRep = header.getByRole("button", {
      name: /Add Wave REP|Edit your Wave REP/,
    });
    await expect(
      header.getByRole("button", { name: /^(Share wave|Copy wave link)$/ })
    ).toHaveCount(0);

    const score = header.getByRole("button", { name: /^Wave score / });
    if (compact) {
      await expect(headerRep).toHaveCount(0);
      await expect(score).toHaveCount(0);
      await header.getByRole("button", { name: "More wave actions" }).click();
      await expect(
        page
          .getByRole("dialog", { name: "More wave actions" })
          .getByRole("button", { name: /^(Share wave|Copy wave link)$/ })
      ).toBeVisible();
      await page.keyboard.press("Escape");
    } else {
      await expect(details).toHaveText("");
      if (await headerRep.count()) {
        await expect(headerRep).toBeVisible();
      }
      const description = header.getByRole("button", {
        name: "Show wave description",
        exact: true,
      });
      if (await description.count()) {
        let descriptionGeometry: unknown;
        try {
          await expect
            .poll(
              async () => {
                descriptionGeometry = await description.evaluate((button) => {
                  const preview = button.querySelector("span > span");
                  const identity = button.parentElement;
                  if (!preview || !identity) {
                    return { fitsIdentity: false, hasTruncationCue: false };
                  }
                  const buttonBox = button.getBoundingClientRect();
                  const identityBox = identity.getBoundingClientRect();
                  const isTruncated =
                    preview.scrollWidth > preview.clientWidth + 1;
                  return {
                    fitsIdentity: buttonBox.right <= identityBox.right + 1,
                    hasTruncationCue:
                      !isTruncated || button.querySelector("svg") !== null,
                    buttonRight: buttonBox.right,
                    identityRight: identityBox.right,
                    previewWidth: preview.clientWidth,
                    previewScrollWidth: preview.scrollWidth,
                    fonts: document.fonts.status,
                  };
                });
                return descriptionGeometry;
              },
              {
                message:
                  "Wave description must fit its identity and indicate truncation",
              }
            )
            .toMatchObject({ fitsIdentity: true, hasTruncationCue: true });
        } finally {
          await testInfo.attach("wave-description-geometry", {
            body: Buffer.from(
              JSON.stringify(descriptionGeometry ?? null, null, 2)
            ),
            contentType: "application/json",
          });
        }
      }
      if (await score.count()) {
        const headingBox = await header
          .getByRole("heading", { level: 1 })
          .boundingBox();
        const scoreBox = await score.boundingBox();
        expect(headingBox).not.toBeNull();
        expect(scoreBox).not.toBeNull();
        expect(
          Math.abs((headingBox?.y ?? 0) - (scoreBox?.y ?? 0))
        ).toBeLessThanOrEqual(4);
        expect(scoreBox?.height).toBeGreaterThanOrEqual(24);
        expect(scoreBox?.width).toBeGreaterThanOrEqual(24);
      }
    }

    await details.click();
    const aboutPanel = page
      .getByRole("complementary", { name: "Wave details" })
      .or(page.getByRole("dialog", { name: "Wave details" }));
    await expect(
      aboutPanel.getByRole("tab", { name: "About", exact: true })
    ).toBeVisible();
    await aboutPanel.getByRole("tab", { name: "About", exact: true }).click();
    await expect(page.getByText("Created by", { exact: true })).toHaveCount(0);
    // Pinned drops can render their own dates inside link previews. Select the
    // wave's creation date explicitly instead of every date in the panel.
    const creationDate = aboutPanel.getByTestId("wave-creation-date");
    await expect(creationDate).toBeVisible();
    await expect(creationDate).toHaveAttribute(
      "datetime",
      /^\d{4}-\d{2}-\d{2}T/
    );
    await expect(
      aboutPanel.getByRole("region", { name: "Pinned drop", exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Pinned drop", exact: true })
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: /^(Share wave|Copy wave link)$/ })
    ).toBeVisible();
  });

  test("handles legacy wave query links without mutation", async ({ page }) => {
    const waveId = await getFirstWaveId(page);

    await gotoDocumentWithTransientRetry(
      page,
      `/waves?wave=${waveId}&serialNo=1`
    );
    // Next can emit the redirect in the streamed document. The initial shell
    // is visible before that navigation destroys its execution context.
    await page.waitForURL((url) => url.pathname === `/waves/${waveId}`, {
      waitUntil: "domcontentloaded",
      timeout: 45_000,
    });
    await waitForRouteReady(page);
    await expectNoHorizontalOverflow(page);

    const url = new URL(page.url());
    expect(url.searchParams.get("wave")).toBeNull();
    expect(url.searchParams.get("serialNo")).toBe("1");
  });

  test("keeps profile statistics natural and activity loading compact", async ({
    page,
  }) => {
    let releaseLogs: () => void = () => {};
    const logsReady = new Promise<void>((resolve) => {
      releaseLogs = resolve;
    });
    await page.route("**/api/profile-logs?**", async (route) => {
      await logsReady;
      await route.continue();
    });
    try {
      await gotoReady(page, `/${PROFILE_HANDLE}`);
      const loading = page.getByRole("status", {
        name: "Loading activity log",
      });
      await expect(loading).toBeVisible();
      const loadingBox = await loading.boundingBox();
      expect(loadingBox).not.toBeNull();
      expect(loadingBox!.height).toBeLessThan(300);
      const stats = page.getByRole("link", {
        name: new RegExp(`View ${PROFILE_HANDLE}'s collected TDH:`),
      });
      const numericStyles = await stats.evaluate((element) => {
        const value = element.firstElementChild ?? element;
        return {
          family: getComputedStyle(value).fontFamily,
          variant: getComputedStyle(value).fontVariantNumeric,
        };
      });
      expect(numericStyles.family).toContain("Montserrat");
      expect(numericStyles.variant).toBe("normal");
      await expectNoHorizontalOverflow(page);
      await loading.scrollIntoViewIfNeeded();
      await expect
        .poll(() =>
          loading.evaluate((element) => {
            let ancestor: Element | null = element;
            while (ancestor) {
              if (Number(getComputedStyle(ancestor).opacity) < 1) return false;
              ancestor = ancestor.parentElement;
            }
            return true;
          })
        )
        .toBe(true);
      await captureSafeScreenshot(
        page,
        test.info(),
        "profile-activity-loading"
      );

      // Releasing the held request starts the network round trip; it does not
      // mean the activity data has arrived. Keep network and render readiness
      // separate, and fail explicitly if the activity endpoint returns an error.
      const activityResponse = page.waitForResponse(
        (response) => {
          const url = new URL(response.url());
          return (
            response.request().method() === "GET" &&
            url.pathname === "/api/profile-logs" &&
            url.searchParams.get("profile") === PROFILE_HANDLE
          );
        },
        { timeout: RESPONSE_TIMEOUT_MS }
      );
      releaseLogs();
      const response = await activityResponse;
      expect(
        response.ok(),
        `Profile activity request returned HTTP ${response.status()}`
      ).toBe(true);
      await expect(
        response.finished(),
        "Profile activity response must complete successfully"
      ).resolves.toBeNull();
      await expect(
        page.getByRole("status", { name: "Loading activity log" })
      ).toHaveCount(0);
    } finally {
      releaseLogs();
    }
  });

  test("waits for identity guidance hydration before accepting activation", async ({
    page,
  }) => {
    // Desktop-only SSR check: mobile requires hydrated tab navigation to reveal
    // this panel, so it cannot expose the button while scripts are held. The
    // existing profile-shell test still covers mobile guidance activation.
    test.skip(
      (page.viewportSize()?.width ?? 1280) < 1024,
      "The mobile statements panel requires hydrated tab navigation."
    );
    let releaseScripts: () => void = () => undefined;
    const scriptsReady = new Promise<void>((resolve) => {
      releaseScripts = resolve;
    });
    await page.route("**/_next/static/chunks/**", async (route) => {
      if (new URL(route.request().url()).pathname.endsWith(".js")) {
        await scriptsReady;
      }
      await route.continue();
    });
    const guidanceButton = page.getByRole("button", {
      name: "About identity statements",
      exact: true,
    });
    const guidance = page.getByRole("tooltip", {
      name: /All statements are optional\./,
    });
    try {
      // Commit waits for the document response, allowing inspection of server
      // markup while client scripts remain held at the browser boundary.
      await page.goto(`/${PROFILE_HANDLE}`, { waitUntil: "commit" });
      await expect(guidanceButton).toBeVisible();
      await expect(guidanceButton).toBeDisabled();
    } finally {
      releaseScripts();
    }
    await expect(guidanceButton).toBeEnabled();
    await guidanceButton.click();
    await expect(guidanceButton).toHaveAttribute("aria-expanded", "true");
    await expect(guidance).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(guidanceButton).toHaveAttribute("aria-expanded", "false");
    await expect(guidance).toHaveCount(0);
  });

  test("renders the stable public profile shell read-only", async ({
    page,
    isMobile,
  }) => {
    await gotoReady(page, `/${PROFILE_HANDLE}`);

    await expectUrlState(page, (url) => url.pathname === `/${PROFILE_HANDLE}`);
    await expect(page).toHaveTitle(new RegExp(PROFILE_HANDLE, "i"));
    await expectProfileShell(page);
    await expectProfileTabLinks(page);
    const statements = page.getByRole("button", { name: /ID Statements/i });
    if (isMobile) {
      await expect(statements).toBeVisible({ timeout: RESPONSE_TIMEOUT_MS });
    }
    if (await statements.isVisible()) {
      // Its numeric count replaces the server placeholder only after this
      // streamed section hydrates and its statement query resolves.
      await expect(statements).toHaveAccessibleName(
        /^ID Statements \d[\d,]*$/,
        { timeout: RESPONSE_TIMEOUT_MS }
      );
      await statements.click();
      await expect(statements).toHaveAttribute("aria-pressed", "true");
    }
    await expect(
      page.getByRole("link", { name: "Wallet Checker" })
    ).toBeVisible({ timeout: RESPONSE_TIMEOUT_MS });
    await expect(
      page.getByRole("link", { name: "Wallet Checker" })
    ).toHaveAttribute(
      "href",
      /^\/safe-collecting\/wallet-checker\?address=0x[0-9a-fA-F]{40}$/
    );
    await expect(
      page.getByRole("link", { name: "Add another wallet" })
    ).toHaveCount(0);
    const walletCount = page.getByText(/^\d of 4 addresses$/).first();
    await expect(walletCount).toBeVisible();
    await expect
      .poll(() =>
        walletCount.evaluate((counter) => {
          const row = counter.parentElement;
          if (!row) return Number.POSITIVE_INFINITY;
          return Math.abs(
            row.getBoundingClientRect().right -
              counter.getBoundingClientRect().right
          );
        })
      )
      .toBeLessThanOrEqual(2);
    await expectNoHorizontalOverflow(page);
    const walletHeading = page.getByRole("heading", {
      name: `${PROFILE_HANDLE}'s Wallet`,
      level: 3,
    });
    const statementsHeading = page.getByRole("heading", {
      name: /ID Statements$/,
      level: 3,
    });
    await expect(walletHeading).toBeVisible();
    await expect(statementsHeading).toBeVisible();
    const walletBox = await walletHeading.boundingBox();
    const statementsBox = await statementsHeading.boundingBox();
    expect(walletBox).not.toBeNull();
    expect(statementsBox).not.toBeNull();
    expect(walletBox!.y).toBeLessThan(statementsBox!.y);
    await expect(
      page.getByText("Consolidated Addresses", { exact: true })
    ).toHaveCount(0);
    const guidanceButton = page.getByRole("button", {
      name: "About identity statements",
      exact: true,
    });
    await expect(guidanceButton).toBeEnabled();
    await guidanceButton.scrollIntoViewIfNeeded();
    await guidanceButton.click();
    await expect(
      page.getByRole("button", {
        name: "About identity statements",
        exact: true,
      })
    ).toHaveAttribute("aria-expanded", "true");
    // A scroll-into-view event can arrive after the opening click. It must
    // not dismiss guidance when the trigger has already reached its position.
    await page.evaluate(() => document.dispatchEvent(new Event("scroll")));
    // Production also adjusted page scroll by 3px after guidance opened. A
    // programmatic adjustment must reposition the popup instead of closing it.
    const adjusted = await page.evaluate(async () => {
      const scroller = document.scrollingElement;
      if (!scroller) return false;
      const before = scroller.scrollTop;
      scroller.scrollBy({
        top: before >= 3 ? -3 : 3,
        behavior: "instant",
      });
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      );
      return scroller.scrollTop !== before;
    });
    expect(adjusted).toBe(true);
    await page.mouse.move(0, 0);
    await expect(
      page.getByRole("button", {
        name: "About identity statements",
        exact: true,
      })
    ).toHaveAttribute("aria-expanded", "true");
    // Statement-row tooltips can still be closing while guidance is open.
    // Select its existing accessible name instead of every tooltip on the page.
    const guidance = page.getByRole("tooltip", {
      name: /All statements are optional\./,
    });
    await expect(guidance).toBeVisible();
    const guidanceBox = await guidance.boundingBox();
    expect(guidanceBox).not.toBeNull();
    const viewport = page.viewportSize();
    expect(viewport).not.toBeNull();
    expect(guidanceBox!.x).toBeGreaterThanOrEqual(0);
    expect(guidanceBox!.y).toBeGreaterThanOrEqual(0);
    expect(guidanceBox!.x + guidanceBox!.width).toBeLessThanOrEqual(
      viewport!.width
    );
    expect(guidanceBox!.y + guidanceBox!.height).toBeLessThanOrEqual(
      viewport!.height
    );
    await expect(guidance.getByRole("listitem")).toHaveCount(4);
    await expect(guidance).toContainText("All statements are optional.");
    await expect(guidance).toContainText(
      "All statements are fully and permanently public."
    );
    await expect(guidance).toContainText("Social accounts are self-declared.");
    await expect(guidance).toContainText(
      "The community will rate statement accuracy."
    );
    await page.keyboard.press("Escape");
    await expect(guidance).toBeHidden();
    await expect(guidance).toHaveCount(0);
    await page
      .getByRole("button", { name: "About identity statements", exact: true })
      .click();
    await expect(guidance).toBeVisible();
    await walletHeading.click();
    await expect(guidance).toBeHidden();
    await expect(guidance).toHaveCount(0);

    const helpButton = page.getByRole("button", {
      name: "About identity statements",
      exact: true,
    });
    for (const interaction of ["focus", "click"] as const) {
      await walletHeading.click();
      if (interaction === "focus") {
        await helpButton.focus();
      } else {
        await helpButton.click();
      }
      await expect(guidance).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(helpButton).toHaveAttribute("aria-expanded", "false");
      await expect(guidance).toHaveCount(0);
    }
  });

  for (const tab of PROFILE_TAB_PATHS) {
    test(`renders ${tab.path} read-only`, async ({ page }) => {
      await gotoReady(page, tab.path);

      await expectUrlState(page, (url) => url.pathname === tab.path);
      await expect(page).toHaveTitle(tab.title);
      await expectProfileShell(page, tab.activeTab);
      await expectProfileTabLinks(page);
    });
  }
});

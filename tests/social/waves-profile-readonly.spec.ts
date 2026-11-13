import type { Locator, Page } from "@playwright/test";
import { ApiProfileClassification } from "../../generated/models/ApiProfileClassification";
import type { ApiWaveOverviewPage } from "../../generated/models/ApiWaveOverviewPage";
import type { ApiXTdhGrantsPage } from "../../generated/models/ApiXTdhGrantsPage";
import { ApiXTdhGrantStatus } from "../../generated/models/ApiXTdhGrantStatus";
import { ApiXTdhGrantTargetChain } from "../../generated/models/ApiXTdhGrantTargetChain";
import { ApiXTdhGrantTargetTokenMode } from "../../generated/models/ApiXTdhGrantTargetTokenMode";
import { fetchWaveDiscoveryPage } from "./waveDiscoveryPagination";
import type { ApiXTdhGrantTokensPage } from "../../generated/models/ApiXTdhGrantTokensPage";
import { expectUrlState } from "../support/urlState";
import { mediaResolverUrlPattern } from "../support/mediaResolverHosts";
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

import { installSubscriptionFixtures } from "../support/subscriptionFixtures";

import { EN_US_MESSAGES } from "../../i18n/messages/en-US.complete";
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

async function getPublicChatMessageTarget(page: Page) {
  const response = await gotoReadyWithApiResponse(
    page,
    "/waves",
    (url) =>
      url.pathname === "/api/v2/waves" &&
      !url.searchParams.has("name") &&
      !url.searchParams.has("pinned") &&
      (!url.searchParams.has("page") || url.searchParams.get("page") === "1")
  );
  const isEligibleChat = (candidate: ApiWaveOverviewPage["data"][number]) =>
    !candidate.has_competition &&
    !candidate.is_private &&
    !candidate.is_dm_wave &&
    candidate.total_drops_count > 1;
  let overview = (await response.json()) as ApiWaveOverviewPage;
  let wave = overview.data.find(isEligibleChat);
  const stagingAccess = await response.request().headerValue("x-6529-auth");
  while (!wave && overview.next) {
    const nextPage = overview.page + 1;
    const nextPageUrl = new URL(response.url());
    nextPageUrl.searchParams.set("page", String(nextPage));
    overview = await fetchWaveDiscoveryPage(
      page.context(),
      nextPageUrl,
      stagingAccess
    );
    expect(overview.page).toBe(nextPage);
    wave = overview.data.find(isEligibleChat);
  }
  expect(
    wave,
    "Legacy-link fixture unavailable: public discovery must contain a nonempty public chat wave"
  ).toBeDefined();
  const waveId = wave!.id;
  expect(waveId).toMatch(/^[0-9a-f-]{36}$/i);
  await gotoReady(page, `/waves/${waveId}`);
  const message = page
    .getByRole("region", {
      name: "Wave chat file upload area",
      exact: true,
    })
    .locator("[data-serial-no]")
    .first();
  await expect(message).toBeVisible({ timeout: 15000 });
  const serialNo = await message.getAttribute("data-serial-no");
  expect(serialNo).toMatch(/^[1-9]\d*$/);
  return { waveId, serialNo: serialNo! };
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
      await expect(sortControl).toHaveCSS("font-size", "14px");
      await expect(sortControl).toHaveCSS(
        "height",
        (page.viewportSize()?.width ?? 1280) >= 1024 ? "32px" : "44px"
      );
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
    // Token metadata resolves through the deployed build's media resolver
    // (media.6529.io in production, the separate content domain on staging).
    await page.route(
      mediaResolverUrlPattern(
        "/arweave/fLAMSnWmzM9tAso6xMRSSPC2ZYaRoqjRnqGKaxk7vRQ"
      ),
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

  for (const subscribed of [true, false]) {
    test(`aligns mint-day visitor status with later rows when subscribed=${subscribed}`, async ({
      page,
    }, testInfo) => {
      await page.clock.setFixedTime(new Date("2026-10-30T00:01:00Z"));
      await installSubscriptionFixtures(page);
      await page.route(
        (url) => url.pathname.endsWith("/memes_latest"),
        (route) =>
          route.fulfill({
            json: {
              id: 568,
              contract: "0x33fd426905f149f8376e227d0c9d3340aad17af1",
              thumbnail: "/profile-cms/templates/memes/1.webp",
            },
          })
      );
      await page.route(
        (url) =>
          url.pathname.includes("/subscriptions/consolidation/upcoming-memes/"),
        (route) =>
          route.fulfill({
            json: [568, 569, 570].map((token_id) => ({
              token_id,
              contract: "0x33fd426905f149f8376e227d0c9d3340aad17af1",
              subscribed,
              subscribed_count: 2,
            })),
          })
      );
      await gotoReady(page, `/${PROFILE_HANDLE}/subscriptions`);
      const upcoming = page.getByRole("region", {
        name: "Upcoming Drops",
        exact: true,
      });
      const artwork = page
        .getByRole("region", { name: "Upcoming Drops", exact: true })
        .locator("img");
      const mintingToday = upcoming.getByRole("button", {
        name: "Minting Today",
      });
      const statuses = upcoming.getByText(
        subscribed ? "Subscribed" : "Not subscribed",
        { exact: true }
      );
      await expect(artwork).toBeVisible();
      await expect(statuses).toHaveCount(3);
      await expect(upcoming.getByRole("switch")).toHaveCount(0);
      await expect(upcoming.getByRole("combobox")).toHaveCount(0);
      for (const width of [390, 492, 639, 640, 1024]) {
        await page.setViewportSize({ width, height: 900 });
        const imageBox = await artwork.boundingBox();
        const labelBox = await mintingToday.boundingBox();
        expect(imageBox).not.toBeNull();
        expect(labelBox).not.toBeNull();
        if (width < 640) {
          expect(labelBox!.y).toBeGreaterThanOrEqual(
            imageBox!.y + imageBox!.height
          );
          expect(Math.abs(labelBox!.x - imageBox!.x)).toBeLessThanOrEqual(1);
        } else {
          expect(labelBox!.x).toBeGreaterThanOrEqual(
            imageBox!.x + imageBox!.width
          );
        }
        const rightEdges = await statuses.evaluateAll((elements) =>
          elements.map((element) => element.getBoundingClientRect().right)
        );
        expect(
          Math.max(...rightEdges) - Math.min(...rightEdges)
        ).toBeLessThanOrEqual(1);
        await expectNoHorizontalOverflow(page);
        if (width === 390) {
          const path = testInfo.outputPath(`mint-day-status-${subscribed}.png`);
          await upcoming.screenshot({ path });
          await testInfo.attach("Minting Today mobile layout", {
            contentType: "image/png",
            path,
          });
        }
      }
    });
  }

  test("keeps the full subscription airdrop address available on touch and keyboard", async ({
    page,
    isMobile,
  }) => {
    await gotoReady(page, `/${PROFILE_HANDLE}/subscriptions`);
    await expectProfileShell(page, "Subscriptions");
    if (page.viewportSize()!.width < 1024) {
      const settingsOpener = page.getByRole("button", {
        name: "Minting settings",
        exact: true,
      });
      // Stay touch-only on touch devices. A mouse click here would park the
      // emulated cursor, and Chrome's hover update at that cursor closes the
      // tapped address tooltip as soon as it mounts.
      if (isMobile) {
        await settingsOpener.tap();
      } else {
        await settingsOpener.click();
      }
      await expect(
        page
          .getByRole("dialog", { name: "Minting settings", exact: true })
          .getByRole("heading", { name: "Minting settings", exact: true })
      ).toBeFocused();
    }
    const address = page.getByRole("button", {
      name: /^0x[0-9a-fA-F]{40}$/,
    });
    // The address comes from the subscriptions API after the shell renders.
    await expect(address).toBeVisible({ timeout: RESPONSE_TIMEOUT_MS });
    const fullAddress = (await address.getAttribute("aria-label"))!;
    if (isMobile) {
      await address.tap();
    } else {
      await address.focus();
    }
    const addressTooltip = page.getByRole("tooltip", { name: fullAddress });
    await expect(addressTooltip).toBeVisible();
    // react-tooltip mounts the tooltip at opacity 0 and opens it on a later
    // timer. Wait until it is readable; dismissing during that handoff can
    // leave the hidden tooltip mounted.
    await expect(addressTooltip).toHaveCSS("opacity", "1");
    const addressHeading = page.getByRole("heading", {
      name: "Airdrop Address",
      exact: true,
    });
    if (isMobile) {
      await addressHeading.tap();
    } else {
      await addressHeading.click();
    }
    await expect(addressTooltip).toHaveCount(0);
    const addressWidth = await address.evaluate((element) => ({
      visible: element.clientWidth,
      content: element.scrollWidth,
    }));
    expect(addressWidth.content).toBeLessThanOrEqual(addressWidth.visible + 1);
    await expectNoHorizontalOverflow(page);
  });

  for (const [section, title] of [
    ["settings", "Minting settings"],
    ["history", "Subscription History"],
  ] as const) {
    test(`opens subscription ${section} from links and taps, not resizing`, async ({
      page,
    }) => {
      await installSubscriptionFixtures(page);
      await page.setViewportSize({ width: 1024, height: 900 });
      await gotoReady(
        page,
        `/${PROFILE_HANDLE}/subscriptions#profile-subscriptions-${section}`
      );
      await expect(
        page.getByRole("heading", { name: title, exact: true })
      ).toBeVisible();
      const sheet = page.getByRole("dialog", { name: title, exact: true });
      await expect(sheet).toHaveCount(0);

      await page.setViewportSize({ width: 1023, height: 900 });
      const opener = page.getByRole("button", { name: title, exact: true });
      await expect(opener).toBeVisible();
      await expect(sheet).toHaveCount(0);
      await opener.click();
      await expect(
        sheet.getByRole("heading", { name: title, exact: true })
      ).toBeVisible();
      await sheet.getByRole("button", { name: "Close", exact: true }).click();
      await expect(sheet).toHaveCount(0);
      await expect(opener).toBeFocused();
      await expect(page).toHaveURL((url) => url.hash === "");

      // Refreshing a dismissed sheet stays closed. Explicit deep links still work.
      await page.setViewportSize({ width: 390, height: 900 });
      await page.reload();
      await expect(opener).toBeVisible();
      await expect(sheet).toHaveCount(0);
      await gotoReady(
        page,
        `/${PROFILE_HANDLE}/subscriptions#profile-subscriptions-${section}`
      );
      await expect(
        sheet.getByRole("heading", { name: title, exact: true })
      ).toBeVisible();
      await expect(
        sheet.getByRole("heading", { name: title, exact: true })
      ).toBeFocused();
      await page.setViewportSize({ width: 1024, height: 900 });
      await expect(sheet).toHaveCount(0);
      await page.setViewportSize({ width: 1023, height: 900 });
      await expect(opener).toBeVisible();
      await expect(sheet).toHaveCount(0);
    });
  }

  for (const width of [390, 1280]) {
    test(`distinguishes failed subscription reads from empty data at ${width}px`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await installSubscriptionFixtures(page);
      let failReads = true;
      await page.route(
        (url) => url.pathname.includes("/subscriptions/consolidation/"),
        async (route) => {
          if (failReads) {
            await route.fulfill({
              status: 503,
              json: { error: "Unavailable" },
            });
          } else {
            await route.fallback();
          }
        }
      );
      await gotoReady(page, `/${PROFILE_HANDLE}/subscriptions`);
      const overview = page
        .getByRole("region", { name: "Subscription minting" })
        .locator("#profile-subscriptions-overview");
      const upcoming = page.getByRole("region", { name: "Upcoming Drops" });
      await expect(
        overview.getByText("Unavailable", { exact: true }).first()
      ).toBeVisible();
      await expect(overview.getByText("ETH", { exact: true })).toHaveCount(0);
      await expect(overview.getByText(/mints available/)).toHaveCount(0);
      await expect(
        upcoming.getByText("Unavailable", { exact: true })
      ).toBeVisible();
      await expect(upcoming.getByText("No upcoming drops found")).toHaveCount(
        0
      );
      await captureSafeScreenshot(
        page,
        testInfo,
        `subscription-read-error-${width}.png`
      );
      await overview.screenshot({
        path: testInfo.outputPath(`subscription-read-error-card-${width}.png`),
      });

      failReads = false;
      await page
        .getByRole("status")
        .filter({ hasText: "Some subscription data could not be refreshed." })
        .getByRole("button", { name: "Retry", exact: true })
        .click();
      await expect(
        overview.getByText("0.4 ETH", { exact: true })
      ).toBeVisible();
      await expect(
        upcoming.getByText("The Memes #568", { exact: true })
      ).toBeVisible();
      await expect(
        upcoming.getByText("Unavailable", { exact: true })
      ).toHaveCount(0);
    });
  }

  for (const width of [390, 1342]) {
    test(`shows one amber funding boundary without changing visitor selections at ${width}px`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await installSubscriptionFixtures(page);
      await gotoReady(
        page,
        `/${PROFILE_HANDLE}/subscriptions#profile-subscriptions-upcoming`
      );
      const upcoming = page.getByRole("region", {
        name: "Upcoming Drops",
        exact: true,
      });
      const boundary = upcoming.getByText(/^Funded through The Memes #570$/);
      await expect(boundary).toHaveCount(1);
      await expect(boundary).toHaveCSS("color", "rgb(253, 230, 138)");
      await expect(
        boundary.getByRole("link", { name: "The Memes #570" })
      ).toHaveAttribute("href", "/the-memes/570");
      await expect(upcoming.getByText("Unfunded", { exact: true })).toHaveCount(
        0
      );
      await expect(
        upcoming.getByText("Subscribed", { exact: true })
      ).toHaveCount(3);
      await expect(upcoming.getByRole("switch")).toHaveCount(0);
      await upcoming
        .getByRole("button", { name: "Show More", exact: true })
        .click();
      const fullList =
        width < 640
          ? page.getByRole("dialog", { name: "Upcoming Drops", exact: true })
          : upcoming;
      await expect(
        fullList.getByText(/^Funded through The Memes #/)
      ).toHaveCount(1);
      await expect(
        fullList.getByText(/^Next unfunded The Memes #/)
      ).toHaveCount(0);
      await expect(fullList.getByText("Unfunded", { exact: true })).toHaveCount(
        0
      );
      await expect(
        fullList.getByText("Subscribed", { exact: true })
      ).toHaveCount(5);
      await expectNoHorizontalOverflow(page);
      if (width < 640) {
        await expect(
          fullList.getByRole("heading", { name: "Upcoming Drops", exact: true })
        ).toBeFocused();
        const panel = page
          .getByRole("dialog", { name: "Upcoming Drops", exact: true })
          .locator('[id^="headlessui-dialog-panel-"]')
          .locator("..");
        await expect
          .poll(() =>
            panel.evaluate((element) => {
              const transform = getComputedStyle(element).transform;
              return transform === "none"
                ? 0
                : new DOMMatrixReadOnly(transform).m42;
            })
          )
          .toBe(0);
        await expect(
          fullList.getByText(/^Funded through The Memes #570$/)
        ).toBeInViewport();
      }
      await page.screenshot({
        path: testInfo.outputPath(
          `subscriptions-funding-boundary-${width}.png`
        ),
      });
    });
  }

  test("keeps desktop history inline and preserves its selected pill in mobile sheets", async ({
    page,
  }, testInfo) => {
    // Fixed settings ensure the saved UTC date and pagination are covered.
    await page.clock.setFixedTime(new Date("2026-10-30T00:01:00Z"));
    await installSubscriptionFixtures(page);
    // Desktop anchors stay inline; mobile settings/history use shared sheets.
    await page.setViewportSize({ width: 1280, height: 900 });
    const historyRequests: string[] = [];
    page.on("request", (request) => {
      const match =
        /\/subscriptions\/consolidation\/(redeemed|logs|top-up)\//.exec(
          new URL(request.url()).pathname
        );
      if (match) historyRequests.push(match[1]!);
    });
    await gotoReadyWithApiResponse(
      page,
      `/${PROFILE_HANDLE}/subscriptions#profile-subscriptions-history`,
      (url) => url.pathname.includes("/subscriptions/consolidation/redeemed/")
    );
    await expectProfileShell(page, "Subscriptions");
    const overview = page.getByRole("region", {
      name: "Subscription minting",
      exact: true,
    });
    const learnMore = overview.getByRole("link", {
      name: "Learn more",
      exact: true,
    });
    await expect(
      page
        .getByRole("main")
        .getByRole("link", { name: "Learn more", exact: true })
    ).toHaveCount(1);
    await expect(learnMore).toHaveAttribute("href", "/about/subscriptions");
    // Read related geometry together so profile hydration/scroll restoration
    // cannot move the viewport between the measurements.
    const header = await learnMore.evaluate((link) => {
      const section = link.closest("section")!;
      const title = section.querySelector("h2")!;
      return {
        title: title.getBoundingClientRect().toJSON(),
        link: link.getBoundingClientRect().toJSON(),
        section: section.getBoundingClientRect().toJSON(),
      };
    });
    expect(
      Math.abs(header.link.right - header.section.right)
    ).toBeLessThanOrEqual(1);
    expect(header.link.left).toBeGreaterThan(header.title.right);
    expect(
      Math.abs(
        header.link.y +
          header.link.height / 2 -
          (header.title.y + header.title.height / 2)
      )
    ).toBeLessThanOrEqual(1);
    const history = page
      .getByRole("region", {
        name: "Subscription History",
        exact: true,
      })
      .or(
        page.getByRole("dialog", { name: "Subscription History", exact: true })
      );
    await expect(
      history.getByRole("heading", {
        name: "Subscription History",
        exact: true,
      })
    ).toBeFocused();
    await expect(
      history.getByRole("button", {
        name: "Subscription History",
        exact: true,
      })
    ).toHaveCount(0);
    const coverage = page
      .getByRole("region", { name: "Subscription minting", exact: true })
      .locator("#profile-subscriptions-overview");
    const mintingSettings = page
      .getByRole("region", {
        name: "Minting settings",
        exact: true,
      })
      .or(page.getByRole("dialog", { name: "Minting settings", exact: true }));
    const details = coverage.getByRole("button", {
      name: "Details",
      exact: true,
    });
    await expect(mintingSettings).toBeVisible();
    await expect(details).toHaveCount(0);
    await expect(coverage.getByText(/Top up by|Recommended:/)).toHaveCount(0);
    await expect(
      coverage.getByText(
        /Choose a drop|Set up subscriptions|Review settings or refresh/
      )
    ).toHaveCount(0);
    await expect(
      coverage.getByRole("heading", { level: 2 }).locator("svg")
    ).toHaveCount(0);
    const statusGeometry = await coverage.evaluate((element) => {
      const badge = element
        .querySelector("#profile-subscriptions-overview-status")
        ?.getBoundingClientRect();
      const headline = element
        .querySelector("#profile-subscriptions-overview-title")
        ?.getBoundingClientRect();
      return badge && headline
        ? { badgeBottom: badge.bottom, headlineTop: headline.top }
        : null;
    });
    expect(statusGeometry).not.toBeNull();
    expect(statusGeometry!.badgeBottom).toBeLessThanOrEqual(
      statusGeometry!.headlineTop
    );
    const coverageBox = await coverage.boundingBox();
    const headlineBox = await coverage
      .getByRole("heading", { level: 2 })
      .boundingBox();
    const balanceBox = await page
      .getByRole("region", { name: "Subscription minting", exact: true })
      .locator("#subscription-overview-actions")
      .getByText("Subscription balance", { exact: true })
      .boundingBox();
    expect(coverageBox).not.toBeNull();
    expect(headlineBox).not.toBeNull();
    expect(balanceBox).not.toBeNull();
    const descriptionBox = await page
      .getByRole("region", { name: "Subscription minting", exact: true })
      .locator("#profile-subscriptions-overview-title + p")
      .boundingBox();
    expect(descriptionBox).not.toBeNull();
    expect(balanceBox!.y).toBeGreaterThanOrEqual(
      descriptionBox!.y + descriptionBox!.height
    );
    expect(balanceBox!.y + balanceBox!.height).toBeLessThanOrEqual(
      coverageBox!.y + coverageBox!.height
    );
    const forecast = coverage.getByRole("button", {
      name: "Forecast use",
      exact: true,
    });
    await expect(
      coverage.getByText("Forecast use", { exact: true })
    ).toBeVisible();
    await forecast.click();
    const forecastTooltip = page.getByRole("tooltip").filter({
      hasText:
        "Projected from current eligibility, settings, balance, and the published Meme schedule.",
    });
    await expect(forecastTooltip).toBeVisible();
    await expect(
      forecastTooltip.getByText("Your next selected drops are fully funded.", {
        exact: true,
      })
    ).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(forecastTooltip).toBeHidden();
    await expect(mintingSettings.getByRole("switch")).toHaveCount(0);
    const visitorMode = mintingSettings.getByRole("group", {
      name: "Mode",
      exact: true,
    });
    const visitorEditions = mintingSettings.getByRole("group", {
      name: "Edition Preference",
      exact: true,
    });
    await expect(
      mintingSettings
        .getByRole("group", { name: "Mode", exact: true })
        .locator("[data-setting-value]")
    ).toHaveText(/^(Manual|Automatic)$/);
    await expect(visitorMode.getByText(/^(Manual|Automatic)$/)).toHaveCount(1);
    await expect(
      mintingSettings
        .getByRole("group", { name: "Edition Preference", exact: true })
        .locator("[data-setting-value]")
    ).toHaveText(/^(One edition|All eligible)$/);
    await expect(
      visitorEditions.getByText(/^(One edition|All eligible)$/)
    ).toHaveCount(1);
    await expect(visitorEditions.getByText(/^Eligibility x/)).toBeVisible();
    await expect(visitorMode.getByRole("button")).toHaveCount(0);
    await expect(visitorEditions.getByRole("button")).toHaveCount(0);
    await expect(mintingSettings.getByText(/^You will receive/)).toHaveCount(0);
    await expect(
      page
        .getByRole("region", { name: "Upcoming Drops", exact: true })
        .getByText(
          /^(You have to opt-in to each specific drop|Automatic airdrops of all eligible drops unless you opt-out)$/
        )
    ).toHaveCount(0);
    await expect(
      mintingSettings.getByRole("heading", {
        name: "Airdrop Address",
        exact: true,
      })
    ).toBeVisible();
    const settingsBox = await mintingSettings.boundingBox();
    const upcoming = page.getByRole("region", {
      name: "Upcoming Drops",
      exact: true,
    });
    await expect(upcoming.getByRole("switch")).toHaveCount(0);
    await expect(upcoming.getByRole("combobox")).toHaveCount(0);
    await expect(
      upcoming.getByRole("button", { name: "Show More", exact: true })
    ).toHaveCSS("justify-content", "center");
    await expect(
      upcoming.getByText(/^(Subscribed|Not subscribed)$/)
    ).toHaveCount(3);
    const upcomingBox = await upcoming.boundingBox();
    expect(settingsBox).not.toBeNull();
    expect(upcomingBox).not.toBeNull();
    expect(settingsBox!.y + settingsBox!.height).toBeLessThanOrEqual(
      upcomingBox!.y
    );
    const initialViewport = page.viewportSize()!;
    await page.setViewportSize({ width: 1024, height: initialViewport.height });
    await expectNoHorizontalOverflow(page);
    const desktopOverview = await page
      .getByRole("region", { name: "Subscription minting", exact: true })
      .boundingBox();
    const desktopSettings = await mintingSettings.boundingBox();
    expect(desktopOverview).not.toBeNull();
    expect(desktopSettings).not.toBeNull();
    expect(desktopSettings!.x).toBeGreaterThanOrEqual(
      desktopOverview!.x + desktopOverview!.width
    );
    expect(
      Math.abs(desktopSettings!.y - desktopOverview!.y)
    ).toBeLessThanOrEqual(1);
    await page.evaluate(() =>
      window.history.replaceState(
        window.history.state,
        "",
        window.location.pathname
      )
    );
    await page.setViewportSize({ width: 390, height: initialViewport.height });
    const narrowTitle = await upcoming
      .getByText("The Memes #569", { exact: true })
      .boundingBox();
    const narrowQuantity = upcoming.getByRole("group", {
      name: "Subscription quantity for The Memes #569",
      exact: true,
    });
    const narrowQuantityBox = await narrowQuantity.boundingBox();
    const narrowStatusBox = await upcoming
      .getByRole("group", {
        name: "Subscription quantity for The Memes #569",
        exact: true,
      })
      .locator("..")
      .locator("..")
      .getByText("Subscribed", { exact: true })
      .boundingBox();
    expect(narrowTitle).not.toBeNull();
    expect(narrowQuantityBox).not.toBeNull();
    expect(narrowStatusBox).not.toBeNull();
    // Visitor values may share the title line when space permits; neither
    // layout may overlap or split quantity from its status.
    if (narrowQuantityBox!.y < narrowTitle!.y + narrowTitle!.height) {
      expect(narrowQuantityBox!.x).toBeGreaterThanOrEqual(
        narrowTitle!.x + narrowTitle!.width
      );
    } else {
      expect(narrowQuantityBox!.y).toBeGreaterThanOrEqual(
        narrowTitle!.y + narrowTitle!.height
      );
    }
    expect(
      Math.abs(narrowQuantityBox!.y - narrowStatusBox!.y)
    ).toBeLessThanOrEqual(1);
    const settingsOpener = page.getByRole("button", {
      name: "Minting settings",
      exact: true,
    });
    const compactBox = await settingsOpener.boundingBox();
    const mobileDropsBox = await upcoming.boundingBox();
    expect(compactBox).not.toBeNull();
    expect(mobileDropsBox).not.toBeNull();
    expect(compactBox!.y).toBeGreaterThanOrEqual(
      mobileDropsBox!.y + mobileDropsBox!.height
    );
    await settingsOpener.click();
    await expect(
      mintingSettings.getByRole("heading", {
        name: "Minting settings",
        exact: true,
      })
    ).toBeFocused();
    // Let the shared sheet finish entering before comparing row geometry.
    await mintingSettings
      .getByRole("heading", { name: "Minting settings", exact: true })
      .click({ trial: true });
    await expect(mintingSettings.getByRole("switch")).toHaveCount(0);
    const settingControls = [
      mintingSettings.getByRole("group", { name: "Mode", exact: true }),
      mintingSettings.getByRole("group", {
        name: "Edition Preference",
        exact: true,
      }),
      mintingSettings.getByRole("heading", {
        name: "Airdrop Address",
        exact: true,
      }),
    ];
    const settingBoxes = await Promise.all(
      settingControls.map((control) => control.boundingBox())
    );
    for (const [index, box] of settingBoxes.entries()) {
      expect(box).not.toBeNull();
      expect(Math.abs(box!.x - settingBoxes[0]!.x)).toBeLessThanOrEqual(1);
      if (index > 0) {
        const previous = settingBoxes[index - 1]!;
        expect(box!.y).toBeGreaterThanOrEqual(previous.y + previous.height);
      }
    }
    expect(
      Math.abs(settingBoxes[0]!.width - settingBoxes[1]!.width)
    ).toBeLessThanOrEqual(1);
    const modeValue = mintingSettings
      .getByRole("group", { name: "Mode", exact: true })
      .locator("[data-setting-value]");
    const modeLabelBox = await mintingSettings
      .getByText("Mode", { exact: true })
      .boundingBox();
    const modeValueBox = await modeValue.boundingBox();
    await expect(
      mintingSettings
        .getByRole("group", { name: "Mode", exact: true })
        .locator('[id$="-detail"]')
    ).toHaveCSS("text-align", "start");
    expect(modeLabelBox).not.toBeNull();
    expect(modeValueBox).not.toBeNull();
    expect(Math.abs(modeValueBox!.x - modeLabelBox!.x)).toBeLessThanOrEqual(1);
    expect(modeValueBox!.y).toBeGreaterThanOrEqual(
      modeLabelBox!.y + modeLabelBox!.height
    );
    const eligibilityBox = await mintingSettings
      .getByText(/^Eligibility x/)
      .boundingBox();
    const editionLabelBox = await mintingSettings
      .getByText("Edition Preference", { exact: true })
      .boundingBox();
    expect(eligibilityBox).not.toBeNull();
    await expect(visitorEditions.getByText(/^Eligibility x/)).toHaveCSS(
      "text-align",
      "start"
    );
    expect(editionLabelBox).not.toBeNull();
    expect(eligibilityBox!.y).toBeGreaterThanOrEqual(
      editionLabelBox!.y + editionLabelBox!.height
    );
    const addressBox = await mintingSettings
      .getByRole("button", { name: /^0x[0-9a-fA-F]{40}$/ })
      .boundingBox();
    await expect(
      mintingSettings.getByRole("button", { name: /^0x[0-9a-fA-F]{40}$/ })
    ).toHaveText(/^·?\s*0x[0-9a-fA-F]{4}\.\.\.[0-9a-fA-F]{4}$/);
    expect(addressBox).not.toBeNull();
    expect(addressBox!.y).toBeGreaterThanOrEqual(
      settingBoxes[2]!.y + settingBoxes[2]!.height
    );
    for (const width of [768, 1023]) {
      await page.setViewportSize({ width, height: initialViewport.height });
      const inlineLabels = await Promise.all(
        (await mintingSettings.getByRole("heading", { level: 3 }).all()).map(
          (label) => label.boundingBox()
        )
      );
      for (const [index, label] of inlineLabels.entries()) {
        expect(label).not.toBeNull();
        expect(Math.abs(label!.x - inlineLabels[0]!.x)).toBeLessThanOrEqual(1);
        if (index > 0) {
          const previous = inlineLabels[index - 1]!;
          expect(label!.y).toBeGreaterThan(previous.y + previous.height);
        }
      }
    }
    await mintingSettings
      .getByRole("button", { name: "Close", exact: true })
      .click();
    await expect(settingsOpener).toBeFocused();
    await page.setViewportSize({ width: 1920, height: initialViewport.height });
    await expect(
      page.getByRole("dialog", { name: "Minting settings", exact: true })
    ).toHaveCount(0);
    const inlineModeValue = await modeValue.boundingBox();
    const inlineModeDate = await mintingSettings
      .getByRole("group", { name: "Mode", exact: true })
      .locator('[id$="-detail"]')
      .boundingBox();
    expect(inlineModeValue).not.toBeNull();
    expect(inlineModeDate).not.toBeNull();
    const sidebarModeLabel = await visitorMode
      .getByRole("heading", { name: "Mode", exact: true })
      .boundingBox();
    expect(sidebarModeLabel).not.toBeNull();
    expect(inlineModeValue!.y).toBeGreaterThanOrEqual(
      sidebarModeLabel!.y + sidebarModeLabel!.height
    );
    expect(
      Math.abs(inlineModeValue!.x - sidebarModeLabel!.x)
    ).toBeLessThanOrEqual(1);
    expect(
      Math.abs(inlineModeDate!.y - inlineModeValue!.y)
    ).toBeLessThanOrEqual(4);
    await expect(
      mintingSettings
        .getByRole("group", { name: "Mode", exact: true })
        .locator('[id$="-detail"]')
    ).toHaveCSS("text-align", "start");
    await page.setViewportSize(initialViewport);
    await expect(details).toHaveCount(0);
    const tabs = history.getByRole("tablist");
    await expect(tabs).toBeVisible();
    await expect(tabs.getByRole("tab")).toHaveText([
      "Redeemed",
      "Log History",
      "Top Up History",
    ]);
    expect(historyRequests).toEqual(["redeemed"]);
    const logs = tabs.getByRole("tab", { name: "Log History", exact: true });
    await logs.click();
    await expect(logs).toHaveAttribute("aria-selected", "true");
    await expect(history.getByRole("tabpanel")).toHaveAttribute(
      "aria-busy",
      "false"
    );
    expect(historyRequests).toEqual(["redeemed", "logs"]);
    const viewport = page.viewportSize()!;
    await page.setViewportSize({
      width: viewport.width < 640 ? 900 : 390,
      height: viewport.height,
    });
    const historyOpener = page.getByRole("button", {
      name: "Subscription History",
      exact: true,
    });
    await historyOpener.click();
    await expect(
      history.getByRole("heading", {
        name: "Subscription History",
        exact: true,
      })
    ).toBeFocused();
    await expect(tabs).toBeVisible();
    await expect(logs).toHaveAttribute("aria-selected", "true");
    await expectNoHorizontalOverflow(page);
    await history.getByRole("button", { name: "Close", exact: true }).click();
    await expect(historyOpener).toBeFocused();
    await page.setViewportSize({ width: 390, height: viewport.height });
    await expect(
      upcoming.getByRole("button", { name: "Show More", exact: true })
    ).toHaveCSS("justify-content", "center");
    for (const quantity of await upcoming
      .getByRole("group", {
        name: /^Subscription quantity for The Memes #/,
      })
      .all()) {
      await expect(quantity).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
      const quantityBox = await quantity.boundingBox();
      const upcomingMobileBox = await upcoming.boundingBox();
      expect(quantityBox).not.toBeNull();
      expect(upcomingMobileBox).not.toBeNull();
      expect(quantityBox!.x).toBeGreaterThanOrEqual(upcomingMobileBox!.x);
      expect(quantityBox!.x + quantityBox!.width).toBeLessThanOrEqual(
        upcomingMobileBox!.x + upcomingMobileBox!.width
      );
    }
    for (const status of await upcoming
      .getByText(/^(Subscribed|Not subscribed)$/)
      .all()) {
      await expect(status).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    }
    // The shorter Redeemed label fits at 390px; exercise scrolling at 320px.
    await page.setViewportSize({ width: 320, height: viewport.height });
    await historyOpener.click();
    const pillLayout = await tabs.evaluate((element) => ({
      width: element.clientWidth,
      contentWidth: element.scrollWidth,
      rowTops: Array.from(
        element.querySelectorAll('[role="tab"]'),
        (tab) => tab.getBoundingClientRect().top
      ),
    }));
    expect(new Set(pillLayout.rowTops).size).toBe(1);
    expect(pillLayout.contentWidth).toBeGreaterThan(pillLayout.width);
    await expect(logs).toHaveAttribute("aria-selected", "true");
    await logs.press("ArrowRight");
    const topUps = tabs.getByRole("tab", {
      name: "Top Up History",
      exact: true,
    });
    await expect(topUps).toBeFocused();
    await expect(topUps).toHaveAttribute("aria-selected", "true");
    await expect
      .poll(() =>
        topUps.evaluate((tab) => {
          const pill = tab.getBoundingClientRect();
          const strip = tab
            .closest('[role="tablist"]')!
            .getBoundingClientRect();
          // Fractional device pixels can leave the final edge <1 CSS px out.
          return pill.left >= strip.left - 1 && pill.right <= strip.right + 1;
        })
      )
      .toBe(true);
    await expect(history.getByRole("tabpanel")).toHaveAttribute(
      "aria-busy",
      "false"
    );
    expect(historyRequests).toEqual(["redeemed", "logs", "top-up"]);
    await topUps.press("ArrowLeft");
    await expect(logs).toBeFocused();
    await expect(logs).toHaveAttribute("aria-selected", "true");
    await expect(history.getByRole("tabpanel")).toHaveAttribute(
      "aria-busy",
      "false"
    );
    expect(historyRequests).toEqual(["redeemed", "logs", "top-up"]);
    await page.setViewportSize(viewport);
    await expectNoHorizontalOverflow(page);
    await captureSafeScreenshot(
      page,
      testInfo,
      "subscription-history-pills.png"
    );
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
    expect(competitionPath).toMatch(/\/decisions\/[^/]+$/);
    // The page route says "decisions"; the public API keeps "competitions".
    const competitionApiPath = competitionPath.replace(
      /\/decisions\/([^/]+)$/,
      "/competitions/$1"
    );
    const activityResponse = await gotoReadyWithApiResponse(
      page,
      `${competitionPath}?tab=votes&voteTab=activity`,
      (url) =>
        url.pathname === `/api/v3${competitionApiPath}/activity` &&
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
            "This decision could not be loaded. It may be unavailable or you may not have access.",
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
    for (const name of ["Chat", "Leaderboard", "Winners", "FAQ"]) {
      await expect(
        waveTabs.getByRole("tab", { name, exact: true })
      ).toBeAttached();
    }
    await expect(
      waveTabs.getByRole("tab", { name: /^Outcomes?$/, exact: true })
    ).toHaveCount(0);
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
      page.getByRole("button", { name: "Toggle results timeline" })
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
      feedNavigation.getByRole("link", { name: "Waves", exact: true })
    ).toHaveAttribute("href", "/waves");
    const discoverLink = feedNavigation.getByRole("link", {
      name: "Discover Waves",
      exact: true,
    });
    await expect(discoverLink).toHaveAttribute("href", "/discover");
    const backLinkBounds = await feedNavigation
      .getByRole("link", { name: "Waves", exact: true })
      .boundingBox();
    const discoverLinkBounds = await discoverLink.boundingBox();
    const navigationBounds = await feedNavigation.boundingBox();
    expect(backLinkBounds).not.toBeNull();
    expect(discoverLinkBounds).not.toBeNull();
    expect(navigationBounds).not.toBeNull();
    expect(
      Math.abs(
        backLinkBounds!.y +
          backLinkBounds!.height / 2 -
          (discoverLinkBounds!.y + discoverLinkBounds!.height / 2)
      )
    ).toBeLessThanOrEqual(1);
    expect(
      navigationBounds!.x +
        navigationBounds!.width -
        (discoverLinkBounds!.x + discoverLinkBounds!.width)
    ).toBeLessThanOrEqual(1);

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

    // The virtualized masonry re-renders its cells after the scroll, so a
    // matched cell can detach before it is measured. Measure against the feed
    // itself and retry until a connected post intersects it.
    let visibleFeedPostIndex = -1;
    await expect
      .poll(async () => {
        const profileFeedElement = await profileFeed.elementHandle();
        try {
          visibleFeedPostIndex = await feedPostButtons.evaluateAll(
            (buttons, feed) => {
              if (!feed?.isConnected) {
                return -1;
              }

              const feedRect = feed.getBoundingClientRect();
              return buttons.findIndex((button) => {
                const rect = button.getBoundingClientRect();
                return (
                  button.isConnected &&
                  rect.height > 0 &&
                  rect.bottom > feedRect.top &&
                  rect.top < feedRect.bottom
                );
              });
            },
            profileFeedElement
          );
        } finally {
          await profileFeedElement?.dispose();
        }
        return visibleFeedPostIndex;
      })
      .toBeGreaterThanOrEqual(0);
    const visibleFeedPost = feedPostButtons.nth(visibleFeedPostIndex);
    await visibleFeedPost.focus();
    // Chat treats serialNo as a one-time jump target and removes it from the
    // URL once mounted, sometimes within 100 ms of the navigation. Sampling
    // the address bar can miss that, so observe the committed navigation,
    // armed before Enter is pressed.
    await Promise.all([
      page.waitForURL(
        (url) =>
          /^\/waves\/[0-9a-f-]{36}$/i.test(url.pathname) &&
          Boolean(url.searchParams.get("serialNo")),
        { waitUntil: "commit", timeout: 20_000 }
      ),
      visibleFeedPost.press("Enter"),
    ]);
    // The cleanup keeps the pathname, so the current URL names the same wave.
    const openedWavePath = new URL(page.url()).pathname;
    expect(openedWavePath).toMatch(/^\/waves\/[0-9a-f-]{36}$/i);
    // Next syncs that removal into its router in a transition. A Back press
    // before the transition commits lets the router write the wave URL over
    // the feed entry, so let the wave consume the target and go idle first.
    await expectUrlState(
      page,
      (url) =>
        url.pathname === openedWavePath && !url.searchParams.has("serialNo")
    );
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          if (typeof globalThis.requestIdleCallback === "function") {
            globalThis.requestIdleCallback(() => resolve(), { timeout: 5_000 });
          } else {
            globalThis.setTimeout(resolve, 250);
          }
        })
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
    const { waveId, serialNo } = await getPublicChatMessageTarget(page);
    const wavePath = `/waves/${waveId}`;
    await test.info().attach("legacy-wave-message-target", {
      body: JSON.stringify({ waveId, serialNo }),
      contentType: "application/json",
    });
    // Observe both the redirect and the chat's target lookup before navigating.
    // Chat intentionally consumes serialNo; an address-bar check after hydration
    // races that cleanup and cannot prove which message was actually opened.
    await Promise.all([
      page.waitForURL(
        (url) =>
          url.pathname === wavePath &&
          !url.searchParams.has("wave") &&
          url.searchParams.get("serialNo") === serialNo,
        { waitUntil: "commit", timeout: 45_000 }
      ),
      page.waitForResponse(
        (response) => {
          const url = new URL(response.url());
          return (
            response.ok() &&
            url.pathname.endsWith(`/v2/waves/${waveId}/drops`) &&
            url.searchParams.get("serial_no_limit") === serialNo &&
            url.searchParams.get("search_strategy") === "FIND_BOTH"
          );
        },
        { timeout: RESPONSE_TIMEOUT_MS }
      ),
      gotoDocumentWithTransientRetry(
        page,
        `/waves?wave=${waveId}&serialNo=${serialNo}`
      ),
    ]);
    await expectUrlState(
      page,
      (url) =>
        url.pathname === wavePath &&
        !url.searchParams.has("wave") &&
        !url.searchParams.has("serialNo")
    );
    const target = page
      .getByRole("region", { name: "Wave chat file upload area", exact: true })
      .locator(`[data-serial-no="${serialNo}"]`);
    await expect(target).toBeVisible();
    await expect(target).toBeInViewport();
    await expectNoHorizontalOverflow(page);
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
      // Mobile section buttons contain labels; the count is in the content.
      await expect(statements).toHaveAccessibleName("ID Statements");
      await statements.click();
      await expect(statements).toHaveAttribute("aria-pressed", "true");
      await expect(
        page
          .getByRole("region", { name: /ID Statements$/ })
          .getByText(/^[0-9,]+ statements?$/)
      ).toBeVisible({ timeout: RESPONSE_TIMEOUT_MS });
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

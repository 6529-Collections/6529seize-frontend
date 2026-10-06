import type { Locator, Page } from "@playwright/test";
import { installSurfaceSimulation } from "../support/surfaceSimulation";
import {
  gotoDocumentWithTransientRetry,
  RESPONSE_TIMEOUT_MS,
} from "../support/routeReadiness";

import { EN_US_MESSAGES } from "../../i18n/messages/en-US";
import {
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
        await expect(
          page
            .getByRole("list", { name: "Leaderboard drops", exact: true })
            .or(page.getByText("No drops to show", { exact: true }))
        ).toBeVisible({ timeout: 30000 });
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
        await expect(page).toHaveURL((url) => url.pathname === "/waves");
      };
      await gotoReady(page, "/waves");
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
      await returnToWaves();
      const chatWave = await openWave(chatWaveName);
      expect(chatWave).not.toBe(mainStage);
      await expect(chat).toBeVisible({ timeout: 15000 });
      await section("Chat").click();
      await returnToWaves();
      expect(await openWave("The Memes - Main Stage")).toBe(mainStage);
      await expectLeaderboard();
      await page.screenshot({
        path: testInfo.outputPath(`remembered-${surface}-main-stage.png`),
        fullPage: true,
      });
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
      (response) => new URL(response.url()).pathname === "/api/settings"
    );
    await gotoReady(page, "/waves");
    const settings = await (await settingsResponse).json();
    expect(settings.memes_wave_id).toMatch(/^[0-9a-f-]{36}$/i);
    const leaderboardResponse = page.waitForResponse((response) => {
      const url = new URL(response.url());
      return (
        url.pathname ===
          `/api/v2/waves/${settings.memes_wave_id}/leaderboard` &&
        url.searchParams.get("sort") === "RANK"
      );
    });
    await gotoReady(page, `/waves/${settings.memes_wave_id}`);
    const navigation = page.getByRole("navigation", { name: "Wave sections" });
    await expect(
      navigation.getByRole("button", { name: /^(Chat|Leaderboard|Winners)$/ })
    ).toHaveText(["Chat", "Leaderboard", "Winners"]);
    await testInfo.attach("main-stage-chat-first-app-tabs", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    await navigation
      .getByRole("button", { name: "Leaderboard", exact: true })
      .click();
    const response = await leaderboardResponse;
    expect(response.ok()).toBe(true);
    const data = await response.json();
    expect(data.wave.id).toBe(settings.memes_wave_id);
    await testInfo.attach("main-stage-leaderboard-counts", {
      body: JSON.stringify({
        waveId: settings.memes_wave_id,
        route: new URL(page.url()).pathname,
        sort: "RANK",
        count: data.count,
        returned: data.drops.length,
        withMedia: data.drops.filter((drop: { media?: unknown[] }) =>
          Boolean(drop.media?.length)
        ).length,
      }),
      contentType: "application/json",
    });
    expect(data.count).toBeGreaterThanOrEqual(0);
    const artwork = data.drops.find((drop: { media?: unknown[] }) =>
      Boolean(drop.media?.length)
    );
    await page.getByRole("tab", { name: "Grid view", exact: true }).click();
    if (!artwork) {
      await expect(
        page.getByText("No drops to show", { exact: true })
      ).toBeVisible();
      await expect(
        page.getByRole("list", { name: "Leaderboard drops" })
      ).toHaveCount(0);
      return;
    }
    await expect(
      page.getByRole("list", { name: "Leaderboard drops" })
    ).toBeVisible();
    await expect(
      page
        .getByRole("list", { name: "Leaderboard drops" })
        .locator(`[data-leaderboard-drop-id="${artwork.id}"]`)
    ).toBeVisible();
    await expect(
      page.getByText("No drops to show", { exact: true })
    ).toHaveCount(0);
    await testInfo.attach("main-stage-app-leaderboard", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
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
    ).toBeVisible();
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
    ).toBeVisible();
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

    await expect(page).toHaveURL((url) => url.pathname === "/waves");
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
    ).toBeVisible();
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

    await expect(page).toHaveURL(
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
    await expect(page).toHaveURL(
      (url) =>
        /^\/waves\/[0-9a-f-]{36}$/i.test(url.pathname) &&
        Boolean(url.searchParams.get("serialNo"))
    );

    await page.goBack();
    await expect(page).toHaveURL(
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
    await expect(page).toHaveURL(
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
    await expect(page).toHaveURL((url) => url.pathname === `/waves/${waveId}`);
    await page.goBack();
    await expect(page).toHaveURL(
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
  }) => {
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
        await expect
          .poll(() =>
            description.evaluate((button) => {
              const preview = button.querySelector("span > span");
              const identity = button.parentElement;
              if (!preview || !identity) {
                return false;
              }
              const buttonBox = button.getBoundingClientRect();
              const identityBox = identity.getBoundingClientRect();
              const isTruncated = preview.scrollWidth > preview.clientWidth + 1;
              return (
                buttonBox.right <= identityBox.right + 1 &&
                (!isTruncated || button.querySelector("svg") !== null)
              );
            })
          )
          .toBe(true);
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
    const creationDate = page
      .getByRole("complementary", { name: "Wave details" })
      .locator("time[datetime]")
      .or(
        page
          .getByRole("dialog", { name: "Wave details" })
          .locator("time[datetime]")
      );
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

  test("renders the stable public profile shell read-only", async ({
    page,
  }) => {
    await gotoReady(page, `/${PROFILE_HANDLE}`);

    await expect(page).toHaveURL(
      (url) => url.pathname === `/${PROFILE_HANDLE}`
    );
    await expect(page).toHaveTitle(new RegExp(PROFILE_HANDLE, "i"));
    await expectProfileShell(page);
    await expectProfileTabLinks(page);
    const statements = page.getByRole("button", { name: /ID Statements/i });
    if (await statements.isVisible()) {
      await statements.click();
    }
    await expect(
      page.getByRole("link", { name: "Wallet Checker" })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Add another wallet" })
    ).toHaveCount(0);
  });

  for (const tab of PROFILE_TAB_PATHS) {
    test(`renders ${tab.path} read-only`, async ({ page }) => {
      await gotoReady(page, tab.path);

      await expect(page).toHaveURL((url) => url.pathname === tab.path);
      await expect(page).toHaveTitle(tab.title);
      await expectProfileShell(page, tab.activeTab);
      await expectProfileTabLinks(page);
    });
  }
});

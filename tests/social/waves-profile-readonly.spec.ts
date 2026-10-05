import type { Locator, Page } from "@playwright/test";
import { installSurfaceSimulation } from "../support/surfaceSimulation";

import { EN_US_MESSAGES } from "../../i18n/messages/en-US";
import { expect, test } from "../testHelpers";
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
  let href: string | null = null;
  await expect
    .poll(
      async () => {
        href = await waveList.locator('a[href^="/waves/"]').evaluateAll(
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
      { message: "Expected wave list to contain a wave detail link" }
    )
    .toBe(true);
  const pathname = href ? new URL(href, page.url()).pathname : "";
  const match = pathname.match(/^\/waves\/([^/]+)$/);

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
    for (const name of ["Leaderboard", "Chat", "Winners", "Outcome", "FAQ"]) {
      await expect(
        waveTabs.getByRole("tab", { name, exact: true })
      ).toBeAttached();
    }
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

    await gotoReady(page, `/waves?wave=${waveId}&serialNo=1`);

    const url = new URL(page.url());
    if (url.pathname === "/waves") {
      await expect(url.searchParams.get("wave")).toBe(waveId);
    } else {
      await expect(url.pathname).toBe(`/waves/${waveId}`);
      const serialNo = url.searchParams.get("serialNo");
      if (serialNo !== null) {
        await expect(serialNo).toBe("1");
      }
    }
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

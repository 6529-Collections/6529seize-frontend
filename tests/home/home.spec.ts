import {
  expect,
  expectNoHorizontalOverflow,
  test,
  waitForRouteReady,
} from "../testHelpers";
import { devices, type Page } from "@playwright/test";
import { buildSync } from "esbuild";
import { getAppEnvironment } from "../../config/appEnvironment";
import {
  isDesktopWebProject,
  isMobileWebProject,
} from "../support/surfaceSimulation";
import { gateSidebarHydration } from "../support/sidebarHydration";
import { installSectionTrackingFixture } from "../support/sectionTrackingFixture";
import { installReadonlyMutationGuard } from "../support/readonlyMutationGuard";
import { RESPONSE_TIMEOUT_MS } from "../support/routeReadiness";

const loadingTestArtwork = {
  id: 536,
  name: "Homepage loading test artwork",
  artist: "Test artist",
  artist_seize_handle: "",
  image: "https://6529.io/home-loading-fixture.png",
  scaled: "https://6529.io/home-loading-fixture.png",
  animation: null,
  floor_price: 0,
  collection: "The Memes",
  season: 1,
};

async function installLoadingTestArtwork(page: Page) {
  await page.route("**/home-loading-fixture.png", (route) =>
    route.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="#777"/></svg>',
    })
  );
  await page.route("https://rpc.walletconnect.org/**", (route) =>
    route.abort()
  );
}

const comingUpWave = {
  id: "00000000-0000-4000-8000-000000000529",
  name: "Coming Up fixture",
};
const comingUpSettings = { memes_wave_id: comingUpWave.id };
const comingUpLeaderboard = {
  wave: comingUpWave,
  count: 3,
  page: 1,
  next: false,
  drops: [1, 2, 3].map((rank) => ({
    id: `coming-up-${rank}`,
    serial_no: rank,
    title: `Coming Up artwork ${rank}`,
    drop_type: "SUBMISSION",
    created_at: 1,
    is_signed: false,
    hide_link_preview: false,
    parts_count: 1,
    boosts: 0,
    author: {
      id: "coming-up-artist",
      handle: "coming-up-artist",
      level: 1,
      primary_address: "0x0000000000000000000000000000000000000529",
      classification: "PSEUDONYM",
      badges: {},
    },
  })),
};
const comingUpLeaderboardPattern = (url: URL) =>
  /\/api\/v2\/waves\/[^/]+\/leaderboard$/.test(url.pathname) &&
  url.searchParams.get("page_size") === "3";

async function installComingUpFixture(page: Page) {
  await installLoadingTestArtwork(page);
  await page.route("**/api/settings", (route) =>
    route.fulfill({ json: comingUpSettings })
  );
  await page.route("**/api/memes_latest", (route) =>
    route.fulfill({ json: loadingTestArtwork })
  );
  await page.route("**/api/v2/waves/*/decisions?*", (route) =>
    route.fulfill({ json: { data: [], page: 1, count: 0, next: false } })
  );
}

for (const cardCount of [1, 3]) {
  test(`Coming Up sizes ${cardCount} cards for the available width @smoke @medium @large`, async ({
    page,
  }, testInfo) => {
    await installComingUpFixture(page);
    await page.route(comingUpLeaderboardPattern, (route) =>
      route.fulfill({
        json: {
          ...comingUpLeaderboard,
          count: cardCount,
          drops: comingUpLeaderboard.drops.slice(0, cardCount),
        },
      })
    );
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const carousel = page
      .getByRole("region", { name: "Coming up", exact: true })
      .locator(".tw-snap-x");
    await expect(
      carousel.getByRole("link", { name: /^Coming Up artwork / })
    ).toHaveCount(cardCount);
    const widths = isMobileWebProject(testInfo.project.name)
      ? [320, 639, 640, 767]
      : [1280];
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      const geometry = await carousel.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          available:
            element.clientWidth -
            Number.parseFloat(style.paddingLeft) -
            Number.parseFloat(style.paddingRight),
          card: element.firstElementChild!.getBoundingClientRect().width,
          overflow: element.scrollWidth - element.clientWidth,
        };
      });
      if (width < 768) {
        expect(geometry.card).toBeCloseTo(
          geometry.available * (cardCount === 1 && width < 640 ? 1 : 0.8),
          0
        );
        expect(geometry.overflow > 1).toBe(cardCount > 1);
      } else {
        expect(geometry.card).toBeLessThan(geometry.available / 2);
        expect(geometry.overflow).toBeLessThanOrEqual(1);
      }
      await expectNoHorizontalOverflow(page);
    }
    await carousel.scrollIntoViewIfNeeded();
    await carousel.screenshot({
      path: testInfo.outputPath(`coming-up-${cardCount}-cards.png`),
    });
  });
}

test("Coming Up keeps collaborator credits compact and accessible @smoke @medium @large", async ({
  page,
}, testInfo) => {
  await installComingUpFixture(page);
  const collaborators = Array.from({ length: 5 }, (_, index) => ({
    id: `credit-${index}`,
    handle: `collaborator-with-a-long-name-${index}`,
    display: `Collaborator ${index}`,
    pfp: loadingTestArtwork.image,
  }));
  await page.route("**/api/identities/credit-*", (route) =>
    route.fulfill({ status: 503, json: { error: "Unavailable" } })
  );
  await page.route(comingUpLeaderboardPattern, (route) =>
    route.fulfill({
      json: {
        ...comingUpLeaderboard,
        drops: comingUpLeaderboard.drops.map((drop, index) => ({
          ...drop,
          author: { ...drop.author, pfp: loadingTestArtwork.image },
          collaborators:
            index === 0 ? collaborators : collaborators.slice(0, 2 - index),
        })),
      },
    })
  );
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const section = page.getByRole("region", { name: "Coming up", exact: true });
  const more = section.getByRole("link", {
    name: "+3 more View all collaborators on this drop",
  });
  await expect(more).toHaveText("+3 more View all collaborators on this drop");
  await expect(more).toHaveAttribute(
    "href",
    `/waves/${comingUpWave.id}?drop=coming-up-1`
  );
  await more.scrollIntoViewIfNeeded();
  const layout = await more.evaluate((link) => {
    const credit = link.parentElement!.parentElement!.parentElement!;
    const stack = credit.firstElementChild!;
    const names = credit.lastElementChild!;
    const avatarBoxes = Array.from(stack.children).map((avatar) =>
      avatar.getBoundingClientRect().toJSON()
    );
    return {
      avatars: stack.querySelectorAll("img").length,
      avatarBoxes,
      stackRight: stack.getBoundingClientRect().right,
      namesLeft: names.getBoundingClientRect().left,
      overflow: credit.scrollWidth > credit.clientWidth,
      firstZ: getComputedStyle(stack.firstElementChild!).zIndex,
      secondZ: getComputedStyle(stack.children[1]!).zIndex,
      nameStyles: Array.from(names.querySelectorAll("a[title]")).map(
        (name) => ({
          ellipsis: getComputedStyle(name).textOverflow,
          whiteSpace: getComputedStyle(name).whiteSpace,
        })
      ),
    };
  });
  expect(layout.avatars).toBe(4);
  expect(layout.avatarBoxes[1]!.left).toBeLessThan(
    layout.avatarBoxes[0]!.right
  );
  expect(Number(layout.firstZ)).toBeGreaterThan(Number(layout.secondZ));
  expect(layout.namesLeft).toBeGreaterThan(layout.stackRight);
  expect(layout.overflow).toBe(false);
  for (const styles of layout.nameStyles) {
    expect(styles).toEqual({ ellipsis: "ellipsis", whiteSpace: "nowrap" });
  }
  if (isDesktopWebProject(testInfo.project.name)) {
    const artists = section.getByRole("link", {
      name: "coming-up-artist",
      exact: true,
    });
    await expect(artists.first()).toHaveCSS("color", "rgb(147, 147, 159)");
    await artists.first().hover();
    await expect(artists.first()).toHaveCSS("color", "rgb(206, 207, 212)");
    const soloArtistName = section
      .getByRole("link", { name: "coming-up-artist", exact: true })
      .nth(2)
      .locator("span");
    await expect(soloArtistName).toHaveCSS("color", "rgb(147, 147, 159)");
    for (const name of [artists.first(), soloArtistName]) {
      await expect(name).toHaveCSS("font-size", "14px");
      await expect(name).toHaveCSS("font-weight", "500");
    }
    await artists.nth(2).hover();
    await expect(soloArtistName).toHaveCSS("color", "rgb(255, 255, 255)");
  }
  await more.focus();
  await expect(more).toBeFocused();
  await expectNoHorizontalOverflow(page);
  await section.screenshot({
    path: testInfo.outputPath("collaborator-credits.png"),
  });
});

for (const hasBoostedDrops of [false, true]) {
  test(`Coming Up loads while boosted cards are pending, with ${hasBoostedDrops ? "populated" : "empty"} results @smoke @medium @large`, async ({
    page,
  }) => {
    await installComingUpFixture(page);
    await page.route(comingUpLeaderboardPattern, (route) =>
      route.fulfill({ json: comingUpLeaderboard })
    );
    const previewUrl = "https://example.com/boosted-startup-preview";
    const boostedDrop = {
      ...comingUpLeaderboard.drops[0],
      id: "boosted-startup",
      serial_no: 42,
      drop_type: "CHAT",
      boosts: 5,
      content: previewUrl,
      wave: comingUpWave,
      moderation: { status: "VISIBLE", can_view: true },
    };
    const boostedReady = Promise.withResolvers<void>();
    await page.route("**/api/v2/boosted-drops?*", async (route) => {
      await boostedReady.promise;
      await route.fulfill({
        json: {
          data: hasBoostedDrops ? [boostedDrop] : [],
          page: 1,
          count: hasBoostedDrops ? 1 : 0,
          next: false,
        },
      });
    });
    await page.route("**/api/open-graph*", (route) =>
      route.fulfill({ status: 503, json: {} })
    );

    try {
      await page.goto("/", { waitUntil: "domcontentloaded" });
      const comingUp = page.getByRole("region", {
        name: "Coming up",
        exact: true,
      });
      await expect(
        comingUp.getByRole("link", { name: "Coming Up artwork 3", exact: true })
      ).toBeVisible();
      await expect(page.getByText("Loading...", { exact: true })).toBeVisible();

      boostedReady.resolve();
      await expect(page.getByText("Loading...", { exact: true })).toHaveCount(
        0
      );
      if (!hasBoostedDrops) {
        await expect(
          page.getByText("Boosted Drops", { exact: true })
        ).toHaveCount(0);
        return;
      }

      const openDrop = page.getByRole("button", {
        name: "Open boosted drop from coming-up-artist",
        exact: true,
      });
      await expect(openDrop).toBeVisible();
      await expect(
        page.getByRole("link", {
          name: "example.com example.com/boosted-startup-preview",
          exact: true,
        })
      ).toHaveAttribute("href", previewUrl);
      await expectNoHorizontalOverflow(page);
      // The preview is its own link; use the card's keyboard action to open the drop.
      await openDrop.focus();
      // Navigation includes cold route compilation in the development CI server.
      await Promise.all([
        page.waitForURL(
          new RegExp(`/waves/${comingUpWave.id}\\?serialNo=42$`),
          { waitUntil: "domcontentloaded" }
        ),
        openDrop.press("Enter"),
      ]);
    } finally {
      boostedReady.resolve();
    }
  });
}

test("Coming Up retains cards across navigation and a failed refresh @smoke @medium @large", async ({
  page,
}) => {
  await page.clock.install();
  await installComingUpFixture(page);
  let requests = 0;
  let failing = false;
  await page.route(comingUpLeaderboardPattern, (route) => {
    requests += 1;
    return failing
      ? route.fulfill({
          status: 503,
          json: { error: "Temporarily unavailable" },
        })
      : route.fulfill({ json: comingUpLeaderboard });
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const comingUp = page.getByRole("region", { name: "Coming up", exact: true });
  await expect(
    comingUp.getByRole("link", { name: "Coming Up artwork 3", exact: true })
  ).toBeVisible();
  expect(requests).toBe(1);

  await Promise.all([
    page.waitForURL(/\/join-6529$/, { waitUntil: "domcontentloaded" }),
    page.getByRole("link", { name: "Start here", exact: true }).click(),
  ]);
  await page.goBack();
  await expect(
    comingUp.getByRole("link", { name: "Coming Up artwork 3", exact: true })
  ).toBeVisible();
  expect(requests).toBe(1);

  await Promise.all([
    page.waitForURL(/\/join-6529$/, { waitUntil: "domcontentloaded" }),
    page.getByRole("link", { name: "Start here", exact: true }).click(),
  ]);
  await page.clock.fastForward(61_000);
  failing = true;
  const failedRefresh = page.waitForResponse(
    (response) =>
      comingUpLeaderboardPattern(new URL(response.url())) &&
      response.status() === 503
  );
  await page.goBack();
  await failedRefresh;
  await expect(
    comingUp.getByRole("link", { name: "Coming Up artwork 3", exact: true })
  ).toBeVisible();
  await expect(comingUp.getByRole("alert")).toHaveCount(0);
  await expect(
    comingUp.getByRole("button", { name: "Try again", exact: true })
  ).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
});

for (const slowEndpoint of ["leaderboard", "settings"] as const) {
  test(`Coming Up accepts ${slowEndpoint} responses after 15 seconds @smoke @medium @large`, async ({
    page,
  }) => {
    await page.clock.install();
    await installComingUpFixture(page);
    let requests = 0;
    let releaseResponse!: () => void;
    const responseReady = new Promise<void>((resolve) => {
      releaseResponse = resolve;
    });
    await page.route(comingUpLeaderboardPattern, async (route) => {
      if (slowEndpoint === "leaderboard") {
        requests += 1;
        await responseReady;
      }
      await route.fulfill({ json: comingUpLeaderboard });
    });
    if (slowEndpoint === "settings") {
      await page.route("**/api/settings", async (route) => {
        requests += 1;
        await responseReady;
        await route.fulfill({ json: comingUpSettings });
      });
    }
    try {
      await page.goto("/", { waitUntil: "domcontentloaded" });
      const comingUp = page.getByRole("region", {
        name: "Coming up",
        exact: true,
      });
      await expect.poll(() => requests).toBe(1);
      await page.clock.fastForward(20_000);
      if (slowEndpoint === "leaderboard") {
        await expect(comingUp.getByRole("status")).toHaveText(
          "Loading upcoming artwork…"
        );
      } else {
        await expect(comingUp).toHaveCount(0);
      }
      await expect(comingUp.getByRole("alert")).toHaveCount(0);
      await expect(
        comingUp.getByRole("button", { name: "Try again", exact: true })
      ).toHaveCount(0);
      expect(requests).toBe(1);
      releaseResponse();
      await expect(
        comingUp.getByRole("link", { name: "Coming Up artwork 3", exact: true })
      ).toBeVisible();
      await expect(comingUp.getByRole("status")).toHaveCount(0);
      expect(requests).toBe(1);
      await expectNoHorizontalOverflow(page);
    } finally {
      releaseResponse();
    }
  });
}

test("Coming Up does not mislabel the current artwork while Latest Drop is delayed @smoke @medium @large", async ({
  page,
}) => {
  await installComingUpFixture(page);
  await page.route(comingUpLeaderboardPattern, (route) =>
    route.fulfill({ json: comingUpLeaderboard })
  );
  await page.route("**/api/v2/waves/*/decisions?*", (route) =>
    route.fulfill({
      json: {
        page: 1,
        count: 1,
        next: false,
        data: [
          {
            decision_time: 1,
            winners: [
              {
                place: 1,
                awards: [],
                drop: {
                  ...comingUpLeaderboard.drops[0],
                  title: loadingTestArtwork.name,
                },
              },
            ],
          },
        ],
      },
    })
  );
  let releaseArtwork!: () => void;
  const artworkReady = new Promise<void>((resolve) => {
    releaseArtwork = resolve;
  });
  await page.route("**/api/memes_latest", async (route) => {
    await artworkReady;
    await route.fulfill({ json: loadingTestArtwork });
  });
  try {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const comingUp = page.getByRole("region", {
      name: "Coming up",
      exact: true,
    });
    await expect(
      comingUp.getByRole("link", { name: "Coming Up artwork 3", exact: true })
    ).toBeVisible();
    await expect(comingUp.getByText("NEXT MINT", { exact: true })).toHaveCount(
      0
    );
    releaseArtwork();
    await expect(
      page.getByRole("link", { name: loadingTestArtwork.name, exact: true })
    ).toBeVisible();
    await expect(comingUp.getByText("NEXT MINT", { exact: true })).toHaveCount(
      0
    );
    await expect(
      comingUp.getByRole("link", { name: "Coming Up artwork 3", exact: true })
    ).toBeVisible();
  } finally {
    releaseArtwork();
  }
});

test("homepage artwork survives slow settings and failed mint status @smoke @medium @large", async ({
  page,
}) => {
  await installLoadingTestArtwork(page);
  await page.route("**/api/memes_latest", (route) =>
    route.fulfill({ json: loadingTestArtwork })
  );
  let releaseSettings!: () => void;
  const settingsReady = new Promise<void>((resolve) => {
    releaseSettings = resolve;
  });
  await page.route("**/api/settings", async (route) => {
    await settingsReady;
    await route.fallback();
  });
  try {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const artwork = page
      .getByRole("main")
      .locator('[data-home-section="Latest drop"]');
    await expect(
      artwork.getByRole("link", { name: loadingTestArtwork.name, exact: true })
    ).toBeVisible();
    const image = artwork.getByRole("img", {
      name: loadingTestArtwork.name,
      exact: true,
    });
    await expect(image).toBeVisible();
    await expect
      .poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth))
      .toBeGreaterThan(0);
    releaseSettings();
    await expect(
      artwork.getByText("Unavailable", { exact: true }).first()
    ).toBeVisible({ timeout: RESPONSE_TIMEOUT_MS });
    await expect(image).toBeVisible();
    await expectNoHorizontalOverflow(page);
  } finally {
    releaseSettings();
  }
});

test("homepage artwork request has a visible failure and retry @smoke @medium @large", async ({
  page,
}) => {
  await installLoadingTestArtwork(page);
  let failing = true;
  await page.route("**/api/memes_latest", (route) =>
    failing
      ? route.fulfill({
          status: 503,
          json: { error: "Temporarily unavailable" },
        })
      : route.fulfill({ json: loadingTestArtwork })
  );
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "We couldn’t load the latest artwork." })
  ).toBeVisible({ timeout: RESPONSE_TIMEOUT_MS });
  failing = false;
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(
    page.getByRole("link", { name: loadingTestArtwork.name, exact: true })
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Try again", exact: true })
  ).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
});

test.describe("Home Page @smoke @medium @large", () => {
  test.beforeEach(async ({ page }) => {
    // Layout and hover assertions must not depend on a live voting round.
    await installComingUpFixture(page);
    await page.route(comingUpLeaderboardPattern, (route) =>
      route.fulfill({ json: comingUpLeaderboard })
    );
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await waitForRouteReady(page);
  });

  test("should display the home landing content", async ({ page }) => {
    // Prod serves "6529.io"; staging serves "6529 Staging".
    await expect(page).toHaveTitle(/^6529(\.io| Staging)$/);
    await expectNoHorizontalOverflow(page);

    await expect(page.getByText(/^(Latest|Next) Drop$/)).toBeVisible();
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Building a decentralized network state",
      })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        level: 2,
        name: "6529 is a network society",
      })
    ).toBeVisible();

    const waveLink = page.getByRole("link", { name: /^View wave / }).first();
    await expect(waveLink).toBeVisible({ timeout: RESPONSE_TIMEOUT_MS });

    const imageArea = page
      .getByRole("link", { name: /^View wave / })
      .first()
      .locator(":scope > div")
      .first();
    const details = page
      .getByRole("link", { name: /^View wave / })
      .first()
      .locator(":scope > div")
      .last();
    const imageBox = await imageArea.boundingBox();
    const detailsBox = await details.boundingBox();
    if (!imageBox || !detailsBox) {
      throw new Error(
        "The wave card image and details must have visible bounds"
      );
    }

    if (await page.evaluate(() => globalThis.innerWidth < 768)) {
      expect(imageBox.x + imageBox.width).toBeLessThanOrEqual(detailsBox.x);
      expect(imageBox.y).toBeCloseTo(detailsBox.y, 1);
      expect(imageBox.height).toBeCloseTo(detailsBox.height, 1);
    } else {
      expect(imageBox.y + imageBox.height).toBeLessThanOrEqual(detailsBox.y);
    }

    // Activity belongs under the title; the scores stay at the card bottom
    // even when a description takes fewer lines than its neighbors.
    for (const card of await page
      .getByRole("link", { name: /^View wave / })
      .all()) {
      const layout = await card.evaluate((element) => {
        const body = element.lastElementChild!;
        const [title, activity, description, metrics] = Array.from(
          body.children
        );
        return {
          title: title!.getBoundingClientRect().toJSON(),
          activity: activity!.getBoundingClientRect().toJSON(),
          description: description!.getBoundingClientRect().toJSON(),
          metrics: metrics!.getBoundingClientRect().toJSON(),
          body: body.getBoundingClientRect().toJSON(),
          paddingBottom: Number.parseFloat(
            getComputedStyle(body).paddingBottom
          ),
        };
      });
      expect(layout.activity.top).toBeGreaterThanOrEqual(layout.title.bottom);
      expect(layout.description.top).toBeGreaterThanOrEqual(
        layout.activity.bottom
      );
      expect(layout.metrics.top).toBeGreaterThanOrEqual(
        layout.description.bottom
      );
      expect(layout.body.bottom - layout.metrics.bottom).toBeCloseTo(
        layout.paddingBottom,
        0
      );
    }

    const comingUp = page.getByRole("region", {
      name: "Coming up",
      exact: true,
    });
    await expect(comingUp).toBeVisible({ timeout: RESPONSE_TIMEOUT_MS });
    const isNarrowViewport = await page.evaluate(() => innerWidth < 768);
    const viewportWidth = await page.evaluate(() => innerWidth);
    let sectionTitleSize = "24px";
    if (viewportWidth < 768) sectionTitleSize = "20px";
    else if (viewportWidth < 1024) sectionTitleSize = "22px";
    await expect(page.getByText(/^(Latest|Next) Drop$/)).toHaveCSS(
      "font-size",
      sectionTitleSize
    );
    await expect(page.getByText(/^(Latest|Next) Drop$/)).toHaveCSS(
      "margin-bottom",
      "20px"
    );
    // Both section actions belong in the header and must leave the title clear.
    for (const section of [
      comingUp,
      page
        .getByRole("heading", { name: "Tired of bot replies?", exact: true })
        .locator('xpath=ancestor::*[@data-home-section="Explore waves"]'),
    ]) {
      await expect(
        section.getByRole("link", { name: "View all", exact: true })
      ).toHaveCount(1);
      await expect(section.getByRole("heading", { level: 2 })).toHaveCSS(
        "font-size",
        sectionTitleSize
      );
      const subtitle = section
        .getByRole("heading", { level: 2 })
        .locator("xpath=following-sibling::p");
      await expect(subtitle).toHaveCSS("font-size", "14px");
      await expect(subtitle).toHaveCSS("margin-top", "4px");
      await expect(
        section.getByRole("heading", { level: 2 }).locator("../..")
      ).toHaveCSS("margin-bottom", "20px");
      expect(
        await section.evaluate((section) => {
          const heading = section.querySelector("h2");
          const link = section.querySelector('[data-home-action="View all"]');
          if (!heading || !link) return false;
          if (link.parentElement !== heading.parentElement?.parentElement)
            return false;
          const range = document.createRange();
          range.selectNodeContents(heading);
          const linkBox = link.getBoundingClientRect();
          return Array.from(range.getClientRects()).every(
            (textBox) =>
              textBox.right <= linkBox.left ||
              textBox.bottom <= linkBox.top ||
              textBox.left >= linkBox.right ||
              textBox.top >= linkBox.bottom
          );
        })
      ).toBe(true);

      if (isNarrowViewport) {
        const subtitleGap = await section.evaluate((section) => {
          const subtitle = section.querySelector("p")!;
          const link = section.querySelector('[data-home-action="View all"]')!;
          return (
            subtitle.getBoundingClientRect().top -
            link.getBoundingClientRect().bottom
          );
        });
        // The requested compact header uses a 4px subtitle gap; the action
        // remains contained within the title row rather than hanging below it.
        expect(subtitleGap).toBeGreaterThanOrEqual(4);
      }
    }

    if (isNarrowViewport) {
      const carousel = page
        .getByRole("region", { name: "Coming up", exact: true })
        .locator(".tw-snap-x");
      const cards = page
        .getByRole("region", { name: "Coming up", exact: true })
        .locator(".tw-snap-x > div");
      if ((await cards.count()) > 1) {
        // A directional scroll beyond the next card must stop at that card,
        // instead of skipping it. Check both forward and backward movement.
        const nextCardOffset = await carousel.evaluate((element) => {
          const first = element.children[0]!.getBoundingClientRect();
          const second = element.children[1]!.getBoundingClientRect();
          element.scrollBy({
            left: element.clientWidth * 2,
            behavior: "instant",
          });
          return Math.min(
            second.left - first.left,
            element.scrollWidth - element.clientWidth
          );
        });
        await expect
          .poll(() => carousel.evaluate((element) => element.scrollLeft))
          .toBeCloseTo(nextCardOffset, 0);
        await carousel.evaluate((element) => {
          element.scrollBy({
            left: -element.clientWidth * 2,
            behavior: "instant",
          });
        });
        await expect
          .poll(() => carousel.evaluate((element) => element.scrollLeft))
          .toBe(0);
      }
    }

    const footer = page
      .getByRole("link", { name: "Terms of Service", exact: true })
      .locator("xpath=ancestor::footer");
    await footer.scrollIntoViewIfNeeded();
    await expect(
      footer.getByRole("link", { name: "Terms of Service" })
    ).toBeVisible();
    expect(
      await footer.evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        const links = Array.from(element.querySelectorAll("a"), (link) =>
          link.getBoundingClientRect()
        );
        return links.every(
          (box, index) =>
            box.left >= bounds.left &&
            box.right <= bounds.right &&
            links
              .slice(index + 1)
              .every(
                (other) =>
                  box.right <= other.left ||
                  box.left >= other.right ||
                  box.bottom <= other.top ||
                  box.top >= other.bottom
              )
        );
      })
    ).toBe(true);
    await expectNoHorizontalOverflow(page);
  });

  test("keeps a countdown with days inside the original timer height", async ({
    page,
  }, testInfo) => {
    if (isMobileWebProject(testInfo.project.name)) {
      await page.setViewportSize({ width: 320, height: 800 });
    }
    // Use the real component and app CSS with a deterministic duration. This
    // checks the longest timer layout independently of the live mint phase.
    const styles = await page
      .locator("head")
      .evaluate((head) =>
        Array.from(
          head.querySelectorAll('link[rel="stylesheet"]'),
          (link) => link.outerHTML
        ).join("")
      );
    const fixtureUrl = new URL("/__countdown-layout-fixture", page.url()).href;
    await page.route(fixtureUrl, (route) =>
      route.fulfill({
        contentType: "text/html",
        body: `<html><head><meta name="viewport" content="width=device-width, initial-scale=1">${styles}</head><body>
        <main class="tailwind-scope" style="width:calc(100% - 64px);max-width:384px;margin:32px auto">
          <div id="countdown-fixture"></div>
        </main>
      </body></html>`,
      })
    );
    await page.goto(fixtureUrl);
    const script = buildSync({
      stdin: {
        resolveDir: process.cwd(),
        contents: `
          import { createElement } from 'react';
          import { createRoot } from 'react-dom/client';
          import Countdown from './components/home/now-minting/NowMintingCountdownActive';
          createRoot(document.getElementById('countdown-fixture')).render(
            createElement(Countdown, { countdown: {
              title: 'Phase 0 (Allowlist) Starts In',
              targetDate: Math.floor(Date.now() / 1000) + 12 * 86400 + 23 * 3600 + 59 * 60 + 59,
              showAllowlistInfo: true,
              showMintBtn: false,
              isActive: false
            } })
          );
        `,
      },
      bundle: true,
      format: "iife",
      jsx: "automatic",
      define: { "process.env.NODE_ENV": '"production"', "process.env": "{}" },
      write: false,
    });
    await page.addScriptTag({ content: script.outputFiles[0]!.text });
    const timer = page.getByRole("timer");
    await expect(timer).toHaveText(/^12d : 23h : 59m : \d{2}s$/);
    await expect(timer).toHaveCSS(
      "font-size",
      (await page.evaluate(() => innerWidth < 768)) ? "20px" : "24px"
    );
    await page.evaluate(() => document.fonts.ready);
    const bounds = await timer.evaluate((element) => ({
      timer: element.getBoundingClientRect().toJSON(),
      box: element
        .parentElement!.parentElement!.getBoundingClientRect()
        .toJSON(),
    }));
    expect(bounds.box.height).toBe(56);
    expect(bounds.timer.left).toBeGreaterThanOrEqual(bounds.box.left);
    expect(bounds.timer.right).toBeLessThanOrEqual(bounds.box.right);
    expect(bounds.timer.top).toBeGreaterThanOrEqual(bounds.box.top);
    expect(bounds.timer.bottom).toBeLessThanOrEqual(bounds.box.bottom);
    await expectNoHorizontalOverflow(page);
    await page.screenshot({ path: testInfo.outputPath("countdown-days.png") });
  });

  test("should expose the network health route", async ({ page }) => {
    const healthLink = page.getByRole("link", {
      name: "Open network health dashboard",
    });

    await expect(healthLink).toBeVisible();
    await expect(healthLink).toHaveAttribute("href", "/network/health");
  });

  test("keeps homepage hover feedback subtle and respects reduced motion", async ({
    page,
  }, testInfo) => {
    const waveLink = page.getByRole("link", { name: /^View wave / }).first();
    await expect(waveLink).toBeVisible({ timeout: RESPONSE_TIMEOUT_MS });
    const comingUp = page.getByRole("region", {
      name: "Coming up",
      exact: true,
    });
    const viewAll = comingUp.getByRole("link", {
      name: "View all",
      exact: true,
    });
    const arrow = page
      .getByRole("region", { name: "Coming up", exact: true })
      .getByRole("link", { name: "View all", exact: true })
      .locator("svg");
    const secondaryActions = page
      .getByRole("button", { name: "Connect wallet", exact: true })
      .or(page.getByRole("link", { name: "View all", exact: true }));
    await expect(secondaryActions).toHaveCount(3);
    const isNarrowViewport = await page.evaluate(() => innerWidth < 768);
    for (const action of await secondaryActions.all()) {
      const isViewAll =
        (await action.getAttribute("data-home-action")) === "View all";
      const isMobileViewAllLink = isNarrowViewport && isViewAll;
      const borderOpacity = isViewAll ? 0.15 : 0.2;
      if (isMobileViewAllLink) {
        await expect(action).toHaveCSS("border-width", "0px");
        await expect(action).toHaveCSS("height", "28px");
      } else {
        await expect(action).toHaveCSS("border-width", "1px");
        await expect(action).toHaveCSS(
          "border-color",
          `rgba(255, 255, 255, ${borderOpacity})`
        );
      }
      await expect(action).toHaveCSS(
        "background-color",
        isMobileViewAllLink ? "rgba(0, 0, 0, 0)" : "rgba(255, 255, 255, 0.04)"
      );
    }

    await page.emulateMedia({ reducedMotion: "no-preference" });
    if (isDesktopWebProject(testInfo.project.name)) {
      const dropTitle = page.getByRole("link", {
        name: loadingTestArtwork.name,
        exact: true,
      });
      await expect(dropTitle).toBeVisible();
      await dropTitle.hover();
      await expect(dropTitle).toHaveCSS("color", "rgb(206, 207, 212)");

      const comingUpTitle = comingUp.getByRole("link", {
        name: "Coming Up artwork 1",
        exact: true,
      });
      await comingUpTitle.hover();
      await expect(comingUpTitle).toHaveCSS("color", "rgb(206, 207, 212)");

      await waveLink.scrollIntoViewIfNeeded();
      const before = await waveLink.boundingBox();
      await waveLink.hover();
      await expect(waveLink).toHaveCSS(
        "border-color",
        "rgba(255, 255, 255, 0.2)"
      );
      await expect(waveLink).toHaveCSS("transform", "none");
      await expect(waveLink.getByRole("img")).toHaveCSS("transform", "none");
      expect(await waveLink.boundingBox()).toEqual(before);

      await viewAll.hover();
      await expect(arrow).toHaveCSS("transform", "matrix(1, 0, 0, 1, 2, 0)");

      for (const action of await secondaryActions.all()) {
        await action.hover();
        await expect(action).toHaveCSS(
          "border-color",
          "rgba(255, 255, 255, 0.3)"
        );
        await expect(action).toHaveCSS(
          "background-color",
          "rgba(255, 255, 255, 0.08)"
        );
      }
    }

    await page.keyboard.press("Tab");
    await viewAll.focus();
    await expect(viewAll).toBeFocused();
    await expect(viewAll).not.toHaveCSS("box-shadow", "none");
    await expect(arrow).toHaveCSS("transform", "matrix(1, 0, 0, 1, 2, 0)");

    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(arrow).toHaveCSS("transform", "none");
    await expect(arrow).toHaveCSS("transition-property", "none");
    await expect(viewAll).toHaveCSS("transition-property", "none");
    await expect(waveLink).toHaveCSS("transition-property", "none");
    await expect(viewAll).not.toHaveCSS("box-shadow", "none");
    await expectNoHorizontalOverflow(page);
  });

  if (process.env["PLAYWRIGHT_ENV"] === "production") {
    test("does not render an environment badge in production", async ({
      page,
    }) => {
      await expect(page.locator('[aria-label^="Environment:"]')).toHaveCount(0);
    });
  }
});

test("mobile web starts with its header and full-width content before hydration @smoke @medium @large", async ({
  browser,
  browserName,
  baseURL,
  context: authenticatedContext,
}, testInfo) => {
  // Phone emulation supports Chromium/WebKit. Native simulations exercise a
  // different shell and Firefox has no supported mobile device context.
  test.skip(
    browserName === "firefox" ||
      (!isDesktopWebProject(testInfo.project.name) &&
        !isMobileWebProject(testInfo.project.name)),
    "Mobile browser startup contract"
  );
  if (!baseURL) throw new Error("The homepage test requires a base URL");
  // The PR smoke lane selects desktop Chromium. A separate phone context keeps
  // this mobile first-paint contract in that lane without expanding its pack.
  const context = await browser.newContext({
    ...devices[browserName === "webkit" ? "iPhone 14" : "Pixel 7"],
    baseURL,
    // Preserve fixture-seeded staging access without navigating or hydrating
    // before the first-paint assertions.
    storageState: await authenticatedContext.storageState(),
  });
  const guard = await installReadonlyMutationGuard(context, baseURL);
  const page = await context.newPage();
  const hydration = await gateSidebarHydration(page);
  const main = page.getByRole("main").first();
  const header = page.getByRole("banner");
  const sidebar = page.getByLabel("Primary sidebar", { exact: true });
  try {
    await page.goto("/", { waitUntil: "commit" });
    await expect(page.locator("html")).toHaveAttribute(
      "data-small-web-startup",
      "true"
    );
    await expect(page.getByRole("main").first().locator("..")).toHaveAttribute(
      "data-small",
      "false"
    );
    await expect(header).toBeVisible();
    await expect(header).toHaveAttribute("aria-busy", "true");
    await expect(
      page.getByRole("status", { name: "Loading navigation…" })
    ).toBeVisible();
    await expect(
      header.getByRole("button", { name: "Open menu" })
    ).toBeDisabled();
    await expect(sidebar).toBeHidden();
    const initial = await main.boundingBox();
    expect(initial?.x).toBe(0);
    expect(initial?.width).toBe(await page.evaluate(() => innerWidth));
    await expectNoHorizontalOverflow(page);
    await hydration.waitForDownloads();
    hydration.release();
    await hydration.waitForReady();
    await expect(page.getByRole("main").first().locator("..")).toHaveAttribute(
      "data-small",
      "true"
    );
    await expect(page.locator("html")).not.toHaveAttribute(
      "data-small-web-startup",
      "true"
    );
    await expect(header).toBeVisible();
    await expect(header).toHaveAttribute("aria-busy", "false");
    await expect(header.getByRole("status")).toHaveCount(0);
    await expect(
      header.getByRole("button", { name: "Open menu" })
    ).toBeEnabled();
    await expect(sidebar).toBeHidden();
    const hydrated = await main.boundingBox();
    expect(hydrated?.x).toBe(initial?.x);
    expect(hydrated?.width).toBe(initial?.width);
  } finally {
    hydration.release();
    await hydration.attachEvidence(testInfo);
    await context.close();
    guard.assertNoBlockedRequests();
  }
});

test("homepage tracking follows nested scrolling and loaded sections @smoke @medium @large", async ({
  page,
}) => {
  // Exercise the production observer with real browser geometry, without
  // contacting Mixpanel or requiring production analytics configuration.
  const { seen, clicked } = await installSectionTrackingFixture(
    page,
    `
    <main aria-label="Homepage test" style="height:240px;overflow:auto">
      <section data-home-section="Introduction" style="height:180px">
        <h1>Introduction</h1>
      </section>
      <div style="height:700px"></div>
      <section aria-label="Loading section" style="height:180px">
        <button data-home-action="Open wave">Open wave</button>
      </section>
    </main>
  `,
    `
        import { observeHomepageSections, getHomepageClick } from './components/home/homepageTracking';
        const root = document.querySelector('main');
        observeHomepageSections(root, section => append('Sections seen', section), new Set());
        root.addEventListener('click', event => {
          const click = getHomepageClick(root, event.target);
          if (click) append('Actions clicked', click.section + ': ' + click.action);
        }, true);
        root.querySelector('button').addEventListener('click', event => event.stopPropagation());
      `
  );
  await expect(seen).toHaveText(["Introduction"]);
  const loading = page.getByRole("region", { name: "Loading section" });
  await loading.scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "Open wave", exact: true }).click();
  await expect(clicked).toHaveCount(0);
  await loading.evaluate((element) =>
    element.setAttribute("data-home-section", "Explore waves")
  );
  await expect(seen).toHaveText(["Introduction", "Explore waves"]);
  await page.getByRole("button", { name: "Open wave", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(clicked).toHaveText(["Explore waves: Open wave"]);
  await page
    .getByRole("heading", { name: "Introduction" })
    .scrollIntoViewIfNeeded();
  await expect(seen).toHaveText(["Introduction", "Explore waves"]);
});

test("desktop account updates do not move utilities, including in short expanded sidebars @smoke @medium @large", async ({
  page,
}, testInfo) => {
  // Mobile uses its own drawer; this checks persistent desktop sidebar geometry.
  test.skip(
    !isDesktopWebProject(testInfo.project.name),
    "Desktop sidebar geometry contract"
  );
  let releaseVersion!: () => void;
  const versionReady = new Promise<void>((resolve) => {
    releaseVersion = resolve;
  });
  await page.route("**/api/version", async (route) => {
    await versionReady;
    await route.fulfill({ json: { stale: true } });
  });
  try {
    const response = await page.goto("/about", {
      waitUntil: "domcontentloaded",
    });
    const environment = getAppEnvironment(page.url());
    const serverHtml = await response!.text();
    if (environment.badge) {
      expect(serverHtml).toContain(
        `aria-label="Environment: ${environment.badge} (${environment.host})"`
      );
    } else {
      expect(serverHtml).not.toContain('aria-label="Environment:');
    }
    const sidebar = page.getByLabel("Primary sidebar", { exact: true });
    const search = sidebar.getByRole("button", {
      name: "Search",
      exact: true,
    });
    const account = page
      .getByLabel("Primary sidebar", { exact: true })
      .locator("[data-sidebar-account]");
    await expect(account).toHaveAttribute("data-sidebar-account", "signed-out");
    await expect(search).toBeVisible();
    const beforeSearch = await search.boundingBox();
    const beforeAccount = await account.boundingBox();
    expect(beforeSearch).not.toBeNull();
    expect(beforeAccount).not.toBeNull();
    // Search is usable even though update availability is unresolved.
    await search.click();
    await expect(
      page.getByRole("combobox", { name: "Search 6529", exact: true })
    ).toBeVisible();
    await page.keyboard.press("Escape");
    releaseVersion();
    const update = sidebar.getByRole("button", {
      name: "Update",
      exact: true,
    });
    await expect(update).toBeVisible();
    const updateContent = sidebar
      .getByRole("button", { name: "Update", exact: true })
      .locator(":scope > div");
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await expect(updateContent).toHaveCSS("animation-duration", "0.125s");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(updateContent).toHaveCSS("animation-name", "none");
    await expect(updateContent).toHaveCSS("opacity", "1");
    expect(await search.boundingBox()).toEqual(beforeSearch);
    expect(await account.boundingBox()).toEqual(beforeAccount);
    await expect(
      page
        .getByLabel("Primary sidebar", { exact: true })
        .locator('[data-sidebar-section="utilities"]')
        .getByRole("button", { name: "Update", exact: true })
    ).toBeVisible();

    await page.setViewportSize({ width: 1440, height: 460 });
    const sidebarToggle = sidebar.getByRole("button", {
      name: "Toggle right sidebar",
    });
    const logo = sidebar.getByRole("img", { name: "6529Seize" });
    await search.blur();
    await page.mouse.move(1000, 400);
    await expect(sidebarToggle).toHaveCSS("opacity", "0");
    // Hovering a distant menu control reveals the header toggle too.
    await search.hover();
    await expect(sidebarToggle).toHaveCSS("opacity", "1");
    const railBox = await sidebar.boundingBox();
    const toggleBox = await sidebarToggle.boundingBox();
    expect(railBox).not.toBeNull();
    expect(toggleBox).not.toBeNull();
    expect(toggleBox!.x + toggleBox!.width).toBeLessThanOrEqual(
      railBox!.x + railBox!.width
    );
    expect(toggleBox!.width).toBe(20);
    expect(toggleBox!.y + toggleBox!.height / 2).toBeCloseTo(
      railBox!.y + railBox!.height / 2,
      0
    );
    const about = sidebar.getByRole("button", { name: "About", exact: true });
    await about.hover();
    await expect(
      page.getByRole("navigation", { name: "About sub-navigation" })
    ).toBeVisible();
    await expect(sidebarToggle).toBeHidden();
    await page.keyboard.press("Escape");
    await search.hover();
    await expect(sidebarToggle).toBeVisible();
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await logo.hover();
    await expect(logo).not.toHaveCSS("box-shadow", "none");
    await expect(logo).not.toHaveCSS("transform", "none");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(logo).toHaveCSS("transform", "none");
    await page.mouse.move(1000, 400);
    await sidebarToggle.focus();
    await expect(sidebarToggle).toHaveCSS("opacity", "1");
    await page.keyboard.press("Enter");
    await expect(sidebarToggle).toHaveAttribute("aria-expanded", "true");
    await expect(sidebarToggle).toHaveCSS("width", "20px");
    const expandedToggleBox = await sidebarToggle.boundingBox();
    expect(expandedToggleBox).not.toBeNull();
    expect(expandedToggleBox!.y + expandedToggleBox!.height / 2).toBeCloseTo(
      railBox!.y + railBox!.height / 2,
      0
    );
    const nav = sidebar.getByRole("navigation", {
      name: "Desktop navigation",
    });
    await nav.getByRole("button", { name: "About", exact: true }).click();
    await expect(search).toBeInViewport();
    await expect(update).toBeInViewport();
    await expect(account).toBeInViewport();
    const navigationBox = await page
      .getByLabel("Primary sidebar", { exact: true })
      .locator('[data-sidebar-scroll="true"]')
      .boundingBox();
    const utilitiesBox = await page
      .getByLabel("Primary sidebar", { exact: true })
      .locator('[data-sidebar-section="utilities"]')
      .boundingBox();
    expect(navigationBox).not.toBeNull();
    expect(utilitiesBox).not.toBeNull();
    expect(navigationBox!.y + navigationBox!.height).toBeLessThanOrEqual(
      utilitiesBox!.y + 1
    );
    await expectNoHorizontalOverflow(page);

    // Unsupported Share routes keep Update directly above Search, with no hole.
    await page.goto("/notifications", { waitUntil: "domcontentloaded" });
    await expect(
      sidebar.getByRole("button", { name: "Share this page", exact: true })
    ).toHaveCount(0);
    await expect(update).toBeVisible();
    const searchBox = await search.boundingBox();
    const updateBox = await update.boundingBox();
    expect(searchBox).not.toBeNull();
    expect(updateBox).not.toBeNull();
    expect(searchBox!.y).toBeCloseTo(updateBox!.y + updateBox!.height, 0);
  } finally {
    releaseVersion();
  }
});

for (const { width, stored, expectedWidth } of [
  { width: 1440, stored: "false", expectedWidth: 275 },
  { width: 1440, stored: "true", expectedWidth: 80 },
  { width: 1100, stored: "false", expectedWidth: 80 },
]) {
  test(`restores sidebar ${stored} at ${width}px before hydration @smoke @medium @large`, async ({
    page,
  }, testInfo) => {
    // This contract covers desktop-web session restoration; native/mobile
    // layouts deliberately ignore the saved desktop sidebar width.
    test.skip(
      !isDesktopWebProject(testInfo.project.name),
      "Saved desktop sidebar width does not apply to native or mobile layouts"
    );
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript((value) => {
      globalThis.sessionStorage.setItem("sidebarCollapsed", value);
    }, stored);
    const hydration = await gateSidebarHydration(page);
    const sidebar = page.getByLabel("Primary sidebar", { exact: true });
    const layout = page.getByRole("main").first().locator("..");
    try {
      const documentResponse = await page.goto("/", { waitUntil: "commit" });
      await expect(layout).toHaveAttribute("data-sidebar-ready", "false");
      await expect(sidebar).toHaveCSS("width", `${expectedWidth}px`);
      await expect(page.getByRole("main").first()).toHaveCSS(
        "padding-left",
        `${expectedWidth}px`
      );
      await expect(page.getByRole("main").first()).toBeVisible();
      if (width >= 1280 && stored === "false") {
        await expect(
          page
            .getByLabel("Primary sidebar", { exact: true })
            .locator("[data-sidebar-content]")
        ).toHaveCSS("visibility", "hidden");
      }
      expect(documentResponse).not.toBeNull();
      expect(await documentResponse?.finished()).toBeNull();
      await hydration.waitForDownloads();
      hydration.release();
      await hydration.waitForReady();
    } finally {
      hydration.release();
      await hydration.attachEvidence(testInfo);
    }
    await expect(layout).toHaveAttribute("data-sidebar-ready", "true");
    await expect(sidebar).toHaveCSS("width", `${expectedWidth}px`);
    await expect(page.getByRole("main").first()).toHaveCSS(
      "padding-left",
      `${expectedWidth}px`
    );
    await expect(
      sidebar.getByRole("button", { name: "Toggle right sidebar" })
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
}

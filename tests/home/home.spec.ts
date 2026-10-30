import {
  expect,
  expectNoHorizontalOverflow,
  test,
  waitForRouteReady,
} from "../testHelpers";
import { devices, type Page } from "@playwright/test";
import { buildSync } from "esbuild";
import {
  decodeFunctionData,
  encodeFunctionResult,
  multicall3Abi,
  toFunctionSelector,
  zeroAddress,
  zeroHash,
} from "viem";
import { MEMES_MANIFOLD_PROXY_ABI } from "../../abis/abis";
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
    // A terminal response exercises the unavailable state without transport retries.
    route.fulfill({ status: 400, json: { error: "Fixture RPC unavailable" } })
  );
}

async function installCompletedMintStatus(
  page: Page,
  ready: Promise<void> = Promise.resolve()
) {
  const claimResult = encodeFunctionResult({
    abi: MEMES_MANIFOLD_PROXY_ABI,
    functionName: "getClaimForToken",
    result: [
      1n,
      {
        total: 328,
        totalMax: 328,
        walletMax: 0,
        startDate: 1,
        endDate: 2,
        storageProtocol: 0,
        merkleRoot: zeroHash,
        location: "",
        tokenId: 536n,
        cost: 0n,
        paymentReceiver: zeroAddress,
        erc20: zeroAddress,
        signingAddress: zeroAddress,
      },
    ],
  });
  const selector = toFunctionSelector("getClaimForToken(address,uint256)");
  await page.route("https://rpc.walletconnect.org/**", async (route) => {
    const rpc = route.request().postDataJSON();
    if (rpc.method !== "eth_call") {
      await route.abort();
      return;
    }
    await ready;
    let result = claimResult;
    if (!rpc.params[0].data.startsWith(selector)) {
      const { args, functionName } = decodeFunctionData({
        abi: multicall3Abi,
        data: rpc.params[0].data,
      });
      if (functionName !== "aggregate3")
        throw new Error("Unexpected fixture RPC call");
      result = encodeFunctionResult({
        abi: multicall3Abi,
        functionName,
        result: args[0].map((call) => ({
          success: call.callData.startsWith(selector),
          returnData: call.callData.startsWith(selector) ? claimResult : "0x",
        })),
      });
    }
    await route.fulfill({ json: { jsonrpc: "2.0", id: rpc.id, result } });
  });
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
  await page.route("**/api/memes_lite", (route) =>
    route.fulfill({
      json: {
        data: Array.from({ length: 5 }, (_, index) => ({
          ...loadingTestArtwork,
          id: loadingTestArtwork.id - index,
          name: `Recent Meme ${index}`,
        })),
      },
    })
  );
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

test.describe("Coming up local decision time", () => {
  test.use({ timezoneId: "Asia/Shanghai", locale: "en-US" });

  test("Coming up shows the existing wave decision in the visitor timezone @smoke @medium @large", async ({
    page,
  }, testInfo) => {
    const now = new Date("2026-10-26T12:00:00Z");
    const decision = new Date("2026-10-26T16:00:00Z");
    await page.clock.setFixedTime(now);
    await installComingUpFixture(page);
    let waveRequests = 0;
    await page.route(`**/api/waves/${comingUpWave.id}`, (route) => {
      waveRequests += 1;
      return route.fulfill({
        json: {
          ...comingUpWave,
          wave: { next_decision_time: decision.getTime() },
        },
      });
    });
    await page.route(comingUpLeaderboardPattern, (route) =>
      route.fulfill({ json: comingUpLeaderboard })
    );
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const section = page.getByRole("region", {
      name: "Coming up",
      exact: true,
    });
    const decisionLabel = page
      .getByRole("region", { name: "Coming up", exact: true })
      .locator("time");
    await expect(decisionLabel).toHaveText(
      "Next decision tomorrow at 00:00."
    );
    await expect(decisionLabel).toHaveAttribute(
      "datetime",
      decision.toISOString()
    );
    await expect(
      section.getByText("Next in queue and current vote leaders.", {
        exact: false,
      })
    ).toBeVisible();
    await expect(
      section.getByRole("link", { name: "View all", exact: true })
    ).toHaveAttribute("href", `/waves/${comingUpWave.id}`);
    expect(waveRequests).toBe(1);
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 1100 });
      await decisionLabel.scrollIntoViewIfNeeded();
      await expectNoHorizontalOverflow(page);
      await section.screenshot({
        path: testInfo.outputPath(`decision-${width}.png`),
      });
    }
  });
});

test("Subscription Minting stays readable with the reference layout @smoke @medium @large", async ({
  page,
}, testInfo) => {
  await installComingUpFixture(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const documentStyle = await page.evaluate(() => ({
    styles: Array.from(
      document.head.querySelectorAll('link[rel="stylesheet"], style'),
      (element) => element.outerHTML
    ).join(""),
    bodyClass: document.body.className,
  }));
  const fixtureUrl = new URL("/__subscription-layout-fixture", page.url()).href;
  await page.route(fixtureUrl, (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<html><head><meta name="viewport" content="width=device-width, initial-scale=1">${documentStyle.styles}</head>
      <body class="${documentStyle.bodyClass}"><main data-home-drop class="tailwind-scope tw-group/home-drop" style="width:calc(100% - 72px);max-width:600px;margin:24px auto">
        <div id="subscription-fixture"></div></main></body></html>`,
    })
  );
  await page.goto(fixtureUrl);
  const script = buildSync({
    stdin: {
      resolveDir: process.cwd(),
      contents: `
        import { createElement } from 'react';
        import { createRoot } from 'react-dom/client';
        import Row from './components/home/now-minting/MemeSubscriptionAwarenessRow';
        const states = [
          { subscribed: false, subscriptionsCount: 564, profileCoverageSummary: 'Not configured · 0 ETH' },
          { subscribed: true, subscribedCount: 12, subscriptionsCount: 123456789, profileCoverageSummary: 'Ready · 12 mints · 0.78348 ETH' },
          { subscribed: false, subscriptionsCountLoading: true },
          { subscribed: true, subscribedCount: 2, subscriptionsCount: 564, profileSubscriptionsActionLabel: 'Choose drops', profileCoverageSummary: 'Manual · 0.18 ETH · 4 drops funded' }
        ];
        createRoot(document.getElementById('subscription-fixture')).render(
          createElement('div', { className: 'tw-space-y-6' }, ...states.map((props, index) =>
            createElement('section', { key: index, 'aria-label': 'Subscription state ' + index },
              createElement(Row, { ...props, tooltipLabel: 'Subscription status', profileSubscriptionsHref: '/fixture/subscriptions' })
            )
          ))
        );`,
    },
    outfile: "subscription-layout-fixture.js",
    bundle: true,
    format: "iife",
    jsx: "automatic",
    define: { "process.env.NODE_ENV": '\"production\"', "process.env": "{}" },
    write: false,
  });
  for (const file of script.outputFiles) {
    if (file.path.endsWith(".css"))
      await page.addStyleTag({ content: file.text });
    else await page.addScriptTag({ content: file.text });
  }
  await expect(
    page.getByText("Subscription Minting", { exact: true })
  ).toHaveCount(4);
  await page.evaluate(() => document.fonts.ready);
  for (const width of [320, 360, 375, 390, 430, 640, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const region of await page.getByRole("region").all()) {
      const heading = await region
        .getByText("Subscription Minting", { exact: true })
        .boundingBox();
      const action = region.getByRole("link", { name: /^(Set up|Manage|Choose drops)$/ });
      const actionBox = await action.boundingBox();
      const infoBox = await region
        .getByRole("link", { name: "Learn more about The Memes subscriptions" })
        .boundingBox();
      const toggleBox = await region
        .getByRole("img", { name: "Subscription status", exact: true })
        .boundingBox();
      if (!heading || !actionBox || !infoBox || !toggleBox)
        throw new Error("Subscription controls must be visible");
      expect(actionBox.height).toBeGreaterThanOrEqual(24);
      const card = await region.boundingBox();
      if (!card) throw new Error("Subscription card must be visible");
      // The requested action stays at the far right. Very narrow cards stack
      // it below the details to preserve readable labels and every control.
      expect(card.x + card.width - (actionBox.x + actionBox.width)).toBe(17);
      expect(infoBox.y).toBeGreaterThan(heading.y + heading.height);
      if (card.width < 226) {
        expect(actionBox.y).toBeGreaterThanOrEqual(infoBox.y + infoBox.height);
      } else {
        expect(actionBox.x).toBeGreaterThanOrEqual(heading.x + heading.width);
        expect(actionBox.y).toBeLessThanOrEqual(heading.y + heading.height);
        expect(actionBox.y + actionBox.height).toBeLessThanOrEqual(infoBox.y);
      }
      if (card.width >= 354) {
        expect(heading.height).toBeLessThanOrEqual(20);
        expect(Math.abs(toggleBox.y - heading.y)).toBeLessThanOrEqual(2);
        expect(toggleBox.x - (heading.x + heading.width)).toBeCloseTo(8, 0);
      }
      const overflowingElements = await region.evaluate((element) =>
        Array.from(element.querySelectorAll("*"))
          .filter(
            (child) =>
              child instanceof HTMLElement &&
              child.clientWidth > 0 &&
              !child.classList.contains("tw-sr-only") &&
              child.scrollWidth > child.clientWidth + 1
          )
          .map((child) => ({
            tag: child.tagName,
            text: child.textContent,
            className: child.className,
            clientWidth: child.clientWidth,
            scrollWidth: child.scrollWidth,
          }))
      );
      expect(
        overflowingElements,
        `Subscription content must fit at ${width}px`
      ).toEqual([]);
    }
    await expectNoHorizontalOverflow(page);
    if (width === 390 || width === 1280) {
      await page.screenshot({
        path: testInfo.outputPath(`subscription-${width}.png`),
        fullPage: true,
      });
    }
  }
});

for (const cardCount of [1, 3]) {
  test(`Coming Up sizes ${cardCount} cards for the available width @smoke @medium @large`, async ({
    page,
  }, testInfo) => {
    await installComingUpFixture(page);
    await page.route("**/coming-up-layout-*.png", (route) => {
      const rank = Number(
        /coming-up-layout-(\d)/.exec(route.request().url())?.[1]
      );
      const height = [400, 600, 200][rank - 1]!;
      return route.fulfill({
        contentType: "image/svg+xml",
        body: `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="${height}"><rect width="400" height="${height}" fill="#777"/></svg>`,
      });
    });
    await page.route(comingUpLeaderboardPattern, (route) =>
      route.fulfill({
        json: {
          ...comingUpLeaderboard,
          count: cardCount,
          drops: comingUpLeaderboard.drops
            .slice(0, cardCount)
            .map((drop, index) => ({
              ...drop,
              media: [
                {
                  mime_type: "image/png",
                  url: `https://d3lqz0a4bldqgf.cloudfront.net/drops/coming-up-layout-${index + 1}.png`,
                },
              ],
            })),
        },
      })
    );
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const cards = page
      .getByRole("region", { name: "Coming up", exact: true })
      .getByTestId("coming-up-cards");
    await expect(
      cards.getByRole("link", { name: /^Coming Up artwork / })
    ).toHaveCount(cardCount);
    const artworkFrames = cards.getByTestId("coming-up-artwork");
    for (const frame of await artworkFrames.all()) {
      await frame.scrollIntoViewIfNeeded();
      await expect(frame.getByRole("img")).toHaveCSS("opacity", "1");
    }
    const widths = [320, 390, 639, 640, 767, 768, 1024, 1280, 1920];
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      await cards
        .getByRole("link", { name: /^Coming Up artwork / })
        .first()
        .scrollIntoViewIfNeeded();
      const geometry = await cards.evaluate((element) => {
        const style = getComputedStyle(element);
        const section = element.closest("section")!;
        const sectionStyle = getComputedStyle(section);
        return {
          sectionAvailable:
            section.clientWidth -
            Number.parseFloat(sectionStyle.paddingLeft) -
            Number.parseFloat(sectionStyle.paddingRight),
          available:
            element.clientWidth -
            Number.parseFloat(style.paddingLeft) -
            Number.parseFloat(style.paddingRight),
          cards: Array.from(element.children, (card) =>
            card.getBoundingClientRect().toJSON()
          ),
          top: element.getBoundingClientRect().top,
          overflow: element.scrollWidth - element.clientWidth,
        };
      });
      expect(geometry.overflow).toBeLessThanOrEqual(1);
      expect(geometry.available).toBeCloseTo(geometry.sectionAvailable, 0);
      if (width < 768) {
        for (const [index, card] of geometry.cards.entries()) {
          expect(card.width).toBeCloseTo(geometry.available, 0);
          if (index > 0) {
            const previous = geometry.cards[index - 1]!;
            expect(card.top - previous.bottom).toBeCloseTo(24, 0);
            expect(card.left).toBeCloseTo(previous.left, 0);
          }
        }
        // Every card participates in page scrolling; there is no nested swipe row.
        const lastCard = cards.getByRole("link", {
          name: `Coming Up artwork ${cardCount}`,
          exact: true,
        });
        await lastCard.scrollIntoViewIfNeeded();
        await expect(lastCard).toBeInViewport();
        if (cardCount > 1) {
          expect(
            await cards.evaluate(
              (element) => element.getBoundingClientRect().top
            )
          ).toBeLessThan(geometry.top);
        }
      } else {
        const columns = width < 1024 ? 2 : 3;
        const gap = width < 1024 ? 16 : 20;
        expect(geometry.cards[0]!.width).toBeCloseTo(
          (geometry.available - gap * (columns - 1)) / columns,
          0
        );
      }
      for (const frame of await artworkFrames.all()) {
        const artwork = await frame.evaluate((element) => {
          const image = element.querySelector("img")!;
          const bounds = element.getBoundingClientRect();
          const card = element.parentElement!;
          const cardStyle = getComputedStyle(card);
          return {
            width: bounds.width,
            cardInnerWidth:
              card.getBoundingClientRect().width -
              Number.parseFloat(cardStyle.borderLeftWidth) -
              Number.parseFloat(cardStyle.borderRightWidth),
            height: bounds.height,
            imageHeight: image.getBoundingClientRect().height,
            ratio: image.naturalHeight / image.naturalWidth,
            fit: getComputedStyle(image).objectFit,
          };
        });
        expect(artwork.fit).toBe("contain");
        expect(artwork.width).toBeCloseTo(artwork.cardInnerWidth, 0);
        expect(artwork.height).toBeCloseTo(
          artwork.width * (width < 768 ? artwork.ratio : 4 / 3),
          0
        );
        if (width < 768) {
          expect(artwork.imageHeight).toBeCloseTo(artwork.height, 0);
        }
      }
      await expectNoHorizontalOverflow(page);
    }
    await cards.scrollIntoViewIfNeeded();
    await cards.screenshot({
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

test("Coming Up loads without a homepage Boosted section or request @smoke @medium @large", async ({
  page,
}) => {
  await installComingUpFixture(page);
  await page.route(comingUpLeaderboardPattern, (route) =>
    route.fulfill({ json: comingUpLeaderboard })
  );
  const boostedRequests: string[] = [];
  await page.route("**/api/v2/boosted-drops?*", async (route) => {
    boostedRequests.push(route.request().url());
    await route.fulfill({ json: { data: [], page: 1, count: 0, next: false } });
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const comingUp = page.getByRole("region", { name: "Coming up", exact: true });
  await expect(
    comingUp.getByRole("link", { name: "Coming Up artwork 3", exact: true })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Boosted Drops", exact: true })
  ).toHaveCount(0);
  expect(boostedRequests).toEqual([]);
  await expectNoHorizontalOverflow(page);
});

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
    ).toBeVisible({ timeout: RESPONSE_TIMEOUT_MS });
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

test("homepage waits for initial settings and recovers from failed mint status @smoke @medium @large", async ({
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
  await page.route("**/api/v2/waves/*/decisions?*", (route) =>
    route.fulfill({ json: { data: [], page: 1, count: 0, next: false } })
  );
  await page.route("**/api/settings", async (route) => {
    await settingsReady;
    await route.fulfill({ json: comingUpSettings });
  });
  try {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const artwork = page
      .getByRole("main")
      .locator('[data-home-section="Latest drop"]');
    await expect(page.getByText("Latest Drop", { exact: true })).toBeVisible();
    await expect(artwork).toHaveCount(0);
    releaseSettings();
    const image = artwork.getByRole("img", {
      name: loadingTestArtwork.name,
      exact: true,
    });
    await expect(image).toBeVisible({ timeout: RESPONSE_TIMEOUT_MS });
    await expect
      .poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth))
      .toBeGreaterThan(0);
    await expect(
      artwork.getByText("Unavailable", { exact: true }).first()
    ).toBeVisible({ timeout: RESPONSE_TIMEOUT_MS });
    await expect(image).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Your allowance" })
    ).toHaveCount(0);
    await expect(
      page.getByText("Connect your wallet to view details.", { exact: true })
    ).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
  } finally {
    releaseSettings();
  }
});

test("Latest Drop keeps multiple artist links spaced within the card @smoke @medium @large", async ({
  page,
}, testInfo) => {
  await installComingUpFixture(page);
  const handles = [
    "phoebeum",
    "prxt0alt",
    "artist-with-a-very-long-handle".repeat(3),
  ];
  await page.route("**/api/identities/*", (route) =>
    route.fulfill({ status: 503, json: { error: "Unavailable" } })
  );
  await page.route("**/api/memes_latest", (route) =>
    route.fulfill({
      json: { ...loadingTestArtwork, artist_seize_handle: handles.join(", ") },
    })
  );
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const section = page
    .getByRole("main")
    .locator('[data-home-section="Latest drop"]');
  const artists = page
    .getByRole("main")
    .locator(
      '[data-home-section="Latest drop"] [data-home-action="Open artist profile"]'
    );
  await expect(
    section.getByRole("link", { name: loadingTestArtwork.name, exact: true })
  ).toBeVisible({ timeout: RESPONSE_TIMEOUT_MS });
  await expect(artists).toHaveCount(handles.length);
  const boxes = [];
  for (const handle of handles) {
    const link = section.getByRole("link", { name: handle, exact: true });
    await expect(link).toHaveAttribute("href", `/${handle}`);
    const box = await link.boundingBox();
    if (!box) throw new Error("Artist link must be visible");
    boxes.push(box);
  }
  for (let index = 1; index < boxes.length; index++) {
    const previous = boxes[index - 1]!;
    const current = boxes[index]!;
    if (Math.abs(current.y - previous.y) < 1) {
      expect(current.x - previous.x - previous.width).toBeGreaterThanOrEqual(
        20
      );
    } else {
      expect(current.y - previous.y - previous.height).toBeGreaterThanOrEqual(
        12
      );
    }
  }
  await expectNoHorizontalOverflow(page);
  await section.screenshot({
    path: testInfo.outputPath("latest-drop-artists.png"),
  });
});

test("homepage selects Next Drop without flashing the previous artwork @smoke @medium @large", async ({
  page,
}) => {
  await installComingUpFixture(page);
  const winner = {
    ...comingUpLeaderboard.drops[0],
    id: "next-drop-loading-fixture",
    title: "Upcoming artwork fixture",
    wave: comingUpWave,
    media: [{ mime_type: "image/png", url: loadingTestArtwork.image }],
    metadata: [],
    collaborators: Array.from({ length: 3 }, (_, index) => ({
      id: `next-credit-${index}`,
      handle: `next-collaborator-with-a-long-name-${index}`,
      display: `Collaborator ${index}`,
      pfp: loadingTestArtwork.image,
    })),
    submission_context: {
      meme_card_id: 537,
      voting: { current_calculated_vote: 0 },
    },
  };
  await page.route("**/api/identities/next-credit-*", (route) =>
    route.fulfill({ status: 503, json: { error: "Unavailable" } })
  );
  await page.route(`**/api/waves/${comingUpWave.id}`, (route) =>
    route.fulfill({
      json: {
        ...comingUpWave,
        author: winner.author,
        description_drop: { id: "description" },
        voting: { scope: {}, credit_type: "TDH" },
        participation: { scope: {} },
        chat: { scope: {} },
        visibility: { scope: {} },
        wave: { admin_group: {} },
      },
    })
  );
  let releaseWinner!: () => void;
  const winnerReady = new Promise<void>((resolve) => {
    releaseWinner = resolve;
  });
  await page.route("**/api/v2/waves/*/decisions?*", async (route) => {
    await winnerReady;
    await route.fulfill({
      json: {
        data: [
          {
            decision_time: 1,
            winners: [{ place: 1, awards: [], drop: winner }],
          },
        ],
        page: 1,
        count: 1,
        next: false,
      },
    });
  });
  let releaseStatus!: () => void;
  const statusReady = new Promise<void>((resolve) => {
    releaseStatus = resolve;
  });
  await installCompletedMintStatus(page, statusReady);
  await page.addInitScript(() => {
    new MutationObserver(() => {
      if (document.querySelector('[data-home-section="Latest drop"]')) {
        document.documentElement.dataset["previousDropRendered"] = "true";
      }
    }).observe(document, { childList: true, subtree: true });
  });
  try {
    const artworkResponse = page.waitForResponse("**/api/memes_latest");
    const statusRequest = page.waitForRequest(
      (request) =>
        request.url().startsWith("https://rpc.walletconnect.org/") &&
        request.postDataJSON()?.method === "eth_call"
    );
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await artworkResponse;
    await statusRequest;
    await expect(page.getByText("Latest Drop", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("main").locator('[data-home-section="Latest drop"]')
    ).toHaveCount(0);
    const winnerResponse = page.waitForResponse(
      "**/api/v2/waves/*/decisions?*"
    );
    releaseWinner();
    await winnerResponse;
    await expect(
      page.getByRole("link", { name: winner.title, exact: true })
    ).toHaveCount(0);
    await expect(
      page.getByRole("main").locator('[data-home-section="Latest drop"]')
    ).toHaveCount(0);
    releaseStatus();
    await expect(page.getByText("Next Drop", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("link", { name: winner.title, exact: true })
    ).toBeVisible();
    await expect(page.locator("html")).not.toHaveAttribute(
      "data-previous-drop-rendered",
      "true"
    );
    await expect(
      page.getByRole("heading", { name: "Your allowance" })
    ).toHaveCount(0);
    await expect(
      page.getByText("Connect your wallet to view details.", { exact: true })
    ).toHaveCount(0);
    const credits = page
      .getByRole("main")
      .locator('[data-home-section="Next drop"]')
      .getByRole("list", { name: "Collaborators" });
    await expect(credits.getByRole("listitem")).toHaveCount(3);
    const layout = await credits.evaluate((list) => {
      const group = list.parentElement!;
      const artist = group.parentElement!.previousElementSibling!;
      return {
        artistGap:
          group.getBoundingClientRect().top -
          artist.getBoundingClientRect().bottom,
        rows: Array.from(list.children, (row) =>
          row.getBoundingClientRect().toJSON()
        ),
      };
    });
    expect(layout.artistGap).toBeGreaterThanOrEqual(16);
    for (let index = 1; index < layout.rows.length; index++) {
      expect(
        layout.rows[index]!.top - layout.rows[index - 1]!.bottom
      ).toBeGreaterThanOrEqual(12);
    }
    await expectNoHorizontalOverflow(page);
  } finally {
    releaseWinner();
    releaseStatus();
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
  ).toBeVisible({ timeout: RESPONSE_TIMEOUT_MS });
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

  test("hero keeps the approved copy and actions in a responsive typography layout @smoke", async ({
    page,
  }, testInfo) => {
    await installCompletedMintStatus(page);
    await page.reload({ waitUntil: "domcontentloaded" });
    const hero = page
      .getByRole("main")
      .first()
      .locator('[data-home-section="Introduction"]');
    const heading = hero.getByRole("heading", { level: 1 });
    await expect(heading).toHaveText("Building a decentralized network state");
    await expect(
      hero.getByText(
        "A decentralized, permissionless global network that funds, builds, and coordinates public-goods work across art, science, culture, and technology."
      )
    ).toBeVisible();
    const actions = page
      .getByRole("region", { name: "New to 6529" })
      .getByRole("button")
      .or(page.getByRole("region", { name: "New to 6529" }).getByRole("link"));
    await expect(actions).toHaveText(["Connect wallet", "Start here"]);
    await expect(actions.last()).toHaveAttribute("href", "/join-6529");
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      const textBox = await heading.boundingBox();
      const heroBox = await hero.boundingBox();
      if (!textBox || !heroBox) throw new Error("Hero must be visible");
      expect(textBox.x).toBeGreaterThanOrEqual(heroBox.x);
      expect(textBox.x + textBox.width).toBeLessThanOrEqual(
        heroBox.x + heroBox.width
      );
      await expect(
        page
          .getByRole("main")
          .first()
          .locator('[data-home-section="Introduction"] img')
      ).toHaveCount(0);
      await expect(heading).toHaveCSS("font-family", /Montserrat/);
      for (const action of await actions.all()) {
        await expect(action).toBeVisible();
        const actionBox = await action.boundingBox();
        if (!actionBox) throw new Error("Hero action must be visible");
        expect(actionBox.y).toBeGreaterThan(textBox.y + textBox.height);
        if (width < 768) expect(actionBox.height).toBeGreaterThanOrEqual(48);
      }
      await expect(actions.first()).toHaveCSS("transition-property", "none");
      await hero.screenshot({ path: testInfo.outputPath(`hero-${width}.png`) });
      await expectNoHorizontalOverflow(page);
    }
  });

  test("newcomer explanation reflows and keeps its links keyboard accessible @smoke", async ({
    page,
  }, testInfo) => {
    const section = page.getByRole("region", { name: "What is 6529?" });
    const articles = section.getByRole("article");
    const waveImages = page
      .getByRole("region", { name: "What is 6529?" })
      .getByRole("article")
      .filter({
        has: page.getByRole("heading", {
          name: "Where the network coordinates",
        }),
      })
      .locator("img");
    const links = section.getByRole("link");
    await expect(section).toBeVisible();
    await expect(articles).toHaveCount(3);
    await expect(links).toHaveText([
      "Browse The Memes",
      "Browse Waves",
      "Explore Main Stage",
    ]);
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      const boxes = await articles.evaluateAll((items) =>
        items.map((item) => {
          const { x, y, width, height } = item.getBoundingClientRect();
          return { x, y, width, height };
        })
      );
      for (const [index, box] of boxes.entries()) {
        if (index === 0) continue;
        const previous = boxes[index - 1]!;
        if (width < 768) {
          expect(box.y).toBeGreaterThanOrEqual(
            previous.y + previous.height - 1
          );
          expect(Math.abs(box.x - previous.x)).toBeLessThan(1);
        } else {
          expect(Math.abs(box.y - previous.y)).toBeLessThan(1);
          expect(box.x).toBeGreaterThanOrEqual(previous.x + previous.width - 1);
        }
      }
      await links.first().focus();
      for (let index = 0; index < 3; index++) {
        const link = links.nth(index);
        await expect(link).toBeFocused();
        await expect(link).not.toHaveCSS("box-shadow", "none");
        if (index < 2) await page.keyboard.press("Tab");
      }
      await expectNoHorizontalOverflow(page);
      await expect(waveImages).toHaveCount(4);
      await waveImages.first().scrollIntoViewIfNeeded();
      await expect
        .poll(() =>
          waveImages.evaluateAll((images) =>
            images.every(
              (image) =>
                image instanceof HTMLImageElement &&
                image.complete &&
                image.naturalWidth > 0
            )
          )
        )
        .toBe(true);
      await section.screenshot({
        path: testInfo.outputPath(`what-is-${width}.png`),
      });
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(links.first()).toHaveCSS("transition-property", "none");
    await expect(
      section
        .getByRole("link", { name: "Browse The Memes", exact: true })
        .locator("svg")
    ).toHaveCSS("transition-property", "none");
  });

  test("How to start keeps its actions accessible across screen sizes @smoke", async ({
    page,
  }, testInfo) => {
    const start = page.getByRole("region", {
      name: "How to start",
      exact: true,
    });
    await expect(start).toBeVisible();
    await expect(
      start.getByText("Four steps into 6529.", { exact: true })
    ).toBeVisible();
    for (const [name, href] of [
      ["Create profile", "/join-6529#join-step-profile"],
      ["Join a Wave", "/waves"],
      ["Hold Meme Cards", "/the-memes"],
      ["submit your own art", "/about/apply"],
      ["Read the full guide", "/join-6529"],
    ] as const) {
      await expect(
        start.getByRole("link", { name, exact: true })
      ).toHaveAttribute("href", href);
    }
    const actions = page
      .getByRole("region", { name: "How to start", exact: true })
      .getByRole("heading", { level: 3 })
      .getByRole("link")
      .or(
        page
          .getByRole("region", { name: "How to start", exact: true })
          .getByRole("heading", { level: 3 })
          .getByRole("button")
      );
    await expect(actions).toHaveText([
      "Connect wallet",
      "Create profile",
      "Join a Wave",
    ]);
    await expect(start.getByRole("heading", { name: "Collect or create" })).toBeVisible();
    await expect(start.getByRole("link", { name: "Collect or create", exact: true })).toHaveCount(0);
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1100 });
      for (const action of await actions.all()) {
        await action.focus();
        await expect(action).toBeFocused();
        const target = await action.boundingBox();
        expect(target!.height).toBeGreaterThanOrEqual(40);
      }
      // Step 4 uses inline sentence links, not separate button-sized actions.
      for (const name of ["Hold Meme Cards", "submit your own art"]) {
        const link = start.getByRole("link", { name, exact: true });
        await link.focus();
        await expect(link).toBeFocused();
        await expect(link).not.toHaveCSS("box-shadow", "none");
      }
      const boxes = await start
        .getByRole("listitem")
        .evaluateAll((items) =>
          items.map((item) => item.getBoundingClientRect().toJSON())
        );
      for (let index = 1; index < boxes.length; index++) {
        if (width < 768)
          expect(boxes[index]!.top).toBeGreaterThan(boxes[index - 1]!.bottom);
        else expect(boxes[index]!.top).toBeCloseTo(boxes[0]!.top, 0);
      }
      await expectNoHorizontalOverflow(page);
      if (width === 390 || width === 1440) {
        await start.screenshot({
          path: testInfo.outputPath(`how-to-start-${width}.png`),
        });
      }
    }
    await Promise.all([
      page.waitForURL(/\/about\/apply$/, { waitUntil: "domcontentloaded" }),
      start.getByRole("link", { name: "submit your own art", exact: true }).click(),
    ]);
    await expect(page.getByRole("heading", { name: "Apply", exact: true, level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Seeking a Nomination (New Artists)", exact: true })).toBeVisible();
  });

  test("homepage wave cards use desktop artwork overlays and preserve mobile details", async ({
    page,
  }, testInfo) => {
    // Same-origin thumbnails prove real canvas sampling. Only the bottom half
    // should tint desktop text; mobile keeps its existing untinted surface.
    await page.route("**/_next/image?*", (route) =>
      route.fulfill({
        contentType: "image/svg+xml",
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><path fill="blue" d="M0 0h32v16H0z"/><path fill="red" d="M0 16h32v16H0z"/></svg>',
      })
    );
    await page.setViewportSize({ width: 390, height: 1000 });
    await page.reload({ waitUntil: "domcontentloaded" });
    await waitForRouteReady(page);
    const cards = page.getByRole("link", { name: /^View wave / });
    await expect(cards.first()).toBeVisible({ timeout: RESPONSE_TIMEOUT_MS });
    // Require artwork so sampling remains covered even when other live Waves
    // have no cover image and intentionally use the Iron fallback.
    await expect(cards.getByRole("img").first()).toBeVisible();
    // The requested desktop treatment fills the card with the cover behind text.
    // Mobile keeps its existing side-by-side layout.
    // Description, activity, metrics, and wave navigation are unchanged.
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await expectNoHorizontalOverflow(page);
      for (const card of await cards.all()) {
        await expect(card).toHaveAttribute("href", /\/(waves|messages)\//);
        await card.scrollIntoViewIfNeeded();
        const hasArtwork = (await card.getByRole("img").count()) > 0;
        const expectedTint = width >= 768 && hasArtwork ? "58 7 7" : "";
        await expect.poll(() => card.evaluate((element) => {
          const details = element.lastElementChild!;
          return getComputedStyle(details).getPropertyValue("--card-tint").trim();
        })).toBe(expectedTint);
        const gradient = await card.evaluate((element) =>
          getComputedStyle(element.lastElementChild!).backgroundImage
        );
        if (width < 768) {
          expect(gradient).toBe("none");
        } else {
          // Preserve the same fade geometry for sampled and fallback colors.
          const color = hasArtwork ? "58, 7, 7" : "19, 19, 22";
          expect(gradient).toContain(`rgb(${color}) 0%`);
          expect(gradient).toContain(`rgb(${color}) calc(100% - 60px)`);
          expect(gradient).toContain(`rgba(${color}, 0.8) calc(100% - 34px)`);
        }
        const layout = await card.evaluate((element) => {
          const cover = element.firstElementChild!;
          const details = element.lastElementChild!;
          const title = details.firstElementChild!;
          const activity = details.children[1]!;
          const description = details.querySelector("p")!;
          const metrics = details.querySelector(".explore-wave-card-metrics")!;
          return {
            cover: cover.getBoundingClientRect().toJSON(),
            details: details.getBoundingClientRect().toJSON(),
            title: title.getBoundingClientRect().toJSON(),
            activity: activity.getBoundingClientRect().toJSON(),
            description: description.getBoundingClientRect().toJSON(),
            metrics: metrics.getBoundingClientRect().toJSON(),
            card: element.getBoundingClientRect().toJSON(),
            paddingBottom: Number.parseFloat(
              getComputedStyle(details).paddingBottom
            ),
            borderBottom: Number.parseFloat(
              getComputedStyle(element).borderBottomWidth
            ),
          };
        });
        if (width < 768) {
          expect(layout.cover.width).toBeCloseTo((layout.card.width - 2) / 3, 0);
          expect(layout.cover.right).toBeCloseTo(layout.details.left, 0);
          expect(layout.cover.top).toBeCloseTo(layout.details.top, 0);
        } else {
          expect(layout.borderBottom).toBe(0);
          expect(layout.cover.width).toBeCloseTo(layout.card.width, 0);
          expect(layout.cover.height).toBeCloseTo(layout.card.height, 0);
          expect(layout.cover.top).toBeCloseTo(layout.card.top, 0);
          expect(layout.cover.bottom).toBeCloseTo(layout.details.bottom, 0);
          expect(layout.details.top).toBeGreaterThan(layout.cover.top);
          expect(layout.title.top).toBeGreaterThan(layout.details.top);
          expect(layout.card.height).toBeCloseTo(layout.card.width, 0);
        }
        expect(layout.activity.top).toBeGreaterThanOrEqual(layout.title.bottom);
        expect(layout.description.top).toBeGreaterThanOrEqual(
          layout.activity.bottom
        );
        expect(layout.metrics.top).toBeGreaterThanOrEqual(
          layout.description.bottom
        );
        expect(layout.card.bottom - layout.metrics.bottom).toBeCloseTo(
          layout.paddingBottom + layout.borderBottom,
          0
        );
      }
      if (width === 390 || width === 1440) {
        await page
          .getByRole("heading", { name: "Tired of bot replies?", exact: true })
          .locator('xpath=ancestor::*[@data-home-section="Explore waves"]')
          .screenshot({
            path: testInfo.outputPath(`wave-cards-${width}.png`),
          });
      }
    }
    await cards.first().focus();
    await expect(cards.first()).toBeFocused();
    expect(
      await cards
        .first()
        .evaluate((element) => getComputedStyle(element).boxShadow)
    ).not.toBe("none");
  });

  test("Discover keeps artwork overlays and descriptions at every breakpoint", async ({
    page,
  }, testInfo) => {
    await page.route("**/_next/image?*", (route) =>
      route.fulfill({
        contentType: "image/svg+xml",
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="blue"/></svg>',
      })
    );
    await page.goto("/discover", { waitUntil: "domcontentloaded" });
    await waitForRouteReady(page);
    const cards = page.getByRole("link", { name: /^View wave / });
    const firstCard = cards.first();
    await expect(firstCard).toBeVisible({ timeout: RESPONSE_TIMEOUT_MS });
    const originalName = await firstCard.getAttribute("aria-label");
    const originalHref = await firstCard.getAttribute("href");
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await firstCard.scrollIntoViewIfNeeded();
      await expectNoHorizontalOverflow(page);
      await expect(firstCard).toHaveAttribute("aria-label", originalName!);
      await expect(firstCard).toHaveAttribute("href", originalHref!);
      await expect
        .poll(() =>
          firstCard.evaluate((card) =>
            getComputedStyle(card.lastElementChild!)
              .getPropertyValue("--card-tint")
              .trim()
          )
        )
        .toBe("7 7 58");
      const layout = await firstCard.evaluate((card) => {
        const cover = card.firstElementChild!;
        const details = card.lastElementChild!;
        return {
          card: card.getBoundingClientRect().toJSON(),
          cover: cover.getBoundingClientRect().toJSON(),
          details: details.getBoundingClientRect().toJSON(),
          metrics: details
            .querySelector(".explore-wave-card-metrics")!
            .getBoundingClientRect()
            .toJSON(),
          gradient: getComputedStyle(details).backgroundImage,
        };
      });
      expect(layout.card.right).toBeLessThanOrEqual(width);
      expect(layout.card.left).toBeGreaterThanOrEqual(0);
      expect(layout.cover.width).toBeCloseTo(layout.card.width, 0);
      expect(layout.cover.height).toBeCloseTo(layout.card.height, 0);
      expect(layout.card.height).toBeCloseTo(
        width < 768 ? Math.max(layout.card.width, 288) : layout.card.width, 0
      );
      expect(layout.details.top).toBeGreaterThan(layout.card.top);
      expect(layout.metrics.bottom).toBeLessThan(layout.card.bottom);
      expect(layout.gradient).toContain("rgb(7, 7, 58) calc(100% - 60px)");
      if (width === 390 || width === 1440) {
        await page.screenshot({
          path: testInfo.outputPath(`discover-cards-${width}.png`),
        });
      }
    }
    await firstCard.focus();
    await expect(firstCard).toBeFocused();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await firstCard.hover();
    expect(
      await firstCard.evaluate((card) => getComputedStyle(card).transform)
    ).toBe("none");
    await Promise.all([
      page.waitForURL(new RegExp(originalHref!.replaceAll("/", "\\/")), {
        waitUntil: "domcontentloaded",
      }),
      firstCard.press("Enter"),
    ]);
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

    const comingUp = page.getByRole("region", {
      name: "Coming up",
      exact: true,
    });
    await expect(comingUp).toBeVisible({ timeout: RESPONSE_TIMEOUT_MS });
    const isNarrowViewport = await page.evaluate(() => innerWidth < 768);
    const viewportWidth = await page.evaluate(() => innerWidth);
    const sectionTitleSize = isNarrowViewport ? "28px" : "38px";
    await expect(page.getByText(/^(Latest|Next) Drop$/)).toHaveCSS(
      "font-size",
      viewportWidth < 768 ? "28px" : "38px"
    );
    await expect(page.getByText(/^(Latest|Next) Drop$/)).toHaveCSS(
      "margin-bottom",
      viewportWidth < 768 ? "28px" : "32px"
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
      await expect(subtitle).toHaveCSS(
        "font-size",
        isNarrowViewport ? "14px" : "15px"
      );
      await expect(subtitle).toHaveCSS("margin-top", "12px");
      await expect(
        section.getByRole("heading", { level: 2 }).locator("../..")
      ).toHaveCSS("margin-bottom", isNarrowViewport ? "28px" : "32px");
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
        const linkGap = await section.evaluate((section) => {
          const subtitle = section.querySelector("p")!;
          const link = section.querySelector('[data-home-action="View all"]')!;
          return (
            link.getBoundingClientRect().top -
            subtitle.getBoundingClientRect().bottom
          );
        });
        // The approved mobile layout puts the text action below the subtitle.
        expect(linkGap).toBeGreaterThanOrEqual(12);
      }
    }

    if (isNarrowViewport) {
      const cards = comingUp.getByTestId("coming-up-cards");
      const layout = await cards.evaluate((element) => ({
        overflow: element.scrollWidth - element.clientWidth,
        boxes: Array.from(element.children, (card) =>
          card.getBoundingClientRect().toJSON()
        ),
      }));
      expect(layout.overflow).toBeLessThanOrEqual(1);
      for (let index = 1; index < layout.boxes.length; index++) {
        expect(
          layout.boxes[index]!.top - layout.boxes[index - 1]!.bottom
        ).toBeCloseTo(24, 0);
      }
    }

    const start = page.getByRole("region", {
      name: "How to start",
      exact: true,
    });
    await expect(start).toBeVisible();
    await expect(start.getByRole("listitem")).toHaveCount(4);
    await expect(
      start.getByRole("link", { name: "Create profile", exact: true })
    ).toHaveAttribute("href", "/join-6529#join-step-profile");
    const steps = await start
      .getByRole("listitem")
      .evaluateAll((items) =>
        items.map((item) => item.getBoundingClientRect().toJSON())
      );
    for (let index = 1; index < steps.length; index++) {
      if (isNarrowViewport)
        expect(steps[index]!.top).toBeGreaterThan(steps[index - 1]!.bottom);
      else expect(steps[index]!.top).toBeCloseTo(steps[0]!.top, 0);
    }
    const guide = start.getByRole("link", {
      name: "Read the full guide",
      exact: true,
    });
    await guide.focus();
    await expect(guide).toBeFocused();
    await expect(guide).toHaveCSS(
      "min-height",
      isNarrowViewport ? "40px" : "32px"
    );

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

  test("keeps long countdowns readable in standard and compact homepage layouts", async ({
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
          const root = createRoot(document.getElementById('countdown-fixture'));
          const countdown = {
              title: 'Phase 0 (Allowlist) Starts In',
              targetDate: Math.floor(Date.now() / 1000) + 12 * 86400 + 23 * 3600 + 59 * 60 + 59,
              showAllowlistInfo: true,
              showMintBtn: true,
              isActive: false
          };
          root.render(createElement(Countdown, { countdown }));
          globalThis.addEventListener('show-home-countdown', () => root.render(createElement(Countdown, { countdown, variant: 'home' })));
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
    const standardCardHeight = await timer.evaluate(
      (element) =>
        element.parentElement!.parentElement!.parentElement!.parentElement!.getBoundingClientRect()
          .height
    );
    await page.evaluate(() =>
      globalThis.dispatchEvent(new Event("show-home-countdown"))
    );
    if (isMobileWebProject(testInfo.project.name)) {
      // Match the narrow slot left by the homepage sidebar and card padding.
      await page.getByRole("main").evaluate((element) => {
        element.style.width = "calc(100% - 155px)";
      });
    }
    const phase = page.getByText("Phase 0 (Allowlist) Starts In", {
      exact: true,
    });
    const mint = page.getByRole("link", { name: "Mint", exact: true });
    await expect(phase).toBeVisible();
    await expect(page.getByText("Upcoming", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("img", {
        name: "The timer displays the current time remaining for a specific phase of the drop. Please refer to the distribution plan to check if you are in the allowlist.",
        exact: true,
      })
    ).toBeVisible();
    await expect(mint).toHaveAttribute("href", "/the-memes/mint");
    await expect(mint).toHaveCSS("border-radius", "8px");
    await expect(timer).toHaveText(/^12d : 23h : 59m : \d{2}s$/);
    const values = page.getByRole("timer").locator("[data-countdown-value]");
    await expect(values).toHaveCount(4);
    await expect(values.first()).toHaveCSS(
      "font-size",
      (await page.evaluate(() => innerWidth < 768)) ? "20px" : "24px"
    );
    await expect(values.first()).toHaveCSS("font-weight", "700");
    await expect(page.getByText("Starts In", { exact: true })).toHaveCount(0);
    const phaseBounds = await phase.boundingBox();
    const mintBounds = await mint.boundingBox();
    const compact = await timer.evaluate((element) => {
      const row = element.closest("[data-countdown-timing]")!;
      const box = element.closest("[data-home-countdown]")!;
      return {
        timer: element.getBoundingClientRect().toJSON(),
        row: row.getBoundingClientRect().toJSON(),
        rowBackground: getComputedStyle(row).backgroundColor,
        rowBorder: getComputedStyle(row).borderWidth,
        boxBorder: getComputedStyle(box).borderWidth,
        box: box.getBoundingClientRect().toJSON(),
        paddingX: Number.parseFloat(getComputedStyle(box).paddingLeft),
        paddingBottom: Number.parseFloat(getComputedStyle(box).paddingBottom),
        space: box.parentElement!.getBoundingClientRect().toJSON(),
      };
    });
    if (!phaseBounds || !mintBounds)
      throw new Error("Countdown controls must be visible");
    expect(phaseBounds.y + phaseBounds.height).toBeLessThanOrEqual(
      compact.row.top
    );
    expect(compact.timer.left).toBeGreaterThanOrEqual(
      compact.box.left + compact.paddingX
    );
    expect(compact.timer.right).toBeLessThanOrEqual(
      compact.box.right - compact.paddingX
    );
    expect(compact.timer.bottom).toBeLessThanOrEqual(
      compact.box.bottom - compact.paddingBottom
    );
    // The requested layout restores the complete heading above a dark timer row.
    expect(compact.rowBackground).toBe("rgb(19, 19, 22)");
    expect(compact.rowBorder).toBe("0px");
    expect(compact.boxBorder).toBe("0px");
    expect(compact.row.height).toBeGreaterThanOrEqual(48);
    expect(compact.timer.top).toBeGreaterThanOrEqual(compact.row.top + 12);
    expect(
      Math.abs(
        compact.timer.left + compact.timer.width / 2 -
          (compact.row.left + compact.row.width / 2)
      )
    ).toBeLessThanOrEqual(1);
    expect(mintBounds.y).toBeGreaterThanOrEqual(compact.box.bottom + 10);
    expect(mintBounds.height).toBe(44);
    if ((await page.evaluate(() => innerWidth)) >= 1024) {
      expect(compact.space.height).toBe(standardCardHeight);
    }
    await page
      .getByRole("main")
      .locator('[data-home-countdown] [data-tooltip-id="allowlist-info"]')
      .focus();
    await expect(page.getByRole("tooltip")).toContainText(
      "Please refer to the distribution plan to check if you are in the allowlist."
    );
    await mint.focus();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(
      page.getByRole("main").locator("[data-home-countdown] .tw-absolute")
    ).toHaveCSS("animation-name", "none");
    await expectNoHorizontalOverflow(page);
    await page.screenshot({ path: testInfo.outputPath("countdown-days.png") });
    if (isMobileWebProject(testInfo.project.name)) {
      for (const width of [320, 390, 430]) {
        await page.setViewportSize({ width, height: 800 });
        const mobileLayout = await timer.evaluate((element) => {
          const box = element.closest("[data-home-countdown]")!;
          const phase = box.querySelector("[data-countdown-phase]")!;
          return {
            timer: element.getBoundingClientRect().toJSON(),
            box: box.getBoundingClientRect().toJSON(),
            phase: phase.getBoundingClientRect().toJSON(),
            badge: phase.nextElementSibling!.getBoundingClientRect().toJSON(),
            segments: Array.from(element.children, (segment) =>
              segment.getBoundingClientRect().toJSON()
            ),
          };
        });
        // The timer stays centered in its own row below the complete heading.
        expect(mobileLayout.timer.top).toBeGreaterThan(mobileLayout.phase.bottom);
        expect(
          Math.abs(
            mobileLayout.timer.left + mobileLayout.timer.width / 2 -
              (mobileLayout.box.left + mobileLayout.box.width / 2)
          )
        ).toBeLessThanOrEqual(1);
        expect(
          mobileLayout.badge.top >= mobileLayout.phase.bottom ||
            mobileLayout.badge.left >= mobileLayout.phase.right
        ).toBe(true);
        for (const segment of mobileLayout.segments) {
          expect(segment.left).toBeGreaterThanOrEqual(mobileLayout.timer.left);
          expect(segment.right).toBeLessThanOrEqual(mobileLayout.timer.right);
        }
        await expect(values.first()).toHaveCSS("font-size", "20px");
        if (width === 320) {
          // Four units form two balanced rows in the tightest content slot.
          expect(mobileLayout.segments[0]!.top).toBe(
            mobileLayout.segments[1]!.top
          );
          expect(mobileLayout.segments[2]!.top).toBe(
            mobileLayout.segments[3]!.top
          );
          expect(mobileLayout.segments[2]!.left).toBe(
            mobileLayout.segments[0]!.left
          );
        } else {
          expect(
            mobileLayout.segments.every(
              (segment) => segment.top === mobileLayout.segments[0]!.top
            )
          ).toBe(true);
        }
        await expectNoHorizontalOverflow(page);
        await page.screenshot({
          path: testInfo.outputPath(`countdown-days-${width}.png`),
        });
      }
    }
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
      .getByRole("link", { name: "Start here", exact: true })
      .or(page.getByRole("link", { name: "View all", exact: true }));
    await expect(secondaryActions).toHaveCount(3);
    const isNarrowViewport = await page.evaluate(() => innerWidth < 768);
    for (const action of await secondaryActions.all()) {
      const isViewAll =
        (await action.getAttribute("data-home-action")) === "View all";
      if (isViewAll) {
        await expect(action).toHaveCSS("border-width", "0px");
        await expect(action).toHaveCSS(
          "min-height",
          isNarrowViewport ? "40px" : "32px"
        );
      } else {
        await expect(action).toHaveCSS("border-width", "1px");
        await expect(action).toHaveCSS(
          "border-color",
          "rgba(255, 255, 255, 0.1)"
        );
      }
      await expect(action).toHaveCSS(
        "background-color",
        isViewAll ? "rgba(0, 0, 0, 0)" : "rgba(255, 255, 255, 0.07)"
      );
    }

    await page.emulateMedia({ reducedMotion: "no-preference" });
    if (isDesktopWebProject(testInfo.project.name)) {
      const dropTitle = page.getByRole("link", {
        name: loadingTestArtwork.name,
        exact: true,
      });
      await expect(dropTitle).toBeVisible({ timeout: RESPONSE_TIMEOUT_MS });
      await dropTitle.hover();
      await expect(dropTitle).toHaveCSS("color", "rgb(206, 207, 212)");

      const comingUpTitle = comingUp.getByRole("link", {
        name: "Coming Up artwork 1",
        exact: true,
      });
      await comingUpTitle.hover();
      await expect(comingUpTitle).toHaveCSS("color", "rgb(206, 207, 212)");

      await waveLink.scrollIntoViewIfNeeded();
      await page.mouse.move(0, 0);
      await expect(waveLink).toHaveCSS("transform", "none");
      const before = await waveLink.boundingBox();
      await waveLink.screenshot({ path: testInfo.outputPath("wave-card-rest.png") });
      await waveLink.hover();
      // The requested desktop motion replaces the former border-only feedback.
      await expect(waveLink).toHaveCSS("border-color", "rgba(255, 255, 255, 0.2)");
      await expect(waveLink).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, -4)");
      await expect(page.getByRole("link", { name: /^View wave / }).first().locator("img")).toHaveCSS(
        "transform",
        "matrix(1.06, 0, 0, 1.06, 0, 0)"
      );
      await expect(
        // Wave names and ordering differ between deployed environments.
        // Keep checking the hovered card's actual title color.
        page
          .getByRole("link", { name: /^View wave / })
          .first()
          .locator("span.tw-break-words.tw-font-semibold")
      ).toHaveCSS("color", "rgb(255, 255, 255)");
      const after = await waveLink.boundingBox();
      expect(after!.y).toBeCloseTo(before!.y - 4, 0);
      expect(after!.width).toBe(before!.width);
      expect(after!.height).toBe(before!.height);
      await waveLink.screenshot({ path: testInfo.outputPath("wave-card-hover.png") });

      await viewAll.hover();
      await expect(arrow).toHaveCSS("transform", "matrix(1, 0, 0, 1, 2, 0)");

      for (const action of await secondaryActions.all()) {
        const isStartHere =
          (await action.getAttribute("data-home-action")) === "Get started";
        await action.hover();
        if (isStartHere) {
          await expect(action).toHaveCSS(
            "border-color",
            "rgba(255, 255, 255, 0.2)"
          );
          await expect(action).toHaveCSS(
            "background-color",
            "rgba(255, 255, 255, 0.1)"
          );
        } else {
          await expect(action).toHaveCSS("color", "rgb(255, 255, 255)");
          await expect(action).toHaveCSS(
            "text-decoration-color",
            "rgba(255, 255, 255, 0.6)"
          );
          await expect(action).toHaveCSS(
            "background-color",
            "rgba(0, 0, 0, 0)"
          );
        }
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
    if (isDesktopWebProject(testInfo.project.name)) {
      await waveLink.hover();
      await expect(waveLink).toHaveCSS("transform", "none");
      await expect(page.getByRole("link", { name: /^View wave / }).first().locator("img")).toHaveCSS("transform", "none");
      await expect(page.getByRole("link", { name: /^View wave / }).first().locator("img")).toHaveCSS("transition-property", "none");
    }
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

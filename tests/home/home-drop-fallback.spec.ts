import { expect, expectNoHorizontalOverflow, test } from "../testHelpers";
import { RESPONSE_TIMEOUT_MS } from "../support/routeReadiness";
import {
  comingUpLeaderboard,
  comingUpLeaderboardPattern,
  comingUpSettings,
  comingUpWave,
  installComingUpFixture,
  installCompletedMintStatus,
  installLoadingTestArtwork,
  loadingTestArtwork,
} from "./homeDropFixtures";

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
    await expect(page.getByText("Latest Drop", { exact: true })).toHaveCount(0);
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

test("homepage reuses fast roots after mint details mount @smoke @medium @large", async ({
  page,
}) => {
  await installComingUpFixture(page);
  let releaseClaim!: () => void;
  const claimReady = new Promise<void>((resolve) => {
    releaseClaim = resolve;
  });
  await installCompletedMintStatus(page, claimReady);
  await page.route(comingUpLeaderboardPattern, (route) =>
    route.fulfill({ json: comingUpLeaderboard })
  );
  let rootsRequests = 0;
  await page.route("**/api/minting-claims/*/*/roots", (route) => {
    rootsRequests += 1;
    return route.fulfill({ json: [] });
  });
  try {
    const rootsResponse = page.waitForResponse(
      "**/api/minting-claims/*/*/roots"
    );
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await (await rootsResponse).finished();
    await expect(
      page
        .getByRole("main")
        .first()
        .locator('[data-home-section="Latest drop"]')
    ).toHaveCount(0);
    expect(rootsRequests).toBe(1);
    releaseClaim();
    const latest = page
      .getByRole("main")
      .first()
      .locator('[data-home-section="Latest drop"]');
    const image = latest.getByRole("img", {
      name: loadingTestArtwork.name,
      exact: true,
    });
    await expect(image).toBeVisible({ timeout: RESPONSE_TIMEOUT_MS });
    await expect
      .poll(() => image.evaluate((el: HTMLImageElement) => el.naturalWidth))
      .toBeGreaterThan(0);
    await expect(
      latest.getByText("All editions have been minted!", { exact: true })
    ).toBeVisible();
    expect(rootsRequests).toBe(1);
  } finally {
    releaseClaim();
  }
});

test("homepage reads fresh roots on same-card SPA return @smoke @medium @large", async ({
  page,
}) => {
  await installComingUpFixture(page);
  await installCompletedMintStatus(page);
  await page.route(comingUpLeaderboardPattern, (route) =>
    route.fulfill({ json: comingUpLeaderboard })
  );
  let rootsRequests = 0;
  await page.route("**/api/minting-claims/*/*/roots", (route) => {
    rootsRequests += 1;
    return route.fulfill({ json: [] });
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const latest = page
    .getByRole("main")
    .first()
    .locator('[data-home-section="Latest drop"]');
  await expect(
    latest.getByText("All editions have been minted!", { exact: true })
  ).toBeVisible({ timeout: RESPONSE_TIMEOUT_MS });
  expect(rootsRequests).toBe(1);
  const documentStart = await page.evaluate(() => performance.timeOrigin);
  await page.getByRole("link", { name: "Start here", exact: true }).click();
  await page.waitForURL(/\/join-6529$/);
  expect(await page.evaluate(() => performance.timeOrigin)).toBe(documentStart);
  await page.goBack();
  expect(await page.evaluate(() => performance.timeOrigin)).toBe(documentStart);
  await expect(
    latest.getByRole("img", { name: loadingTestArtwork.name, exact: true })
  ).toBeVisible({ timeout: RESPONSE_TIMEOUT_MS });
  await expect.poll(() => rootsRequests).toBe(2);
  await expect(
    latest.getByText("All editions have been minted!", { exact: true })
  ).toBeVisible();
  expect(rootsRequests).toBe(2);
});

for (const rootsStatus of [200, 503]) {
  test(`homepage shares pending roots without delaying or replacing artwork (${rootsStatus}) @smoke @medium @large`, async ({
    page,
  }, testInfo) => {
    await installComingUpFixture(page);
    await installCompletedMintStatus(page);
    await page.route(comingUpLeaderboardPattern, (route) =>
      route.fulfill({ json: comingUpLeaderboard })
    );
    let releaseRoots!: () => void;
    const rootsReady = new Promise<void>((resolve) => {
      releaseRoots = resolve;
    });
    let rootsRequests = 0;
    await page.route("**/api/minting-claims/*/*/roots", async (route) => {
      rootsRequests += 1;
      await rootsReady;
      await route.fulfill({
        status: rootsStatus,
        json: rootsStatus === 200 ? [] : { error: "Fixture roots unavailable" },
      });
    });
    const started = Date.now();
    try {
      await page.goto("/", { waitUntil: "domcontentloaded" });
      const latest = page
        .getByRole("main")
        .first()
        .locator('[data-home-section="Latest drop"]');
      const image = latest.getByRole("img", {
        name: loadingTestArtwork.name,
        exact: true,
      });
      await expect(image).toBeVisible({ timeout: RESPONSE_TIMEOUT_MS });
      await expect
        .poll(() =>
          image.evaluate((element: HTMLImageElement) => element.naturalWidth)
        )
        .toBeGreaterThan(0);
      await expect
        .poll(() =>
          image.evaluate((element: HTMLImageElement) => element.currentSrc)
        )
        .toContain("home-loading-fixture.png");
      await expect(
        latest.getByText("All editions have been minted!", { exact: true })
      ).toBeVisible();
      await expect(
        latest.getByRole("link", { name: loadingTestArtwork.name, exact: true })
      ).toHaveAttribute("href", `/the-memes/${loadingTestArtwork.id}`);
      expect(rootsRequests).toBe(1);

      const artworkVisibleMs = Date.now() - started;
      const completed = page.waitForResponse((response) =>
        /\/api\/minting-claims\/[^/]+\/\d+\/roots$/.test(
          new URL(response.url()).pathname
        )
      );
      releaseRoots();
      await completed;
      await expect(image).toBeVisible();
      await expect(
        latest.getByText("All editions have been minted!", { exact: true })
      ).toBeVisible();
      expect(rootsRequests).toBe(1);
      await testInfo.attach("roots-request-evidence", {
        contentType: "application/json",
        body: JSON.stringify({
          rootsStatus,
          rootsRequests,
          artworkVisibleMs,
          artworkVisibleBeforeRootsResponse: true,
        }),
      });
    } finally {
      releaseRoots();
    }
  });
}

test("homepage keeps newer artwork when old roots finish after back navigation @smoke @medium @large", async ({
  page,
}) => {
  const initialTime = new Date("2026-11-13T12:00:00Z");
  await page.clock.setFixedTime(initialTime);
  await installComingUpFixture(page);
  await installCompletedMintStatus(page);
  await page.route(comingUpLeaderboardPattern, (route) =>
    route.fulfill({ json: comingUpLeaderboard })
  );
  const newerArtwork = {
    ...loadingTestArtwork,
    id: loadingTestArtwork.id + 1,
    name: "Newer homepage artwork",
    image: "https://6529.io/home-rollover-fixture.png",
    scaled: "https://6529.io/home-rollover-fixture.png",
  };
  await page.route("**/home-rollover-fixture.png", (route) =>
    route.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="#579"/></svg>',
    })
  );
  let showNewCard = false;
  await page.route("**/api/memes_latest", (route) =>
    route.fulfill({ json: showNewCard ? newerArtwork : loadingTestArtwork })
  );
  let releaseOldRoots!: () => void;
  const oldRootsReady = new Promise<void>((resolve) => {
    releaseOldRoots = resolve;
  });
  await page.route("**/api/minting-claims/*/*/roots", async (route) => {
    if (
      new URL(route.request().url()).pathname.endsWith(
        `/${loadingTestArtwork.id}/roots`
      )
    ) {
      await oldRootsReady;
    }
    await route.fulfill({ json: [] });
  });
  try {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const latest = page
      .getByRole("main")
      .first()
      .locator('[data-home-section="Latest drop"]');
    await expect(
      latest.getByRole("img", { name: loadingTestArtwork.name, exact: true })
    ).toBeVisible({ timeout: RESPONSE_TIMEOUT_MS });
    const initialDocument = await page.evaluate(() => performance.timeOrigin);
    await page.getByRole("link", { name: "Start here", exact: true }).click();
    await page.waitForURL(/\/join-6529$/);
    expect(await page.evaluate(() => performance.timeOrigin)).toBe(
      initialDocument
    );
    showNewCard = true;
    await installCompletedMintStatus(page, Promise.resolve(), newerArtwork.id);
    await page.clock.setFixedTime(new Date(initialTime.getTime() + 11_000));
    await page.goBack();
    const image = latest.getByRole("img", {
      name: newerArtwork.name,
      exact: true,
    });
    await expect(image).toBeVisible({ timeout: RESPONSE_TIMEOUT_MS });
    await expect
      .poll(() =>
        image.evaluate((element: HTMLImageElement) => element.naturalWidth)
      )
      .toBeGreaterThan(0);
    await expect
      .poll(() =>
        image.evaluate((element: HTMLImageElement) => element.currentSrc)
      )
      .toContain("home-rollover-fixture.png");
    const oldResponse = page.waitForResponse((response) =>
      new URL(response.url()).pathname.endsWith(
        `/${loadingTestArtwork.id}/roots`
      )
    );
    releaseOldRoots();
    await oldResponse;
    await expect(image).toBeVisible();
    await expect
      .poll(() =>
        image.evaluate((element: HTMLImageElement) => element.currentSrc)
      )
      .toContain("home-rollover-fixture.png");
    await expect(
      latest.getByRole("img", { name: loadingTestArtwork.name, exact: true })
    ).toHaveCount(0);
    await expect(
      latest.getByRole("link", { name: newerArtwork.name, exact: true })
    ).toHaveAttribute("href", `/the-memes/${newerArtwork.id}`);
  } finally {
    releaseOldRoots();
  }
});

test("homepage selects Next Drop without flashing the previous heading or artwork @smoke @medium @large", async ({
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
      const home = document.querySelector("main");
      if (
        home?.querySelector('[data-home-section="Latest drop"]') ||
        [...(home?.querySelectorAll("span") ?? [])].some(
          (element) => element.textContent?.trim() === "Latest Drop"
        )
      ) {
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
    await expect(page.getByText("Latest Drop", { exact: true })).toHaveCount(0);
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

import type { Page } from "@playwright/test";
import type { ApiWave } from "@/generated/models/ApiWave";
import {
  CollectedCollectionType,
  type CollectedCard,
} from "@/entities/IProfile";
import { expectPersonalCollectedActionsAbsent } from "./profileReadonlyHelpers";
import { expectUrlState } from "../support/urlState";
import { isCapacitorSimulationProject } from "../support/surfaceSimulation";
import {
  expect,
  expectAxeClean,
  expectNoHorizontalOverflow,
  test,
} from "../testHelpers";
import {
  getSandboxApiOrigin,
  hideNextDevOverlay,
  LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
  useLocalSandboxMutationGuard,
} from "../support/localSandbox";

const WALLET = "0x0000000000000000000000000000000000000529";
const PROFILE_ID = "00000000-0000-4000-8000-000000000531";
const LONG_ABOUT = Array.from(
  { length: 10 },
  (_, i) => `Line ${i + 1}: collecting art and sharing ideas.`
).join("\n");

async function seedSession(page: Page, role: string | null = null) {
  const jwt = [
    Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString(
      "base64url"
    ),
    Buffer.from(
      JSON.stringify({ sub: WALLET, role, exp: 2000000000 })
    ).toString("base64url"),
    "",
  ].join(".");
  await page.addInitScript(
    ({ address, jwt, role, profileId }) => {
      document.cookie = "essential-cookies-consent=true; path=/";
      document.cookie = "performance-cookies-consent=false; path=/";
      localStorage.setItem("6529-wallet-active-address", address);
      localStorage.setItem(
        "6529-wallet-accounts",
        JSON.stringify([
          {
            address,
            jwt,
            role,
            refreshToken: null,
            authSessionVersion: "v2",
            profileId,
            profileHandle: "playwright",
          },
        ])
      );
    },
    { address: WALLET, jwt, role, profileId: PROFILE_ID }
  );
}

async function seedGettingStartedSession(page: Page, arrival = false) {
  await seedSession(page);
  await page.addInitScript((shouldArrive) => {
    // Represent the successful creation session while keeping reload/dismiss real.
    const fixtureKey = "playwright-getting-started-session-seeded";
    if (sessionStorage.getItem(fixtureKey)) return;
    sessionStorage.setItem(fixtureKey, "true");
    sessionStorage.setItem(
      "identity-getting-started-created-profile:playwright",
      "true"
    );
    if (shouldArrive) {
      sessionStorage.setItem(
        "identity-getting-started-arrival:playwright",
        "true"
      );
    }
  }, arrival);
}

async function observeGettingStartedScroll(page: Page) {
  await page.addInitScript(() => {
    const originalScrollIntoView = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function (options) {
      if (
        this.getAttribute("aria-label") === "Getting started with your identity"
      ) {
        const key = "playwright-guided-arrival-scrolls";
        const previous = JSON.parse(sessionStorage.getItem(key) ?? "[]");
        sessionStorage.setItem(
          key,
          JSON.stringify([
            ...previous,
            {
              behavior: typeof options === "object" ? options.behavior : null,
              block: typeof options === "object" ? options.block : null,
              focused: this.contains(document.activeElement),
              rendered: this.getClientRects().length > 0,
            },
          ])
        );
      }
      originalScrollIntoView.call(this, options);
    };
  });
}

async function getGettingStartedScrolls(page: Page) {
  return page.evaluate(async () => {
    // Let scheduled arrival effects run before asserting the absence of a repeat.
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
    return JSON.parse(
      sessionStorage.getItem("playwright-guided-arrival-scrolls") ?? "[]"
    ) as {
      behavior: ScrollBehavior | null;
      block: ScrollLogicalPosition | null;
      focused: boolean;
      rendered: boolean;
    }[];
  });
}

async function installHostedWalletReads(page: Page) {
  // Hosted wallet usage/discovery and contract reads are outside this fixture.
  await page.route("https://api.web3modal.org/getWallets?*", (route) =>
    route.fulfill({ json: { data: [], count: 0 } })
  );
  await page.route("https://api.web3modal.org/appkit/v1/config?*", (route) =>
    route.fulfill({ json: { features: [] } })
  );
  await page.route(
    "https://api.web3modal.org/appkit/v1/project-limits?*",
    (route) =>
      route.fulfill({
        json: {
          planLimits: {
            tier: "starter",
            isAboveMauLimit: false,
            isAboveRpcLimit: false,
          },
        },
      })
  );
  await page.route("https://rpc.walletconnect.org/v1/**", async (route) => {
    const payload = route.request().postDataJSON() as
      | { id: number; method: string }
      | { id: number; method: string }[];
    const respond = (call: { id: number; method: string }) => {
      expect(call.method).toBe("eth_call");
      return {
        jsonrpc: "2.0",
        id: call.id,
        error: {
          code: -32000,
          message: "Contract reads are unavailable in this profile fixture",
        },
      };
    };
    await route.fulfill({
      json: Array.isArray(payload) ? payload.map(respond) : respond(payload),
    });
  });
}

async function finishHostedWalletInitialization(
  page: Page,
  navigate: () => Promise<unknown>
) {
  const responses = ["config", "project-limits"].map((path) =>
    page
      .waitForResponse(
        (response) => new URL(response.url()).pathname === `/appkit/v1/${path}`
      )
      .then((response) => response.finished())
  );
  await navigate();
  await Promise.all(responses);
}

async function openOwnProfile(page: Page, expectOwnerAction = true) {
  // Exercise account-menu navigation; the direct-load test covers cold hydration.
  const profileLoaded = page.waitForResponse((response) =>
    new URL(response.url()).pathname.endsWith(`/identities/${WALLET}`)
  );
  await page.goto("/about");
  await profileLoaded;
  if ((page.viewportSize()?.width ?? 0) < 1024) {
    await page.getByRole("button", { name: "Open menu", exact: true }).click();
  }
  const nativeProfile = page.getByRole("link", {
    name: /^Open .+ profile$/,
  });
  const accountMenu = page.getByRole("button", {
    name: "Open account and profiles menu",
    exact: true,
  });
  await expect(nativeProfile.or(accountMenu)).toBeVisible();
  if (await nativeProfile.isVisible()) await nativeProfile.click();
  else {
    await accountMenu.press("Enter");
    await page.getByRole("link", { name: "Profile", exact: true }).click();
  }
  await page.waitForURL(/\/playwright$/, {
    timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
  });
  await expect(
    page.getByRole("navigation", { name: "Profile sections" })
  ).toBeVisible();
  if (expectOwnerAction) {
    await expect(
      page.getByRole("button", { name: "Edit profile", exact: true })
    ).toBeVisible();
  }
}

async function installStatements(page: Page, api: string) {
  let value: string | null = null;
  const statements = () =>
    value === null
      ? []
      : [
          {
            id: "about-statement",
            profile_id: PROFILE_ID,
            statement_group: "GENERAL",
            statement_type: "BIO",
            statement_value: value,
            statement_comment: null,
            created_at: 1713744000000,
            updated_at: null,
          },
        ];
  await page.route(`${api}/api/profiles/*/cic/statements`, async (route) => {
    if (route.request().method() === "POST") {
      const body = route.request().postDataJSON();
      expect(body.statement_group).toBe("GENERAL");
      expect(body.statement_type).toBe("BIO");
      value = body.statement_value;
      await route.fulfill({ json: statements()[0] });
    } else {
      await route.fulfill({ json: statements() });
    }
  });
  await page.route(
    `${api}/api/profiles/*/cic/statements/about-statement`,
    async (route) => {
      expect(route.request().method()).toBe("DELETE");
      value = null;
      await route.fulfill({ json: {} });
    }
  );
}

async function openAboutEditor(page: Page) {
  await page.getByRole("button", { name: "Edit profile", exact: true }).click();
  const aboutMenuItem = page.getByRole("button", {
    name: "About",
    exact: true,
  });
  if (await aboutMenuItem.isVisible()) {
    await aboutMenuItem.click();
    // Wait for the sheet's scheduled heading focus before editing.
    await expect(
      page.getByRole("heading", { name: "Edit About", exact: true })
    ).toBeFocused();
  }
  await expect(
    page.getByRole("textbox", { name: "About statement", exact: true })
  ).toBeVisible();
}

test.describe("Profile editing @auth @medium @local-only", () => {
  useLocalSandboxMutationGuard(
    test,
    "PLAYWRIGHT_AUTH_SANDBOX",
    "Profile edits require the isolated mock API."
  );
  test.beforeEach(async ({ page, baseURL }) => {
    await page.route(
      `${getSandboxApiOrigin(baseURL)}/api/memes_lite`,
      (route) =>
        route.fulfill({ json: { count: 0, data: [], next: null, page: 1 } })
    );
  });

  for (const profile of ["playwright", "following-artist-0"]) {
    test(`Brain wave rows scroll independently on ${profile === "playwright" ? "the owner's" : "a visitor's"} profile`, async ({
      page,
    }, testInfo) => {
      await seedSession(page);
      await installHostedWalletReads(page);
      await page.route("**/drops?**", (route) => route.fulfill({ json: [] }));
      const createdNames = [
        "Created wave with a long name",
        "Second created wave",
      ];
      const recentNames = Array.from(
        { length: 5 },
        (_, index) => `Recent wave ${index + 1} with a long name`
      );
      await page.route("**/v2/waves/profile-activity/**", (route) => {
        const isCreated =
          new URL(route.request().url()).searchParams.get("activity_type") ===
          "CREATED";
        return route.fulfill({
          json: {
            data: (isCreated ? createdNames : recentNames).map(
              (name, index) => ({
                wave_id: `00000000-0000-4000-8000-00000000000${index + 1}`,
                wave_name: name,
                wave_picture: null,
                is_private: false,
                total_drops_count: 12,
                latest_post_timestamp: 1713744000000,
              })
            ),
            next_cursor: null,
          },
        });
      });
      await page.goto(`/${profile}/brain`);
      const mobileStrip = page.getByTestId("brain-sidebar-mobile-strip");
      const desktop = page.getByTestId("brain-sidebar-desktop");
      if (testInfo.project.name === "web-desktop-chromium") {
        await expect(desktop).toBeVisible();
        await expect(mobileStrip).toBeHidden();
        await expect(desktop.getByRole("link")).toHaveText([
          ...createdNames.map((name) => new RegExp(name)),
          ...recentNames.map((name) => new RegExp(name)),
        ]);
        await page.screenshot({
          path: testInfo.outputPath(`brain-wave-rows-${profile}.png`),
          fullPage: true,
          scale: "css",
        });
        return;
      }

      const created = page.getByTestId("brain-created-waves-mobile");
      const recent = page.getByTestId("brain-recent-waves-mobile");
      await expect(created.getByRole("link")).toHaveText([createdNames[0]!]);
      await expect(recent.getByRole("link")).toHaveText(recentNames);
      await expect(desktop).toBeHidden();
      const widths = isCapacitorSimulationProject(testInfo.project.name)
        ? [390]
        : [320, 390, 768];
      for (const width of widths) {
        await page.setViewportSize({ width, height: 1000 });
        const shell = await page
          .getByRole("main")
          .filter({ has: mobileStrip })
          .last()
          .boundingBox();
        const createdBox = await created.boundingBox();
        const recentBox = await recent.boundingBox();
        expect(recentBox!.y).toBeGreaterThan(
          createdBox!.y + createdBox!.height
        );
        for (const row of [created, recent]) {
          const rowBox = await row.boundingBox();
          const firstChip = await row.getByRole("link").first().boundingBox();
          expect(Math.abs(rowBox!.x - shell!.x)).toBeLessThanOrEqual(1);
          expect(
            Math.abs(rowBox!.x + rowBox!.width - shell!.x - shell!.width)
          ).toBeLessThanOrEqual(1);
          expect(firstChip!.x - rowBox!.x).toBe(16);
        }
        const heading = mobileStrip.getByText("Recently Active In", {
          exact: true,
        });
        const headingX = (await heading.boundingBox())!.x;
        await recent.getByRole("link").first().focus();
        await recent.getByRole("link").last().focus();
        expect(
          await recent.evaluate((node) => node.scrollLeft)
        ).toBeGreaterThan(0);
        expect(await created.evaluate((node) => node.scrollLeft)).toBe(0);
        expect((await heading.boundingBox())!.x).toBe(headingX);
        await expect(recent.getByRole("link").last()).toBeInViewport();
        await recent.evaluate((node) => {
          node.scrollLeft = 0;
        });
        await expectNoHorizontalOverflow(page);
      }
      await page.screenshot({
        path: testInfo.outputPath(`brain-wave-rows-${profile}.png`),
        fullPage: true,
        scale: "css",
      });
    });
  }

  for (const profile of ["playwright", "following-artist-0"]) {
    test(`Curation profile layout preserves ${profile === "playwright" ? "owner" : "visitor"} controls and empty copy`, async ({
      page,
      baseURL,
    }, testInfo) => {
      await hideNextDevOverlay(page.context());
      await seedSession(page);
      await installHostedWalletReads(page);
      const api = getSandboxApiOrigin(baseURL);
      const waveId = "00000000-0000-4000-8000-000000000529";
      const waveResponse = await page.request.get(`${api}/api/waves/${waveId}`);
      const wave = (await waveResponse.json()) as ApiWave;
      wave.name = "A source Wave with a long name";
      wave.picture = "/6529.svg";
      wave.metrics.drops_count = 12345;
      wave.metrics.subscribers_count = 6789;
      const title = "A long collection title that wraps beside owner actions";
      let curationName = title;
      let connected = true;
      await page.route("**/api/profiles/*/wave", (route) =>
        route.fulfill({
          json: {
            profile_wave_id: connected ? waveId : null,
            profile_curation_id: connected ? "profile-curation" : null,
          },
        })
      );
      await page.route(`${api}/api/waves/${waveId}`, (route) =>
        route.fulfill({ json: wave })
      );
      await page.route(`${api}/api/waves/${waveId}/curations`, (route) =>
        route.fulfill({
          json: [
            {
              id: "profile-curation",
              name: curationName,
              wave_id: waveId,
              group_id: null,
              created_at: 1,
              updated_at: 1,
              priority_order: 1,
            },
          ],
        })
      );
      await page.route(`**/v2/waves/${waveId}/curations/*/drops?**`, (route) =>
        route.fulfill({ json: { data: [], page: 1, next: false } })
      );
      await page.route(`${api}/api/waves?**`, (route) =>
        route.fulfill({ json: [] })
      );
      await finishHostedWalletInitialization(page, () =>
        page.goto(`/${profile}/curations`)
      );
      const heading = page.getByRole("heading", { name: title, exact: true });
      await expect(heading).toBeVisible();
      const mobile = testInfo.project.name !== "web-desktop-chromium";
      const owner = profile === "playwright";
      const source = page.getByRole("button", {
        name: `Open source Wave ${wave.name}`,
        exact: true,
      });
      const manage = page.getByRole("button", {
        name: mobile ? "Manage" : "Curation options",
        exact: true,
      });
      const add = page.getByRole("button", { name: "Add post", exact: true });
      await expect(source).toBeVisible();
      await expect(manage).toHaveCount(owner ? 1 : 0);
      await expect(add).toHaveCount(owner ? 1 : 0);
      if (mobile) {
        await expect(
          page.getByText("12,345 source posts • 6,789 joined", { exact: true })
        ).toBeVisible();
        await expect(
          page.getByText("Source Wave", { exact: true })
        ).toBeVisible();
        const widths = isCapacitorSimulationProject(testInfo.project.name)
          ? [390]
          : [320, 390, 768];
        for (const width of widths) {
          await page.setViewportSize({ width, height: 1000 });
          const headingBox = await heading.boundingBox();
          const sourceBox = await source.boundingBox();
          expect(sourceBox!.y).toBeGreaterThan(
            headingBox!.y + headingBox!.height
          );
          if (owner) {
            await expect(manage).toHaveCSS("width", "36px");
            await expect(manage).toHaveCSS("height", "36px");
            await expect(manage).toHaveText("");
            await expect(add).toHaveCSS("height", "36px");
            await expect(add).toHaveCSS("font-size", "13px");
            const manageBox = await manage.boundingBox();
            const addBox = await add.boundingBox();
            const sectionsBox = await page
              .getByRole("navigation", { name: "Profile sections" })
              .boundingBox();
            expect(Math.abs(headingBox!.y - manageBox!.y)).toBeLessThanOrEqual(
              1
            );
            expect(headingBox!.x + headingBox!.width).toBeLessThanOrEqual(
              manageBox!.x
            );
            expect(manageBox!.x + manageBox!.width).toBeLessThan(addBox!.x);
            expect(
              Math.abs(
                addBox!.x + addBox!.width - sectionsBox!.x - sectionsBox!.width
              )
            ).toBeLessThanOrEqual(1);
          }
          await expectNoHorizontalOverflow(page);
        }
        if (owner) {
          await manage.click();
          const sheet = page.getByRole("dialog", {
            name: "Manage",
            exact: true,
          });
          await expect(
            sheet.getByRole("heading", { name: "Manage", exact: true })
          ).toBeVisible();
          await page.screenshot({
            path: testInfo.outputPath(`curation-manage-${profile}.png`),
            scale: "css",
          });
          await sheet
            .getByRole("button", { name: "Close", exact: true })
            .click();
          await expect(manage).toBeFocused();
        }
      } else {
        await expect(
          page.getByText("12345 source posts • 6789 joined", { exact: true })
        ).toBeVisible();
        if (owner) await expect(manage).toContainText("Manage");
      }
      await page.screenshot({
        path: testInfo.outputPath(`curation-${profile}.png`),
        fullPage: true,
        scale: "css",
      });
      await page
        .getByRole("heading", { name: title, exact: true })
        .locator("..")
        .screenshot({
          path: testInfo.outputPath(`curation-header-${profile}.png`),
          scale: "css",
        });
      if (owner && mobile) {
        curationName = "Art";
        await finishHostedWalletInitialization(page, () => page.reload());
        const shortHeading = page.getByRole("heading", {
          name: "Art",
          exact: true,
        });
        await expect(shortHeading).toBeVisible();
        for (const width of [320, 390, 768]) {
          await page.setViewportSize({ width, height: 1000 });
          const headingBox = await shortHeading.boundingBox();
          const manageBox = await manage.boundingBox();
          expect(Math.abs(headingBox!.y - manageBox!.y)).toBeLessThanOrEqual(1);
          expect(headingBox!.x + headingBox!.width).toBeLessThanOrEqual(
            manageBox!.x
          );
          await expectNoHorizontalOverflow(page);
        }
        await page.setViewportSize({ width: 390, height: 1000 });
        await page
          .getByRole("heading", { name: "Art", exact: true })
          .locator("..")
          .screenshot({
            path: testInfo.outputPath(`curation-short-header-${profile}.png`),
            scale: "css",
          });
      }
      connected = false;
      await finishHostedWalletInitialization(page, () => page.reload());
      const emptyTitle = owner ? "Create a Curation" : "No featured wave yet";
      const emptyHeading = page.getByRole("heading", {
        name: emptyTitle,
        exact: true,
      });
      await expect(emptyHeading).toBeVisible();
      await expect(
        page.getByText(
          owner
            ? "Create a collection of posts to feature on your profile."
            : "This profile hasn't selected a featured wave for Curation yet.",
          { exact: true }
        )
      ).toBeVisible();
      if (mobile) {
        await expect(emptyHeading).toHaveCSS("font-size", "17px");
        await expect(emptyHeading).toHaveCSS("font-weight", "600");
        await expect(
          page
            .getByRole("heading", { name: emptyTitle, exact: true })
            .locator("..")
            .getByRole("paragraph")
        ).toHaveCSS("font-size", "14px");
        const panel = page
          .getByRole("heading", { name: emptyTitle, exact: true })
          .locator("xpath=ancestor::section");
        await expect(panel).toHaveCSS("border-radius", "12px");
        if (owner) {
          const create = page.getByRole("button", {
            name: "Create Curation",
            exact: true,
          });
          const advanced = page.getByRole("link", {
            name: "Advanced Wave setup",
            exact: true,
          });
          await expect(create).toHaveCount(1);
          await expect(create).toHaveCSS("height", "44px");
          await expect(advanced).toHaveCSS(
            "background-color",
            "rgba(0, 0, 0, 0)"
          );
          const createBox = await create.boundingBox();
          const advancedBox = await advanced.boundingBox();
          expect(advancedBox!.y).toBeGreaterThanOrEqual(
            createBox!.y + createBox!.height
          );
        }
      }
      await page.screenshot({
        path: testInfo.outputPath(`curation-empty-${profile}.png`),
        fullPage: true,
        scale: "css",
      });
    });
  }

  test("Guided welcome arrives once, respects motion preferences and preserves focus", async ({
    page,
    baseURL,
    isMobile,
  }) => {
    await seedGettingStartedSession(page, true);
    await observeGettingStartedScroll(page);
    await page.emulateMedia({
      reducedMotion: isMobile ? "reduce" : "no-preference",
    });
    await installStatements(page, getSandboxApiOrigin(baseURL));
    await installHostedWalletReads(page);
    await finishHostedWalletInitialization(page, () =>
      page.goto("/playwright")
    );
    const guidance = page.getByRole("region", {
      name: "Getting started with your identity",
      exact: true,
    });
    await expect(guidance).toBeVisible();
    const expectedScrolls = [
      {
        behavior: isMobile ? "instant" : "smooth",
        block: "start",
        focused: false,
        rendered: true,
      },
    ];
    await expect
      .poll(() => getGettingStartedScrolls(page))
      .toEqual(expectedScrolls);
    // Keep the native scroll call real: the card must actually reach the viewport.
    await expect
      .poll(async () => {
        const box = await guidance.boundingBox();
        return box !== null && box.y >= 0 && box.y < 200;
      })
      .toBe(true);
    expect(
      await guidance.evaluate((element) =>
        element.contains(document.activeElement)
      )
    ).toBe(false);
    expect(
      await page.evaluate(() =>
        sessionStorage.getItem("identity-getting-started-arrival:playwright")
      )
    ).toBeNull();
    await finishHostedWalletInitialization(page, () => page.reload());
    await expect(guidance).toBeVisible();
    expect(await getGettingStartedScrolls(page)).toEqual(expectedScrolls);
    await guidance
      .getByRole("link", { name: "Find a Wave", exact: true })
      .click();
    await page.waitForURL(/\/discover$/, {
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    await page.goBack();
    await expect(guidance).toBeVisible();
    expect(await getGettingStartedScrolls(page)).toEqual(expectedScrolls);
  });

  test("Guided welcome explains paths, opens eligibility and keeps dismissal across reload", async ({
    page,
    baseURL,
    isMobile,
  }, testInfo) => {
    await seedGettingStartedSession(page);
    await installStatements(page, getSandboxApiOrigin(baseURL));
    await openOwnProfile(page);
    if (isMobile) await page.setViewportSize({ width: 320, height: 900 });
    const guidance = page.getByRole("region", {
      name: "Getting started with your identity",
      exact: true,
    });
    await expect(
      guidance.getByRole("heading", { name: "Your profile is ready" })
    ).toBeVisible();
    await expect(
      guidance.getByText("Profile created", { exact: true })
    ).toHaveCount(0);
    const allGuidance = page.getByRole("region", {
      name: "Getting started with your identity",
      exact: true,
      includeHidden: true,
    });
    const dismissGuide = guidance.getByRole("button", {
      name: "Dismiss guide",
      exact: true,
    });
    const minimumDismissHeight = await page.evaluate(() =>
      globalThis.matchMedia("(pointer: coarse)").matches ? 44 : 32
    );
    await expect(
      guidance.getByText("Getting started", { exact: true })
    ).toBeVisible();
    await expect(dismissGuide).toHaveText("Dismiss");
    await expect(dismissGuide).toHaveAttribute("title", "Dismiss guide");
    for (const width of [768, 1023, 1024, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await expect(allGuidance).toHaveCount(1);
      await expect(guidance).toBeVisible();
      await expectNoHorizontalOverflow(page);
      const headingBounds = await guidance
        .getByRole("heading", { name: "Your profile is ready", exact: true })
        .evaluate((element) => {
          const range = document.createRange();
          range.selectNodeContents(element);
          const box = range.getBoundingClientRect();
          return { x: box.x, y: box.y, width: box.width, height: box.height };
        });
      const dismissBounds = await dismissGuide.boundingBox();
      expect(dismissBounds).not.toBeNull();
      const separated =
        headingBounds.x + headingBounds.width <= dismissBounds!.x ||
        headingBounds.y >= dismissBounds!.y + dismissBounds!.height;
      expect(separated, `Guide header controls overlap at ${width}px`).toBe(
        true
      );
      expect(dismissBounds!.height).toBeGreaterThanOrEqual(
        minimumDismissHeight
      );
      expect(dismissBounds!.width).toBeGreaterThanOrEqual(44);
      if (width === 390 || width === 320) {
        const discoverBounds = await guidance
          .getByRole("link", { name: "Find a Wave", exact: true })
          .boundingBox();
        const learnBounds = await guidance
          .getByRole("link", { name: "How 6529 works", exact: true })
          .boundingBox();
        expect(discoverBounds).not.toBeNull();
        expect(learnBounds).not.toBeNull();
        expect(discoverBounds!.height).toBeGreaterThanOrEqual(44);
        expect(
          Math.abs(discoverBounds!.height - learnBounds!.height)
        ).toBeLessThanOrEqual(1);
        expect(
          Math.abs(discoverBounds!.width - learnBounds!.width)
        ).toBeLessThanOrEqual(1);
        // Desktop retains its rail at this viewport; the two-up layout is a phone requirement.
        if (width === 390 && isMobile) {
          expect(
            Math.abs(
              discoverBounds!.y +
                discoverBounds!.height / 2 -
                (learnBounds!.y + learnBounds!.height / 2)
            )
          ).toBeLessThanOrEqual(1);
        } else if (width === 320) {
          expect(learnBounds!.y).toBeGreaterThanOrEqual(
            discoverBounds!.y + discoverBounds!.height
          );
        }
      }
    }
    await page.setViewportSize({
      width: isMobile ? 320 : 1280,
      height: 900,
    });
    await expect(
      guidance.getByText(
        "Welcome to 6529. Start with a Wave, a space for conversation, art, and community decisions.",
        { exact: true }
      )
    ).toBeVisible();
    await expect(
      guidance.getByText("Check nomination requirements for The Memes.", {
        exact: true,
      })
    ).toBeVisible();
    await expect(
      guidance.getByRole("link", { name: /^The Memes Main Stage/ })
    ).toHaveAttribute("href", /^\/waves\//);
    await expect(
      guidance.getByRole("link", { name: "How 6529 works", exact: true })
    ).toHaveAttribute("href", "/join-6529");
    await expect(
      guidance.getByRole("link", { name: "Create a wave", exact: true })
    ).toHaveCount(0);
    const submissionGuidance = guidance.getByRole("button", {
      name: /^Before you submit art/,
    });
    if (isMobile) await submissionGuidance.tap();
    else await submissionGuidance.click();
    const eligibility = page.getByRole("dialog", {
      name: isMobile
        ? "Before you submit art"
        : "Main Stage submission eligibility",
      exact: true,
    });
    await expect(
      eligibility.getByText("Unlock submissions", { exact: true })
    ).toBeVisible();
    if (!isMobile) await expect(eligibility).toHaveCSS("opacity", "1");
    await expect(eligibility).toContainText("MemesNominee REP");
    await expect(eligibility).toContainText("50,000");
    await expect(
      eligibility.getByRole("link", { name: "Get nominated", exact: true })
    ).toHaveAttribute("href", "/waves/0ecb95d0-d8f2-48e8-8137-bfa71ee8593c");
    await expectNoHorizontalOverflow(page);
    await expectAxeClean(page, { include: ['[role="dialog"]'] });
    const eligibilityScreenshot = testInfo.outputPath("guided-eligibility.png");
    await page.screenshot({
      path: eligibilityScreenshot,
      style: "nextjs-portal{display:none!important}",
    });
    await testInfo.attach("guided-eligibility", {
      path: eligibilityScreenshot,
      contentType: "image/png",
    });
    if (isMobile) {
      await eligibility
        .getByRole("button", { name: "Close", exact: true })
        .tap();
    } else {
      await expect(eligibility).toHaveAttribute("aria-modal", "false");
      await submissionGuidance.press("Escape");
    }
    await expect(eligibility).toHaveCount(0);
    await expect(submissionGuidance).toBeFocused();
    await expectNoHorizontalOverflow(page);
    await expectAxeClean(page, {
      include: ['[aria-label="Getting started with your identity"]'],
    });
    const screenshotPath = testInfo.outputPath("guided-welcome.png");
    // Capture the resting appearance after proving keyboard focus restoration.
    await guidance
      .getByRole("heading", { name: "Your profile is ready" })
      .click();
    await guidance.screenshot({
      path: screenshotPath,
      style: "nextjs-portal{display:none!important}",
    });
    await testInfo.attach("guided-welcome", {
      path: screenshotPath,
      contentType: "image/png",
    });
    const findWave = guidance.getByRole("link", {
      name: "Find a Wave",
      exact: true,
    });
    await expect(findWave).toHaveAttribute("href", "/discover");
    if (isMobile) await findWave.tap();
    else {
      await findWave.focus();
      await expect(findWave).toBeFocused();
      await findWave.press("Enter");
    }
    await page.waitForURL(/\/discover$/, {
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    await page.goBack();
    await expect(guidance).toHaveCount(1);
    await expect(guidance).toBeVisible();
    await dismissGuide.click();
    await expect(guidance).toHaveCount(0);
    await page.reload();
    await expect(
      page.getByRole("navigation", { name: "Profile sections" })
    ).toBeVisible();
    await expect(guidance).toHaveCount(0);
  });

  test("Guided welcome eligibility follows input capabilities and supports keyboard dismissal", async ({
    page,
    baseURL,
    isMobile,
  }) => {
    await seedGettingStartedSession(page);
    await installStatements(page, getSandboxApiOrigin(baseURL));
    await openOwnProfile(page);
    // A wide touch device still uses the sheet/dialog; a narrow mouse window
    // still uses the desktop popover.
    await page.setViewportSize({ width: isMobile ? 1280 : 600, height: 900 });
    const trigger = page
      .getByRole("region", {
        name: "Getting started with your identity",
        exact: true,
      })
      .getByRole("button", { name: /^Before you submit art/ });
    const eligibility = page.getByRole("dialog", {
      name: isMobile
        ? "Before you submit art"
        : "Main Stage submission eligibility",
      exact: true,
    });
    await trigger.scrollIntoViewIfNeeded();
    if (!isMobile) {
      await trigger.hover();
      await expect(eligibility).toBeVisible();
      await eligibility.hover();
      await expect(eligibility).toBeVisible();
      await page
        .getByRole("heading", { name: "Your profile is ready" })
        .click();
      await expect(eligibility).toHaveCount(0);
    }
    for (const key of ["Enter", "Space"]) {
      await trigger.focus();
      await trigger.press(key);
      await expect(
        eligibility.getByText("Unlock submissions", { exact: true })
      ).toBeVisible();
      if (isMobile) {
        await expect(eligibility).toHaveAttribute("aria-modal", "true");
        await eligibility
          .getByRole("button", { name: "Close", exact: true })
          .click();
      } else {
        await expect(eligibility).toBeFocused();
        await page.keyboard.press("Tab");
        await expect(
          eligibility.getByRole("link", { name: "Get nominated", exact: true })
        ).toBeFocused();
        await page.keyboard.press("Escape");
      }
      await expect(eligibility).toHaveCount(0);
      await expect(trigger).toBeFocused();
    }
    await expectNoHorizontalOverflow(page);
  });

  test("Guided welcome keeps About editing in the profile editor", async ({
    page,
    baseURL,
    isMobile,
  }) => {
    await seedGettingStartedSession(page);
    await observeGettingStartedScroll(page);
    const api = getSandboxApiOrigin(baseURL);
    await installStatements(page, api);
    await openOwnProfile(page);
    const guidance = page.getByRole("region", {
      name: "Getting started with your identity",
      exact: true,
    });
    const editProfile = page.getByRole("button", {
      name: "Edit profile",
      exact: true,
    });
    await expect(
      guidance.getByRole("button", { name: /About statement/ })
    ).toHaveCount(0);
    await openAboutEditor(page);
    const input = page.getByRole("textbox", {
      name: "About statement",
      exact: true,
    });
    await expect(input).toBeVisible();
    await input.fill("This introduction is cancelled.");
    await page.keyboard.press("Escape");
    if (!isMobile) {
      await page
        .getByRole("button", { name: "Discard changes", exact: true })
        .click();
    }
    await expect(input).toHaveCount(0);
    await expect(editProfile).toBeFocused();
    await openAboutEditor(page);
    await expect(input).toBeEmpty();
    const draft = "A new member exploring art and community decisions.";
    await input.fill(draft);
    let failNextSave = true;
    await page.route(`${api}/api/profiles/*/cic/statements`, (route) => {
      if (route.request().method() === "POST" && failNextSave) {
        failNextSave = false;
        return route.fulfill({ status: 400, json: { error: "Unavailable" } });
      }
      return route.fallback();
    });
    const save = page.getByRole("button", { name: "Save", exact: true });
    await save.click();
    await expect(
      page.getByRole("heading", { name: "Couldn't save About", exact: true })
    ).toBeVisible();
    await expect(input).toHaveValue(draft);
    await expect(save).toBeEnabled();
    await save.click();
    await expect(input).toHaveCount(0);
    await expect(
      guidance.getByRole("button", { name: /About statement/ })
    ).toHaveCount(0);
    await expect(editProfile).toBeFocused();
    await expect(page.getByText(draft, { exact: true })).toBeVisible();
    await openAboutEditor(page);
    await expect(input).toHaveValue(draft);
    await page.keyboard.press("Escape");
    await expect(input).toHaveCount(0);
    expect(await getGettingStartedScrolls(page)).toEqual([]);
    await expectNoHorizontalOverflow(page);
  });

  test("hydrates a saved owner session on a direct profile load and reload", async ({
    page,
    baseURL,
    isMobile,
  }, testInfo) => {
    const hydrationWarnings: string[] = [];
    page.on("console", (message) => {
      if (
        message.type() === "error" &&
        /hydration|hydrated|server rendered|did not match|didn't match/i.test(
          message.text()
        )
      ) {
        hydrationWarnings.push(message.text());
      }
    });
    await seedSession(page);
    await installStatements(page, getSandboxApiOrigin(baseURL));
    await installHostedWalletReads(page);
    await page.goto("/playwright");
    const edit = page.getByRole("button", {
      name: "Edit profile",
      exact: true,
    });
    const tabs = page.getByRole("navigation", { name: "Profile sections" });
    for (const load of ["direct", "reload"]) {
      if (load === "reload") await page.reload();
      await expect(edit).toBeVisible({
        timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
      });
      await expect(edit).toHaveCount(1);
      await expect(
        page.getByRole("link", { name: "Preferences", exact: true })
      ).toBeVisible();
      if ((page.viewportSize()?.width ?? 0) < 1024) {
        const preferences = page.getByRole("link", {
          name: "Preferences",
          exact: true,
        });
        const heading = page.getByRole("heading", {
          name: "playwright",
          exact: true,
        });
        const [editBox, preferencesBox, headingBox] = await Promise.all([
          edit.boundingBox(),
          preferences.boundingBox(),
          heading.boundingBox(),
        ]);
        if (!editBox || !preferencesBox || !headingBox) {
          throw new Error("Owner header controls must have visible bounds");
        }
        expect(editBox.y + editBox.height).toBeLessThan(headingBox.y);
        expect(Math.abs(editBox.y - preferencesBox.y)).toBeLessThanOrEqual(4);
        expect(preferencesBox.x).toBeGreaterThan(editBox.x);
        expect(preferencesBox.x + preferencesBox.width).toBeGreaterThan(
          (page.viewportSize()?.width ?? 0) - 64
        );
      }
      await expect(
        tabs.getByRole("link", { name: "Brain", exact: true })
      ).toBeVisible();
      await expect(
        tabs.getByRole("link", { name: "Proxy", exact: true })
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: /^Open your following list:/ })
      ).toBeVisible();
      const statementsTab = page.getByRole("button", {
        name: /^ID Statements/,
      });
      if (await statementsTab.isVisible()) await statementsTab.click();
      await expect(
        page.getByRole("button", { name: "Add", exact: true })
      ).toBeVisible();
      await expectNoHorizontalOverflow(page);
      expect(hydrationWarnings, `${load} hydration console warnings`).toEqual(
        []
      );
    }
    await testInfo.attach("cold-owner-profile", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    if (isMobile) await edit.click();
    else await edit.press("Enter");
    const about = page.getByRole("button", { name: "About", exact: true });
    if (await about.isVisible()) await about.click();
    await expect(
      page.getByRole("textbox", { name: "About statement", exact: true })
    ).toBeVisible();
    await page.getByRole("button", { name: "Close", exact: true }).click();
  });

  test("adds, edits and removes About through the profile editor", async ({
    page,
    baseURL,
    isMobile,
  }, testInfo) => {
    await seedSession(page);
    await installStatements(page, getSandboxApiOrigin(baseURL));
    await openOwnProfile(page);
    const edit = page.getByRole("button", {
      name: "Edit profile",
      exact: true,
    });
    await expect(
      page.getByRole("button", { name: /^(Add|Edit) About statement$/ })
    ).toHaveCount(0);
    if (isMobile)
      expect((await edit.boundingBox())?.height).toBeGreaterThanOrEqual(44);
    else {
      await edit.focus();
      await page.keyboard.press("Shift+Tab");
      await page.keyboard.press("Tab");
      await expect(edit).toBeFocused();
    }
    await page.screenshot({ path: testInfo.outputPath("empty-profile.png") });
    await openAboutEditor(page);
    const input = page.getByRole("textbox", {
      name: "About statement",
      exact: true,
    });
    const save = page.getByRole("button", { name: "Save", exact: true });
    if (!isMobile) {
      await expect(
        page.getByRole("textbox", { name: "Profile name", exact: true })
      ).toBeVisible();
      for (const name of ["Profile cover", "Profile picture"])
        await expect(
          page.getByRole("heading", { name, exact: true })
        ).toBeVisible();
    }
    await expect(save).toBeDisabled();
    await input.fill(LONG_ABOUT);
    await save.click();
    await expect(input).toHaveCount(0);
    await expect(page.getByText(LONG_ABOUT, { exact: true })).toBeVisible();
    if (isMobile) {
      await page.getByRole("button", { name: "See more", exact: true }).click();
      await expect(
        page.getByRole("button", { name: "See less", exact: true })
      ).toBeVisible();
      await page.getByRole("button", { name: "See less", exact: true }).click();
      await expect(input).toHaveCount(0);
    }
    await openAboutEditor(page);
    await expect(input).toHaveValue(LONG_ABOUT);
    await input.fill("Updated About statement for this isolated test.");
    await save.click();
    await expect(input).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
    await expectAxeClean(page, { include: ["#profile-about"] });
    await openAboutEditor(page);
    await expect(input).toHaveValue(
      "Updated About statement for this isolated test."
    );
    await input.fill("");
    await expect(input).toBeEmpty();
    await expect(save).toBeEnabled();
    await save.click();
    await expect(input).toHaveCount(0);
    await expect(
      page.getByText("Updated About statement for this isolated test.", {
        exact: true,
      })
    ).toHaveCount(0);
    await openAboutEditor(page);
    await expect(input).toBeEmpty();
    await expect(save).toBeDisabled();
  });

  test("retains the draft on save errors and moderation warnings", async ({
    page,
    baseURL,
    isMobile,
  }) => {
    await seedSession(page);
    await installStatements(page, getSandboxApiOrigin(baseURL));
    await openOwnProfile(page);
    await openAboutEditor(page);
    const input = page.getByRole("textbox", {
      name: "About statement",
      exact: true,
    });
    const save = page.getByRole("button", { name: "Save", exact: true });
    const failures = [
      ["Unavailable", "Couldn't save About"],
      ["About statement rejected for hate speech", "Hate speech warning"],
      [
        "About statement rejected for personal insults",
        "Personal insult warning",
      ],
      ["About statement denied for inappropriate language", "Language warning"],
      [
        "About statement rejected for doxxing of another person",
        "Privacy warning",
      ],
    ] as const;
    for (const [error, title] of failures) {
      await page.route(
        `${getSandboxApiOrigin(baseURL)}/api/profiles/*/cic/statements`,
        (route) =>
          route.request().method() === "POST"
            ? route.fulfill({ status: 400, json: { error } })
            : route.fallback()
      );
      await input.fill(`Safe draft for the ${title} fixture.`);
      const draft = await input.inputValue();
      await save.click();
      await expect(
        page.getByRole("heading", { name: title, exact: true })
      ).toBeVisible();
      await expect(input).toHaveValue(draft);
      await expect(input).toHaveAttribute(
        "aria-invalid",
        error === "Unavailable" ? "false" : "true"
      );
      await expect(input).toHaveAttribute(
        "aria-describedby",
        /profile-about-error/
      );
      await expect(save).toBeEnabled();
    }
    await page.keyboard.press("Escape");
    if (!isMobile) {
      await expect(
        page.getByRole("heading", { name: "Discard your changes?" })
      ).toBeVisible();
      await page
        .getByRole("button", { name: "Keep editing", exact: true })
        .click();
      await expect(input).toBeVisible();
      await page.getByRole("button", { name: "Cancel", exact: true }).click();
      await page
        .getByRole("button", { name: "Discard changes", exact: true })
        .click();
    }
    await expect(input).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Edit profile", exact: true })
    ).toBeFocused();
  });

  test("uses the existing field menu in narrow desktop windows", async ({
    page,
    isMobile,
  }) => {
    test.skip(
      isMobile,
      "The mobile owner journey covers the small-screen menu."
    );
    await seedSession(page);
    await openOwnProfile(page);
    await page.setViewportSize({ width: 600, height: 850 });
    await page
      .getByRole("button", { name: "Edit profile", exact: true })
      .press("Enter");
    for (const name of [
      "Profile cover",
      "Profile picture",
      "Profile name",
      "Classification",
      "About",
    ])
      await expect(
        page.getByRole("button", { name, exact: true })
      ).toBeVisible();
    await page.getByRole("button", { name: "About", exact: true }).click();
    await expect(
      page.getByRole("textbox", { name: "About statement", exact: true })
    ).toBeVisible();
    await page.getByRole("button", { name: "Back", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "About", exact: true })
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expectNoHorizontalOverflow(page);
  });

  test("opens all fields on wide touch and hybrid screens", async ({
    page,
    isMobile,
    browserName,
  }, testInfo) => {
    if (!isMobile)
      await page.addInitScript(() => {
        Object.defineProperty(navigator, "maxTouchPoints", {
          configurable: true,
          get: () => 5,
        });
      });
    await seedSession(page);
    await openOwnProfile(page);
    const edit = page.getByRole("button", {
      name: "Edit profile",
      exact: true,
    });
    const preferences = page.getByRole("link", {
      name: "Preferences",
      exact: true,
    });
    if (isMobile) {
      await page.setViewportSize({ width: 800, height: 900 });
      expect((await edit.boundingBox())?.height).toBeGreaterThanOrEqual(44);
      expect((await preferences.boundingBox())?.height).toBeGreaterThanOrEqual(
        44
      );
      await edit.click();
      await page.getByRole("button", { name: "About", exact: true }).click();
      const back = page.getByRole("button", { name: "Back", exact: true });
      expect((await back.boundingBox())?.height).toBeGreaterThanOrEqual(44);
      await back.click();
      const close = page.getByRole("button", { name: "Close", exact: true });
      expect((await close.boundingBox())?.height).toBeGreaterThanOrEqual(44);
      await close.click();
    }
    await page.setViewportSize({ width: 1024, height: 900 });
    if (isMobile) {
      expect((await edit.boundingBox())?.height).toBeGreaterThanOrEqual(44);
      expect((await preferences.boundingBox())?.height).toBeGreaterThanOrEqual(
        44
      );
    }
    await edit.click();
    if (isMobile) {
      const close = page.getByRole("button", { name: "Close", exact: true });
      expect((await close.boundingBox())?.height).toBeGreaterThanOrEqual(44);
      for (const name of ["Gradient", "Image"]) {
        const tab = page.getByRole("tab", { name, exact: true });
        expect((await tab.boundingBox())?.height).toBeGreaterThanOrEqual(44);
      }
    }
    await expect(
      page.getByRole("heading", { name: "Edit profile", exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("textbox", { name: "Profile name", exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("textbox", { name: "About statement", exact: true })
    ).toBeVisible();
    const aboutInput = page.getByRole("textbox", {
      name: "About statement",
      exact: true,
    });
    const colorLabel = page.getByText("Background Color 1", { exact: true });
    await expect(colorLabel).toHaveCSS("cursor", "pointer");
    for (const name of ["Background Color 1", "Background Color 2"]) {
      const input = page.getByLabel(name, { exact: true });
      await input.evaluate((element) => {
        // Capture native label activation without opening the OS color picker.
        element.addEventListener(
          "click",
          (event) => {
            event.preventDefault();
            element.dataset["pickerActivated"] = "true";
          },
          { once: true }
        );
      });
      await page
        .getByLabel(name, { exact: true })
        .locator("../..")
        .click({ position: { x: 2, y: 2 } });
      await expect(input).toHaveAttribute("data-picker-activated", "true");
    }
    if (!isMobile) {
      const colorRow = page
        .getByLabel("Background Color 1", { exact: true })
        .locator("../..");
      const restingBackground = await colorRow.evaluate(
        (element) => getComputedStyle(element).backgroundColor
      );
      await colorLabel.hover();
      await expect(colorRow).not.toHaveCSS(
        "background-color",
        restingBackground
      );
      await aboutInput.focus();
      await aboutInput.hover();
      await expect(
        page
          .getByRole("textbox", { name: "About statement", exact: true })
          .locator("..")
      ).toHaveCSS("box-shadow", /rgb\(82, 139, 255\)/);
    }
    const gradient = await page
      .getByRole("tab", { name: "Gradient", exact: true })
      .boundingBox();
    const colorRow = await page
      .getByLabel("Background Color 1", { exact: true })
      .locator("../..")
      .boundingBox();
    expect(gradient).not.toBeNull();
    expect(colorRow).not.toBeNull();
    expect(Math.abs(gradient!.x - colorRow!.x)).toBeLessThanOrEqual(2);
    const memeSearch = page.getByRole("textbox", {
      name: "Select Meme",
      exact: true,
    });
    await expect(memeSearch).toBeVisible();
    const uploadChoice = page
      .getByLabel("Upload image", { exact: true })
      .locator("..");
    const memeBox = await memeSearch.boundingBox();
    const uploadBox = await uploadChoice.boundingBox();
    expect(memeBox?.height).toBeGreaterThanOrEqual(44);
    expect(memeBox?.width).toBeCloseTo(uploadBox!.width, 0);
    await expect(
      page
        .getByRole("region", { name: "Profile picture", exact: true })
        .getByText("or", { exact: true })
    ).toBeVisible();
    await page.getByLabel("Background Color 1", { exact: true }).focus();
    // WebKit uses Option-Tab to include native clickable controls.
    await page.keyboard.press(browserName === "webkit" ? "Alt+Tab" : "Tab");
    const secondColor = page.getByLabel("Background Color 2", { exact: true });
    if (browserName === "webkit") {
      // Native color wells are skipped in WebKit's sequential focus order:
      // https://bugs.webkit.org/show_bug.cgi?id=194756
      await expect(memeSearch).toBeFocused();
      // Keep keyboard modality while checking the native control's outline.
      await secondColor.focus();
    }
    await expect(secondColor).toBeFocused();
    await expect(secondColor).toHaveCSS("outline-style", "solid");
    await expect(secondColor).toHaveCSS("outline-width", "2px");
    await expect(secondColor).toHaveCSS("outline-offset", "2px");
    await expect(secondColor).toHaveCSS("outline-color", "rgb(82, 139, 255)");
    await page.screenshot({
      path: testInfo.outputPath("profile-color-keyboard-focus.png"),
    });
    await page
      .getByRole("heading", { name: "Profile picture", exact: true })
      .click();
    await expect(
      page
        .getByRole("dialog", { name: "Edit profile", exact: true })
        .getByRole("list")
    ).toHaveCount(0);
    const aboutTop = await aboutInput.evaluate(
      (element: HTMLTextAreaElement) => element.offsetTop
    );
    const classification = page.getByRole("button", {
      name: /^Profile classification /,
    });
    await classification.click();
    await expect(
      page
        .getByRole("dialog", { name: "Edit profile", exact: true })
        .getByRole("list")
    ).toBeVisible();
    await expect(
      page
        .getByRole("dialog", { name: "Edit profile", exact: true })
        .getByRole("list")
        .locator("../..")
    ).toHaveCSS("opacity", "1");
    await expect
      .poll(() =>
        aboutInput.evaluate((element: HTMLTextAreaElement) => element.offsetTop)
      )
      .toBe(aboutTop);
    await expectNoHorizontalOverflow(page);
    await expectAxeClean(page, { include: ['[role="dialog"]'] });
    await page.screenshot({
      path: testInfo.outputPath("profile-classification-overlay.png"),
    });
    await classification.click();
    await expect(
      page
        .getByRole("dialog", { name: "Edit profile", exact: true })
        .getByRole("list")
    ).toHaveCount(0);
    await expectAxeClean(page, { include: ['[role="dialog"]'] });
    await page.screenshot({ path: testInfo.outputPath("profile-editor.png") });
    await page
      .getByRole("textbox", { name: "About statement", exact: true })
      .fill("Unsaved touch QA draft");
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    const discardDialog = page.getByRole("dialog", {
      name: "Discard your changes?",
      exact: true,
    });
    const background = await discardDialog
      .getByTestId("mobile-dialog-header")
      .evaluate((header) => {
        const surface = header.parentElement?.parentElement;
        return surface ? getComputedStyle(surface).backgroundColor : null;
      });
    expect(background).toMatch(/^rgb\(/);
    await expect
      .poll(() =>
        discardDialog.getByTestId("mobile-dialog-header").evaluate((header) => {
          let opacity = 1;
          let node: Element | null = header;
          while (node) {
            opacity *= Number(getComputedStyle(node).opacity);
            node = node.parentElement;
          }
          return opacity;
        })
      )
      .toBe(1);
    await page.screenshot({
      path: testInfo.outputPath("discard-profile-changes.png"),
    });
    const discard = page.getByRole("button", {
      name: "Discard changes",
      exact: true,
    });
    if (isMobile) {
      const keepEditing = page.getByRole("button", {
        name: "Keep editing",
        exact: true,
      });
      expect((await discard.boundingBox())?.height).toBeGreaterThanOrEqual(44);
      expect((await keepEditing.boundingBox())?.height).toBeGreaterThanOrEqual(
        44
      );
    }
    await discard.click();
    await expectNoHorizontalOverflow(page);
  });

  for (const width of [1024, 390]) {
    test(`shows Meme search immediately while options load at ${width}px`, async ({
      page,
      baseURL,
    }, testInfo) => {
      await seedSession(page);
      await openOwnProfile(page);
      await page.setViewportSize({ width, height: 900 });
      let requestStarted = false;
      let release: (() => void) | undefined;
      const responseReady = new Promise<void>((resolve) => {
        release = resolve;
      });
      await page.route(
        `${getSandboxApiOrigin(baseURL)}/api/memes_lite`,
        async (route) => {
          requestStarted = true;
          await responseReady;
          await route.fulfill({
            json: {
              data: [
                {
                  id: 1,
                  name: "Fixture Meme",
                  animation: null,
                  contract: "0x0000000000000000000000000000000000000001",
                  icon: null,
                  image: `${baseURL}/6529bgwhite.svg`,
                  scaled: `${baseURL}/6529bgwhite.svg`,
                  thumbnail: `${baseURL}/6529bgwhite.svg`,
                  artist: null,
                },
              ],
            },
          });
        }
      );
      try {
        await page
          .getByRole("button", { name: "Edit profile", exact: true })
          .click();
        if (width < 1024) {
          await page
            .getByRole("button", { name: "Profile picture", exact: true })
            .click();
        }
        await expect.poll(() => requestStarted).toBe(true);
        const search = page.getByRole("textbox", {
          name: "Select Meme",
          exact: true,
        });
        await expect(search).toBeVisible();
        await expect(search).toBeEditable();
        if (width === 1024)
          await expect(
            page.getByText("Loading Memes…", { exact: true })
          ).toBeVisible();
        await expect(
          page.getByRole("button", { name: "Choose a Meme", exact: true })
        ).toHaveCount(0);
        await expect(
          page
            .getByLabel("Upload image", { exact: true })
            .locator("..")
            .locator("svg")
        ).toBeVisible();
        await page.screenshot({
          path: testInfo.outputPath("profile-meme-search-loading.png"),
          scale: "css",
        });
        await search.fill("Fixture");
        release?.();
        const meme = page.getByRole("button", {
          name: "#1 Fixture Meme",
          exact: true,
        });
        await expect(meme).toBeVisible();
        await expect(search).toHaveValue("Fixture");
        await meme.click();
        await expect(meme).toHaveCount(0);
        await expect(
          page.getByRole("img", { name: "Profile image", exact: true })
        ).toBeVisible();
        await expect(
          page.getByLabel("Upload image", { exact: true })
        ).toBeAttached();
        await expect(search).toBeEditable();
        await expect(
          page
            .getByLabel("Upload image", { exact: true })
            .locator("..")
            .getByRole("img", { name: "Profile image", exact: true })
        ).toBeVisible();
        const searchBox = await search.boundingBox();
        const previewBox = await page
          .getByRole("img", { name: "Profile image", exact: true })
          .boundingBox();
        expect(previewBox!.y).toBeGreaterThanOrEqual(
          searchBox!.y + searchBox!.height
        );
        await expect(
          page.getByRole("button", {
            name: width === 1024 ? "Save" : "Save PFP",
            exact: true,
          })
        ).toBeEnabled();
        await expectNoHorizontalOverflow(page);
        await expectAxeClean(page, { include: ['[role="dialog"]'] });
        await page.screenshot({
          path: testInfo.outputPath("profile-meme-search-selected.png"),
          scale: "css",
        });
        await page.getByLabel("Upload image", { exact: true }).setInputFiles({
          name: "replacement.png",
          mimeType: "image/png",
          buffer: Buffer.from(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aDTsAAAAASUVORK5CYII=",
            "base64"
          ),
        });
        await expect(
          page.getByRole("img", { name: "Profile image", exact: true })
        ).toHaveAttribute("src", /^blob:/);
        await search.click();
        await expect(meme).toBeVisible();
        await meme.click();
        await expect(
          page.getByRole("img", { name: "Profile image", exact: true })
        ).not.toHaveAttribute("src", /^blob:/);
        if (width === 1024) {
          await page
            .getByRole("button", { name: "Cancel", exact: true })
            .click();
          await page
            .getByRole("button", { name: "Discard changes", exact: true })
            .click();
        } else {
          await page
            .getByRole("button", { name: "Close", exact: true })
            .click();
        }
      } finally {
        release?.();
      }
    });
  }

  test("keeps the compact field editors consistent in the mobile menu", async ({
    page,
  }, testInfo) => {
    await seedSession(page);
    await openOwnProfile(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page
      .getByRole("button", { name: "Edit profile", exact: true })
      .click();
    const dialog = page.getByRole("dialog");
    await expect
      .poll(() =>
        dialog.getByTestId("mobile-dialog-header").evaluate((header) => {
          let opacity = 1;
          let node: Element | null = header;
          while (node) {
            opacity *= Number(getComputedStyle(node).opacity);
            node = node.parentElement;
          }
          return opacity;
        })
      )
      .toBe(1);
    await expectAxeClean(page, { include: ['[role="dialog"]'] });
    await page.screenshot({
      path: testInfo.outputPath("profile-mobile-menu.png"),
      scale: "css",
    });
    for (const target of [
      "Profile cover",
      "Profile picture",
      "Profile name",
      "Classification",
      "About",
    ]) {
      const row = dialog.getByRole("button", { name: target, exact: true });
      expect((await row.boundingBox())?.height).toBeGreaterThanOrEqual(44);
      await row.click();
      if (target === "Profile cover") {
        await expect(
          page.getByRole("tab", { name: "Gradient", exact: true })
        ).toHaveAttribute("aria-selected", "true");
        const input = page.getByLabel("Background Color 1", { exact: true });
        expect((await input.boundingBox())?.width).toBe(32);
        await page.getByRole("tab", { name: "Image", exact: true }).click();
        await expect(
          page.getByLabel("Upload profile cover", { exact: true })
        ).toBeAttached();
        await expect(
          page
            .getByLabel("Upload profile cover", { exact: true })
            .locator("..")
            .locator("svg")
        ).toBeVisible();
      } else if (target === "Profile picture") {
        await expect(
          page.getByRole("textbox", { name: "Select Meme", exact: true })
        ).toBeVisible();
        await expect(
          page.getByLabel("Upload image", { exact: true })
        ).toBeAttached();
        await expect(
          dialog.getByRole("button", { name: "Save PFP", exact: true })
        ).toBeDisabled();
      } else if (target === "Profile name") {
        await expect(
          page.getByRole("textbox", { name: "Username", exact: true })
        ).toBeVisible();
      } else if (target === "Classification") {
        await page
          .getByRole("button", { name: /^Profile classification / })
          .click();
        await expect(dialog.getByRole("list")).toBeVisible();
        await expect(dialog.getByRole("list").locator("../..")).toHaveCSS(
          "opacity",
          "1"
        );
      } else {
        await expect(
          page.getByRole("textbox", { name: "About statement", exact: true })
        ).toBeVisible();
      }
      const spacing = await page
        .getByTestId("mobile-dialog-header")
        .evaluate((header) => {
          const surface = header.parentElement?.parentElement;
          const heading = header.lastElementChild?.lastElementChild;
          const field =
            header.nextElementSibling?.querySelector("form")?.firstElementChild;
          if (!surface || !heading || !field)
            throw new Error("Missing editor layout");
          const surfaceBox = surface.getBoundingClientRect();
          const headingBox = heading.getBoundingClientRect();
          const fieldBox = field.getBoundingClientRect();
          return {
            headerGap: fieldBox.top - headingBox.bottom,
            leftGutter: fieldBox.left - surfaceBox.left,
            rightGutter: surfaceBox.right - fieldBox.right,
          };
        });
      expect(spacing.headerGap).toBeGreaterThanOrEqual(19);
      expect(spacing.leftGutter).toBeGreaterThanOrEqual(19);
      expect(spacing.rightGutter).toBeGreaterThanOrEqual(19);
      await expect(
        page.getByRole("button", {
          name: target === "Profile picture" ? "Save PFP" : "Save",
          exact: true,
        })
      ).toBeInViewport();
      await expectNoHorizontalOverflow(page);
      await expectAxeClean(page, { include: ['[role="dialog"]'] });
      await page.screenshot({
        path: testInfo.outputPath(
          `profile-mobile-${target.toLowerCase().replaceAll(" ", "-")}.png`
        ),
        scale: "css",
      });
      await page.getByRole("button", { name: "Back", exact: true }).click();
    }
    await page.getByRole("button", { name: "Close", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Edit profile", exact: true })
    ).toBeFocused();
  });

  for (const viewer of ["visitor", "logged out", "proxy"] as const) {
    test(`never flashes owner actions for ${viewer}`, async ({
      page,
      baseURL,
    }, testInfo) => {
      if (viewer !== "logged out")
        await seedSession(page, viewer === "proxy" ? "grantor" : null);
      if (viewer === "visitor") {
        await page.route(
          `${getSandboxApiOrigin(baseURL)}/api/**identities/following-artist-0/subscriptions`,
          (route) => route.fulfill({ json: { actions: [] } })
        );
      }
      if (viewer === "proxy") {
        await page.route(
          `${getSandboxApiOrigin(baseURL)}/api/profiles/*/proxies/**`,
          (route) =>
            route.fulfill({
              json: [
                {
                  id: "proxy",
                  created_by: { id: "grantor", handle: "grantor", pfp: null },
                  granted_to: {
                    id: PROFILE_ID,
                    handle: "playwright",
                    pfp: null,
                  },
                  actions: [
                    {
                      action_type: "ALLOCATE_REP",
                      credit_amount: 50,
                      credit_spent: 0,
                      is_active: true,
                      accepted_at: 1,
                    },
                  ],
                },
              ],
            })
        );
      }
      await page.addInitScript(() => {
        const observer = new MutationObserver(() => {
          if (document.querySelector('[aria-label="Edit profile"]')) {
            document.documentElement.dataset["aboutControlFlashed"] = "true";
          }
          if (
            document.querySelector('[data-testid="collected-purchase-actions"]')
          ) {
            document.documentElement.dataset["collectedActionsFlashed"] =
              "true";
          }
        });
        observer.observe(document, { childList: true, subtree: true });
      });
      if (viewer === "proxy") {
        await openOwnProfile(page, false);
      } else {
        await page.goto(
          viewer === "visitor" ? "/following-artist-0" : "/playwright"
        );
      }
      await expect(
        page.getByRole("navigation", { name: "Profile sections" })
      ).toBeVisible();
      if (viewer === "visitor") {
        await expect(
          page.getByRole("button", { name: "Follow", exact: true })
        ).toBeVisible();
      }
      await expect(
        page.getByRole("button", { name: "Edit profile", exact: true })
      ).toHaveCount(0);
      await expect(page.locator("html")).not.toHaveAttribute(
        "data-about-control-flashed"
      );
      if (viewer === "proxy") {
        // A new document restores the saved proxy token before proxy details arrive.
        await page.goto("/playwright/collected?details=closed");
        await expect(
          page.getByRole("main").locator('[data-profile-section="Filters"]')
        ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
        await expectPersonalCollectedActionsAbsent(page);
        // The profile shell can render before the saved proxy has been restored.
        await expectResolvedProxy(page);
        await expectPersonalCollectedActionsAbsent(page);
        await expect(page.locator("html")).not.toHaveAttribute(
          "data-collected-actions-flashed"
        );
        await page.screenshot({
          path: testInfo.outputPath("collected-proxy.png"),
          fullPage: true,
        });
      }
    });
  }
});

async function expectResolvedProxy(page: Page) {
  const needsMenu = (page.viewportSize()?.width ?? 0) < 1024;
  if (needsMenu) {
    await page.getByRole("button", { name: "Open menu", exact: true }).click();
  }
  const grantorProfile = page.getByRole("link", {
    name: "Open grantor profile",
    exact: true,
  });
  const accountMenu = page.getByRole("button", {
    name: "Open account and profiles menu",
    exact: true,
  });
  await expect(grantorProfile.or(accountMenu)).toBeVisible();
  if (await accountMenu.isVisible()) {
    await accountMenu.press("Enter");
    await expect(
      page.getByRole("button", { name: "grantor Proxy", exact: true })
    ).toHaveAttribute("aria-pressed", "true");
    await accountMenu.press("Enter");
  } else {
    await expect(grantorProfile).toBeVisible();
  }
  if (needsMenu) {
    const overlay = page.getByRole("button", {
      name: "Close menu overlay",
      exact: true,
    });
    // The drawer covers the overlay's center; activate its keyboard control.
    if (await overlay.isVisible()) await overlay.press("Enter");
    else
      await page
        .getByRole("button", { name: "Close menu", exact: true })
        .click();
    await expect(
      page.getByRole("button", { name: "Open menu", exact: true })
    ).toBeVisible();
  }
}

async function expectCollectedActionAlignment(page: Page) {
  const viewport = page.viewportSize();
  for (const width of [360, 390, 430, 520, 639, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    const actions = await page
      .getByRole("link", { name: "Manage orders", exact: true })
      .evaluate((orders) => {
        const row = orders.parentElement!;
        const rowBounds = row.getBoundingClientRect();
        const complete = row.querySelector("a")!.getBoundingClientRect();
        const manage = orders.getBoundingClientRect();
        const style = getComputedStyle(row);
        const left = rowBounds.left + Number.parseFloat(style.paddingLeft);
        const right = rowBounds.right - Number.parseFloat(style.paddingRight);
        const naturalWidth = (element: Element) => {
          const measurement = element.cloneNode(true) as HTMLElement;
          measurement.style.position = "fixed";
          measurement.style.visibility = "hidden";
          measurement.style.setProperty("width", "max-content", "important");
          measurement.style.setProperty("min-width", "0", "important");
          measurement.style.setProperty("max-width", "none", "important");
          row.appendChild(measurement);
          const width = measurement.getBoundingClientRect().width;
          measurement.remove();
          return width;
        };
        return {
          // Intrinsic sizes cannot inherit a full-width flex-item regression.
          fits:
            right - left >=
            naturalWidth(row.querySelector("a")!) +
              naturalWidth(orders) +
              Number.parseFloat(style.columnGap),
          centers: Math.abs(
            complete.y + complete.height / 2 - manage.y - manage.height / 2
          ),
          leftInset: Math.abs(complete.left - left),
          rightInset: Math.abs(manage.right - right),
          stackedLeftInset: Math.abs(manage.left - left),
          stackedGap: manage.top - complete.bottom,
        };
      });
    expect(actions.leftInset).toBeLessThanOrEqual(1);
    if (actions.fits) {
      expect(actions.centers).toBeLessThanOrEqual(1);
      expect(actions.rightInset).toBeLessThanOrEqual(1);
    } else {
      expect(actions.stackedLeftInset).toBeLessThanOrEqual(1);
      expect(actions.stackedGap).toBeGreaterThanOrEqual(8);
    }
    await expectNoHorizontalOverflow(page);
  }
  if (viewport) await page.setViewportSize(viewport);
}

async function holdConnectedIdentity(page: Page) {
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  const identityResponse = page.waitForResponse((response) =>
    new URL(response.url()).pathname
      .toLowerCase()
      .endsWith(`/identities/${WALLET.toLowerCase()}`)
  );
  // This query is enabled only after AuthProvider has accepted the connected identity.
  const connectedProfileRead = page.waitForResponse((response) =>
    /\/profiles\/playwright\/proxies\/?$/.test(new URL(response.url()).pathname)
  );
  await page.route(
    new RegExp(`/identities/${WALLET}/?$`, "i"),
    async (route) => {
      await held;
      await route.continue();
    }
  );
  return async () => {
    release();
    const response = await identityResponse;
    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject({
      id: PROFILE_ID,
      handle: "playwright",
    });
    await response.finished();
    expect((await connectedProfileRead).status()).toBe(200);
  };
}

async function expectSeasonOneCollectedSource(page: Page) {
  await expectUrlState(
    page,
    (url) =>
      url.pathname === "/playwright/collected" &&
      url.searchParams.get("collection") === "memes" &&
      url.searchParams.get("szn") === "1" &&
      url.searchParams.get("details") === "closed"
  );
  await expect(
    page.getByRole("button", { name: "Season: SZN1", exact: true })
  ).toBeVisible();
}

async function installCollectedArtwork(page: Page) {
  // Real card rows keep the source scrollable at the full geometry-test height.
  const cards: CollectedCard[] = Array.from({ length: 12 }, (_, index) => ({
    collection: CollectedCollectionType.MEMES,
    token_id: index + 1,
    token_name: `Season 1 artwork ${index + 1}`,
    img: "/artwork-documentation/examples/an-alteration.png",
    tdh: 1,
    rank: index + 1,
    seized_count: 1,
    szn: 1,
  }));
  await page.route(/\/api\/+profiles\/[^/]+\/collected(?:\?|$)/, (route) =>
    route.fulfill({
      json: { data: cards, count: cards.length, page: 1, next: false },
    })
  );
}

async function openOwnCollected(page: Page) {
  await openOwnProfile(page);
  await page
    .getByRole("navigation", { name: "Profile sections" })
    .getByRole("link", { name: "Collected", exact: true })
    .click();
  await expect(
    page.getByRole("main").locator('[data-profile-section="Filters"]')
  ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
}

test.describe("Collected personal actions @auth @medium @local-only", () => {
  useLocalSandboxMutationGuard(
    test,
    "PLAYWRIGHT_AUTH_SANDBOX",
    "Collected owner actions require the isolated mock API."
  );
  test.beforeEach(async ({ page, baseURL }) => {
    await installHostedWalletReads(page);
    await page.route(
      `${getSandboxApiOrigin(baseURL)}/api/**identities/*/subscriptions`,
      (route) => route.fulfill({ json: { actions: [] } })
    );
  });

  for (const viewer of ["anonymous", "visitor"] as const) {
    test(`omits the actions and their row for the ${viewer} view`, async ({
      page,
    }, testInfo) => {
      if (viewer === "visitor") await seedSession(page);
      const finishIdentityRestore =
        viewer === "visitor" ? await holdConnectedIdentity(page) : null;
      const handle = viewer === "visitor" ? "following-artist-0" : "playwright";
      try {
        await page.goto(`/${handle}/collected?collection=memes&details=closed`);
        await expect(
          page.getByRole("main").locator('[data-profile-section="Filters"]')
        ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
        await expectPersonalCollectedActionsAbsent(page);
      } finally {
        await finishIdentityRestore?.();
      }
      // Repeat after the connected profile has resolved, rather than only during loading.
      await expectPersonalCollectedActionsAbsent(page);
      await page.getByRole("button", { name: "Details", exact: true }).click();
      await expect(
        page.getByRole("button", { name: "Hide Details", exact: true })
      ).toBeVisible();
      await expectPersonalCollectedActionsAbsent(page);
      await expectNoHorizontalOverflow(page);
      await page.screenshot({
        path: testInfo.outputPath(`collected-${viewer}.png`),
        fullPage: true,
      });
    });
  }

  test("keeps owner action alignment, filters and Back restoration", async ({
    page,
  }, testInfo) => {
    // Two initially cold destination routes compile in this local dev-server pack.
    test.setTimeout(90_000);
    await seedSession(page);
    await installCollectedArtwork(page);
    await openOwnCollected(page);
    await page.screenshot({
      path: testInfo.outputPath("collected-owner.png"),
      fullPage: true,
    });
    if (testInfo.project.name === "capacitor-ios-sim") {
      await expectPersonalCollectedActionsAbsent(page);
      return;
    }
    await expect(page.getByTestId("collected-purchase-actions")).toBeVisible();
    await expectCollectedActionAlignment(page);
    const isNative = isCapacitorSimulationProject(testInfo.project.name);
    for (const action of ["Manage orders", "Complete my set"]) {
      await page.goto(
        "/playwright/collected?collection=memes&szn=1&details=closed"
      );
      await expectSeasonOneCollectedSource(page);
      const link = page.getByRole("link", { name: action, exact: true });
      await expect(
        page
          .getByRole("list", { name: "Collected cards", exact: true })
          .getByRole("listitem")
      ).toHaveCount(12);
      await link.click({ trial: true });
      await page.evaluate(() =>
        globalThis.scrollTo({ top: 100, behavior: "instant" })
      );
      await link.scrollIntoViewIfNeeded();
      await expect(link).toBeInViewport({ ratio: 1 });
      const readPosition = () =>
        link.evaluate((element) => ({
          scrollY: globalThis.scrollY,
          linkTop: element.getBoundingClientRect().top,
        }));
      const source = await readPosition();
      expect(source.scrollY).toBeGreaterThan(0);
      const evidenceName = action.toLowerCase().replaceAll(" ", "-");
      await page.screenshot({
        path: testInfo.outputPath(
          `collected-${evidenceName}-scrolled-source.png`
        ),
        scale: "css",
      });
      const destination = new URL(
        (await link.getAttribute("href"))!,
        page.url()
      );
      expect(destination.searchParams.has("returnTo")).toBe(isNative);
      await link.click();
      await expect(page).toHaveURL(
        (url) =>
          url.pathname ===
          (action === "Manage orders" ? "/collect/orders" : "/collect"),
        { timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS }
      );
      await expect(
        page.getByRole("heading", {
          name: action === "Manage orders" ? "Orders" : "Build your collection",
          exact: true,
        })
      ).toBeVisible();
      if (action === "Complete my set") {
        await expectUrlState(
          page,
          (url) =>
            url.searchParams.get("collection") === "memes" &&
            url.searchParams.get("intent") === "season" &&
            url.searchParams.get("definition") === "1"
        );
        await expect(
          page.getByRole("form", { name: "Complete a season", exact: true })
        ).toBeVisible();
        if ((page.viewportSize()?.width ?? 0) < 1024) {
          await expect(
            page.getByRole("button", { name: "Season Season 1", exact: true })
          ).toBeEnabled();
        } else {
          const season = page.getByRole("combobox", {
            name: "Season",
            exact: true,
          });
          await expect(season).toBeEnabled();
          await expect(season).toHaveValue("Season 1");
        }
      }
      if (isNative) {
        await page.getByRole("button", { name: "Back", exact: true }).click();
      } else {
        await expect(
          page.getByRole("button", { name: "Back", exact: true })
        ).toHaveCount(0);
        await page.goBack();
      }
      await expectSeasonOneCollectedSource(page);
      if (isNative) {
        await expect(link).toBeFocused();
        await expect(link).toBeInViewport();
      }
      let restored = await readPosition();
      if (!isNative) {
        await expect
          .poll(async () => {
            restored = await readPosition();
            return Math.max(
              Math.abs(restored.scrollY - source.scrollY),
              Math.abs(restored.linkTop - source.linkTop)
            );
          })
          .toBeLessThanOrEqual(2);
      }
      await testInfo.attach(`collected-${evidenceName}-scroll`, {
        body: JSON.stringify({
          source,
          restored,
          nativeFocusRestoration: isNative,
        }),
        contentType: "application/json",
      });
      await page.screenshot({
        path: testInfo.outputPath(`collected-${evidenceName}-returned.png`),
        scale: "css",
      });
    }
  });

  test("Android Back remains usable after returning from Orders to the owner profile", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "capacitor-android-sim",
      "Android app Back contract"
    );
    await seedSession(page);
    await openOwnCollected(page);
    await page
      .getByRole("link", { name: "Manage orders", exact: true })
      .click();
    await expectUrlState(page, (url) => url.pathname === "/collect/orders");
    await page.getByRole("button", { name: "Back", exact: true }).click();
    await expectUrlState(
      page,
      (url) => url.pathname === "/playwright/collected"
    );
    await expect(
      page.getByRole("button", { name: "Back", exact: true })
    ).toBeEnabled();
    await page.getByRole("button", { name: "Back", exact: true }).click();
    await expectUrlState(page, (url) => url.pathname === "/about");
  });
});

import type { Page } from "@playwright/test";
import { expect, expectNoHorizontalOverflow, test } from "../testHelpers";
import {
  getSandboxApiOrigin,
  LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
  useLocalSandboxMutationGuard,
} from "../support/localSandbox";

const TARGET = "following-artist-0";
const CATEGORY = "Artist";

async function seedSession(page: Page, role: string | null) {
  const address = "0x0000000000000000000000000000000000000529";
  const jwt = [
    Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString(
      "base64url"
    ),
    Buffer.from(
      JSON.stringify({ sub: address, role, exp: 2000000000 })
    ).toString("base64url"),
    "",
  ].join(".");
  await page.addInitScript(
    ({ address, jwt, role }) => {
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
            profileId: "00000000-0000-4000-8000-000000000531",
            profileHandle: "playwright",
          },
        ])
      );
    },
    { address, jwt, role }
  );
}

async function installCategories(page: Page, api: string) {
  await page.route(`${api}/api/**identities/*/subscriptions`, (route) =>
    route.fulfill({ json: { actions: [] } })
  );
  await page.route(`${api}/api/profiles/*/rep/categories?*`, (route) =>
    route.fulfill({
      json: {
        data: [
          {
            category: CATEGORY,
            total_rep: 20,
            contributor_count: 1,
            authenticated_user_contribution: 20,
            top_contributors: [],
          },
        ],
        page: 1,
        next: false,
        count: 1,
      },
    })
  );
  await page.route(`${api}/api/profiles/*/rep/overview*`, (route) =>
    route.fulfill({
      json: {
        total_rep: 20,
        authenticated_user_contribution: 20,
        contributor_count: 1,
        contributors: { data: [], page: 1, next: false, count: 0 },
      },
    })
  );
}

async function openProfile(page: Page, role: string | null = null) {
  await seedSession(page, role);
  await page.goto(`/${TARGET}`, { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("button", {
      name: `Edit REP category ${CATEGORY}`,
      exact: true,
    })
  ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
}

function dialogPanel(page: Page) {
  return page
    .getByRole("dialog", { name: `Add Rep to ${TARGET}`, exact: true })
    .locator(".mobile-wrapper-dialog");
}

const allowance = {
  rep_rates_left_for_rater: 80,
  rating_stats: [
    {
      category: CATEGORY,
      rating: 20,
      contributor_count: 1,
      rater_contribution: 20,
    },
  ],
};

test.describe("Profile REP edit dialog @auth @medium @local-only", () => {
  useLocalSandboxMutationGuard(
    test,
    "PLAYWRIGHT_AUTH_SANDBOX",
    "REP edits require the local mock API runner."
  );

  test.beforeEach(async ({ page, baseURL }) => {
    await installCategories(page, getSandboxApiOrigin(baseURL));
  });

  test("keeps cold loading stable, restores pencil focus, and saves the current total", async ({
    page,
    baseURL,
    isMobile,
  }) => {
    let resolveAllowance: () => void = () => {};
    const ready = new Promise<void>((resolve) => {
      resolveAllowance = resolve;
    });
    const api = getSandboxApiOrigin(baseURL);
    await page.route(
      `${api}/api/profiles/${TARGET}/rep/ratings/received?*`,
      async (route) => {
        await ready;
        await route.fulfill({ json: allowance });
      }
    );
    const saved: unknown[] = [];
    await page.route(
      `${api}/api/profiles/${TARGET}/rep/rating`,
      async (route) => {
        saved.push(route.request().postDataJSON());
        await route.fulfill({ json: {} });
      }
    );
    await openProfile(page);
    const pencil = page.getByRole("button", {
      name: `Edit REP category ${CATEGORY}`,
      exact: true,
    });
    await pencil.click();
    const dialog = page.getByRole("dialog", {
      name: `Add Rep to ${TARGET}`,
      exact: true,
    });
    const input = dialog.getByRole("textbox", {
      name: /Your total Rep for Artist/,
    });
    await expect(dialog.getByRole("status")).toHaveText(
      "Loading your Rep allowance…"
    );
    await expect(input).toHaveAttribute("readonly");
    await expect(
      dialog.getByRole("button", { name: "Save", exact: true })
    ).toBeDisabled();
    // WebKit can report no animations before the entry transition starts.
    // Wait for Headless UI to finish entering before measuring the panel.
    await expect(
      page
        .getByRole("dialog", {
          name: `Add Rep to ${TARGET}`,
          exact: true,
        })
        .locator(".mobile-wrapper-dialog")
        .locator("..")
    ).not.toHaveAttribute("data-enter");
    const loadingBox = await dialogPanel(page).boundingBox();
    resolveAllowance();
    await expect(input).toHaveValue("20");
    const loadedBox = await dialogPanel(page).boundingBox();
    expect(loadedBox).toEqual(loadingBox);
    if (!isMobile) await expect(input).toBeFocused();
    await expectNoHorizontalOverflow(page);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(pencil).toBeFocused();
    await pencil.click();
    await expect(input).toHaveValue("20");
    await input.fill("30");
    await dialog.getByRole("button", { name: "Save", exact: true }).click();
    await expect(dialog).toBeHidden();
    expect(saved).toEqual([{ amount: 30, category: CATEGORY }]);
    await expect(page.getByText("Rep updated.", { exact: true })).toBeVisible();
  });

  test("shows allowance failure, retries, and retains the same panel geometry", async ({
    page,
    baseURL,
  }) => {
    const api = getSandboxApiOrigin(baseURL);
    let fail = true;
    await page.route(
      `${api}/api/profiles/${TARGET}/rep/ratings/received?*`,
      (route) =>
        route.fulfill(
          fail
            ? { status: 503, json: { error: "Unavailable" } }
            : { json: allowance }
        )
    );
    await openProfile(page);
    await page
      .getByRole("button", {
        name: `Edit REP category ${CATEGORY}`,
        exact: true,
      })
      .click();
    const dialog = page.getByRole("dialog", {
      name: `Add Rep to ${TARGET}`,
      exact: true,
    });
    await expect(dialog.getByRole("alert")).toHaveText(
      "Couldn't load your Rep allowance.",
      { timeout: 15000 }
    );
    await expect(
      dialog.getByRole("button", { name: "Save", exact: true })
    ).toBeDisabled();
    const errorBox = await dialogPanel(page).boundingBox();
    fail = false;
    await dialog
      .getByRole("button", { name: "Try again", exact: true })
      .click();
    await expect(dialog.getByRole("textbox")).toHaveValue("20");
    expect(await dialogPanel(page).boundingBox()).toEqual(errorBox);
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(dialog).toBeHidden();
  });

  test("hides edit pencils in Given direction and on the viewer's own profile", async ({
    page,
  }) => {
    await openProfile(page);
    await page
      .getByRole("region", { name: "REP", exact: true })
      .filter({ visible: true })
      .getByRole("button", { name: "Given", exact: true })
      .or(
        page
          .getByRole("region", { name: "REP", exact: true })
          .filter({ visible: true })
          .getByRole("tab", { name: "Given", exact: true })
      )
      .click();
    await expect(
      page.getByRole("button", { name: /Edit REP category/ })
    ).toHaveCount(0);
    // Navigate through the shell so pending wallet initialization survives
    // the profile change, as it does during normal in-app navigation.
    if ((page.viewportSize()?.width ?? 0) < 1024) {
      await page
        .getByRole("button", { name: "Open menu", exact: true })
        .click();
    }
    const nativeProfileLink = page.getByRole("link", {
      name: "Open playwright profile",
      exact: true,
    });
    const accountMenu = page.getByRole("button", {
      name: "Open account and profiles menu",
      exact: true,
    });
    await expect(nativeProfileLink.or(accountMenu)).toBeVisible();
    if (await nativeProfileLink.isVisible()) {
      await nativeProfileLink.click();
    } else {
      await accountMenu.press("Enter");
      await page.getByRole("link", { name: "Profile", exact: true }).click();
    }
    await page.waitForURL(/\/playwright$/, {
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    await expect(
      page.getByRole("navigation", { name: "Profile sections" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Edit REP category/ })
    ).toHaveCount(0);
  });

  test("loads and saves the grantor contribution in proxy mode", async ({
    page,
    baseURL,
  }) => {
    const api = getSandboxApiOrigin(baseURL);
    const grantorId = "00000000-0000-4000-8000-000000000539";
    await page.route(`${api}/api/profiles/*/proxies/**`, (route) =>
      route.fulfill({
        json: [
          {
            id: "00000000-0000-4000-8000-000000000540",
            created_by: { id: grantorId, handle: "grantor", pfp: null },
            granted_to: {
              id: "00000000-0000-4000-8000-000000000531",
              handle: "playwright",
              pfp: null,
            },
            actions: [
              {
                action_type: "ALLOCATE_REP",
                credit_amount: 50,
                credit_spent: 10,
                is_active: true,
                accepted_at: 1,
              },
            ],
          },
        ],
      })
    );
    const raters: (string | null)[] = [];
    await page.route(
      `${api}/api/profiles/${TARGET}/rep/ratings/received?*`,
      (route) => {
        const rater = new URL(route.request().url()).searchParams.get("rater");
        raters.push(rater);
        return route.fulfill({
          json:
            rater === "grantor"
              ? allowance
              : { ...allowance, rating_stats: [] },
        });
      }
    );
    const saved: unknown[] = [];
    await page.route(`${api}/api/profiles/${TARGET}/rep/rating`, (route) => {
      saved.push(route.request().postDataJSON());
      return route.fulfill({ json: {} });
    });
    await openProfile(page, grantorId);
    await page
      .getByRole("button", {
        name: `Edit REP category ${CATEGORY}`,
        exact: true,
      })
      .click();
    const dialog = page.getByRole("dialog", {
      name: `Add Rep to ${TARGET}`,
      exact: true,
    });
    await expect(
      dialog.getByText("You are acting as proxy for:", { exact: false })
    ).toBeVisible();
    await expect(
      dialog.getByRole("link", { name: "grantor", exact: true })
    ).toHaveAttribute("href", "/grantor");
    const input = dialog.getByRole("textbox");
    await expect(input).toHaveValue("20");
    expect(raters).toContain("grantor");
    await input.fill("30");
    await dialog.getByRole("button", { name: "Save", exact: true }).click();
    await expect(dialog).toBeHidden();
    expect(saved).toEqual([{ amount: 30, category: CATEGORY }]);
  });
});

test.describe("Profile Given rating management @auth @medium @local-only", () => {
  useLocalSandboxMutationGuard(
    test,
    "PLAYWRIGHT_AUTH_SANDBOX",
    "Given edits require the isolated local API."
  );

  for (const matter of ["REP", "NIC"] as const) {
    test(`${matter}: owner adjusts and removes from Given, then returns to the refreshed list`, async ({
      page,
      baseURL,
      isMobile,
    }, testInfo) => {
      const api = getSandboxApiOrigin(baseURL);
      const path = matter === "REP" ? "rep" : "cic";
      const managementDialogs = page.getByRole("dialog", {
        name: /^(?:(?:REP|NIC) Given|REP given to |Add Rep to |Adjust NIC for )/,
        includeHidden: true,
      });
      if (isMobile && matter === "NIC")
        await page.setViewportSize({ width: 320, height: 844 });
      let rating = 20;
      let failSave = true;
      const saved: unknown[] = [];
      const requestedPages: number[] = [];
      let recipientRepReads = 0;
      await installCategories(page, api);
      await page.route(`${api}/api/profiles/*/${path}/overview*`, (route) =>
        route.fulfill({
          json: {
            [matter === "REP" ? "total_rep" : "total_cic"]: 20,
            authenticated_user_contribution: null,
            contributor_count: 2,
            contributors: {
              data: [TARGET, "older-recipient"].map((handle, index) => ({
                contribution: 20 - index,
                profile: {
                  id: `summary-${index}`,
                  handle,
                  primary_address: `0x${String(index + 1).padStart(40, "0")}`,
                  pfp: "/icon-512.png",
                },
              })),
              page: 1,
              next: false,
            },
          },
        })
      );
      await page.route(
        `${api}/api/profiles/*/${path}/ratings/by-rater?*`,
        (route) => {
          const params = new URL(route.request().url()).searchParams;
          expect(params.get("given")).toBe("true");
          expect(params.get("order_by")).toBe("last_modified");
          expect(params.get("order")).toBe("DESC");
          const requestedPage = Number(params.get("page"));
          requestedPages.push(requestedPage);
          if (requestedPage === 2)
            return route.fulfill({
              json: {
                data: [
                  {
                    profile_id: "page-two",
                    handle: "page-two-recipient",
                    wallets: [],
                    rating: 10,
                    last_modified: 1,
                  },
                ],
                page: 2,
                next: false,
              },
            });
          const data =
            rating === 0
              ? []
              : [
                  {
                    profile_id: "following-0",
                    handle: TARGET,
                    wallets: [],
                    rating,
                    last_modified: 20,
                  },
                ];
          data.push({
            profile_id: "older",
            handle: "older-recipient",
            wallets: [],
            rating: 900,
            last_modified: 10,
          });
          return route.fulfill({ json: { data, page: 1, next: true } });
        }
      );
      await page.route(
        `${api}/api/profiles/${TARGET}/rep/ratings/received?*`,
        (route) => {
          recipientRepReads += 1;
          return route.fulfill({
            json: {
              ...allowance,
              rating_stats: [
                { ...allowance.rating_stats[0], rater_contribution: rating },
              ],
            },
          });
        }
      );
      await page.route(`${api}/api/profiles/${TARGET}/cic/rating/*`, (route) =>
        route.fulfill({
          json: {
            cic_rating_by_rater: rating,
            cic_ratings_left_to_give_by_rater: 80,
          },
        })
      );
      await page.route(
        `${api}/api/profiles/${TARGET}/${path}/rating`,
        (route) => {
          saved.push(route.request().postDataJSON());
          if (failSave) {
            failSave = false;
            return route.fulfill({
              status: 503,
              json: { message: "Try again" },
            });
          }
          rating = route.request().postDataJSON().amount;
          return route.fulfill({ json: {} });
        }
      );
      await seedSession(page, null);
      await page.goto(`/${TARGET}`, { waitUntil: "domcontentloaded" });
      await expect(
        page.getByRole("navigation", { name: "Profile sections" })
      ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
      if ((page.viewportSize()?.width ?? 0) < 1024)
        await page
          .getByRole("button", { name: "Open menu", exact: true })
          .click();
      const nativeProfileLink = page.getByRole("link", {
        name: "Open playwright profile",
        exact: true,
      });
      const accountMenu = page.getByRole("button", {
        name: "Open account and profiles menu",
        exact: true,
      });
      await expect(nativeProfileLink.or(accountMenu)).toBeVisible();
      if (await nativeProfileLink.isVisible()) await nativeProfileLink.click();
      else {
        await accountMenu.press("Enter");
        await page.getByRole("link", { name: "Profile", exact: true }).click();
      }
      await page.waitForURL(/\/playwright$/, {
        timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
      });
      await expect(
        page.getByRole("navigation", { name: "Profile sections" })
      ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
      if (matter === "NIC" && isMobile)
        await page
          .getByRole("group", { name: "Identity sections", exact: true })
          .getByRole("button", { name: "NIC", exact: true })
          .click();
      await expect(
        page.getByRole("region", { name: matter, exact: true })
      ).toHaveCount(1);
      const section =
        matter === "NIC"
          ? page
              .getByRole("region", { name: "NIC", exact: true })
              .filter({ visible: true })
          : page
              .getByRole("region", { name: "REP", exact: true })
              .filter({ visible: true });
      await section
        .getByRole("button", { name: "Given", exact: true })
        .or(section.getByRole("tab", { name: "Given", exact: true }))
        .filter({ visible: true })
        .first()
        .click();
      await expectNoHorizontalOverflow(page);
      const summaryScreenshot = testInfo.outputPath(`${matter}-summary.png`);
      await page.screenshot({ path: summaryScreenshot });
      await testInfo.attach(`${matter}-summary`, {
        path: summaryScreenshot,
        contentType: "image/png",
      });
      const manageGiven = section
        .getByRole("button", {
          name: new RegExp(`^Manage given ${matter}: [0-9,]+ receivers?$`),
          exact: true,
        })
        .filter({ visible: true });
      if (isMobile) {
        await expect(manageGiven).toHaveText("Manage given");
        await expect(
          section
            .getByRole("button", {
              name: new RegExp(`^Manage given ${matter}:`),
            })
            .locator("..")
            .getByText("·", { exact: true })
        ).toBeVisible();
        await section.getByText("2 receivers", { exact: true }).click();
        await expect(managementDialogs).toHaveCount(0);
      }
      await manageGiven.click();
      const list = page.getByRole("dialog", {
        name: `${matter} Given`,
        exact: true,
      });
      await expect(list.getByRole("link").first()).toHaveText(TARGET);
      await expect(list.getByRole("link").nth(1)).toHaveText("older-recipient");
      if (isMobile) {
        await expect(
          list
            .getByRole("listitem")
            .filter({ hasText: TARGET })
            .getByText(`20 ${matter}`, { exact: true })
        ).toBeVisible();
      }
      await list
        .getByRole("button", { name: "Load more", exact: true })
        .click();
      await expect(
        list.getByRole("link", { name: "page-two-recipient", exact: true })
      ).toBeVisible();
      expect(requestedPages).toEqual([1, 2]);
      await expect(
        page
          .getByRole("dialog", { name: `${matter} Given`, exact: true })
          .locator(".mobile-wrapper-dialog")
          .locator("..")
      ).not.toHaveAttribute("data-enter");
      const givenScreenshot = testInfo.outputPath(`${matter}-given.png`);
      await page.screenshot({ path: givenScreenshot });
      await testInfo.attach(`${matter}-given`, {
        path: givenScreenshot,
        contentType: "image/png",
      });

      const openEditor = async () => {
        let readsBeforeCategoryEditor = recipientRepReads;
        await list
          .getByRole("button", {
            name: `Adjust ${matter} for ${TARGET}`,
            exact: true,
          })
          .click();
        if (matter === "REP") {
          const categoryButton = page
            .getByRole("dialog", {
              name: `REP given to ${TARGET}`,
              exact: true,
            })
            .getByRole("button", {
              name: `Adjust REP (${CATEGORY}) for ${TARGET}`,
              exact: true,
            });
          await expect(categoryButton).toBeVisible();
          await expect(managementDialogs).toHaveCount(1);
          readsBeforeCategoryEditor = recipientRepReads;
          await categoryButton.click();
        }
        const editor = page.getByRole("dialog", {
          name:
            matter === "REP"
              ? `Add Rep to ${TARGET}`
              : `Adjust NIC for ${TARGET}`,
          exact: true,
        });
        await expect(editor.getByRole("textbox")).toHaveValue(String(rating));

        await expect(managementDialogs).toHaveCount(1);
        if (matter === "REP")
          expect(recipientRepReads).toBe(readsBeforeCategoryEditor);
        return editor;
      };
      let editor = await openEditor();
      await editor.getByRole("textbox").fill("25");
      await editor.getByRole("button", { name: "Back", exact: true }).click();
      if (matter === "REP") {
        const categories = page.getByRole("dialog", {
          name: `REP given to ${TARGET}`,
          exact: true,
        });
        await expect(
          categories.getByRole("button", {
            name: `Adjust REP (${CATEGORY}) for ${TARGET}`,
            exact: true,
          })
        ).toBeVisible();
        await categories
          .getByRole("button", { name: "Back", exact: true })
          .click();
      }
      await expect(
        list.getByRole("heading", { name: `${matter} Given`, exact: true })
      ).toBeVisible();
      await expect(managementDialogs).toHaveCount(1);
      await expect(
        list.getByRole("button", {
          name: `Adjust ${matter} for ${TARGET}`,
          exact: true,
        })
      ).toBeFocused();
      await expect(
        list.getByRole("link", { name: "page-two-recipient", exact: true })
      ).toBeVisible();
      expect(requestedPages).toEqual([1, 2]);
      expect(saved).toHaveLength(0);

      editor = await openEditor();
      await editor.getByRole("button", { name: "Cancel", exact: true }).click();
      if (matter === "REP") {
        await page
          .getByRole("dialog", { name: `REP given to ${TARGET}`, exact: true })
          .getByRole("button", { name: "Back", exact: true })
          .click();
      }
      await expect(
        list.getByRole("heading", { name: `${matter} Given`, exact: true })
      ).toBeVisible();
      expect(saved).toHaveLength(0);
      editor = await openEditor();
      await editor.getByRole("textbox").fill("30");
      await editor.getByRole("button", { name: "Save", exact: true }).click();
      await expect(
        page.getByText("Please try again.", { exact: true }).first()
      ).toBeVisible();
      await expect(editor.getByRole("textbox")).toHaveValue("30");
      const pagesBeforeSave = requestedPages.length;
      await editor.getByRole("button", { name: "Save", exact: true }).click();
      await expect(editor).toBeHidden();
      await expect(
        list.getByRole("link", { name: TARGET }).locator("..")
      ).toContainText("30");
      expect(requestedPages.slice(pagesBeforeSave)).toEqual([1]);
      await expect(
        list.getByRole("link", { name: "page-two-recipient", exact: true })
      ).toHaveCount(0);
      await list
        .getByRole("button", { name: "Load more", exact: true })
        .click();
      await expect(
        list.getByRole("link", { name: "page-two-recipient", exact: true })
      ).toBeVisible();
      expect(requestedPages.slice(pagesBeforeSave)).toEqual([1, 2]);
      editor = await openEditor();
      await editor.getByRole("button", { name: "Close", exact: true }).click();
      await expect(managementDialogs).toHaveCount(0);
      const manageTrigger = section
        .getByRole("button", {
          name: new RegExp(`^Manage given ${matter}:`),
        })
        .filter({ visible: true });
      await expect(manageTrigger).toBeFocused();
      await manageTrigger.click();
      editor = await openEditor();
      await editor
        .getByRole("button", { name: "Remove rating", exact: true })
        .click();
      await expect(editor.getByRole("textbox")).toHaveValue("0");
      expect(saved).toHaveLength(2);
      await expect(
        editor.getByText("Save to remove this rating.")
      ).toBeVisible();
      const removeScreenshot = testInfo.outputPath(`${matter}-remove.png`);
      await page.screenshot({ path: removeScreenshot });
      await testInfo.attach(`${matter}-remove`, {
        path: removeScreenshot,
        contentType: "image/png",
      });
      const pagesBeforeRemoval = requestedPages.length;
      await editor.getByRole("button", { name: "Save", exact: true }).click();
      await expect(editor).toBeHidden();
      await expect(list.getByRole("link", { name: TARGET })).toHaveCount(0);
      expect(requestedPages.slice(pagesBeforeRemoval)).toEqual([1]);
      await expect(
        list.getByRole("link", { name: "older-recipient" })
      ).toBeVisible();
      expect(saved).toEqual(
        matter === "REP"
          ? [
              { amount: 30, category: CATEGORY },
              { amount: 30, category: CATEGORY },
              { amount: 0, category: CATEGORY },
            ]
          : [{ amount: 30 }, { amount: 30 }, { amount: 0 }]
      );
      await expectNoHorizontalOverflow(page);
    });
  }

  test("visitor can inspect NIC Received and Given without management controls", async ({
    page,
    baseURL,
    isMobile,
  }, testInfo) => {
    const api = getSandboxApiOrigin(baseURL);
    await installCategories(page, api);
    const directions: string[] = [];
    const overviewDirections: string[] = [];
    if (isMobile) await page.setViewportSize({ width: 320, height: 844 });
    await page.route(`${api}/api/profiles/*/cic/overview*`, (route) => {
      const direction =
        new URL(route.request().url()).searchParams.get("direction") ??
        "incoming";
      overviewDirections.push(direction);
      return route.fulfill({
        json: {
          total_cic: direction === "outgoing" ? 1250 : 4100,
          authenticated_user_contribution: null,
          contributor_count: 1,
          contributors: { data: [], page: 1, next: false },
        },
      });
    });
    await page.route(
      `${api}/api/profiles/*/cic/ratings/by-rater?*`,
      (route) => {
        directions.push(
          new URL(route.request().url()).searchParams.get("given") ?? ""
        );
        return route.fulfill({
          json: {
            data: [
              {
                profile_id: "one",
                handle: "another-profile",
                wallets: [],
                rating: -20,
              },
            ],
            page: 1,
            next: false,
          },
        });
      }
    );
    await openProfile(page);
    if (isMobile)
      await page
        .getByRole("group", { name: "Identity sections", exact: true })
        .getByRole("button", { name: "NIC", exact: true })
        .click();
    const section = page
      .getByRole("region", { name: "NIC", exact: true })
      .filter({ visible: true });
    for (const direction of ["Received", "Given"]) {
      await section
        .getByRole("button", { name: direction, exact: true })
        .click();
      if (!isMobile) {
        await expect(
          section.getByText(`NIC ${direction.toLowerCase()}`, { exact: true })
        ).toBeVisible();
      }
      await expect(
        section.getByRole("button", { name: direction, exact: true })
      ).toHaveAttribute("aria-pressed", "true");
      const expectedTotal = direction === "Given" ? "1,250" : "4,100";
      await expect(
        section.getByText(expectedTotal, { exact: true })
      ).toBeVisible();
      if (isMobile) {
        await expect(
          page
            .getByRole("group", { name: "Identity sections", exact: true })
            .getByRole("button", {
              name: "NIC",
              exact: true,
            })
        ).toBeVisible();
      }
      const contributorsButton = section.getByRole("button", {
        name: new RegExp(
          `^View NIC ${direction}: [0-9,]+ (raters?|receivers?)$`
        ),
        exact: true,
      });
      if (!isMobile) {
        const scoreBox = await section
          .getByText(expectedTotal, { exact: true })
          .boundingBox();
        const contributorsBox = await contributorsButton.boundingBox();
        expect(scoreBox).not.toBeNull();
        expect(contributorsBox).not.toBeNull();
        expect(contributorsBox!.y).toBeGreaterThanOrEqual(
          scoreBox!.y + scoreBox!.height
        );
        expect(contributorsBox!.x).toBeCloseTo(scoreBox!.x, 0);
      }
      const summaryScreenshot = testInfo.outputPath(
        `NIC-${direction}-summary.png`
      );
      await page.screenshot({ path: summaryScreenshot, fullPage: true });
      await testInfo.attach(`NIC-${direction}-summary`, {
        path: summaryScreenshot,
        contentType: "image/png",
      });
      await contributorsButton.click();
      const list = page.getByRole("dialog", {
        name: `NIC ${direction}`,
        exact: true,
      });
      await expect(
        list.getByRole("link", { name: "another-profile" })
      ).toBeVisible();
      await expect(list.getByRole("button", { name: /Adjust/ })).toHaveCount(0);
      const panel = await page
        .getByRole("dialog", { name: `NIC ${direction}`, exact: true })
        .locator(".mobile-wrapper-dialog")
        .boundingBox();
      expect(panel?.height).toBeLessThan(
        (page.viewportSize()?.height ?? 720) * 0.6
      );
      await list.getByRole("button", { name: "Close", exact: true }).click();
      await expect(list).toBeHidden();
    }
    expect(directions).toEqual(["false", "true"]);
    if (isMobile) {
      const sections = page.getByRole("group", {
        name: "Identity sections",
        exact: true,
      });
      await expect(sections.getByRole("button")).toHaveText([
        "REP",
        "NIC",
        "ID Statements",
      ]);
      await sections.getByRole("button", { name: "REP", exact: true }).click();
      await expect(
        page
          .getByRole("region", { name: "REP", exact: true })
          .filter({ visible: true })
          .getByRole("heading", { name: "Total REP", exact: true })
          .locator("..")
          .locator("..")
          .getByText("20", { exact: true })
      ).toBeVisible();
      await sections.getByRole("button", { name: "NIC", exact: true }).click();
      await expect(section.getByText("1,250", { exact: true })).toBeVisible();
      await expect(
        section.getByRole("button", { name: "Given", exact: true })
      ).toHaveAttribute("aria-pressed", "true");
    }
    await section
      .getByRole("button", { name: "Received", exact: true })
      .click();
    await expect(section.getByText("4,100", { exact: true })).toBeVisible();
    if (isMobile) {
      const sections = page.getByRole("group", {
        name: "Identity sections",
        exact: true,
      });
      await expect(
        sections.getByRole("button", { name: "NIC", exact: true })
      ).toHaveAttribute("aria-pressed", "true");
      await sections
        .getByRole("button", { name: "ID Statements", exact: true })
        .click();
      const statements = page.getByRole("region", { name: /ID Statements$/ });
      await expect(statements.getByText(/^[0-9,]+ statements?$/)).toBeVisible();
      await sections.getByRole("button", { name: "NIC", exact: true }).click();
      await expect(section.getByText("4,100", { exact: true })).toBeVisible();
    }
    expect(
      overviewDirections.filter((direction) => direction === "outgoing")
    ).toHaveLength(1);
    await expectNoHorizontalOverflow(page);
  });
});

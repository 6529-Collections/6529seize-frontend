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
      .getByRole("button", { name: "Given", exact: true })
      .or(page.getByRole("tab", { name: "Given", exact: true }))
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

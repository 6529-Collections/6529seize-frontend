import {
  expect,
  expectAxeClean,
  expectNoHorizontalOverflow,
  test,
} from "../testHelpers";
import {
  getSandboxApiOrigin,
  LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
  useLocalSandboxMutationGuard,
} from "../support/localSandbox";
import type { Page } from "@playwright/test";

async function openOwnProfile(page: Page) {
  // Enter through the authenticated shell after hydration. Cold profile loads
  // have a separate profile-tab hydration mismatch.
  const profileLoaded = page.waitForResponse((response) =>
    new URL(response.url()).pathname.endsWith(
      "/identities/0x0000000000000000000000000000000000000529"
    )
  );
  await page.goto("/about");
  await profileLoaded;
  if ((page.viewportSize()?.width ?? 0) < 1024) {
    await page.getByRole("button", { name: "Open menu", exact: true }).click();
  }
  const nativeProfileLink = page.getByRole("link", {
    name: "Open playwright profile",
    exact: true,
  });
  const webAccountMenu = page.getByRole("button", {
    name: "Open account and profiles menu",
    exact: true,
  });
  await expect(nativeProfileLink.or(webAccountMenu)).toBeVisible();
  if (await nativeProfileLink.isVisible()) {
    await nativeProfileLink.click();
  } else {
    await webAccountMenu.press("Enter");
    await page.getByRole("link", { name: "Profile", exact: true }).click();
  }
  // First-visit compilation can outlast an assertion timeout in the dev server.
  await page.waitForURL(/\/playwright$/, {
    timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
  });
  // App navigation can briefly render both the outgoing and incoming profile.
  await expect(
    page.getByRole("button", { name: /Open playwright's followers:/ })
  ).toHaveCount(1);
}

const identity = (index: number) => ({
  id: `following-${index}`,
  handle: `following-artist-${index}`,
  pfp: null,
  primary_address: `0x${String(index + 1).padStart(40, "0")}`,
  level: 12,
});

test.describe("Own profile Following sandbox @auth @medium @local-only", () => {
  useLocalSandboxMutationGuard(
    test,
    "PLAYWRIGHT_AUTH_SANDBOX",
    "Following coverage requires the local mock API runner."
  );

  test.beforeEach(async ({ page, baseURL }) => {
    const apiOrigin = new URL(getSandboxApiOrigin(baseURL));
    // Model the local shell socket; this profile test does not need wave events.
    await page.routeWebSocket(
      (url) => url.protocol === "ws:" && url.host === apiOrigin.host,
      (socket) => {
        socket.onMessage((payload) => {
          if (typeof payload !== "string") return;
          const message: unknown = JSON.parse(payload);
          if (
            typeof message === "object" &&
            message !== null &&
            "type" in message &&
            message.type === "AUTHENTICATE"
          ) {
            socket.send(JSON.stringify({ type: "AUTHENTICATED" }));
          }
        });
      }
    );
    await page.route(`${baseURL}/api/open-graph**`, (route) =>
      route.fulfill({ json: {} })
    );
    // Use the normal saved-session path; dev-auth's synchronous wallet seed
    // differs from SSR and does not model profile hydration faithfully.
    const wallet = "0x0000000000000000000000000000000000000529";
    const jwt = [
      Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString(
        "base64url"
      ),
      Buffer.from(
        JSON.stringify({ sub: wallet, role: null, exp: 2000000000 })
      ).toString("base64url"),
      "",
    ].join(".");
    await page.addInitScript(
      ({ address, token }) => {
        // Keep analytics outside this profile fixture; external writes stay blocked.
        document.cookie = "essential-cookies-consent=true; path=/";
        document.cookie = "performance-cookies-consent=false; path=/";
        localStorage.setItem("6529-wallet-active-address", address);
        localStorage.setItem(
          "6529-wallet-accounts",
          JSON.stringify([
            {
              address,
              jwt: token,
              role: null,
              refreshToken: null,
              authSessionVersion: "v2",
              profileId: "00000000-0000-4000-8000-000000000531",
              profileHandle: "playwright",
            },
          ])
        );
      },
      { address: wallet, token: jwt }
    );
  });

  test("opens the responsive list, paginates, unfollows and navigates using existing rows", async ({
    page,
    baseURL,
  }, testInfo) => {
    const api = getSandboxApiOrigin(baseURL);
    let following = Array.from({ length: 101 }, (_, index) => identity(index));
    const requests: { page: number; pageSize: number }[] = [];
    await page.route(
      `${api}/api/identity-subscriptions/outgoing/IDENTITY?*`,
      (route) => {
        const params = new URL(route.request().url()).searchParams;
        const number = Number(params.get("page"));
        const pageSize = Number(params.get("page_size"));
        requests.push({ page: number, pageSize });
        return route.fulfill({
          json: {
            count: following.length,
            page: number,
            next: number * pageSize < following.length,
            data: following
              .slice((number - 1) * pageSize, number * pageSize)
              .map((target) => ({ target, actions: ["DROP_CREATED"] })),
          },
        });
      }
    );
    // The mutation is intercepted only on the loopback fixture API.
    await page.route(
      `${api}/api/**identities/following-artist-*/subscriptions`,
      (route) => {
        const handle = new URL(route.request().url()).pathname
          .split("/")
          .filter(Boolean)[2];
        if (route.request().method() === "DELETE") {
          following = following.filter((target) => target.handle !== handle);
        }
        return route.fulfill({
          json: {
            actions: following.some((target) => target.handle === handle)
              ? ["DROP_CREATED"]
              : [],
          },
        });
      }
    );
    await page.route(
      `${api}/api/**identity-subscriptions/incoming/IDENTITY/**`,
      (route) =>
        route.fulfill({
          json: { data: [], count: 0, page: 1, next: false },
        })
    );
    await openOwnProfile(page);
    const followersOpener = page.getByRole("button", {
      name: /Open playwright's followers:/,
    });
    await followersOpener.press("Enter");
    const followersDialog = page.getByRole("dialog", {
      name: "Followers",
      exact: true,
    });
    await expect(followersDialog.getByText("No followers yet.")).toBeVisible();
    await expectAxeClean(page, { include: ['[role="dialog"]'] });
    await page.screenshot({ path: testInfo.outputPath("followers-empty.png") });
    await followersDialog
      .getByRole("button", { name: "Close", exact: true })
      .click();
    await expect(followersOpener).toBeFocused();
    const opener = page.getByRole("button", {
      name: "Open your following list: 101",
    });
    await expect(opener).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Open playwright's followers:/ })
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await page.screenshot({
      path: testInfo.outputPath("following-header.png"),
    });
    expect(requests).toEqual([{ page: 1, pageSize: 1 }]);
    await opener.press("Enter");
    const dialog = page.getByRole("dialog", { name: "Following", exact: true });
    const list = dialog.getByRole("list", { name: "Following", exact: true });
    await expect(list.getByRole("listitem")).toHaveCount(100);
    await expect(list.getByRole("link").first()).toHaveAttribute(
      "href",
      "/following-artist-0"
    );
    const longPanel = page
      .getByRole("dialog", { name: "Following", exact: true })
      .locator('[id^="headlessui-dialog-panel-"]');
    await expect
      .poll(async () => (await longPanel.boundingBox())?.height)
      .toBeLessThanOrEqual(512);
    await expect(longPanel).toBeInViewport();
    await expectAxeClean(page, { include: ['[role="dialog"]'] });
    await page.screenshot({ path: testInfo.outputPath("following-open.png") });
    // Scrolling to the footer activates automatic pagination on every surface.
    await dialog
      .getByRole("button", { name: "Load more", exact: true })
      .scrollIntoViewIfNeeded();
    await expect(list.getByRole("listitem")).toHaveCount(101);
    expect(requests).toEqual([
      { page: 1, pageSize: 1 },
      { page: 1, pageSize: 100 },
      { page: 2, pageSize: 100 },
    ]);
    const lastRow = list
      .getByRole("listitem")
      .filter({ hasText: "following-artist-100" });
    await lastRow
      .getByRole("button", { name: "Unfollow", exact: true })
      .click();
    await expect(list.getByRole("listitem")).toHaveCount(100);
    await expect(lastRow).toHaveCount(0);
    await dialog.getByRole("button", { name: "Close", exact: true }).click();
    const updatedOpener = page.getByRole("button", {
      name: "Open your following list: 100",
    });
    await expect(updatedOpener).toBeFocused();
    await updatedOpener.click();
    const countBeforeNavigation = requests.length;
    await dialog
      .getByRole("link", { name: "View following-artist-0's profile" })
      .click();
    await expect(page).toHaveURL(/\/following-artist-0$/);
    await expect(
      page.getByRole("heading", { name: "following-artist-0", exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Open your following list:/ })
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: /Open following-artist-0's followers:/ })
    ).toBeVisible();
    expect(requests).toHaveLength(countBeforeNavigation);
    await expectNoHorizontalOverflow(page);
  });

  test("keeps short follower and following lists compact", async ({
    page,
    baseURL,
  }, testInfo) => {
    const api = getSandboxApiOrigin(baseURL);
    const people = [identity(0), identity(1)];
    let followers = [identity(0), identity(2)];
    await page.route(
      `${api}/api/identity-subscriptions/outgoing/IDENTITY?*`,
      (route) => {
        const pageSize = Number(
          new URL(route.request().url()).searchParams.get("page_size")
        );
        return route.fulfill({
          json: {
            count: 2,
            page: 1,
            next: pageSize < 2,
            data: people
              .slice(0, pageSize)
              .map((target) => ({ target, actions: ["DROP_CREATED"] })),
          },
        });
      }
    );
    await page.route(
      `${api}/api/**identity-subscriptions/incoming/IDENTITY/**`,
      (route) => {
        const params = new URL(route.request().url()).searchParams;
        const page = Number(params.get("page") ?? 1);
        const pageSize = Number(params.get("page_size"));
        return route.fulfill({
          json: {
            count: followers.length,
            page,
            next: page * pageSize < followers.length,
            data: followers
              .slice((page - 1) * pageSize, page * pageSize)
              .map((identity) => ({
                identity,
                actions: ["DROP_CREATED"],
              })),
          },
        });
      }
    );
    await page.route(
      `${api}/api/**identities/following-artist-*/subscriptions`,
      (route) =>
        route.fulfill({
          json: {
            actions: new URL(route.request().url()).pathname.includes(
              "following-artist-2/"
            )
              ? []
              : ["DROP_CREATED"],
          },
        })
    );
    await openOwnProfile(page);
    for (const name of ["Followers", "Following"]) {
      const opener = page.getByRole("button", {
        name:
          name === "Followers"
            ? /Open playwright's followers:/
            : "Open your following list: 2",
      });
      await opener.click();
      const dialog = page.getByRole("dialog", { name, exact: true });
      await expect(dialog.getByRole("listitem")).toHaveCount(2);
      const panel = page
        .getByRole("dialog", { name, exact: true })
        .locator('[id^="headlessui-dialog-panel-"]');
      await expect
        .poll(async () => (await panel.boundingBox())?.height)
        .toBeGreaterThanOrEqual(240);
      await expect
        .poll(async () => (await panel.boundingBox())?.height)
        .toBeLessThanOrEqual(360);
      await expect(panel).toBeInViewport();
      const button = dialog.getByRole("listitem").first().getByRole("button", {
        name: "Unfollow",
        exact: true,
      });
      await expect(button).toBeEnabled();
      const actions = [button];
      if (name === "Followers") {
        actions.push(
          dialog.getByRole("button", { name: "Follow", exact: true })
        );
      }
      for (const action of actions) {
        await expect(action).toHaveCSS("font-size", "12px");
        await expect(action).toHaveCSS("height", "32px");
      }
      await button.focus();
      await expect(button).toBeFocused();
      await expectNoHorizontalOverflow(page);
      await expectAxeClean(page, { include: ['[role="dialog"]'] });
      await page.screenshot({
        path: testInfo.outputPath(`${name.toLowerCase()}-short.png`),
      });
      await dialog.press("Escape");
      await expect(opener).toBeFocused();
    }
    // The existing Followers wrapper must also keep its pagination sentinel
    // reachable when its dialog uses intrinsic height instead of fixed height.
    followers = Array.from({ length: 101 }, (_, index) => identity(index));
    // Start a new page session so the short-list cache remains untouched.
    await openOwnProfile(page);
    await page
      .getByRole("button", { name: /Open playwright's followers:/ })
      .click();
    const followersDialog = page.getByRole("dialog", {
      name: "Followers",
      exact: true,
    });
    await expect(followersDialog.getByRole("listitem")).toHaveCount(100);
    const followersPanel = page
      .getByRole("dialog", { name: "Followers", exact: true })
      .locator('[id^="headlessui-dialog-panel-"]');
    await expect
      .poll(async () => (await followersPanel.boundingBox())?.height)
      .toBeLessThanOrEqual(512);
    await followersDialog
      .getByRole("link", { name: "View following-artist-99's profile" })
      .scrollIntoViewIfNeeded();
    await expect(followersDialog.getByRole("listitem")).toHaveCount(101);
    await expect(
      followersDialog.getByRole("link", {
        name: "View following-artist-100's profile",
      })
    ).toBeVisible();
  });

  test("reports a failed request and recovers to an honest empty state", async ({
    page,
    baseURL,
  }) => {
    let fail = true;
    await page.route(
      `${getSandboxApiOrigin(baseURL)}/api/identity-subscriptions/outgoing/IDENTITY?*`,
      (route) =>
        route.fulfill(
          fail
            ? { status: 503, json: { error: "Unavailable" } }
            : { json: { data: [], count: 0, page: 1, next: false } }
        )
    );
    await openOwnProfile(page);
    await page
      .getByRole("button", { name: "Open your following list: Unavailable" })
      .click();
    const dialog = page.getByRole("dialog", { name: "Following", exact: true });
    await expect(dialog.getByRole("status")).toContainText(
      "Loading following list"
    );
    // Lazy loading starts the request on open. Allow the app's existing three
    // retries (1 + 2 + 4 seconds) before expecting the terminal error state.
    await expect(dialog.getByRole("alert")).toContainText(
      "Couldn't load your following list",
      { timeout: 15_000 }
    );
    await expect(
      dialog.getByText("You aren't following anyone yet.")
    ).toHaveCount(0);
    fail = false;
    await dialog.getByRole("button", { name: "Retry", exact: true }).click();
    await expect(
      dialog.getByText("You aren't following anyone yet.")
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await dialog.press("Escape");
    await expect(
      page.getByRole("button", { name: "Open your following list: 0" })
    ).toBeFocused();
  });
});

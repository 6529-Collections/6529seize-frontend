import type { Page } from "@playwright/test";
import { expect, test } from "../testHelpers";
import {
  hideNextDevOverlay,
  useLocalSandboxMutationGuard,
} from "../support/localSandbox";
import { isMobileSurfaceProject } from "../support/surfaceSimulation";

const wallet = "0x0000000000000000000000000000000000000529";
const expiredJwt = [
  Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString(
    "base64url"
  ),
  Buffer.from(JSON.stringify({ sub: wallet, exp: 1 })).toString("base64url"),
  "",
].join(".");

const validJwt = [
  Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString(
    "base64url"
  ),
  Buffer.from(
    JSON.stringify({ sub: wallet, exp: Math.floor(Date.now() / 1000) + 3600 })
  ).toString("base64url"),
  "",
].join(".");

async function readSessionCookie(page: Page) {
  return (await page.context().cookies()).find(
    (cookie) => cookie.name === "__Host-wallet-auth"
  );
}

test.describe("Session recovery sandbox @auth @local-only", () => {
  useLocalSandboxMutationGuard(
    test,
    "PLAYWRIGHT_AUTH_SANDBOX",
    "Requires the local auth sandbox."
  );
  // This conditional safety guard is disabled by the dedicated CI/local pack,
  // which explicitly sets USE_DEV_AUTH=false; generic packs must not fake auth.
  test.skip(
    process.env["USE_DEV_AUTH"] !== "false",
    "This contract exercises saved sessions with dev auth disabled."
  );

  test("reopens and resumes an expired session without a reconnect prompt or expired authenticated requests", async ({
    page,
  }) => {
    await page.addInitScript(
      ({ address, jwt }) => {
        localStorage.setItem("6529-wallet-active-address", address);
        localStorage.setItem(
          "6529-wallet-accounts",
          JSON.stringify([
            {
              address,
              jwt,
              role: null,
              refreshToken: null,
              authSessionVersion: "v2",
              profileId: "00000000-0000-4000-8000-000000000531",
              profileHandle: "playwright",
            },
          ])
        );
      },
      { address: wallet, jwt: expiredJwt }
    );

    let refreshRequests = 0;
    const expiredRequests: string[] = [];
    await page.route("**/api/auth/session-refresh", async (route) => {
      refreshRequests += 1;
      if (refreshRequests === 1) {
        await route.fulfill({
          status: 429,
          headers: { "Retry-After": "1" },
          json: { error: "Rate limit exceeded", retryAfter: 1 },
        });
        return;
      }
      await route.fallback();
    });
    page.on("request", (request) => {
      if (!/\/api\/(?:v2\/)?notifications/.test(request.url())) return;
      if (request.headers()["authorization"] === `Bearer ${expiredJwt}`)
        expiredRequests.push(request.url());
    });
    await page.goto("/notifications", { waitUntil: "domcontentloaded" });
    await expect.poll(() => refreshRequests, { timeout: 15000 }).toBe(2);
    await expect(page.getByText("mentioned you")).toBeVisible({
      timeout: 60000,
    });
    await expect.poll(() => refreshRequests).toBe(2);
    await expect(
      page.getByRole("dialog", { name: "Sign in to 6529" })
    ).toHaveCount(0);
    expect(expiredRequests).toEqual([]);

    await page.evaluate((jwt) => {
      const accounts = JSON.parse(
        localStorage.getItem("6529-wallet-accounts") ?? "[]"
      ) as { jwt: string }[];
      accounts[0]!.jwt = jwt;
      localStorage.setItem("6529-wallet-accounts", JSON.stringify(accounts));
      document.cookie = `__Host-wallet-auth=${jwt}; path=/; Secure`;
    }, expiredJwt);
    // The sandbox origin must keep the prefixed cookie, or the recovery below
    // would not start from an expired session cookie.
    expect(await readSessionCookie(page)).toMatchObject({ value: expiredJwt });
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await expect.poll(() => refreshRequests).toBe(3);
    await expect
      .poll(() =>
        page.evaluate(() => {
          const accounts = JSON.parse(
            localStorage.getItem("6529-wallet-accounts") ?? "[]"
          ) as { jwt: string }[];
          return accounts[0]?.jwt;
        })
      )
      .not.toBe(expiredJwt);
    await expect(page.getByText("mentioned you")).toBeVisible();
    await expect(
      page.getByText("Please reconnect your wallet.", { exact: true })
    ).toHaveCount(0);
    expect(expiredRequests).toEqual([]);
  });

  test("moves a saved session to the host-only session cookie on load", async ({
    page,
    baseURL,
  }) => {
    await page
      .context()
      .addCookies([{ name: "wallet-auth", value: "stale", url: baseURL! }]);
    await page.addInitScript(
      ({ address, jwt }) => {
        if (localStorage.getItem("6529-wallet-accounts")) return;
        localStorage.setItem("6529-wallet-active-address", address);
        localStorage.setItem(
          "6529-wallet-accounts",
          JSON.stringify([
            {
              address,
              jwt,
              role: null,
              refreshToken: null,
              authSessionVersion: "v2",
              profileId: "00000000-0000-4000-8000-000000000531",
              profileHandle: "playwright",
            },
          ])
        );
      },
      { address: wallet, jwt: validJwt }
    );

    await page.goto("/notifications", { waitUntil: "domcontentloaded" });

    // The app may also refresh the session after load; either way the cookie
    // must hold the token stored for the active account.
    await expect
      .poll(
        async () => {
          const cookie = await readSessionCookie(page);
          const storedJwt = await page.evaluate(
            () =>
              (
                JSON.parse(
                  localStorage.getItem("6529-wallet-accounts") ?? "[]"
                ) as { jwt?: string | null }[]
              )[0]?.jwt ?? null
          );
          return Boolean(cookie?.value) && cookie?.value === storedJwt;
        },
        { timeout: 30_000 }
      )
      .toBe(true);
    const sessionCookie = await readSessionCookie(page);
    // WebKit on Windows does not report SameSite; the unit tests cover it.
    expect(sessionCookie).toMatchObject({ path: "/", secure: true });
    expect(sessionCookie!.domain.startsWith(".")).toBe(false);
    expect(
      (await page.context().cookies()).some(
        (cookie) => cookie.name === "wallet-auth"
      )
    ).toBe(false);
  });
  for (const membership of [
    "guest",
    "profileless",
    "member",
    "unavailable",
  ] as const) {
    test(`membership navigation preserves its slot for ${membership}`, async ({
      page,
    }, testInfo) => {
      await hideNextDevOverlay(page.context());
      if (membership !== "guest") {
        await page.addInitScript(
          ({ address, jwt }) => {
            localStorage.setItem("6529-wallet-active-address", address);
            localStorage.setItem(
              "6529-wallet-accounts",
              JSON.stringify([
                {
                  address,
                  jwt,
                  role: null,
                  refreshToken: null,
                  authSessionVersion: "v2",
                  profileId: null,
                  profileHandle: null,
                },
              ])
            );
          },
          { address: wallet, jwt: validJwt }
        );
      }
      let identityUnavailable = membership === "unavailable";
      let releaseIdentity!: () => void;
      const identityReady = new Promise<void>((resolve) => {
        releaseIdentity = resolve;
      });
      await page.route(`**/api/identities/${wallet}`, async (route) => {
        await identityReady;
        if (identityUnavailable) {
          await route.fulfill({
            status: 503,
            json: { error: "Identity unavailable" },
          });
          return;
        }
        const response = await route.fetch();
        const identity = await response.json();
        await route.fulfill({
          response,
          json: {
            ...identity,
            id: membership !== "profileless" ? identity.id : null,
            handle: membership !== "profileless" ? identity.handle : null,
            normalised_handle:
              membership !== "profileless" ? identity.normalised_handle : null,
          },
        });
      });
      await page.route("**/api/identities/*/activity", (route) =>
        route.fulfill({ json: { date_samples: [] } })
      );
      try {
        const response = await page.goto("/about", {
          waitUntil: "domcontentloaded",
        });
        const html = await response!.text();
        expect(html).toContain('href="/join-6529"');
        expect(html).not.toContain('href="/validator"');
        const openMenu = page.getByRole("button", {
          name: /^(Open|Toggle) menu/,
        });
        const isOverlay = isMobileSurfaceProject(testInfo.project.name);
        if (isOverlay) await openMenu.click();
        const nav = page
          .getByRole("navigation", { name: /^(Desktop|Primary) navigation$/ })
          .filter({ visible: true });
        await expect(nav).toBeVisible();
        const about = nav.getByRole("button", { name: "About", exact: true });
        const aboutBefore = await about.boundingBox();
        if (membership !== "guest") {
          await expect(
            nav.getByRole("link", { name: "Join 6529" })
          ).toBeHidden();
          await expect(
            nav.getByRole("link", { name: "Validator" })
          ).toHaveCount(0);
        }
        releaseIdentity();
        if (membership === "unavailable") {
          const retry = page.getByRole("button", {
            name: "Profile unavailable. Retry",
          });
          await expect(retry).toBeVisible({ timeout: 30_000 });
          await expect(
            nav.getByRole("link", { name: "Join 6529" })
          ).toBeHidden();
          await expect(
            nav.getByRole("link", { name: "Validator" })
          ).toHaveCount(0);
          identityUnavailable = false;
          await retry.click();
        }
        const isMember =
          membership === "member" || membership === "unavailable";
        const label = isMember ? "Validator" : "Join 6529";
        const destination = isMember ? "/validator" : "/join-6529";
        const link = nav.getByRole("link", { name: label, exact: true });
        await expect(link).toBeVisible();
        await expect(link).toHaveAttribute("href", destination);
        const background = await link.evaluate(
          (element) => getComputedStyle(element).backgroundColor
        );
        await link.hover();
        await expect(link).toHaveCSS("background-color", background);
        expect(await about.boundingBox()).toEqual(aboutBefore);
        await page.keyboard.press("Tab");
        await link.focus();
        await expect(link).toBeFocused();
        expect(
          await link.evaluate((element) => getComputedStyle(element).boxShadow)
        ).not.toBe("none");
        const dmBox = await nav
          .getByRole("link", { name: "DMs", exact: true })
          .boundingBox();
        const linkBox = await link.boundingBox();
        expect(linkBox!.y).toBeGreaterThanOrEqual(dmBox!.y + dmBox!.height);
        expect(linkBox!.y - (dmBox!.y + dmBox!.height)).toBeLessThanOrEqual(8);
        await link.click();
        await expect(page).toHaveURL((url) => url.pathname === destination, {
          timeout: 30_000,
        });
        // Route rendering and overlay dismissal finish after the URL updates.
        if (isOverlay) {
          await expect(nav).toBeHidden();
          await openMenu.click();
        }
        await expect(
          nav.getByRole("link", { name: label, exact: true })
        ).toHaveAttribute("aria-current", "page");
      } finally {
        releaseIdentity();
      }
    });
  }
});

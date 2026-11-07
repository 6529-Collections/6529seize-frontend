import type { Page } from "@playwright/test";
import { expect, test } from "../testHelpers";
import { useLocalSandboxMutationGuard } from "../support/localSandbox";

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
});

import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiWave } from "@/generated/models/ApiWave";
import { getWaveDraftStorageKey } from "@/helpers/waves/wave-draft.helpers";
import type { Locator, Page } from "@playwright/test";
import { expect, test, waitForRouteReady } from "../testHelpers";
import {
  expectNoUnsafeSandboxMutations,
  fetchSandboxRequests,
  getSandboxApiOrigin,
  hideNextDevOverlay,
  LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
  useLocalSandboxMutationGuard,
} from "../support/localSandbox";
import { longPressMessage } from "../support/longPressMessage";
import { isMobileSurfaceProject } from "../support/surfaceSimulation";

const wallet = "0x0000000000000000000000000000000000000529";
const replyWaveId = "00000000-0000-4000-8000-000000000529";
const replyProfileId = "00000000-0000-4000-8000-000000000531";
const proxyRole = "00000000-0000-4000-8000-000000000599";
const selectedReplyBackground = "rgba(60, 203, 127, 0.1)";
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

function replySessionJwt(role: string | null, address = wallet) {
  return [
    Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString(
      "base64url"
    ),
    Buffer.from(
      JSON.stringify({
        sub: address,
        role,
        exp: Math.floor(Date.now() / 1000) + 3600,
      })
    ).toString("base64url"),
    "",
  ].join(".");
}

async function seedReplySession(page: Page, initialRole: string | null) {
  const session = { role: initialRole, jwt: replySessionJwt(initialRole) };
  await page.addInitScript(
    ({ address, profileId, jwt, role }) => {
      if (localStorage.getItem("6529-wallet-accounts")) return;
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
    { address: wallet, profileId: replyProfileId, ...session }
  );
  // Preserve the acting role if normal foreground/session recovery runs.
  await page.route("**/api/auth/session-refresh", async (route) => {
    if (route.request().method() !== "POST") {
      await route.fallback();
      return;
    }
    const response = await route.fetch();
    const body = await response.json();
    await route.fulfill({
      response,
      json: { ...body, role: session.role, access_token: session.jwt },
    });
  });

  return async (role: string | null) => {
    session.role = role;
    session.jwt = replySessionJwt(role);
    await page.evaluate(({ jwt, role }) => {
      const accounts = JSON.parse(
        localStorage.getItem("6529-wallet-accounts") ?? "[]"
      ) as { jwt: string; role: string | null }[];
      const account = accounts[0];
      if (!account) throw new Error("Expected a saved sandbox session.");
      account.jwt = jwt;
      account.role = role;
      localStorage.setItem("6529-wallet-accounts", JSON.stringify(accounts));
      document.cookie = `__Host-wallet-auth=${jwt}; path=/; Secure`;
      // These are the app's normal same-tab session update notifications.
      dispatchEvent(new CustomEvent("6529-wallet-accounts-updated"));
      dispatchEvent(new CustomEvent("6529-auth-token-changed"));
      dispatchEvent(
        new CustomEvent("6529-profile-switched", {
          detail: { profileProxy: null },
        })
      );
    }, session);
    const cookie = await readSessionCookie(page);
    const payload = cookie?.value.split(".")[1];
    expect(payload).toBeDefined();
    const cookieRole: unknown = JSON.parse(
      Buffer.from(payload!, "base64url").toString()
    ).role;
    expect(cookieRole).toBe(role);
  };
}

async function openReplyAccessWave(page: Page) {
  await hideNextDevOverlay(page.context());
  await page.route("**/6529-emoji/emoji-list.json**", (route) =>
    route.fulfill({ json: [] })
  );
  await page.route("**/api/open-graph**", (route) =>
    route.fulfill({ json: {} })
  );
  await page.route("**/content-moderation/profiles/*/status", (route) => {
    const profileId = new URL(route.request().url()).pathname.split("/").at(-2);
    return route.fulfill({ json: { profile_id: profileId, status: "ACTIVE" } });
  });
  await page.goto(`/waves/${replyWaveId}`, { waitUntil: "domcontentloaded" });
  await waitForRouteReady(page);
  const row = page
    .getByRole("tabpanel")
    .locator('[data-wave-drop-id][data-serial-no="1"]')
    .first();
  await expect(row).toBeVisible({
    timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
  });
  return row;
}

async function expectNoReplySelection(page: Page, row: Locator) {
  await expect(
    page.getByRole("button", { name: "Cancel reply", exact: true })
  ).toHaveCount(0);
  await expect(
    page.getByRole("textbox", { name: "Post a reply", exact: true })
  ).toHaveCount(0);
  await expect(row).not.toHaveCSS("background-color", selectedReplyBackground);
  await expect(row).not.toHaveAttribute("data-reply-enabled", "true");
}

async function expectNoDropWrites(baseURL: string | undefined) {
  const requests = await fetchSandboxRequests(baseURL);
  expect(
    requests.filter(
      (request) =>
        !["GET", "HEAD", "OPTIONS"].includes(request.method) &&
        /^\/api\/(?:v2\/)?drops(?:\/|$)/.test(request.path)
    )
  ).toEqual([]);
  await expectNoUnsafeSandboxMutations(baseURL);
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

  for (const viewer of ["guest", "proxy"] as const) {
    test(`reply access keeps copying available without Reply for ${viewer}`, async ({
      page,
      baseURL,
    }, testInfo) => {
      test.skip(
        testInfo.project.name !== "web-mobile-chromium",
        "The mobile action sheet requires a touch browser."
      );
      if (viewer === "proxy") {
        await seedReplySession(page, proxyRole);
        // No matching received proxy: the token's acting role must still block Reply.
        await page.route("**/api/profiles/*/proxies**", (route) =>
          route.fulfill({ json: [] })
        );
      }
      await page
        .context()
        .grantPermissions(["clipboard-read", "clipboard-write"]);
      const row = await openReplyAccessWave(page);
      if (viewer === "guest") {
        await expect(
          page.getByRole("button", {
            name: "Sign in to 6529 to post",
            exact: true,
          })
        ).toBeVisible();
      } else {
        await expect(
          page.getByText(/You're signed in as a proxy for another profile/)
        ).toBeVisible();
      }
      await expectNoReplySelection(page, row);
      await longPressMessage(page, row, "Copy text");
      const sheet = page.getByRole("dialog", {
        name: "Drop actions",
        exact: true,
      });
      await expect(
        sheet.getByRole("button", { name: "Reply", exact: true })
      ).toHaveCount(0);
      await expect(
        sheet.getByRole("button", { name: "Copy link", exact: true })
      ).toBeEnabled();
      await page.screenshot({
        path: testInfo.outputPath(`reply-access-${viewer}.png`),
      });
      await sheet
        .getByRole("button", { name: "Copy text", exact: true })
        .click();
      await expect(sheet).toHaveCount(0);
      await expect
        .poll(() => page.evaluate(() => navigator.clipboard.readText()))
        .toMatch(
          /^playwright \([^\n]+\): https:\/\/example\.com\/6529-composer-preview$/
        );

      await longPressMessage(page, row, "Copy link");
      await sheet
        .getByRole("button", { name: "Copy link", exact: true })
        .click();
      await expect(sheet).toHaveCount(0);
      const copiedLink = new URL(
        await page.evaluate(() => navigator.clipboard.readText())
      );
      expect(copiedLink.pathname).toBe(`/waves/${replyWaveId}`);
      expect(copiedLink.searchParams.get("serialNo")).toBe("1");
      await expectNoReplySelection(page, row);
      await expectNoDropWrites(baseURL);
    });
  }

  test("reply access clears a selected target when the session changes to an orphan proxy role", async ({
    page,
    baseURL,
  }, testInfo) => {
    const switchRole = await seedReplySession(page, null);
    const row = await openReplyAccessWave(page);
    const primaryDraft = "Keep this unsent primary draft.";
    const primaryComposer = page
      .getByRole("textbox", { name: "Write a message", exact: true })
      .last();
    await primaryComposer.fill(primaryDraft);
    await expect
      .poll(() =>
        page.evaluate(
          (key) => sessionStorage.getItem(key),
          getWaveDraftStorageKey(replyWaveId)
        )
      )
      .toContain(primaryDraft);
    const isMobile = testInfo.project.name === "web-mobile-chromium";
    if (isMobile) {
      await longPressMessage(page, row);
      await page
        .getByRole("dialog", { name: "Drop actions", exact: true })
        .getByRole("button", { name: "Reply", exact: true })
        .click();
    } else {
      await row.hover();
      await row
        .getByRole("button", { name: "Reply to drop", exact: true })
        .click();
    }
    const reply = page
      .getByRole("textbox", { name: "Post a reply", exact: true })
      .last();
    await expect(reply).toBeVisible();
    const replyOnlyText = "This reply must not replace the primary draft.";
    await reply.fill(replyOnlyText);
    await expect(row).toHaveCSS("background-color", selectedReplyBackground);

    await switchRole(proxyRole);
    await expect(
      page.getByText(/You're signed in as a proxy for another profile/)
    ).toBeVisible();
    await expectNoReplySelection(page, row);
    if (isMobile) {
      await longPressMessage(page, row, "Copy text");
      const sheet = page.getByRole("dialog", {
        name: "Drop actions",
        exact: true,
      });
      await expect(
        sheet.getByRole("button", { name: "Reply", exact: true })
      ).toHaveCount(0);
      await page.keyboard.press("Escape");
      await expect(sheet).toHaveCount(0);
    } else {
      await row.hover();
      await expect(
        row.getByRole("button", { name: "Reply to drop", exact: true })
      ).toHaveCount(0);
    }
    await page.screenshot({
      path: testInfo.outputPath("reply-access-role-change.png"),
    });
    await switchRole(null);
    const restoredDraft = page
      .getByRole("textbox", { name: "Write a message", exact: true })
      .last();
    await expect(restoredDraft).toContainText(primaryDraft);
    await expect(restoredDraft).not.toContainText(replyOnlyText);
    await expect(
      page.getByRole("button", { name: "Cancel reply", exact: true })
    ).toHaveCount(0);
    await expect(row).not.toHaveCSS(
      "background-color",
      selectedReplyBackground
    );
    await expectNoDropWrites(baseURL);
  });

  test("reply access waits for the new own profile's permissions instead of inheriting the previous profile's grant", async ({
    page,
    baseURL,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "web-mobile-chromium",
      "One touch flow covers the shared actor-cache transition."
    );
    const visitorWallet = "0x0000000000000000000000000000000000000599";
    const visitorProfileId = "00000000-0000-4000-8000-000000000598";
    const visitorJwt = replySessionJwt(null, visitorWallet);
    await seedReplySession(page, null);
    const sourceProfile = await page.request.get(
      `${getSandboxApiOrigin(baseURL)}/api/identities/${wallet}`
    );
    expect(sourceProfile.ok()).toBe(true);
    const profile = (await sourceProfile.json()) as ApiIdentity;
    await page.route(`**/api/identities/${visitorWallet}`, (route) =>
      route.fulfill({
        json: {
          ...profile,
          id: visitorProfileId,
          handle: "reply-visitor",
          normalised_handle: "reply-visitor",
          query: visitorWallet,
          primary_wallet: visitorWallet,
          wallets: [{ wallet: visitorWallet, display: visitorWallet, tdh: 0 }],
        } satisfies ApiIdentity,
      })
    );
    await page.route("**/api/auth/session-refresh", async (route) => {
      if (route.request().method() !== "POST") {
        await route.fallback();
        return;
      }
      const body = route.request().postDataJSON() as {
        client_address?: string;
      };
      if (body.client_address?.toLowerCase() !== visitorWallet) {
        await route.fallback();
        return;
      }
      await route.fulfill({
        json: {
          address: visitorWallet,
          role: null,
          access_token: visitorJwt,
          access_token_expires_at: new Date(
            Date.now() + 3_600_000
          ).toISOString(),
          client_type: "web",
        },
      });
    });

    let visitorPermissionReads = 0;
    let releasePermissions!: () => void;
    const permissionGate = new Promise<void>((resolve) => {
      releasePermissions = resolve;
    });
    await page.route(`**/api/waves/${replyWaveId}`, async (route) => {
      const token = route.request().headers()["authorization"]?.split(" ")[1];
      const payload = token?.split(".")[1];
      const actor: unknown = payload
        ? JSON.parse(Buffer.from(payload, "base64url").toString()).sub
        : null;
      if (actor !== visitorWallet) {
        await route.fallback();
        return;
      }
      visitorPermissionReads += 1;
      await permissionGate;
      const response = await route.fetch();
      const wave = (await response.json()) as ApiWave;
      await route.fulfill({
        response,
        json: {
          ...wave,
          chat: {
            ...wave.chat,
            authenticated_user_eligible: false,
            replies: {
              open: false,
              collapsed: false,
              authenticated_user_eligible: false,
              authenticated_user_can_delete: false,
            },
          },
          participation: {
            ...wave.participation,
            authenticated_user_eligible: false,
          },
        } satisfies ApiWave,
      });
    });

    try {
      const row = await openReplyAccessWave(page);
      await expect(row).toHaveAttribute("data-reply-enabled", "true");
      await longPressMessage(page, row);
      const sheet = page.getByRole("dialog", {
        name: "Drop actions",
        exact: true,
      });
      await expect(
        sheet.getByRole("button", { name: "Reply", exact: true })
      ).toBeEnabled();

      await page.evaluate(
        ({ address, profileId, jwt }) => {
          const accounts = JSON.parse(
            localStorage.getItem("6529-wallet-accounts") ?? "[]"
          ) as Record<string, unknown>[];
          accounts.push({
            address,
            jwt,
            role: null,
            refreshToken: null,
            authSessionVersion: "v2",
            profileId,
            profileHandle: "reply-visitor",
          });
          localStorage.setItem(
            "6529-wallet-accounts",
            JSON.stringify(accounts)
          );
          localStorage.setItem("6529-wallet-active-address", address);
          document.cookie = `__Host-wallet-auth=${jwt}; path=/; Secure`;
          // Adopt the other tab's selected account through the normal storage path.
          dispatchEvent(
            new StorageEvent("storage", { key: "6529-wallet-active-address" })
          );
          dispatchEvent(new CustomEvent("6529-wallet-accounts-updated"));
          dispatchEvent(new CustomEvent("6529-auth-token-changed"));
          dispatchEvent(new CustomEvent("6529-profile-switched"));
        },
        { address: visitorWallet, profileId: visitorProfileId, jwt: visitorJwt }
      );
      await expect.poll(() => visitorPermissionReads).toBeGreaterThan(0);
      await expect(sheet).toHaveCount(0);
      await expect(
        page.getByRole("button", { name: "Reply", exact: true })
      ).toHaveCount(0);
      await expect(
        page.getByRole("tabpanel").locator('[data-reply-enabled="true"]')
      ).toHaveCount(0);
      await expect(
        page.getByRole("textbox", { name: "Post a reply", exact: true })
      ).toHaveCount(0);

      const permissionResponse = page.waitForResponse(
        (response) =>
          new URL(response.url()).pathname === `/api/waves/${replyWaveId}` &&
          response.request().headers()["authorization"] ===
            `Bearer ${visitorJwt}`
      );
      releasePermissions();
      await (await permissionResponse).finished();
      await expect(row).toBeVisible();
      await longPressMessage(page, row, "Copy text");
      await expect(
        sheet.getByRole("button", { name: "Reply", exact: true })
      ).toHaveCount(0);
      await page.screenshot({
        path: testInfo.outputPath("reply-access-own-profile-denied.png"),
      });
      await page.keyboard.press("Escape");
      await expect(sheet).toHaveCount(0);
      await expectNoReplySelection(page, row);
      await expectNoDropWrites(baseURL);
    } finally {
      releasePermissions();
    }
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

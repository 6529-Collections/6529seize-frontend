import type { Page } from "@playwright/test";
import { expect, expectNoHorizontalOverflow, test } from "../testHelpers";
import {
  getSandboxApiOrigin,
  useLocalSandboxMutationGuard,
} from "../support/localSandbox";

const ownerId = "00000000-0000-4000-8000-000000000531";
const wallet = "0x0000000000000000000000000000000000000529";

async function seedViewer(page: Page, api: string, viewer: string) {
  if (viewer === "logged-out") return;
  const id = viewer === "owner" ? ownerId : "nic-visitor";
  const viewerWallet =
    viewer === "owner" ? wallet : "0x0000000000000000000000000000000000000530";
  if (viewer === "visitor" || viewer === "unsigned") {
    await page.route(
      `${api}/api/identities/${viewerWallet}**`,
      async (route) => {
        const response = await route.fetch();
        const profile = await response.json();
        await route.fulfill({
          json: {
            ...profile,
            id,
            query: "nic-visitor",
            display: "nic-visitor",
            handle: "nic-visitor",
            normalised_handle: "nic-visitor",
            primary_address: viewerWallet,
            primary_wallet: viewerWallet,
            wallets: [{ wallet: viewerWallet, display: viewerWallet }],
          },
        });
      }
    );
  }
  const token = [
    Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString(
      "base64url"
    ),
    Buffer.from(
      JSON.stringify({ sub: viewerWallet, role: null, exp: 2000000000 })
    ).toString("base64url"),
    "",
  ].join(".");
  await page.addInitScript(
    ({ address, jwt, profileId, handle }) => {
      localStorage.setItem("6529-wallet-active-address", address);
      localStorage.setItem(
        "6529-wallet-accounts",
        JSON.stringify([
          {
            address,
            jwt,
            role: null,
            refreshToken: null,
            authSessionVersion: jwt === null ? null : "v2",
            profileId,
            profileHandle: handle,
          },
        ])
      );
    },
    {
      address: viewerWallet,
      jwt: viewer === "unsigned" ? null : token,
      profileId: id,
      handle: viewer === "owner" ? "playwright" : "nic-visitor",
    }
  );
}

function fixtureRows(onlyRep = false) {
  return Array.from({ length: 90 }, (_, i) => {
    const identity = !onlyRep && i % 3 === 0;
    const matter = !onlyRep && i % 3 === 1 ? "CIC" : i % 2 ? "REP" : "WAVE_REP";
    return {
      id: `activity-${i}`,
      profile_id: ownerId,
      profile_handle: "playwright",
      target_id: "recipient",
      target_profile_handle: matter === "CIC" ? `nic-entry-${i}` : "recipient",
      proxy_id: null,
      proxy_handle: null,
      is_target_of_type_drop: false,
      type: identity ? "HANDLE_EDIT" : "RATING_EDIT",
      additional_data_1: identity ? null : matter,
      additional_data_2: null,
      created_at: new Date(
        Date.UTC(2026, 10, 5, 0, 0) - i * 60000
      ).toISOString(),
      contents: identity
        ? { old_value: "before", new_value: `nic-entry-${i}` }
        : {
            rating_matter: matter,
            rating_category:
              matter === "CIC" ? `nic-entry-${i}` : "rep-leak-marker",
            old_rating: 0,
            new_rating: 1,
            change_reason: "USER_EDIT",
          },
    };
  });
}

async function installLogs(
  page: Page,
  api: string,
  onlyRep = false,
  actor = "playwright"
) {
  const requests: URLSearchParams[] = [];
  await page.route(`${api}/api/profile-logs?*`, async (route) => {
    expect(route.request().method()).toBe("GET");
    const params = new URL(route.request().url()).searchParams;
    requests.push(params);
    let rows = fixtureRows(onlyRep).map((row) => ({
      ...row,
      profile_handle: actor,
    }));
    const nic = params.get("activity_scope") === "NIC";
    if (nic)
      rows = rows.filter(
        (row) =>
          row.type !== "RATING_EDIT" ||
          !["REP", "WAVE_REP"].includes(row.additional_data_1 ?? "")
      );
    else if (params.has("rating_matter"))
      rows = rows.filter(
        (row) => row.additional_data_1 === params.get("rating_matter")
      );
    const types = params.get("log_type")?.split(",").filter(Boolean) ?? [];
    if (types.length) rows = rows.filter((row) => types.includes(row.type));
    const size = Number(params.get("page_size"));
    const pageNumber = Number(params.get("page"));
    const cursor = params.get("cursor");
    if (nic && pageNumber > 1) expect(cursor).toMatch(/^after-\d+$/);
    const offset = nic
      ? Number(cursor?.slice(6) ?? 0)
      : (pageNumber - 1) * size;
    const next = offset + size < rows.length;
    await route.fulfill({
      json: {
        page: pageNumber,
        next,
        data: rows.slice(offset, offset + size),
        ...(nic ? { next_cursor: next ? `after-${offset + size}` : null } : {}),
      },
    });
  });
  return requests;
}

async function selectNic(page: Page, width: number) {
  await expect(
    page.getByRole("heading", { name: "Activity Log", exact: true })
  ).toBeVisible();
  if (width >= 1200)
    await page
      .getByRole("tablist", { name: "Filter matter" })
      .getByRole("tab", { name: "NIC", exact: true })
      .click();
  else
    await page
      .getByRole("button", { name: /NIC/ })
      .filter({ has: page.getByText("NIC", { exact: true }) })
      .first()
      .click();
}

test.describe("Profile NIC activity @local-only", () => {
  useLocalSandboxMutationGuard(
    test,
    "PLAYWRIGHT_AUTH_SANDBOX",
    "Requires the isolated profile API fixture."
  );
  test.beforeEach(async ({ page, baseURL }) => {
    // Wave links request preview metadata with POST; keep that read-only lookup
    // local, alongside the subscription shape needed by visitor headers.
    await page.route(`${baseURL}/api/open-graph**`, (route) =>
      route.fulfill({ json: {} })
    );
    await page.route(
      `${getSandboxApiOrigin(baseURL)}/api/**identities/*/subscriptions`,
      (route) => {
        expect(route.request().method()).toBe("GET");
        return route.fulfill({ json: { actions: [] } });
      }
    );
  });
  for (const width of [1440, 820, 390]) {
    test(`${width}px fetches only the visible activity log`, async ({
      page,
      baseURL,
    }) => {
      await page.setViewportSize({ width, height: 1000 });
      const requests = await installLogs(page, getSandboxApiOrigin(baseURL));
      await page.goto("/playwright");
      await expect(
        page
          .getByText("rep-leak-marker", { exact: true })
          .filter({ visible: true })
          .first()
      ).toBeVisible();
      expect(requests).toHaveLength(1);
      expect(requests[0]?.get("rating_matter")).toBe(
        width >= 1024 ? null : "REP"
      );
    });

    for (const optimizerFails of [false, true]) {
      test(`${width}px main profile picture ${optimizerFails ? "recovers from optimizer failure" : "uses responsive optimization"}`, async ({
        page,
        baseURL,
      }, testInfo) => {
        await page.setViewportSize({ width, height: 1000 });
        await installLogs(page, getSandboxApiOrigin(baseURL));
        const source =
          "https://media.6529.io/ipfs/QmRT2Ur5E1GooeiCWxqToiQXnnok6drPYxuK8J3RLnaMg8";
        const png = Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAIAAABvFaqvAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAJUlEQVQ4jWPooBJgGDWIIBgNI8JgNIwIg9EwIgxGw4gwGMZhBAAG8pYuMnppeAAAAABJRU5ErkJggg==",
          "base64"
        );
        const widths: number[] = [];
        await page.route(source, (route) =>
          route.fulfill({ contentType: "image/png", body: png })
        );
        await page.route("**/_next/image?**", async (route) => {
          const params = new URL(route.request().url()).searchParams;
          if (params.get("url") !== source) return route.continue();
          widths.push(Number(params.get("w")));
          await route.fulfill({
            status: optimizerFails ? 503 : 200,
            contentType: "image/png",
            body: optimizerFails ? "" : png,
          });
        });
        await page.goto("/profile-picture");
        const image = page.getByRole("img", {
          name: "profile-picture's profile picture",
          exact: true,
        });
        await expect
          .poll(() =>
            image.evaluate((img: HTMLImageElement) => img.naturalWidth)
          )
          .toBeGreaterThan(0);
        expect(widths.length).toBeGreaterThan(0);
        expect(widths.every((value) => value > 0 && value <= 256)).toBe(true);
        if (optimizerFails) await expect(image).toHaveAttribute("src", source);
        else await expect(image).toHaveAttribute("src", /\/_next\/image\?/);
        const box = await image.boundingBox();
        expect(box?.width).toBe(width < 640 ? 80 : 112);
        expect(box?.height).toBe(width < 640 ? 80 : 112);
        await expectNoHorizontalOverflow(page);
        if (!optimizerFails)
          await page.screenshot({
            path: testInfo.outputPath("profile-picture.png"),
            fullPage: true,
          });
      });
    }
  }

  for (const startWidth of [390, 1440]) {
    test(`${startWidth}px retains both layouts' filters and pages across resizing`, async ({
      page,
      baseURL,
    }) => {
      const api = getSandboxApiOrigin(baseURL);
      const requests = await installLogs(page, api);
      await page.setViewportSize({ width: startWidth, height: 1000 });
      await page.goto("/playwright");
      await expect(
        page
          .getByText("rep-leak-marker", { exact: true })
          .filter({ visible: true })
          .first()
      ).toBeVisible();
      expect(requests).toHaveLength(1);

      await page.setViewportSize({ width: 1023, height: 1000 });
      const direction = page.getByRole("tablist", { name: "Filter direction" });
      await direction
        .getByRole("tab", { name: "Outgoing", exact: true })
        .click();
      await expect
        .poll(() => requests.at(-1)?.get("include_incoming"))
        .toBeNull();
      const mobileLog = page
        .getByRole("main")
        .locator('[class~="tw-group/profile-activity"]')
        .filter({ visible: true });
      await mobileLog
        .getByRole("button", { name: "Next", exact: true })
        .click();
      await expect.poll(() => requests.at(-1)?.get("page")).toBe("2");
      await expect(
        mobileLog.getByRole("button", { name: "Previous", exact: true })
      ).toBeVisible();
      const mobilePage = await mobileLog.innerText();

      await page.setViewportSize({ width: 1024, height: 1000 });
      await page
        .getByRole("tablist", { name: "Filter matter" })
        .getByRole("tab", { name: "NIC", exact: true })
        .click();
      const entries = page
        .getByText(/^nic-entry-\d+$/)
        .filter({ visible: true });
      await expect(entries).toHaveCount(10);
      await direction
        .getByRole("tab", { name: "Incoming", exact: true })
        .click();
      await expect(entries).toHaveCount(10);
      await page
        .getByRole("button", { name: /Filter activity types:/ })
        .click();
      await page.getByRole("button", { name: "Handle", exact: true }).click();
      await page.keyboard.press("Escape");
      await expect
        .poll(() => requests.at(-1)?.get("log_type")?.includes("HANDLE_EDIT"))
        .toBe(false);
      const desktopLog = page
        .getByRole("main")
        .locator('[class~="tw-group/profile-activity"]')
        .filter({ visible: true });
      await desktopLog
        .getByRole("button", { name: "Next", exact: true })
        .click();
      await expect.poll(() => requests.at(-1)?.get("cursor")).toBe("after-10");
      await expect(
        desktopLog.getByRole("button", { name: "Previous", exact: true })
      ).toBeVisible();
      const desktopEntries = await entries.allTextContents();
      const desktopFilterLabel = await page
        .getByRole("button", { name: /Filter activity types:/ })
        .getAttribute("aria-label");

      const pausedAt = requests.length;
      await page.setViewportSize({ width: 820, height: 1000 });
      await expect(
        direction.getByRole("tab", { name: "Outgoing", exact: true })
      ).toHaveAttribute("aria-selected", "true");
      await expect(
        mobileLog.getByRole("button", { name: "Previous", exact: true })
      ).toBeVisible();
      await expect(mobileLog).toHaveText(mobilePage, { useInnerText: true });
      expect(
        requests
          .slice(pausedAt)
          .every((request) => request.get("activity_scope") !== "NIC")
      ).toBe(true);

      await page.setViewportSize({ width: 1440, height: 1000 });
      await expect(
        direction.getByRole("tab", { name: "Incoming", exact: true })
      ).toHaveAttribute("aria-selected", "true");
      await expect(
        page
          .getByRole("tablist", { name: "Filter matter" })
          .getByRole("tab", { name: "NIC", exact: true })
      ).toHaveAttribute("aria-selected", "true");
      await expect
        .poll(() => entries.allTextContents())
        .toEqual(desktopEntries);
      await expect(
        desktopLog.getByRole("button", { name: "Previous", exact: true })
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: /Filter activity types:/ })
      ).toHaveAttribute("aria-label", desktopFilterLabel!);
      await desktopLog
        .getByRole("button", { name: "Next", exact: true })
        .click();
      await expect.poll(() => requests.at(-1)?.get("cursor")).toBe("after-20");
      await expect(entries).toHaveCount(10);
      await expectNoHorizontalOverflow(page);
    });
  }
  for (const width of [1440, 390]) {
    for (const optimizerFails of [false, true]) {
      test(`${width}px activity avatars ${optimizerFails ? "recover from optimizer failure" : "use small optimized images"}`, async ({
        page,
        baseURL,
      }) => {
        await page.setViewportSize({ width, height: 1000 });
        const api = getSandboxApiOrigin(baseURL);
        await installLogs(page, api, false, "avatar-user");
        const source =
          "https://media.6529.io/ipfs/QmZ41GvrNSPUpSs4mfQy4jxUNudcLM6CXUTFwqtVd2m2XP";
        const png = Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAIAAABvFaqvAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAJUlEQVQ4jWPooBJgGDWIIBgNI8JgNIwIg9EwIgxGw4gwGMZhBAAG8pYuMnppeAAAAABJRU5ErkJggg==",
          "base64"
        );
        const optimizerWidths: number[] = [];
        await page.route(
          `${api}/api/identities/avatar-user*`,
          async (route) => {
            const response = await route.fetch();
            const identity = await response.json();
            await route.fulfill({ json: { ...identity, pfp: source } });
          }
        );
        await page.route(source, (route) =>
          route.fulfill({ contentType: "image/png", body: png })
        );
        await page.route("**/_next/image?**", async (route) => {
          const params = new URL(route.request().url()).searchParams;
          if (params.get("url") !== source) {
            await route.continue();
            return;
          }
          optimizerWidths.push(Number(params.get("w")));
          await route.fulfill({
            status: optimizerFails ? 503 : 200,
            contentType: "image/png",
            body: optimizerFails ? "" : png,
          });
        });
        await page.goto("/playwright");
        const avatar = page
          .getByRole("img", { name: "avatar-user", exact: true })
          .filter({ visible: true })
          .first();
        await avatar.scrollIntoViewIfNeeded();
        await expect
          .poll(() =>
            avatar.evaluate((img: HTMLImageElement) => img.naturalWidth)
          )
          .toBeGreaterThan(0);
        expect(optimizerWidths.length).toBeGreaterThan(0);
        expect(optimizerWidths.every((value) => value > 0 && value <= 96)).toBe(
          true
        );
        if (optimizerFails) await expect(avatar).toHaveAttribute("src", source);
        else await expect(avatar).toHaveAttribute("src", /\/_next\/image\?/);
        const box = await avatar.boundingBox();
        expect(box?.width).toBe(24);
        expect(box?.height).toBe(24);
        await expectNoHorizontalOverflow(page);
      });
    }
  }
  for (const width of [1440, 820, 390]) {
    for (const viewer of ["owner", "visitor", "logged-out", "unsigned"]) {
      test(`${width}px ${viewer}: preserves identity, filters and cursor navigation`, async ({
        page,
        baseURL,
      }, testInfo) => {
        await page.setViewportSize({ width, height: 1000 });
        const api = getSandboxApiOrigin(baseURL);
        await seedViewer(page, api, viewer);
        const requests = await installLogs(page, api);
        if (viewer === "logged-out") {
          await page.goto("/playwright");
        } else {
          // Hydrate the saved session before navigating to the profile, as in
          // the existing authenticated profile sandbox coverage.
          await page.goto("/waves/00000000-0000-4000-8000-000000000529");
          await page
            .getByRole("link", { name: "playwright", exact: true })
            .first()
            .click();
          await page.waitForURL(/\/playwright$/, { timeout: 20000 });
        }
        if (viewer === "visitor") {
          await expect(
            page.getByRole("button", { name: "Follow", exact: true })
          ).toBeVisible();
        }
        if (viewer === "unsigned") {
          expect(
            await page.evaluate(() =>
              localStorage.getItem("6529-wallet-active-address")
            )
          ).toBe("0x0000000000000000000000000000000000000530");
        }
        await selectNic(page, width);
        const entries = page
          .getByText(/^nic-entry-\d+$/)
          .filter({ visible: true });
        await expect(entries).toHaveCount(10);
        await expect(
          page
            .getByText("rep-leak-marker", { exact: true })
            .filter({ visible: true })
        ).toHaveCount(0);
        const first = await entries.allTextContents();
        await page
          .getByRole("button", { name: "Next", exact: true })
          .last()
          .click();
        await expect.poll(() => entries.allTextContents()).not.toEqual(first);
        await expect(entries).toHaveCount(10);
        expect(
          (await entries.allTextContents()).some((text) => first.includes(text))
        ).toBe(false);
        await page
          .getByRole("button", { name: "Previous", exact: true })
          .last()
          .click();
        await expect.poll(() => entries.allTextContents()).toEqual(first);
        for (const direction of ["Incoming", "Outgoing"]) {
          await page
            .getByRole("tablist", { name: "Filter direction" })
            .getByRole("tab", { name: direction, exact: true })
            .click();
          await expect(entries).toHaveCount(10);
          await expect.poll(() => requests.at(-1)?.get("cursor")).toBeNull();
          await expect
            .poll(() =>
              requests
                .at(-1)
                ?.get(direction === "Incoming" ? "target" : "profile")
            )
            .toBe("playwright");
        }
        await page
          .getByRole("button", { name: /Filter activity types:/ })
          .click();
        await page.getByRole("button", { name: "Handle", exact: true }).click();
        await page.keyboard.press("Escape");
        await expect
          .poll(() => requests.at(-1)?.get("log_type")?.includes("HANDLE_EDIT"))
          .toBe(false);
        await expect(
          page
            .getByText("rep-leak-marker", { exact: true })
            .filter({ visible: true })
        ).toHaveCount(0);
        await expectNoHorizontalOverflow(page);
        await page.screenshot({
          path: testInfo.outputPath("nic-activity.png"),
          fullPage: true,
        });
        if (width >= 1200) {
          const matter = page.getByRole("tablist", { name: "Filter matter" });
          await matter.getByRole("tab", { name: "REP", exact: true }).click();
          await expect(
            page
              .getByText("rep-leak-marker", { exact: true })
              .filter({ visible: true })
              .first()
          ).toBeVisible();
          expect(
            requests.some(
              (request) =>
                request.get("rating_matter") === "REP" &&
                !request.has("activity_scope")
            )
          ).toBe(true);
          await matter.getByRole("tab", { name: "All", exact: true }).click();
          await expect(entries.first()).toBeVisible();
          await expect(
            page
              .getByText("rep-leak-marker", { exact: true })
              .filter({ visible: true })
              .first()
          ).toBeVisible();
          expect(
            requests.some(
              (request) =>
                !request.has("rating_matter") && !request.has("activity_scope")
            )
          ).toBe(true);
        }
      });
    }
  }
  test("REP-only profile has an empty NIC log", async ({ page, baseURL }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await installLogs(page, getSandboxApiOrigin(baseURL), true);
    await page.goto("/playwright");
    await selectNic(page, 1440);
    await expect(
      page.getByText("No Activity Log", { exact: true })
    ).toBeVisible();
    await expect(
      page
        .getByText("rep-leak-marker", { exact: true })
        .filter({ visible: true })
    ).toHaveCount(0);
  });
  for (const width of [1440, 390]) {
    test(`${width}px unsupported NIC response shows an error and Retry can recover`, async ({
      page,
      baseURL,
    }, testInfo) => {
      await page.setViewportSize({ width, height: 1000 });
      const api = getSandboxApiOrigin(baseURL);
      await installLogs(page, api);
      let unsupported = true;
      await page.route(`${api}/api/profile-logs?*`, async (route) => {
        const query = new URL(route.request().url()).searchParams;
        if (unsupported && query.get("activity_scope") === "NIC") {
          await route.fulfill({
            json: {
              page: 1,
              next: false,
              data: fixtureRows(true).slice(0, 10),
            },
          });
        } else {
          await route.fallback();
        }
      });
      await page.goto("/playwright");
      await selectNic(page, width);
      const alert = page.getByRole("alert").filter({
        hasText: "Unable to load activity log.",
      });
      // The query keeps its normal automatic retries before settling as failed.
      await expect(alert).toBeVisible({ timeout: 15000 });
      await expect(
        page.getByRole("status", { name: "Loading activity log" })
      ).toHaveCount(0);
      await expect(
        page
          .getByText("rep-leak-marker", { exact: true })
          .filter({ visible: true })
      ).toHaveCount(0);
      await expectNoHorizontalOverflow(page);
      await page.screenshot({
        path: testInfo.outputPath("nic-error.png"),
        fullPage: true,
      });
      // Full-page capture crosses media queries. Let the resumed layout's
      // normal retries settle before exercising the explicit Retry action.
      await expect(alert).toBeVisible({ timeout: 15000 });
      unsupported = false;
      await alert.getByRole("button", { name: "Retry", exact: true }).click();
      await expect(
        page.getByText(/^nic-entry-\d+$/).filter({ visible: true })
      ).toHaveCount(10);
      await expect(alert).toHaveCount(0);
    });
  }
});

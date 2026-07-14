import type { APIRequestContext } from "@playwright/test";

import { expect, test } from "../testHelpers";
import {
  gotoReady,
  gotoReadyWithApiResponse,
  RESPONSE_TIMEOUT_MS,
  waitForApiResponse,
} from "../support/routeReadiness";
import { isDesktopWebProject } from "../support/surfaceSimulation";

async function expectNoStoreJsonError(
  request: APIRequestContext,
  path: string,
  expectedStatus: number,
  expectedError: RegExp | string
) {
  const response = await request.get(path);
  expect(response.status()).toBe(expectedStatus);
  expect(response.headers()["cache-control"] ?? "").toContain("no-store");
  const body = (await response.json()) as { error?: unknown };
  if (expectedError instanceof RegExp) {
    expect(String(body.error)).toMatch(expectedError);
  } else {
    expect(body.error).toBe(expectedError);
  }
}

test.describe("Network, Open Data, and public API read-only coverage @surface @medium @large @readonly", () => {
  test("Network route loads sorted public member data", async ({
    page,
  }, testInfo) => {
    const response = await gotoReadyWithApiResponse(
      page,
      "/network?sort-by=tdh&sort-direction=desc&page=1",
      (url) => url.pathname === "/api/community-members/top"
    );

    await expect(page).toHaveTitle("Network");
    await expect(
      page.getByRole("heading", { level: 1, name: "Network" })
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Nerd view" })).toBeVisible();

    const body = (await response.json()) as { data?: unknown };
    expect(Array.isArray(body.data)).toBe(true);

    if (isDesktopWebProject(testInfo.project.name)) {
      await expect(
        page.getByRole("columnheader", { name: "TDH", exact: true })
      ).toBeVisible({
        timeout: RESPONSE_TIMEOUT_MS,
      });
    }
  });

  test("Network health loads public metric cards", async ({ page }) => {
    const dayResponse = waitForApiResponse(
      page,
      (url) =>
        url.pathname === "/api/community-metrics" &&
        url.searchParams.get("interval") === "DAY"
    );
    const weekResponse = waitForApiResponse(
      page,
      (url) =>
        url.pathname === "/api/community-metrics" &&
        url.searchParams.get("interval") === "WEEK"
    );
    const mintResponse = waitForApiResponse(
      page,
      (url) => url.pathname === "/api/community-metrics/mints"
    );

    await gotoReady(page, "/network/health");
    await Promise.all([dayResponse, weekResponse, mintResponse]);

    await expect(page).toHaveTitle("Health");
    await expect(
      page.getByRole("heading", { level: 1, name: "Health" })
    ).toBeVisible();
    for (const card of [
      "Network TDH",
      "xTDH Granted",
      "Active Identities",
      "Consolidations Formed",
    ]) {
      await expect(page.getByText(card, { exact: true })).toBeVisible({
        timeout: RESPONSE_TIMEOUT_MS,
      });
    }
  });

  test("Open Data index exposes public download categories", async ({
    page,
  }) => {
    await gotoReady(page, "/open-data");

    await expect(page).toHaveTitle("Open Data");
    await expect(
      page.getByRole("heading", { level: 1, name: "Open Data" })
    ).toBeVisible();

    for (const [name, href] of [
      ["Network Metrics", "/open-data/network-metrics"],
      ["6529bot Usage", "/open-data/6529bot"],
      ["Rememes", "/open-data/rememes"],
      ["Team", "/open-data/team"],
      ["Royalties", "/open-data/royalties"],
    ] as const) {
      await expect(page.getByRole("link", { name })).toHaveAttribute(
        "href",
        href
      );
    }
  });

  test("Network Metrics downloads route reads public upload metadata", async ({
    page,
  }) => {
    const response = await gotoReadyWithApiResponse(
      page,
      "/open-data/network-metrics",
      (url) =>
        url.pathname === "/api/consolidated_uploads" &&
        url.searchParams.get("page_size") === "25" &&
        url.searchParams.get("page") === "1"
    );

    await expect(page).toHaveTitle("Consolidated Network Metrics | Open Data");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Consolidated Network Metrics Downloads",
      })
    ).toBeVisible();
    const body = (await response.json()) as { data?: unknown };
    expect(Array.isArray(body.data)).toBe(true);

    const externalLinks = page.locator('main a[target="_blank"]');
    if ((await externalLinks.count()) > 0) {
      await expect(externalLinks.first()).toHaveAttribute(
        "rel",
        /noopener noreferrer/
      );
    }
  });

  test("API documentation remains readable without executing examples", async ({
    page,
  }) => {
    await gotoReady(page, "/tools/api");

    await expect(page).toHaveTitle("API");
    await expect(
      page.getByRole("heading", { level: 1, name: "6529.io API" })
    ).toBeVisible();
    for (const section of [
      "Introduction",
      "Key terminology",
      "Authentication quickstart",
      "Creating drops with embedded media",
    ]) {
      await expect(page.getByText(section, { exact: true })).toBeVisible();
    }
    await expect(
      page.getByRole("link", { name: "https://api.6529.io/docs" })
    ).toHaveAttribute("href", "https://api.6529.io/docs/");
    await expect(
      page.getByRole("link", { name: "https://api.6529.io/docs" })
    ).toHaveAttribute("rel", /noopener noreferrer/);
  });

  test("Restricted route remains fail-closed", async ({ page }) => {
    await gotoReady(page, "/restricted");

    await expect(page).toHaveTitle("Restricted");
    const input = page.locator('main input[type="text"]');
    await expect(input).toBeVisible();
    await expect(input).toBeDisabled();
  });

  test("public route handlers fail closed on invalid GET input", async ({
    request,
  }) => {
    const version = await request.get("/api/version");
    expect(version.status()).toBe(200);
    expect(version.headers()["cache-control"] ?? "").toContain("no-store");
    expect(
      typeof ((await version.json()) as { version?: unknown }).version
    ).toBe("string");

    await expectNoStoreJsonError(
      request,
      "/api/alchemy/contract",
      400,
      "address is required"
    );
    await expectNoStoreJsonError(
      request,
      "/api/alchemy/collections?query=",
      400,
      "query is required"
    );
    await expectNoStoreJsonError(
      request,
      "/api/alchemy/owner-nfts?chainId=not-a-number",
      400,
      "chainId is required"
    );

    const farcaster = await request.get("/api/farcaster?url=http://127.0.0.1/");
    expect(farcaster.status()).toBe(400);
    expect(
      String(((await farcaster.json()) as { error?: unknown }).error)
    ).toMatch(/127\.0\.0\.1|not allowed|forbidden|public/i);

    const tiktok = await request.get("/api/tiktok");
    expect(tiktok.status()).toBe(400);
    expect((await tiktok.json()) as { error?: string }).toEqual({
      error: "A url query parameter is required.",
    });
  });
});

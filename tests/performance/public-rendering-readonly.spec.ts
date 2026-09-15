import type { Page, Route } from "@playwright/test";
import { load } from "cheerio";

import { expect, test, waitForRouteReady } from "../testHelpers";
import { isDesktopWebProject } from "../support/surfaceSimulation";

const WALLET_PROVIDER_HOST =
  /(?:^|\.)(?:walletconnect\.(?:com|org)|reown\.com)$/i;

function isWalletProviderHost(url: string): boolean {
  try {
    return WALLET_PROVIDER_HOST.test(new URL(url).hostname);
  } catch {
    return false;
  }
}

function isWalletProviderRequest(route: Route): boolean {
  const request = route.request();
  if (request.method() !== "GET") {
    return false;
  }

  return isWalletProviderHost(request.url());
}

async function openAnonymousAboutPage(page: Page) {
  const response = await page.goto("/about", { waitUntil: "domcontentloaded" });
  expect(response).not.toBeNull();

  // This is the document response, before Playwright waits for hydration. Keep
  // the contract semantic: useful public route content and a public route link
  // must already be present in the initial HTML.
  const initialHtml = await response!.text();
  const initialDocument = load(initialHtml);
  expect(initialDocument("h1").text()).toContain("About 6529");
  expect(initialDocument('a[href="/about/faq"]')).toHaveLength(1);

  await waitForRouteReady(page);
  await expect(
    page.getByRole("heading", { level: 1, name: "About 6529" })
  ).toBeVisible();
}

test.describe("Public rendering remains usable while wallet startup is delayed @performance @readonly", () => {
  test("delivers homepage content, links, and structured data in the initial HTML", async ({
    page,
  }, testInfo) => {
    test.skip(
      !isDesktopWebProject(testInfo.project.name),
      "Representative public rendering coverage runs on the desktop web shell"
    );

    const response = await page.goto("/", { waitUntil: "domcontentloaded" });
    expect(response).not.toBeNull();
    const initialHtml = await response!.text();
    const initialDocument = load(initialHtml);
    expect(initialDocument("h1").text()).toContain(
      "Building a decentralized network state"
    );
    expect(initialDocument('a[href="/network/health"]')).toHaveLength(1);
    expect(initialDocument('script[type="application/ld+json"]')).toHaveLength(
      1
    );

    await waitForRouteReady(page);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Building a decentralized network state",
      })
    ).toBeVisible();
  });

  test("keeps an anonymous route and public navigation available during wallet-provider startup", async ({
    page,
  }, testInfo) => {
    test.skip(
      !isDesktopWebProject(testInfo.project.name),
      "Representative public rendering coverage runs on the desktop web shell"
    );

    await page.routeWebSocket(/.*/, async (webSocket) => {
      if (isWalletProviderHost(webSocket.url())) {
        await webSocket.close();
        return;
      }
      webSocket.connectToServer();
    });

    await page.route("**/*", async (route) => {
      if (isWalletProviderRequest(route)) {
        await route.abort("connectionfailed");
        return;
      }
      await route.continue();
    });

    await openAnonymousAboutPage(page);

    // Public navigation must work independently of third-party wallet hosts.
    await page
      .getByRole("link", { name: "Open page: FAQ", exact: true })
      .click();
    await expect(page).toHaveURL(/\/about\/faq$/);
    await waitForRouteReady(page);
    const publicMain = page.getByRole("main").first();
    await expect(publicMain).toBeVisible();

    // Wallet intent may initialize locally without making an external request.
    // Either way, an unavailable provider must not remove the public route.
    await page.getByRole("button", { name: "Connect Wallet" }).click();
    await expect(publicMain).toBeVisible();
  });
});

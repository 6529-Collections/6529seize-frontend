import type { Page } from "@playwright/test";

import {
  assertNoConsoleErrors,
  expect,
  expectNoHorizontalOverflow,
  test,
  waitForRouteReady,
} from "../testHelpers";

type ConsoleDiagnostics = {
  consoleErrors: string[];
  pageErrors: string[];
};

function attachConsoleDiagnostics(page: Page): ConsoleDiagnostics {
  const diagnostics: ConsoleDiagnostics = {
    consoleErrors: [],
    pageErrors: [],
  };

  page.on("console", (message) => {
    if (message.type() === "error") {
      diagnostics.consoleErrors.push(message.text());
    }
  });

  return diagnostics;
}

async function expectRouteShellHealthy(
  page: Page,
  diagnostics: ConsoleDiagnostics,
  options: { assertConsoleErrors?: boolean } = {}
) {
  const assertConsoleErrors = options.assertConsoleErrors ?? true;

  await expectNoHorizontalOverflow(page);
  if (assertConsoleErrors) {
    assertNoConsoleErrors(diagnostics);
  }
}

test.describe("Critical read-only route shells @critical-shell @medium @large", () => {
  test("keeps EMMA wallet gate readable and fail-closed", async ({ page }) => {
    const diagnostics = attachConsoleDiagnostics(page);

    await page.goto("/emma", { waitUntil: "domcontentloaded" });
    await waitForRouteReady(page, { readySelector: "h1" });

    await expect(
      page.getByRole("heading", { level: 1, name: "EMMA" }).first()
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "Connect Your Wallet" })
    ).toBeVisible();
    await expect(page.getByText("No gas is needed")).toBeVisible();
    await expectRouteShellHealthy(page, diagnostics);
  });

  test("keeps Drop Forge unauthorized users out", async ({ page }) => {
    const diagnostics = attachConsoleDiagnostics(page);

    await page.goto("/drop-forge", { waitUntil: "domcontentloaded" });
    await waitForRouteReady(page, { readySelector: "main" });

    await expect(
      page.getByRole("heading", { level: 1, name: "Drop Forge" })
    ).toBeVisible();
    await expect(page.getByText("You have no power here")).toBeVisible({
      timeout: 8000,
    });
    await expectRouteShellHealthy(page, diagnostics);
  });

  test("keeps app wallets in the unsupported desktop state", async ({
    page,
  }) => {
    const diagnostics = attachConsoleDiagnostics(page);

    await page.goto("/tools/app-wallets", { waitUntil: "domcontentloaded" });
    await waitForRouteReady(page, { readySelector: "h1" });

    await expect(
      page.getByRole("heading", { level: 1, name: "App Wallets" })
    ).toBeVisible();
    await expect(
      page.getByText("App Wallets are not supported on this platform")
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "TAKE ME HOME" })
    ).toHaveAttribute("href", "/");
    await expectRouteShellHealthy(page, diagnostics);
  });

  test("keeps reviewbot admin protected without operator auth", async ({
    page,
  }) => {
    const diagnostics = attachConsoleDiagnostics(page);

    await page.goto("/tools/6529bot/admin", {
      waitUntil: "domcontentloaded",
    });
    await waitForRouteReady(page);

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /^(Admin Not Configured|Operator Sign-In Required|Admin Access Restricted)$/,
      })
    ).toBeVisible();
    await expectRouteShellHealthy(page, diagnostics);
  });

  test("keeps authenticated content shells behind wallet connection", async ({
    page,
  }) => {
    const diagnostics = attachConsoleDiagnostics(page);

    for (const path of ["/notifications", "/messages"]) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      await waitForRouteReady(page, { readySelector: "h1" });

      await expect(
        page.getByRole("heading", {
          level: 1,
          name: "This content is only available to connected wallets.",
        })
      ).toBeVisible();
      await expect(
        page.getByText("Connect your wallet to continue.")
      ).toBeVisible();
      await expectRouteShellHealthy(page, diagnostics);
    }
  });

  test("keeps the public waves shell mountable", async ({ page }) => {
    const diagnostics = attachConsoleDiagnostics(page);

    await page.goto("/waves", { waitUntil: "domcontentloaded" });
    await waitForRouteReady(page, { readySelector: "#waves-content" });

    await expect(page.locator("#waves-content")).toBeVisible();
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Latest From Profile Waves",
      })
    ).toBeVisible();
    await expect(
      page.getByText(
        "Drops 6529 users are featuring from their own profile waves."
      )
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Profile Waves Feed" })
    ).toHaveAttribute("href", "/waves");
    // Feed API health gets its own coverage; this pack guards the shell mount.
    await expectRouteShellHealthy(page, diagnostics, {
      assertConsoleErrors: false,
    });
  });

  test("keeps open data and block finder tools usable", async ({ page }) => {
    const diagnostics = attachConsoleDiagnostics(page);

    await page.goto("/open-data", { waitUntil: "domcontentloaded" });
    await waitForRouteReady(page);
    await expect(
      page.getByRole("heading", { level: 1, name: "Open Data" })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "6529bot Usage" })
    ).toHaveAttribute("href", "/open-data/6529bot");
    await expectRouteShellHealthy(page, diagnostics);

    await page.goto("/tools/block-finder", { waitUntil: "domcontentloaded" });
    await waitForRouteReady(page, { readySelector: "h1" });
    await expect(
      page.getByRole("heading", { level: 1, name: "Block Finder" })
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Submit" })).toBeDisabled();
    await expectRouteShellHealthy(page, diagnostics);
  });
});

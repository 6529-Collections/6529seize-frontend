import { test as base } from "@playwright/test";

const STAGING_HOSTNAME = "staging.6529.io";
const STAGING_ACCESS_CODE =
  process.env["PLAYWRIGHT_STAGING_ACCESS_CODE"] ?? process.env["STAGING_AUTH"];

async function unlockStagingAccess(page: import("@playwright/test").Page) {
  await page.goto("/");
  if (!isAccessUrl(page.url())) {
    return;
  }

  if (!STAGING_ACCESS_CODE) {
    throw new Error(
      "Staging Playwright tests require PLAYWRIGHT_STAGING_ACCESS_CODE or STAGING_AUTH."
    );
  }

  const accessInput = page
    .locator(
      'input[aria-label="Team access code"], input[placeholder="Team Login"]'
    )
    .first();

  await accessInput.fill(STAGING_ACCESS_CODE);
  await Promise.all([
    page
      .waitForURL((url) => !isAccessPath(url), { timeout: 10000 })
      .catch(() => undefined),
    accessInput.press("Enter"),
  ]);

  if (isAccessUrl(page.url())) {
    await page.goto("/");
  }

  if (isAccessUrl(page.url())) {
    throw new Error("Staging access gate did not unlock.");
  }
}

function isAccessPath(url: URL) {
  return url.pathname === "/access" || url.pathname.startsWith("/access/");
}

function isAccessUrl(url: string) {
  try {
    return isAccessPath(new URL(url));
  } catch {
    return url.includes("/access");
  }
}

function shouldUnlockStaging(baseURL?: string) {
  if (!baseURL) {
    return false;
  }

  try {
    return new URL(baseURL).hostname === STAGING_HOSTNAME;
  } catch {
    return false;
  }
}

const test = base.extend({
  page: async ({ page, baseURL }, runTest) => {
    if (shouldUnlockStaging(baseURL)) {
      await unlockStagingAccess(page);
    }

    await runTest(page);
  },
});

export { expect } from "@playwright/test";
export { test };

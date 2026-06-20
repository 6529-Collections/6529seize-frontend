import { test as base } from "@playwright/test";

import {
  assertNoPageErrors,
  attachPageDiagnostics,
  attachPageDiagnosticsArtifact,
} from "./support/pageAssertions";
import { installReadonlyMutationGuard } from "./support/readonlyMutationGuard";

const STAGING_HOSTNAME = "staging.6529.io";
const STAGING_ACCESS_CODE =
  process.env["PLAYWRIGHT_STAGING_ACCESS_CODE"] ?? process.env["STAGING_AUTH"];
const ACCESS_INPUT_SELECTOR =
  'input[aria-label="Team access code"], input[placeholder="Team Login"]';

async function unlockStagingAccess(page: import("@playwright/test").Page) {
  await page.goto("/");
  if (!(await isAccessGateVisible(page))) {
    return;
  }

  if (!STAGING_ACCESS_CODE) {
    throw new Error(
      "Staging Playwright tests require PLAYWRIGHT_STAGING_ACCESS_CODE or STAGING_AUTH."
    );
  }

  const accessInput = page.locator(ACCESS_INPUT_SELECTOR).first();

  await accessInput.waitFor({ state: "visible", timeout: 5000 });
  await accessInput.fill(STAGING_ACCESS_CODE);
  const loginDialog = page
    .waitForEvent("dialog", { timeout: 10000 })
    .then(async (dialog) => {
      await dialog.accept();
    })
    .catch(() => undefined);

  await accessInput.press("Enter");
  await loginDialog;
  await page
    .waitForURL((url) => !isAccessPath(url), { timeout: 10000 })
    .catch(() => undefined);

  if (await isAccessGateVisible(page)) {
    await page.goto("/", { waitUntil: "domcontentloaded" });
  }

  if (await isAccessGateVisible(page)) {
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

async function isAccessGateVisible(page: import("@playwright/test").Page) {
  if (isAccessUrl(page.url())) {
    return true;
  }

  return page
    .locator(ACCESS_INPUT_SELECTOR)
    .first()
    .isVisible({ timeout: 500 })
    .catch(() => false);
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
  context: async ({ context, baseURL }, runTest) => {
    const guard = await installReadonlyMutationGuard(context, baseURL);

    await runTest(context);

    guard.assertNoBlockedRequests();
  },
  page: async ({ page, baseURL }, runTest, testInfo) => {
    const diagnostics = attachPageDiagnostics(page);

    if (shouldUnlockStaging(baseURL)) {
      await unlockStagingAccess(page);
    }

    await runTest(page);

    await attachPageDiagnosticsArtifact(testInfo, diagnostics);
    assertNoPageErrors(diagnostics);
  },
});

export { expect } from "@playwright/test";
export {
  assertNoConsoleErrors,
  assertNoPageErrors,
  captureSafeScreenshot,
  expectNoHorizontalOverflow,
  waitForRouteReady,
} from "./support/pageAssertions";
export {
  resolvePlaywrightTestSize,
  tagTestTitle,
  TEST_SIZE_TAGS,
} from "./support/testSizes";
export { test };

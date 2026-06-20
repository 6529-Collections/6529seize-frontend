import { test as base } from "@playwright/test";
import type { Page } from "@playwright/test";

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
type PageGoto = (...args: Parameters<Page["goto"]>) => ReturnType<Page["goto"]>;

async function installStagingAccessUnlock(page: Page) {
  const originalGoto = page.goto.bind(page) as PageGoto;
  const gotoWithAccessUnlock: PageGoto = async (...args) => {
    const response = await originalGoto(...args);
    if (!(await isAccessGateVisible(page))) {
      return response;
    }

    if (!isStagingPage(page)) {
      return response;
    }

    await submitStagingAccess(page, originalGoto);
    return originalGoto(...args);
  };

  page.goto = gotoWithAccessUnlock as Page["goto"];
  await gotoWithAccessUnlock("/", { waitUntil: "domcontentloaded" });
}

async function submitStagingAccess(page: Page, goto: PageGoto) {
  if (!(await isAccessGateVisible(page))) {
    return;
  }

  if (!isStagingPage(page)) {
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
    if (!isStagingPage(page)) {
      return;
    }

    await goto("/", { waitUntil: "domcontentloaded" });
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

function isStagingPage(page: Page) {
  try {
    return new URL(page.url()).hostname === STAGING_HOSTNAME;
  } catch {
    return false;
  }
}

async function isAccessGateVisible(page: Page) {
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
      await installStagingAccessUnlock(page);
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

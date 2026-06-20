import { expect, type Page, type TestInfo } from "@playwright/test";

import {
  attachRedactedTextArtifact,
  sanitizeArtifactName,
} from "./artifactRedaction";

export type PageDiagnostics = {
  consoleErrors: string[];
  pageErrors: string[];
};

const BENIGN_CONSOLE_ERROR_PATTERNS = [
  /Failed to load resource: the server responded with a status of (403|404)/i,
  /net::ERR_ABORTED/i,
];

function isBenignConsoleError(message: string) {
  return BENIGN_CONSOLE_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

export function attachPageDiagnostics(page: Page): PageDiagnostics {
  const diagnostics: PageDiagnostics = {
    consoleErrors: [],
    pageErrors: [],
  };

  page.on("console", (message) => {
    if (message.type() !== "error") {
      return;
    }
    diagnostics.consoleErrors.push(message.text());
  });

  page.on("pageerror", (error) => {
    diagnostics.pageErrors.push(error.stack || error.message);
  });

  return diagnostics;
}

export async function attachPageDiagnosticsArtifact(
  testInfo: TestInfo,
  diagnostics: PageDiagnostics
) {
  if (
    diagnostics.consoleErrors.length === 0 &&
    diagnostics.pageErrors.length === 0
  ) {
    return;
  }

  await attachRedactedTextArtifact(
    testInfo,
    "playwright-page-diagnostics.txt",
    [
      "Page errors:",
      ...diagnostics.pageErrors,
      "",
      "Console errors:",
      ...diagnostics.consoleErrors,
    ].join("\n")
  );
}

export function assertNoPageErrors(diagnostics: PageDiagnostics) {
  if (diagnostics.pageErrors.length === 0) {
    return;
  }

  throw new Error(
    `Unexpected browser page error(s):\n${diagnostics.pageErrors.join("\n")}`
  );
}

export function assertNoConsoleErrors(diagnostics: PageDiagnostics) {
  const actionable = diagnostics.consoleErrors.filter(
    (message) => !isBenignConsoleError(message)
  );

  if (actionable.length === 0) {
    return;
  }

  throw new Error(
    `Unexpected browser console error(s):\n${actionable.join("\n")}`
  );
}

export async function waitForRouteReady(
  page: Page,
  options: { readySelector?: string; timeout?: number } = {}
) {
  const timeout = options.timeout ?? 45000;
  const readySelector = options.readySelector ?? "main";

  await page.waitForLoadState("domcontentloaded", {
    timeout,
  });
  await page.locator("body").waitFor({ state: "attached", timeout });
  await expect(page.locator(readySelector).first()).toBeVisible({ timeout });
}

export async function expectNoHorizontalOverflow(
  page: Page,
  options: { tolerancePx?: number; sampleLimit?: number } = {}
) {
  const tolerancePx = options.tolerancePx ?? 2;
  const sampleLimit = options.sampleLimit ?? 8;
  const result = await page.evaluate(
    ({ sampleLimit: limit, tolerancePx: tolerance }) => {
      const documentWidth = document.documentElement.clientWidth;
      const scrollWidth = document.documentElement.scrollWidth;
      const offenders = [...document.body.querySelectorAll("*")]
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            tag: element.tagName.toLowerCase(),
            className: String(element.getAttribute("class") || ""),
            id: String(element.getAttribute("id") || ""),
            right: Math.ceil(rect.right),
            width: Math.ceil(rect.width),
          };
        })
        .filter((item) => item.right > documentWidth + tolerance)
        .slice(0, limit);

      return {
        documentWidth,
        offenders,
        scrollWidth,
        overflowPx: scrollWidth - documentWidth,
      };
    },
    { sampleLimit, tolerancePx }
  );

  expect(
    result.overflowPx,
    `Expected no horizontal overflow. Offenders: ${JSON.stringify(
      result.offenders
    )}`
  ).toBeLessThanOrEqual(tolerancePx);
}

export async function captureSafeScreenshot(
  page: Page,
  testInfo: TestInfo,
  name: string
) {
  const fileName = `${sanitizeArtifactName(name) || "screenshot"}.png`;
  const path = testInfo.outputPath(fileName);
  await page.screenshot({ fullPage: true, path });
  await testInfo.attach(fileName, {
    contentType: "image/png",
    path,
  });
}

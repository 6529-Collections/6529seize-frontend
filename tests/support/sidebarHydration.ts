import type { Page, TestInfo } from "@playwright/test";

import { expect } from "../testHelpers";
import { attachRedactedTextArtifact } from "./artifactRedaction";

type BundleTiming = {
  path: string;
  startedMs: number;
  downloadedMs?: number;
  deliveredMs?: number;
  bytes?: number;
  status?: number;
  error?: string;
};

/**
 * Download real bundles while withholding their execution during SSR checks.
 * Call release() in a finally block so a failed assertion cannot strand delivery.
 */
export async function gateSidebarHydration(page: Page) {
  const started = Date.now();
  const bundles = new Map<string, BundleTiming>();
  let releasedMs: number | undefined;
  let readyMs: number | undefined;
  let missingBundles: string[] = [];
  let release!: () => void;
  const deliveryGate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const routePattern = /\/_next\/.*\.js(?:\?.*)?$/;
  await page.route(routePattern, async (route) => {
    const url = route.request().url();
    const timing: BundleTiming = {
      path: new URL(url).pathname,
      startedMs: Date.now() - started,
    };
    bundles.set(url, timing);
    try {
      const response = await route.fetch({ timeout: 30_000, maxRedirects: 0 });
      const body = await response.body();
      timing.status = response.status();
      timing.bytes = body.byteLength;
      timing.downloadedMs = Date.now() - started;
      await deliveryGate;
      await route.fulfill({ response, body });
      timing.deliveredMs = Date.now() - started;
    } catch (error) {
      timing.error = error instanceof Error ? error.message : String(error);
      await route.abort("failed").catch(() => undefined);
    }
  });

  return {
    async waitForDownloads() {
      await expect
        .poll(
          async () => {
            const sources = await page.evaluate(() =>
              [...document.scripts]
                .filter((script) => !script.noModule)
                .map((script) => script.src)
                .filter((src) => /\/_next\/.*\.js(?:\?.*)?$/.test(src))
            );
            missingBundles = sources
              .filter((src) => !bundles.has(src))
              .map((src) => new URL(src).pathname);
            return (
              sources.length > 0 &&
              sources.every((src) => {
                const bundle = bundles.get(src);
                return (
                  bundle?.downloadedMs !== undefined && bundle.status === 200
                );
              })
            );
          },
          {
            timeout: 30_000,
            message:
              "Initial Next.js bundles must download before hydration is released",
          }
        )
        .toBe(true);
    },
    release() {
      releasedMs ??= Date.now() - started;
      release();
    },
    async waitForReady() {
      await expect(
        page.getByRole("main").first().locator("..")
      ).toHaveAttribute("data-sidebar-ready", "true", { timeout: 15_000 });
      readyMs = Date.now() - started;
    },
    async attachEvidence(testInfo: TestInfo) {
      await attachRedactedTextArtifact(
        testInfo,
        "sidebar-hydration-timing.json",
        JSON.stringify(
          {
            releasedMs,
            readyMs,
            missingBundles,
            bundles: [...bundles.values()],
          },
          null,
          2
        )
      );
    },
  };
}

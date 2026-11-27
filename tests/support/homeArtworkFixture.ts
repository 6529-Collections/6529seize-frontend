import type { Page } from "@playwright/test";

const installedFixtures = new WeakMap<
  Page,
  { readonly documentsReplaced: () => number }
>();

/**
 * Layout/search tests must not execute changing, third-party HTML artwork.
 * Keep the real homepage and iframe renderers, including server-seeded drops;
 * browser API fixtures cannot replace those server reads. Both the NFT renderer
 * and Coming Up's sandboxed submission renderer are covered by their containers.
 * Dedicated media tests deliberately do not install this fixture.
 */
export async function installHomeArtworkFixture(page: Page) {
  const installed = installedFixtures.get(page);
  if (installed) return installed;

  let documentsReplaced = 0;
  await page.route("**/*", async (route) => {
    const request = route.request();
    if (
      request.method() !== "GET" ||
      !request.isNavigationRequest() ||
      request.resourceType() !== "document"
    ) {
      await route.fallback();
      return;
    }
    const frame = request.frame();
    if (frame.parentFrame() === null) {
      await route.fallback();
      return;
    }
    const element = await frame.frameElement();
    let isHomeArtwork: boolean;
    try {
      isHomeArtwork = await element.evaluate(
        (iframe) =>
          iframe instanceof Element &&
          iframe.closest(
            '[data-home-drop], [data-home-section="Coming up"]'
          ) !== null
      );
    } finally {
      await element.dispose();
    }
    if (!isHomeArtwork) {
      await route.fallback();
      return;
    }
    documentsReplaced += 1;
    await route.fulfill({
      contentType: "text/html",
      body: '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#777"><p>HTML artwork fixture</p></body></html>',
    });
  });
  const fixture = { documentsReplaced: () => documentsReplaced };
  installedFixtures.set(page, fixture);
  return fixture;
}

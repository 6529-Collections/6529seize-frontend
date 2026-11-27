import type { Page, Route } from "@playwright/test";

const FIXTURE_ARTWORK_DOCUMENT =
  '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Fixture artwork</title></head><body><p>Isolated homepage artwork fixture</p></body></html>';

/** Isolate unrelated SSR artwork while a synthetic homepage fixture hydrates. */
export async function isolateHomeArtworkDocuments(page: Page) {
  await page.route("**/*", async (route: Route) => {
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
    if (frame.parentFrame() !== page.mainFrame()) {
      await route.fallback();
      return;
    }

    let isHomeArtwork: boolean;
    try {
      const element = await frame.frameElement();
      try {
        isHomeArtwork = await element.evaluate(
          (node) =>
            node instanceof Element && node.closest("[data-home-drop]") !== null
        );
      } finally {
        await element.dispose();
      }
    } catch (error) {
      // Hydration can remove the server-selected iframe before its GET settles.
      if (!frame.isDetached()) throw error;
      await route.abort();
      return;
    }

    if (!isHomeArtwork) {
      await route.fallback();
      return;
    }
    await route.fulfill({
      contentType: "text/html",
      body: FIXTURE_ARTWORK_DOCUMENT,
    });
  });
}

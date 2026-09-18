import type { Page } from "@playwright/test";

import { isLocalMuseumRun } from "./localMuseumAppKitConfig";

// Local Museum checks verify publication rendering, not the CI runner's IP
// geolocation. Keep the country lookup deterministic without masking failures
// in Museum content, media, or deployed-environment country checks.
export async function installLocalMuseumCountryCheck(
  page: Pick<Page, "route">,
  baseURL: string | undefined
): Promise<void> {
  if (!isLocalMuseumRun(baseURL)) {
    return;
  }

  await page.route(
    (url) =>
      ["https://api.6529.io", "https://api.staging.6529.io"].includes(
        url.origin
      ) &&
      url.pathname === "/api/policies/country-check" &&
      !url.username &&
      !url.password,
    async (route) => {
      if (route.request().method() !== "GET") {
        await route.fallback();
        return;
      }

      await route.fulfill({
        status: 200,
        json: { country: "US", is_eu: false },
      });
    }
  );
}

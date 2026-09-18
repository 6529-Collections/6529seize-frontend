import type { Page } from "@playwright/test";

export function isLocalMuseumRun(baseURL: string | undefined): boolean {
  const environment = process.env["PLAYWRIGHT_ENV"];
  if (!baseURL || (environment && environment !== "local")) {
    return false;
  }

  const url = new URL(baseURL);
  return (
    url.protocol === "http:" &&
    ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) &&
    !url.username &&
    !url.password
  );
}

// Anonymous local publication checks do not exercise hosted wallet features.
// AppKit 1.8.19 expects { features: TypedFeatureConfig[] }; an empty array
// explicitly disables those features without hiding other requests or errors.
export async function installLocalMuseumAppKitConfig(
  page: Pick<Page, "route">,
  baseURL: string | undefined
): Promise<void> {
  if (!isLocalMuseumRun(baseURL)) {
    return;
  }

  await page.route(
    (url) =>
      url.origin === "https://api.web3modal.org" &&
      url.pathname === "/appkit/v1/config" &&
      !url.username &&
      !url.password,
    async (route) => {
      if (route.request().method() !== "GET") {
        await route.fallback();
        return;
      }

      await route.fulfill({ status: 200, json: { features: [] } });
    }
  );
}

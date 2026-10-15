import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve, sep } from "node:path";
import type { Page } from "@playwright/test";

import manifest from "../fixtures/museum-media/manifest.json";
import { isLocalMuseumRun } from "./localMuseumAppKitConfig";

// Local rendering checks use the exact retained CDN bytes. Deployed checks
// continue exercising the real proxy and upstream delivery.
export async function installLocalMuseumMedia(
  page: Pick<Page, "route">,
  baseURL: string | undefined
): Promise<void> {
  if (!baseURL || !isLocalMuseumRun(baseURL)) return;
  const origin = new URL(baseURL).origin;
  const root = process.cwd();
  const fixtures = new Map<string, Buffer>();
  for (const entry of manifest) {
    const path = resolve(root, entry.path);
    if (!path.startsWith(`${root}${sep}`) || fixtures.has(entry.url)) {
      throw new Error(`Invalid Museum media fixture: ${entry.path}`);
    }
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- checked-in manifest paths are confined to the repository root above.
    const body = readFileSync(path);
    if (createHash("sha256").update(body).digest("hex") !== entry.sha256) {
      throw new Error(`Museum media fixture hash mismatch: ${entry.path}`);
    }
    fixtures.set(entry.url, body);
  }

  await page.route(
    (url) => url.origin === origin && url.pathname === "/api/museum/media",
    async (route) => {
      if (route.request().method() !== "GET") {
        await route.fallback();
        return;
      }
      const requestUrl = new URL(route.request().url());
      const source = requestUrl.searchParams.get("url") ?? "";
      const body = fixtures.get(source);
      if (
        !body ||
        requestUrl.searchParams.size !== 1 ||
        requestUrl.username ||
        requestUrl.password
      ) {
        await route.abort("failed");
        throw new Error(`Unrecorded Museum media request: ${source}`);
      }
      await route.fulfill({ status: 200, contentType: "image/webp", body });
    }
  );
}

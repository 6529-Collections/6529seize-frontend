/** @jest-environment node */
import { unstable_getResponseFromNextConfig } from "next/experimental/testing/server";
import { publicEnvSchema } from "@/config/env.schema";
import { sharedConfig } from "@/config/nextConfig";
import { ROOT_PUBLIC_FILES } from "@/lib/proxy/publicPaths";
import { VERSION_RELOAD_IMAGE_SRC } from "@/components/version-update/versionReloadImage";

const BRAND_ASSET_CACHE_CONTROL =
  "public, max-age=86400, stale-while-revalidate=604800";
const GENERATED_FILE_CACHE_CONTROL =
  "public, max-age=300, stale-while-revalidate=3600";

const baseEnv = {
  NODE_ENV: "production",
  BASE_ENDPOINT: "https://6529.io",
  API_ENDPOINT: "https://api.6529.io",
  ALLOWLIST_API_ENDPOINT: "https://allowlist-api.6529.io",
  IPFS_API_ENDPOINT: "https://api-ipfs.6529.io",
  IPFS_GATEWAY_ENDPOINT: "https://ipfs.6529.io",
};

function getResponse(
  path: string,
  overrides: Partial<typeof baseEnv> = {}
): Promise<Response> {
  const env = { ...baseEnv, ...overrides };
  return unstable_getResponseFromNextConfig({
    url: `${env.BASE_ENDPOINT}${path}`,
    nextConfig: sharedConfig(publicEnvSchema.parse(env), ""),
  });
}

async function getCacheControl(
  path: string,
  overrides: Partial<typeof baseEnv> = {}
): Promise<string | null> {
  return (await getResponse(path, overrides)).headers.get("cache-control");
}

const GENERATED_FILES = ["/help-index.json", "/llms.txt", "/glossary.json"];
// The reload cover image carries a content hash and is served immutable by
// its own rule (config/versionReloadImageHeaders.ts), so it is checked apart.
const rootImages = [...ROOT_PUBLIC_FILES].filter(
  (path) =>
    /\.(?:png|jpe?g|svg|webp|avif)$/i.test(path) &&
    path !== VERSION_RELOAD_IMAGE_SRC
);

describe("public file cache policy", () => {
  it("covers the root-level images the page shell loads on every view", () => {
    expect(rootImages).toEqual(
      expect.arrayContaining(["/6529.svg", "/twitter.png", "/github_w.png"])
    );
  });

  it.each(rootImages)(
    "gives the root image %s a day of freshness with stale-while-revalidate",
    async (path) => {
      expect(await getCacheControl(path)).toBe(BRAND_ASSET_CACHE_CONTROL);
    }
  );

  it("keeps the content-hashed reload cover image immutable", async () => {
    expect(await getCacheControl(VERSION_RELOAD_IMAGE_SRC)).toBe(
      "public, max-age=31536000, immutable"
    );
  });

  it.each(GENERATED_FILES)(
    "keeps the per-deploy file %s fresh for five minutes only",
    async (path) => {
      expect(await getCacheControl(path)).toBe(GENERATED_FILE_CACHE_CONTROL);
    }
  );

  it.each(["/robots.txt", "/ens.html", "/primary_address.csv"])(
    "leaves the non-image root file %s on Next's default policy",
    async (path) => {
      expect(await getCacheControl(path)).toBeNull();
    }
  );

  it.each([
    "/",
    "/the-memes",
    "/about/6529-apps",
    "/api/version",
    "/_next/static/chunks/main.js",
    "/museum/example.png",
    "/pebbles/example.png",
    "/not-a-public-file.png",
    "/someone.svg",
    "/twitter.png.html",
    "/nested/twitter.png",
  ])("does not touch %s", async (path) => {
    expect(await getCacheControl(path)).toBeNull();
  });

  it("keeps the security headers on cached public files", async () => {
    for (const path of ["/twitter.png", "/help-index.json"]) {
      const response = await getResponse(path);
      expect(response.headers.get("x-content-type-options")).toBe("nosniff");
      expect(response.headers.get("content-security-policy")).toContain(
        "default-src 'none'"
      );
    }
  });

  it("keeps staging noindex alongside the cache policy", async () => {
    const response = await getResponse("/help-index.json", {
      BASE_ENDPOINT: "https://staging.6529.io",
    });
    expect(response.headers.get("cache-control")).toBe(
      GENERATED_FILE_CACHE_CONTROL
    );
    expect(response.headers.get("x-robots-tag")).toBe("noindex");
  });

  it.each(["development", "local"] as const)(
    "leaves public files uncached under NODE_ENV=%s so edits show on reload",
    async (nodeEnv) => {
      for (const path of ["/twitter.png", "/help-index.json"]) {
        expect(await getCacheControl(path, { NODE_ENV: nodeEnv })).toBeNull();
      }
    }
  );
});

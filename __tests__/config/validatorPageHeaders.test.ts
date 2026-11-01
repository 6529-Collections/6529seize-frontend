/** @jest-environment node */
import { unstable_getResponseFromNextConfig } from "next/experimental/testing/server";
import { sharedConfig } from "@/config/nextConfig";
import { publicEnvSchema } from "@/config/env.schema";
import { shouldExcludeSitemapPath } from "@/next-sitemap.config";

const productionEnv = publicEnvSchema.parse({
  NODE_ENV: "production",
  BASE_ENDPOINT: "https://6529.io",
  API_ENDPOINT: "https://api.6529.io",
  ALLOWLIST_API_ENDPOINT: "https://allowlist-api.6529.io",
  IPFS_API_ENDPOINT: "https://api-ipfs.6529.io",
  IPFS_GATEWAY_ENDPOINT: "https://ipfs.6529.io",
});

function getResponse(path: string) {
  return unstable_getResponseFromNextConfig({
    url: `https://6529.io${path}`,
    nextConfig: sharedConfig(productionEnv, ""),
  });
}

describe("validator download pages stay out of search engines", () => {
  it.each([
    "/validator",
    "/validator/guide",
    "/validator/releases",
    "/validator/releases.json",
    "/validator/download/0.1.0-test.1/SHA256SUMS",
  ])("sends noindex, nofollow on %s", async (path) => {
    const response = await getResponse(path);
    expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow");
    expect(response.headers.get("content-security-policy")).toBeTruthy();
  });

  it("leaves other production pages indexable", async () => {
    const response = await getResponse("/validators");
    expect(response.headers.get("x-robots-tag")).toBeNull();
  });

  it.each(["/validator", "/validator/guide", "/validator/releases"])(
    "keeps %s out of the sitemap",
    (path) => {
      expect(shouldExcludeSitemapPath(path)).toBe(true);
    }
  );
});

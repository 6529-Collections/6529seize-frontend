/** @jest-environment node */
import { unstable_getResponseFromNextConfig } from "next/experimental/testing/server";
import { sharedConfig } from "@/config/nextConfig";
import { publicEnvSchema } from "@/config/env.schema";

const productionEnv = publicEnvSchema.parse({
  NODE_ENV: "production",
  BASE_ENDPOINT: "https://6529.io",
  API_ENDPOINT: "https://api.6529.io",
  ALLOWLIST_API_ENDPOINT: "https://allowlist-api.6529.io",
  IPFS_API_ENDPOINT: "https://api-ipfs.6529.io",
  IPFS_GATEWAY_ENDPOINT: "https://ipfs.6529.io",
});

function getResponse(
  baseEndpoint: string,
  path: string,
  requestOrigin = baseEndpoint
) {
  return unstable_getResponseFromNextConfig({
    url: `${requestOrigin}${path}`,
    // Forwarded headers must not opt a production deployment into noindex.
    headers: { "x-forwarded-host": "staging.6529.io" },
    nextConfig: sharedConfig(
      { ...productionEnv, BASE_ENDPOINT: baseEndpoint },
      ""
    ),
  });
}

describe("staging-only indexing policy", () => {
  it.each([
    "/",
    "/access",
    "/restricted",
    "/error",
    "/delegation/wallet-checker?address=0x1",
    "/nextgen/collection/pebbles/art",
    "/robots.txt",
    "/sitemap.xml",
    "/api/example",
    "/favicon.svg",
    "/artwork/the-memes/445.html",
  ])(
    "adds noindex to staging responses at %s even with a production build",
    async (path) => {
      const response = await getResponse("https://staging.6529.io", path);
      expect(response.headers.get("x-robots-tag")).toBe("noindex");
      expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    }
  );

  it("keeps the staging policy when the origin proxy replaces the request host", async () => {
    const response = await getResponse(
      "https://staging.6529.io",
      "/access",
      "http://localhost:3000"
    );
    expect(response.headers.get("x-robots-tag")).toBe("noindex");
  });

  it.each([
    "https://6529.io",
    "https://www.6529.io",
    "http://localhost:3001",
    "https://prxtstaging.6529.io",
    "https://preview.6529.io",
    "https://staging.6529.io.example.com",
  ])(
    "does not apply blanket noindex to %s or trust forwarded-host input",
    async (origin) => {
      for (const path of [
        "/",
        "/access",
        "/rememes/0xe63f4e6ce4110a2fad3de9ed38e7ea5858eb953b/2281",
      ]) {
        const response = await getResponse(origin, path);
        expect(response.headers.get("x-robots-tag")).toBeNull();
      }
    }
  );

  it("retains intentional production noindex on the isolated artwork viewer", async () => {
    const response = await getResponse(
      "https://6529.io",
      "/artwork/the-memes/445.html"
    );
    expect(response.headers.get("x-robots-tag")).toBe("noindex");
  });
});

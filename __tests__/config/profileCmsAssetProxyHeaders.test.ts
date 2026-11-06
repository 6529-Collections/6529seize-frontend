/** @jest-environment node */
import { unstable_getResponseFromNextConfig } from "next/experimental/testing/server";
import { publicEnvSchema } from "@/config/env.schema";
import { sharedConfig } from "@/config/nextConfig";
import { PROFILE_CMS_ASSET_CONTENT_SECURITY_POLICY } from "@/config/profileCmsAssetProxyHeaders";

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

describe("profile CMS asset proxy headers", () => {
  it("replaces the site policy with a sandboxed, load-nothing policy", async () => {
    const response = await getResponse(
      `/api/profile-cms/assets?url=${encodeURIComponent(
        "https://d3lqz0a4bldqgf.cloudfront.net/images/a.webp"
      )}`
    );

    expect(response.headers.get("content-security-policy")).toBe(
      PROFILE_CMS_ASSET_CONTENT_SECURITY_POLICY
    );
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  });

  it("leaves the site policy on other routes", async () => {
    const response = await getResponse("/api/profile-cms/other");

    expect(response.headers.get("content-security-policy")).not.toBe(
      PROFILE_CMS_ASSET_CONTENT_SECURITY_POLICY
    );
    expect(response.headers.get("content-security-policy")).toContain(
      "script-src"
    );
  });
});

/** @jest-environment node */
import { unstable_getResponseFromNextConfig } from "next/experimental/testing/server";
import { publicEnvSchema } from "@/config/env.schema";
import { sharedConfig } from "@/config/nextConfig";
import { OPEN_GRAPH_PROXY_IMAGE_CONTENT_SECURITY_POLICY } from "@/config/openGraphProxyImageHeaders";

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

describe("link-preview image proxy headers", () => {
  it("replaces the site policy with a sandboxed, load-nothing policy", async () => {
    const response = await getResponse(
      `/api/open-graph/proxy-image?url=${encodeURIComponent(
        "https://wx1.sinaimg.cn/large/example.jpg"
      )}`
    );

    expect(response.headers.get("content-security-policy")).toBe(
      OPEN_GRAPH_PROXY_IMAGE_CONTENT_SECURITY_POLICY
    );
    expect(OPEN_GRAPH_PROXY_IMAGE_CONTENT_SECURITY_POLICY).toContain("sandbox");
    expect(OPEN_GRAPH_PROXY_IMAGE_CONTENT_SECURITY_POLICY).not.toContain(
      "allow-scripts"
    );
  });

  it("leaves the site policy on the other link-preview routes", async () => {
    const response = await getResponse(
      "/api/open-graph?url=https://example.com"
    );

    expect(response.headers.get("content-security-policy")).toContain(
      "script-src"
    );
  });
});

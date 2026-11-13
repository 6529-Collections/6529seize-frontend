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

function getResponse(path: string) {
  return unstable_getResponseFromNextConfig({
    url: `https://6529.io${path}`,
    nextConfig: sharedConfig(productionEnv, ""),
  });
}

describe("accept-connection-sharing referrer policy", () => {
  it.each([
    "/accept-connection-sharing",
    "/accept-connection-sharing?token=synthetic&address=0x1",
    "/accept-connection-sharing?connection_share_code=synthetic&address=0x1",
  ])("never sends a Referer from %s", async (path) => {
    const response = await getResponse(path);

    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    // The route-specific policy must not drop the site-wide security headers.
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("content-security-policy")).toBeTruthy();
  });

  it.each(["/", "/accept-connection-sharing-other", "/access"])(
    "keeps the site-wide referrer policy on %s",
    async (path) => {
      const response = await getResponse(path);
      expect(response.headers.get("referrer-policy")).toBe("same-origin");
    }
  );
});

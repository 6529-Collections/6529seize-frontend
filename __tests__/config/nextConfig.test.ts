import { sharedConfig } from "@/config/nextConfig";
import type { PublicEnv } from "@/config/env.schema";

const publicEnv = {
  API_ENDPOINT: "https://api.6529.io",
  BASE_ENDPOINT: "https://6529.io",
  IPFS_GATEWAY_ENDPOINT: "https://ipfs.6529.io",
} as PublicEnv;

describe("shared Next config", () => {
  it("keeps React Strict Mode disabled by explicit migration policy", () => {
    expect(sharedConfig(publicEnv, "").reactStrictMode).toBe(false);
  });

  it("does not publish production browser source maps by default", () => {
    expect(
      sharedConfig(publicEnv, "").productionBrowserSourceMaps
    ).toBeUndefined();
  });

  it("excludes public-review inputs from production traces", () => {
    expect(sharedConfig(publicEnv, "").outputFileTracingExcludes).toEqual({
      "/*": ["content/public-reviews/**/*", "public/review-data/**/*"],
    });
  });

  it("lets staging packaging inject canonical public-review inputs", () => {
    const stagingEnv = {
      ...publicEnv,
      BASE_ENDPOINT: "https://staging.6529.io",
    };

    expect(sharedConfig(stagingEnv, "").outputFileTracingExcludes).toEqual({
      "/*": ["content/public-reviews/**/*", "public/review-data/**/*"],
    });
  });
});

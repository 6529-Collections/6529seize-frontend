import { hasRemoteMatch } from "next/dist/shared/lib/match-remote-pattern";
import { sharedConfig } from "@/config/nextConfig";
import type { PublicEnv } from "@/config/env.schema";

const publicEnv = {
  API_ENDPOINT: "https://api.6529.io",
  BASE_ENDPOINT: "https://6529.io",
  IPFS_GATEWAY_ENDPOINT: "https://ipfs.6529.io",
} as PublicEnv;

describe("shared Next config", () => {
  it("permanently redirects the former Delegation Center to Safe Collecting", async () => {
    expect(await sharedConfig(publicEnv, "").redirects?.()).toContainEqual({
      source: "/delegation/delegation-center",
      destination: "/safe-collecting",
      permanent: true,
    });
  });

  it("keeps React Strict Mode disabled by explicit migration policy", () => {
    expect(sharedConfig(publicEnv, "").reactStrictMode).toBe(false);
  });

  it("keeps the build type check on the TypeScript API checker that skips test files", () => {
    expect(sharedConfig(publicEnv, "").experimental?.useTypeScriptCli).toBe(
      false
    );
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

  it("includes Sharp libvips assets in the OG image route trace", () => {
    expect(sharedConfig(publicEnv, "").outputFileTracingIncludes).toEqual({
      "/*": [".museum-publication/current.json"],
      "/api/og-metadata/image": [
        "node_modules/@img/sharp-libvips-*/**/*",
        "node_modules/.pnpm/@img+sharp-libvips-*/node_modules/@img/sharp-libvips-*/**/*",
      ],
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

describe("Alchemy image optimization policy", () => {
  const thumbnailPath =
    "/cdn-cgi/image/width=250,height=250,fit=scale-down/eth-mainnet/a3062b74e1b4d79fdab0ca1ec5a92615";
  const patterns = sharedConfig(publicEnv, "").images?.remotePatterns ?? [];

  it.each([
    `https://nft2-cdn.alchemy.com${thumbnailPath}`,
    "https://res.cloudinary.com/alchemyapi/image/upload/thumbnailv2/eth-mainnet/example",
  ])("allows the supported thumbnail source %s", (url) => {
    expect(hasRemoteMatch([], patterns, new URL(url))).toBe(true);
  });

  it.each([
    `http://nft2-cdn.alchemy.com${thumbnailPath}`,
    `https://nft2-cdn.alchemy.com:8443${thumbnailPath}`,
    `https://nft2-cdn.alchemy.com.evil.example${thumbnailPath}`,
    `https://other.alchemy.com${thumbnailPath}`,
    `https://nft2-cdn.alchemy.com${thumbnailPath}?url=https://example.com`,
    "https://nft2-cdn.alchemy.com/unrelated/image.png",
    "https://nft2-cdn.alchemy.com/cdn-cgi/image/width=250/https://example.com/image.png",
  ])("rejects sources outside the Alchemy thumbnail rule: %s", (url) => {
    expect(hasRemoteMatch([], patterns, new URL(url))).toBe(false);
  });
});

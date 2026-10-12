/**
 * @jest-environment node
 */

import {
  getRewrittenUrl,
  isRewrite,
  unstable_doesMiddlewareMatch,
  unstable_getResponseFromNextConfig,
} from "next/experimental/testing/server";
import { GET as missingNextAsset } from "@/app/api/missing-next-asset/route";
import {
  MISSING_NEXT_ASSET_REWRITES,
  MISSING_NEXT_ASSET_ROUTE,
} from "@/lib/proxy/plainResponses";
import { config } from "@/proxy";

describe("proxy matcher", () => {
  it.each([
    "/_next/static/chunks/main.js",
    "/_next/static/chunks/main.js.map",
    "/_next/static/media/font.woff2",
    "/_next/image?url=%2F6529io.png&w=64&q=75",
  ])("skips real asset route %s", (url) => {
    expect(unstable_doesMiddlewareMatch({ config, url })).toBe(false);
  });

  it.each([
    "/",
    "/waves",
    "/the-memes/1.png",
    "/6529io.png",
    "/.git/HEAD",
    "/.well-known/security.txt",
    "/api/version",
    "/_next/unknown",
    "/my-stream?wave=abc",
  ])("runs on %s", (url) => {
    expect(unstable_doesMiddlewareMatch({ config, url })).toBe(true);
  });
});

describe("missing /_next asset rewrite", () => {
  const nextConfig = { rewrites: async () => MISSING_NEXT_ASSET_REWRITES };

  it.each([
    "/_next/static/chunks/old-build.js",
    "/_next/static/chunks/old-build.js.map",
    "/_next/static/css/old.css",
    "/_next/unknown/path",
  ])("sends %s to the plain 404 route", async (url) => {
    const response = await unstable_getResponseFromNextConfig({
      url: `https://staging.6529.io${url}`,
      nextConfig,
    });

    expect(isRewrite(response)).toBe(true);
    expect(getRewrittenUrl(response)).toBe(
      `https://staging.6529.io${MISSING_NEXT_ASSET_ROUTE}`
    );
  });

  it.each(["/waves", "/punk6529/site", "/next/static/chunks/a.js", "/api"])(
    "leaves %s alone",
    async (url) => {
      const response = await unstable_getResponseFromNextConfig({
        url: `https://staging.6529.io${url}`,
        nextConfig,
      });

      expect(isRewrite(response)).toBe(false);
    }
  );

  it("runs only after real files are served", () => {
    expect(MISSING_NEXT_ASSET_REWRITES.beforeFiles).toEqual([]);
    expect(MISSING_NEXT_ASSET_REWRITES.fallback).toEqual([]);
  });

  it("answers with a tiny uncached plain-text 404", async () => {
    const response = missingNextAsset();

    expect(response.status).toBe(404);
    expect(response.headers.get("content-type")).toBe(
      "text/plain; charset=utf-8"
    );
    expect(response.headers.get("cache-control")).toContain("no-store");
    await expect(response.text()).resolves.toBe("Not Found");
  });
});

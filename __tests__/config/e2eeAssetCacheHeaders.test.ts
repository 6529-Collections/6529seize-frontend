/** @jest-environment node */
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { unstable_getResponseFromNextConfig } from "next/experimental/testing/server";
import { publicEnvSchema } from "@/config/env.schema";
import { sharedConfig } from "@/config/nextConfig";
import { MLS_WASM_MANIFEST } from "@/lib/e2ee/wasm/manifest";

const IMMUTABLE = "public, max-age=31536000, immutable";
const PUBLIC_E2EE_DIR = path.join(process.cwd(), "public", "e2ee");
const HASHED_NAME = /^mls-wasm-([0-9a-f]{16})\.wasm$/u;

const baseEnv = {
  NODE_ENV: "production",
  BASE_ENDPOINT: "https://6529.io",
  API_ENDPOINT: "https://api.6529.io",
  ALLOWLIST_API_ENDPOINT: "https://allowlist-api.6529.io",
  IPFS_API_ENDPOINT: "https://api-ipfs.6529.io",
  IPFS_GATEWAY_ENDPOINT: "https://ipfs.6529.io",
};

function getResponse(
  pathname: string,
  overrides: Partial<typeof baseEnv> = {}
): Promise<Response> {
  const env = { ...baseEnv, ...overrides };
  return unstable_getResponseFromNextConfig({
    url: `${env.BASE_ENDPOINT}${pathname}`,
    nextConfig: sharedConfig(publicEnvSchema.parse(env), ""),
  });
}

describe("encrypted-messages module cache policy", () => {
  it("ships only content-hashed files in public/e2ee", () => {
    const files = readdirSync(PUBLIC_E2EE_DIR);
    expect(files).toEqual([path.basename(MLS_WASM_MANIFEST.file)]);
    for (const file of files) {
      const match = HASHED_NAME.exec(file);
      expect(match).not.toBeNull();
      const digest = createHash("sha256")
        .update(readFileSync(path.join(PUBLIC_E2EE_DIR, file)))
        .digest("hex");
      // The name is the content: new bytes always get a new URL.
      expect(digest.startsWith(match![1]!)).toBe(true);
    }
  });

  it.each(["production", "development"] as const)(
    "serves the hashed module immutable for a year (NODE_ENV=%s)",
    async (nodeEnv) => {
      const response = await getResponse(MLS_WASM_MANIFEST.file, {
        NODE_ENV: nodeEnv,
      });
      expect(response.headers.get("cache-control")).toBe(IMMUTABLE);
    }
  );

  it("keeps the security headers on the module", async () => {
    const response = await getResponse(MLS_WASM_MANIFEST.file);
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("content-security-policy")).toContain(
      "default-src 'none'"
    );
  });

  it.each([
    "/e2ee",
    "/e2ee/mls-wasm.wasm",
    "/e2ee/mls-wasm-latest.wasm",
    "/e2ee/other-c5dc4d96a05d6406.wasm",
    "/e2ee/nested/mls-wasm-c5dc4d96a05d6406.wasm",
    "/messages/encrypted",
  ])("does not pin the unhashed or unrelated path %s", async (pathname) => {
    const response = await getResponse(pathname);
    expect(response.headers.get("cache-control")).toBeNull();
  });
});

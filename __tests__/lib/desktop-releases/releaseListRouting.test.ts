/** @jest-environment node */
import {
  isRewrite,
  unstable_doesMiddlewareMatch,
  unstable_getResponseFromNextConfig,
} from "next/experimental/testing/server";
import { NextRequest } from "next/server";
import { publicEnvSchema } from "@/config/env.schema";
import { sharedConfig } from "@/config/nextConfig";
import { config as proxyConfig } from "@/proxy";

type Proxy = typeof import("@/proxy").default;

const PATHS = ["/desktop/releases.json", "/desktop/releases.json.sig"];
const ORIGINAL_PUBLIC_RUNTIME = process.env["PUBLIC_RUNTIME"];

const productionEnv = publicEnvSchema.parse({
  NODE_ENV: "production",
  BASE_ENDPOINT: "https://6529.io",
  API_ENDPOINT: "https://api.6529.io",
  ALLOWLIST_API_ENDPOINT: "https://allowlist-api.6529.io",
  IPFS_API_ENDPOINT: "https://api-ipfs.6529.io",
  IPFS_GATEWAY_ENDPOINT: "https://ipfs.6529.io",
});

function loadProductionProxy(): Proxy {
  const runtime = JSON.parse(ORIGINAL_PUBLIC_RUNTIME ?? "{}") as Record<
    string,
    unknown
  >;
  process.env["PUBLIC_RUNTIME"] = JSON.stringify({
    ...runtime,
    BASE_ENDPOINT: "https://6529.io",
  });
  let loaded: Proxy | undefined;
  jest.isolateModules(() => {
    loaded = (require("@/proxy") as { default: Proxy }).default;
  });
  if (!loaded) {
    throw new Error("proxy module did not load");
  }
  return loaded;
}

describe("6529 Desktop release list routing", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    process.env["PUBLIC_RUNTIME"] = ORIGINAL_PUBLIC_RUNTIME;
  });

  it.each(PATHS)(
    "lets %s through the production proxy with no gate or redirect",
    async (path) => {
      const fetchSpy = jest.spyOn(globalThis, "fetch");
      expect(unstable_doesMiddlewareMatch({ config: proxyConfig, url: path })).toBe(
        true
      );

      const response = await loadProductionProxy()(
        new NextRequest(`https://6529.io${path}`)
      );

      expect(response.status).toBe(200);
      expect(response.headers.get("x-middleware-next")).toBe("1");
      expect(response.headers.get("location")).toBeNull();
      expect(response.headers.get("x-middleware-rewrite")).toBeNull();
      expect(fetchSpy).not.toHaveBeenCalled();
    }
  );

  it.each(PATHS)(
    "has no Next config redirect or rewrite for %s",
    async (path) => {
      const response = await unstable_getResponseFromNextConfig({
        url: `https://6529.io${path}`,
        nextConfig: sharedConfig(productionEnv, ""),
      });

      expect(response.status).toBe(200);
      expect(response.headers.get("location")).toBeNull();
      expect(isRewrite(response)).toBe(false);
      expect(response.headers.get("content-security-policy")).toBeTruthy();
    }
  );
});

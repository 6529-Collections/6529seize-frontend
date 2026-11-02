import fs from "node:fs";
import path from "node:path";
import type { PublicEnv } from "@/config/env.schema";
import { sharedConfig } from "@/config/nextConfig";

type EnvModule = typeof import("@/config/env");

const BROWSER_MODULE = "@/config/env.browser";
const SERVER_MODULE = "@/config/env";

// A raw build environment, including values the schema coerces, transforms
// or defaults, so the baked JSON differs from the raw input.
const rawBuildEnv = {
  NODE_ENV: "production",
  VERSION: "abc123",
  API_ENDPOINT: "https://api.6529.io",
  BASE_ENDPOINT: "https://6529.io",
  ALLOWLIST_API_ENDPOINT: "https://allowlist-api.6529.io",
  IPFS_API_ENDPOINT: "https://api-ipfs.6529.io",
  IPFS_GATEWAY_ENDPOINT: "https://ipfs.6529.io",
  NEXTGEN_CHAIN_ID: "11155111",
  DROP_FORGE_TESTNET: "true",
  STANDALONE_TEST_BUILD: "false",
  PORT: "3001",
  UNKNOWN_KEY: "dropped by the schema",
};

function loadModule(moduleName: string, publicRuntime?: string): EnvModule {
  const previous = process.env["PUBLIC_RUNTIME"];
  if (publicRuntime === undefined) {
    delete process.env["PUBLIC_RUNTIME"];
  } else {
    process.env["PUBLIC_RUNTIME"] = publicRuntime;
  }
  try {
    let loaded: EnvModule | undefined;
    jest.isolateModules(() => {
      loaded = require(moduleName) as EnvModule;
    });
    if (!loaded) {
      throw new Error(`Failed to load ${moduleName}`);
    }
    return loaded;
  } finally {
    if (previous === undefined) {
      delete process.env["PUBLIC_RUNTIME"];
    } else {
      process.env["PUBLIC_RUNTIME"] = previous;
    }
  }
}

// next.config.ts bakes PUBLIC_RUNTIME as the schema's parsed output.
function bakePublicRuntime(): string {
  const { publicEnvSchema } = jest.requireActual<
    typeof import("@/config/env.schema")
  >("@/config/env.schema");
  return JSON.stringify(publicEnvSchema.parse(rawBuildEnv));
}

describe("config/env.browser", () => {
  it("is swapped in for @/config/env only in Turbopack browser bundles", () => {
    const alias = sharedConfig(
      {
        API_ENDPOINT: "https://api.6529.io",
        BASE_ENDPOINT: "https://6529.io",
        IPFS_GATEWAY_ENDPOINT: "https://ipfs.6529.io",
      } as PublicEnv,
      ""
    ).turbopack?.resolveAlias?.["@/config/env"];

    expect(alias).toEqual({ browser: "./config/env.browser.ts" });
    expect(path.resolve("config/env.browser.ts")).toBe(
      require.resolve(BROWSER_MODULE)
    );
  });

  it("exports the same API as the validating server module", () => {
    const baked = bakePublicRuntime();
    const browser = loadModule(BROWSER_MODULE, baked);
    const server = loadModule(SERVER_MODULE, baked);

    expect(Object.keys(browser).sort()).toEqual(Object.keys(server).sort());
  });

  it("reads the baked env exactly as the server's re-validation does", () => {
    const baked = bakePublicRuntime();
    const browser = loadModule(BROWSER_MODULE, baked);
    const server = loadModule(SERVER_MODULE, baked);

    expect(browser.publicEnv).toEqual(server.publicEnv);
    expect(browser.publicEnv.NEXTGEN_CHAIN_ID).toBe(11155111);
    expect(browser.publicEnv.DROP_FORGE_TESTNET).toBe(true);
    expect(browser.publicEnv.MEDIA_RESOLVER_ENDPOINT).toBe(
      "https://media.6529.io"
    );
    expect(browser.getNodeEnv()).toBe("production");
  });

  it("fails fast when the bundle carries no baked env", () => {
    expect(() => loadModule(BROWSER_MODULE)).toThrow(
      "PUBLIC_RUNTIME is missing from this browser bundle"
    );
  });

  it("does not import zod or the schema at runtime", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "config/env.browser.ts"),
      "utf8"
    );
    const runtimeImports = source
      .split("\n")
      .filter(
        (line) => /^import\s/.test(line) && !/^import\s+type\s/.test(line)
      );

    expect(runtimeImports).toEqual([]);
  });
});

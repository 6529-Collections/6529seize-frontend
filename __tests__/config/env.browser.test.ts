import fs from "node:fs";
import path from "node:path";
import type { PublicEnv } from "@/config/env.schema";
import { withoutBuildStamp } from "@/config/buildStamp";
import { sharedConfig } from "@/config/nextConfig";

type EnvModule = typeof import("@/config/env");

const BROWSER_MODULE = "@/config/env.browser";
const SERVER_MODULE = "@/config/env";

// A raw build environment, including values the schema coerces, transforms
// or defaults, so the baked JSON differs from the raw input.
const rawBuildEnv = {
  NODE_ENV: "production",
  VERSION: "abc123",
  VERSION_BUILD_TIMESTAMP: "2026-11-04T10:00:00Z",
  VERSION_RELEASE_ORDER: "1200",
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

// The server reads PUBLIC_RUNTIME; the browser reads PUBLIC_RUNTIME_BROWSER.
function runtimeVariable(moduleName: string): string {
  return moduleName === BROWSER_MODULE
    ? "PUBLIC_RUNTIME_BROWSER"
    : "PUBLIC_RUNTIME";
}

function loadModule(moduleName: string, publicRuntime?: string): EnvModule {
  const variable = runtimeVariable(moduleName);
  const previous = process.env[variable];
  if (publicRuntime === undefined) {
    delete process.env[variable];
  } else {
    process.env[variable] = publicRuntime;
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
      delete process.env[variable];
    } else {
      process.env[variable] = previous;
    }
  }
}

function parseBuildEnv(): PublicEnv {
  const { publicEnvSchema } = jest.requireActual<
    typeof import("@/config/env.schema")
  >("@/config/env.schema");
  return publicEnvSchema.parse(rawBuildEnv);
}

// next.config.ts bakes PUBLIC_RUNTIME as the schema's parsed output, and
// PUBLIC_RUNTIME_BROWSER as the same without the per-build stamp.
function bakePublicRuntime(): string {
  return JSON.stringify(parseBuildEnv());
}

function bakeBrowserRuntime(): string {
  return JSON.stringify(withoutBuildStamp(parseBuildEnv()));
}

// app/layout.tsx renders VERSION on <html>.
function setPageVersion(version: string | null): void {
  if (version === null) {
    document.documentElement.removeAttribute("data-version");
  } else {
    document.documentElement.setAttribute("data-version", version);
  }
}

describe("config/env.browser", () => {
  afterEach(() => {
    setPageVersion(null);
    document.documentElement.removeAttribute("data-release-order");
  });

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
    const browser = loadModule(BROWSER_MODULE, bakeBrowserRuntime());
    const server = loadModule(SERVER_MODULE, bakePublicRuntime());

    expect(Object.keys(browser).sort()).toEqual(Object.keys(server).sort());
  });

  it("reads the baked env as the server's re-validation does, minus the build timestamp", () => {
    setPageVersion("abc123");
    document.documentElement.setAttribute("data-release-order", "1200");
    const browser = loadModule(BROWSER_MODULE, bakeBrowserRuntime());
    const server = loadModule(SERVER_MODULE, bakePublicRuntime());

    const { VERSION_BUILD_TIMESTAMP, ...serverWithoutTimestamp } =
      server.publicEnv;
    expect(VERSION_BUILD_TIMESTAMP).toBe("2026-11-04T10:00:00Z");
    expect(browser.publicEnv).toEqual(serverWithoutTimestamp);
    expect(browser.publicEnv.NEXTGEN_CHAIN_ID).toBe(11155111);
    expect(browser.publicEnv.DROP_FORGE_TESTNET).toBe(true);
    expect(browser.publicEnv.MEDIA_RESOLVER_ENDPOINT).toBe(
      "https://media.6529.io"
    );
    expect(browser.getNodeEnv()).toBe("production");
  });

  it("bakes no per-build value into the browser bundle", () => {
    const baked = JSON.parse(bakeBrowserRuntime()) as Record<string, unknown>;
    const stampKeys = [
      "VERSION",
      "VERSION_BUILD_TIMESTAMP",
      "VERSION_RELEASE_ORDER",
    ];

    for (const key of stampKeys) expect(baked).not.toHaveProperty(key);
    expect(Object.keys(baked).sort()).toEqual(
      Object.keys(parseBuildEnv())
        .filter((key) => !stampKeys.includes(key))
        .sort()
    );
  });

  it("takes VERSION from the page's <html data-version>", () => {
    setPageVersion("deployed-commit");

    expect(
      loadModule(BROWSER_MODULE, bakeBrowserRuntime()).publicEnv.VERSION
    ).toBe("deployed-commit");
  });

  it("leaves VERSION unset when the attribute is empty", () => {
    setPageVersion("");

    expect(
      loadModule(BROWSER_MODULE, bakeBrowserRuntime()).publicEnv
    ).not.toHaveProperty("VERSION");
  });

  it("leaves VERSION unset on a page without the attribute", () => {
    expect(
      loadModule(BROWSER_MODULE, bakeBrowserRuntime()).publicEnv
    ).not.toHaveProperty("VERSION");
  });

  it("fails fast when the bundle carries no baked env", () => {
    expect(() => loadModule(BROWSER_MODULE)).toThrow(
      "PUBLIC_RUNTIME_BROWSER is missing from this browser bundle"
    );
  });

  it("fails fast with a named error when the baked env is not JSON", () => {
    expect(() => loadModule(BROWSER_MODULE, "{not json")).toThrow(
      "PUBLIC_RUNTIME_BROWSER in this browser bundle is not valid JSON"
    );
  });

  it("relies on next.config.ts inlining both baked env values", () => {
    // Next's `env` option replaces process.env.<key> at build time in client,
    // server and edge code alike; the server reads PUBLIC_RUNTIME and the
    // browser reader PUBLIC_RUNTIME_BROWSER.
    const source = fs.readFileSync(
      path.join(process.cwd(), "next.config.ts"),
      "utf8"
    );

    expect(source).toMatch(
      /env:\s*\{\s*PUBLIC_RUNTIME:\s*JSON\.stringify\(publicEnv\),/
    );
    expect(source).toMatch(
      /PUBLIC_RUNTIME_BROWSER:\s*JSON\.stringify\(withoutBuildStamp\(publicEnv\)\),/
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

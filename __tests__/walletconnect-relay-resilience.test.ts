import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "yaml";

type LockfileSnapshot = {
  dependencies?: Record<string, string>;
};

type PnpmLockfile = {
  overrides?: Record<string, string>;
  packages?: Record<string, unknown>;
  snapshots?: Record<string, LockfileSnapshot>;
};

type PnpmWorkspace = {
  overrides?: Record<string, string>;
};

const affectedProvider = "@walletconnect/universal-provider@2.23.7";
const patchedVersion = "2.23.9";

function readYaml<T>(filename: string): T {
  return parse(readFileSync(resolve(process.cwd(), filename), "utf8")) as T;
}

describe("WalletConnect relay resilience", () => {
  it("keeps AppKit on the relay reconnection fix", () => {
    const workspace = readYaml<PnpmWorkspace>("pnpm-workspace.yaml");
    const lockfile = readYaml<PnpmLockfile>("pnpm-lock.yaml");

    expect(workspace.overrides?.[affectedProvider]).toBe(patchedVersion);
    expect(lockfile.overrides?.[affectedProvider]).toBe(patchedVersion);

    const appKitProviderVersions = Object.entries(lockfile.snapshots ?? {})
      .filter(
        ([key]) => key.startsWith("@reown/appkit") && key.includes("@1.8.19")
      )
      .flatMap(([, snapshot]) => {
        const version =
          snapshot.dependencies?.["@walletconnect/universal-provider"];
        return version ? [version.split("(", 1)[0]] : [];
      });

    expect(appKitProviderVersions.length).toBeGreaterThan(0);
    expect(new Set(appKitProviderVersions)).toEqual(new Set([patchedVersion]));
    expect(lockfile.packages?.["@walletconnect/core@2.23.9"]).toBeDefined();
    expect(lockfile.packages?.["@walletconnect/core@2.23.7"]).toBeUndefined();
  });
});
